// @ts-nocheck
import React, { useState, useEffect } from "react";
import { DEFAULT_CENTRO_NAMES, DEFAULT_CENTRO_IDS } from "@/constants/centros";
import { loadFromSupabase } from "@/services/googleSheetsService";
import { computeGanttMetrics } from "@/hooks/useGanttMetrics";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Calendar, Save, ChevronDown, ChevronUp, MessageSquare, Pencil, Trash2, X, Check } from "lucide-react";

// ==================== INTERFACES ====================

interface DateRangeMetrics {
  startDate: string;
  endDate: string;
  redes: { ejecutado: number; planificado: number; avance: number };
  fondeo: { ejecutado: number; planificado: number; avance: number };
  rental: { ejecutado: number; planificado: number; avance: number };
  habitabilidad: { ejecutado: number; planificado: number; avance: number };
  sso: { ejecutado: number; planificado: number; avance: number };
  ingenieria: { ejecutado: number; planificado: number; avance: number };
  total: { ejecutado: number; planificado: number; avance: number };
}

interface DayDetail {
  fecha: string;
  redes: { estado: string; actividades: string[]; valores: string[] };
  fondeo: { estado: string; actividades: string[]; valores: string[] };
  rental: { estado: string; actividades: string[]; valores: string[] };
  habitabilidad: { estado: string; actividades: string[]; valores: string[] };
  sso: { estado: string; actividades: string[]; valores: string[] };
  ingenieria: { estado: string; actividades: string[]; valores: string[] };
}

interface ResumenTabProps {
  selectedCentroId: number;
  onCentroChange: (id: number) => void;
  forceReload: number;
}

interface AreaTarea {
  id: string;
  centro_id: number;
  area: string;
  nombre_tarea: string;
  comentario: string | null;
}

// ==================== CONSTANTES ====================

const EXCLUDED_VALUES = ["N", "PC", "R", "🗑️", "", "D1", "D2", "D3", "D4", "NAVEG", "PTOCE", "RELEV", "INSSO"];

// Tareas predefinidas por área
const TAREAS_POR_AREA: Record<string, string[]> = {
  ingenieria: [
    "Estudio Oceanográficos y Ambientales",
    "Elaboración de MCF + Planos Ingeniería",
    "Charla Internalizacion Produccion"
  ],
  fondeo: [
    "Ponton",
    "Módulo",
    "Plataforma de ensilaje",
    "Plataforma de Compresores // Gas // Oxigeno",
    "Plataforma de materiales",
    "Mantención General pasadores",
    "Mantención General zunchos y flotadores",
    "Fierros perimetrales en el centro",
    "Barandas + Cruz San Andres + Atracadero + Tapas Butilo",
    "Soportes pajareros"
  ],
  redes: [
    "Central (instalación+costura)",
    "Frontal (instalación+costura)",
    "Separador (instalación+costura)",
    "Revisión Rov + Reparación lobero",
    "Apertura Lobero Tensores Principales + Secundarios de 20 mts",
    "Apertura Lobero Tensores Secundarios 7 mts. (Sujeto a Recepcion)",
    "Peceras (instalación+tensores+ revision)",
    "Pajarera Instalada",
    "Franjas baranda pasillo",
    "Cerco perimetral",
    "Refuerzo perimetral",
    "Refuerzos esquineros"
  ],
  rental: [
    "Instalación de planzas (HDPE)",
    "Materiales en el centro",
    "Fotoperiodo instalado y funcionando",
    "Instalación de planzas",
    "Conos en el centro",
    "Conos instalados y funcionando",
    "Instalación de planzas (equipos)",
    "Equipos de monitoreo submarino y superficial (Instalados y Operando)",
    "Rotarys",
    "Equipos de Alimentación (Selectora, Tornillo, Blower, etc) Etapa 1 y 2",
    "Sistema de Alimentación en ponton (Trazado, Software)",
    "Control playa"
  ],
  habitabilidad: [
    "Generadores",
    "TK diésel",
    "Embarcaciones",
    "Ensilaje Operativo",
    "Planta de tratamiento aguas grises",
    "Planta de tratamiento de aguas limpias",
    "Mantención Obra Gruesa Ponton / Base en tierra",
    "Mantención Obras Menores Ponton/ Base en tierra",
    "Sistema Alarmas y Bombas Achique (Red Incendio)",
    "Línea blanca",
    "Mobiliario",
    "Aseo y orden del Módulo",
    "Aseo y orden del Ponton (Estancos, cubierta, espacios interiores)"
  ],
  sso: [
    "Presencia y Revision Extintores con Plano Ponton",
    "Chalecos Salvavidas en Ponton",
    "Aros Salvavidas Disponibles en Modulo",
    "Camilla, Cuello Ortopedico y Frazada"
  ]
};

// ==================== COMPONENTE RESUMEN TAB ====================

export const ResumenTab: React.FC<ResumenTabProps> = ({ selectedCentroId, onCentroChange, forceReload }) => {
  // ========== ESTADOS ==========
  const [showDateRangeDetail, setShowDateRangeDetail] = useState<boolean>(true);
  const [showDailyDetail, setShowDailyDetail] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Fecha de siembra
  const [fechaSiembra, setFechaSiembra] = useState<string>("");
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null);
  const [savingFechaSiembra, setSavingFechaSiembra] = useState<boolean>(false);

  // Estados para tareas por área
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [areaTareas, setAreaTareas] = useState<AreaTarea[]>([]);
  const [loadingTareas, setLoadingTareas] = useState<boolean>(false);
  const [editingTareaId, setEditingTareaId] = useState<string | null>(null);
  const [editingComentario, setEditingComentario] = useState<string>("");

  // Cargar fecha de siembra desde Supabase
  useEffect(() => {
    const loadFechaSiembra = async () => {
      try {
        const { data, error } = await supabase
          .from('centro_fechas_siembra')
          .select('fecha_siembra')
          .eq('centro_id', selectedCentroId)
          .maybeSingle();
        
        if (error) {
          console.error('Error cargando fecha siembra:', error);
          return;
        }
        
        if (data) {
          setFechaSiembra(data.fecha_siembra);
        } else {
          setFechaSiembra("");
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };
    
    loadFechaSiembra();
  }, [selectedCentroId]);

  // Calcular días restantes cuando cambia la fecha de siembra
  useEffect(() => {
    if (fechaSiembra) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const siembra = new Date(fechaSiembra);
      siembra.setHours(0, 0, 0, 0);
      const diff = siembra.getTime() - hoy.getTime();
      const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setDiasRestantes(dias);
    } else {
      setDiasRestantes(null);
    }
  }, [fechaSiembra]);

  // Cargar tareas del área cuando se expande
  useEffect(() => {
    if (expandedArea) {
      loadTareasArea(expandedArea);
    }
  }, [expandedArea, selectedCentroId]);

  const loadTareasArea = async (area: string) => {
    setLoadingTareas(true);
    try {
      const { data, error } = await supabase
        .from('area_tareas')
        .select('*')
        .eq('centro_id', selectedCentroId)
        .eq('area', area);
      
      if (error) throw error;
      
      // Si no hay tareas, crear las predefinidas
      if (!data || data.length === 0) {
        const tareasPredefinidas = TAREAS_POR_AREA[area] || [];
        const nuevasTareas = tareasPredefinidas.map(nombre => ({
          centro_id: selectedCentroId,
          area: area,
          nombre_tarea: nombre,
          comentario: null
        }));
        
        if (nuevasTareas.length > 0) {
          const { data: inserted, error: insertError } = await supabase
            .from('area_tareas')
            .insert(nuevasTareas)
            .select();
          
          if (insertError) throw insertError;
          setAreaTareas(inserted || []);
        } else {
          setAreaTareas([]);
        }
      } else {
        setAreaTareas(data);
      }
    } catch (err) {
      console.error('Error cargando tareas:', err);
      toast.error("Error al cargar tareas");
    } finally {
      setLoadingTareas(false);
    }
  };

  const handleSaveComentario = async (tareaId: string, comentario: string) => {
    try {
      const { error } = await supabase
        .from('area_tareas')
        .update({ comentario: comentario || null })
        .eq('id', tareaId);
      
      if (error) throw error;
      
      setAreaTareas(prev => prev.map(t => 
        t.id === tareaId ? { ...t, comentario: comentario || null } : t
      ));
      setEditingTareaId(null);
      setEditingComentario("");
      toast.success("Comentario guardado");
    } catch (err) {
      console.error('Error guardando comentario:', err);
      toast.error("Error al guardar comentario");
    }
  };

  const handleDeleteTarea = async (tareaId: string) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    
    try {
      const { error } = await supabase
        .from('area_tareas')
        .delete()
        .eq('id', tareaId);
      
      if (error) throw error;
      
      setAreaTareas(prev => prev.filter(t => t.id !== tareaId));
      toast.success("Tarea eliminada");
    } catch (err) {
      console.error('Error eliminando tarea:', err);
      toast.error("Error al eliminar tarea");
    }
  };

  const handleToggleArea = (area: string) => {
    if (expandedArea === area) {
      setExpandedArea(null);
      setAreaTareas([]);
    } else {
      setExpandedArea(area);
    }
  };

  // Guardar fecha de siembra
  const handleSaveFechaSiembra = async () => {
    if (!fechaSiembra) {
      toast.error("Seleccione una fecha de siembra");
      return;
    }
    
    setSavingFechaSiembra(true);
    try {
      const { data: existing } = await supabase
        .from('centro_fechas_siembra')
        .select('id')
        .eq('centro_id', selectedCentroId)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('centro_fechas_siembra')
          .update({ 
            fecha_siembra: fechaSiembra,
            centro_nombre: DEFAULT_CENTRO_NAMES[selectedCentroId] || `Centro ${selectedCentroId}`
          })
          .eq('centro_id', selectedCentroId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('centro_fechas_siembra')
          .insert({ 
            centro_id: selectedCentroId,
            centro_nombre: DEFAULT_CENTRO_NAMES[selectedCentroId] || `Centro ${selectedCentroId}`,
            fecha_siembra: fechaSiembra
          });
        
        if (error) throw error;
      }
      
      toast.success("Fecha de siembra guardada");
    } catch (err) {
      console.error('Error guardando fecha siembra:', err);
      toast.error("Error al guardar fecha de siembra");
    } finally {
      setSavingFechaSiembra(false);
    }
  };

  const [metrics, setMetrics] = useState({
    redes: { planificado: 0, ejecutado: 0, ejecutadoTotal: 0, disponible: 0, avanceGlobal: 0, diasPlanificados: 0, diasEjecutados: 0 },
    fondeo: { planificado: 0, ejecutado: 0, ejecutadoTotal: 0, disponible: 0, avanceGlobal: 0, diasPlanificados: 0, diasEjecutados: 0 },
    rental: { planificado: 0, ejecutado: 0, ejecutadoTotal: 0, disponible: 0, avanceGlobal: 0, diasPlanificados: 0, diasEjecutados: 0 },
    habitabilidad: {
      planificado: 0,
      ejecutado: 0,
      ejecutadoTotal: 0,
      disponible: 0,
      avanceGlobal: 0,
      diasPlanificados: 0,
      diasEjecutados: 0,
    },
    sso: { planificado: 0, ejecutado: 0, ejecutadoTotal: 0, disponible: 0, avanceGlobal: 0, diasPlanificados: 0, diasEjecutados: 0 },
    ingenieria: {
      planificado: 0,
      ejecutado: 0,
      ejecutadoTotal: 0,
      disponible: 0,
      avanceGlobal: 0,
      diasPlanificados: 0,
      diasEjecutados: 0,
    },
  });

  const [dateRangeMetrics, setDateRangeMetrics] = useState<DateRangeMetrics | null>(null);
  const [dailyDetails, setDailyDetails] = useState<DayDetail[]>([]);

  const [totales, setTotales] = React.useState({
    totalPlanificado: 0,
    totalEjecutado: 0,       // Sin anomalías (trabajo real)
    totalEjecutadoTotal: 0,  // Con anomalías
    totalDisponible: 0,
    totalDiasPlanificados: 0,
    totalDiasEjecutados: 0,
    totalAvanceGlobalReal: 0,
    totalAvanceGlobalProyectado: 0,
  });

  // ========== FUNCIONES AUXILIARES ==========

  const generateDates = () => {
    const dates = [];
    const novStart = new Date(2025, 10, 1);
    const novEnd = new Date(2025, 10, 30);
    for (let date = new Date(novStart); date <= novEnd; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date));
    }
    const decStart = new Date(2025, 11, 1);
    const decEnd = new Date(2025, 11, 31);
    for (let date = new Date(decStart); date <= decEnd; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date));
    }
    const year2026Start = new Date(2026, 0, 1);
    const year2026End = new Date(2026, 11, 31);
    for (let date = new Date(year2026Start); date <= year2026End; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date));
    }
    return dates;
  };

  const computeDateRangeMetricsDirectFromDB = (
    cellData: Record<string, string>,
    centroId: number,
    startDate: Date,
    endDate: Date,
    areaName: string = "area",
  ) => {
    const diasPlanificadosSet = new Set<number>();
    const diasEjecutadosSet = new Set<number>();

    const allDates = generateDates();
    const normalizeDate = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);

    Object.keys(cellData).forEach((key) => {
      const parts = key.split("-");
      if (parts.length < 3) return;

      const keyCentroId = parseInt(parts[0], 10);
      if (keyCentroId !== centroId) return;

      const keyDateIdx = parseInt(parts[parts.length - 1], 10);
      const fecha = allDates[keyDateIdx];
      if (!fecha) return;

      const normalizedFecha = normalizeDate(fecha);
      if (normalizedFecha < normalizedStart || normalizedFecha > normalizedEnd) return;

      const rowType = parts.length === 4 ? parts[2] : parts[1];
      const value = cellData[key];

      if (!value || value.trim() === "") return;

      if (rowType.includes("proyectado")) {
        // Planificado: excluir solo 🗑️
        if (value !== "🗑️") {
          diasPlanificadosSet.add(keyDateIdx);
        }
      }
      if (rowType.includes("realizado")) {
        // Ejecutado: excluir desviaciones Y 🗑️
        if (!EXCLUDED_VALUES.includes(value.toUpperCase()) && value !== "🗑️") {
          diasEjecutadosSet.add(keyDateIdx);
        }
      }
    });

    const ejecutadoDays = diasEjecutadosSet.size;
    const planificadoDays = diasPlanificadosSet.size;

    console.log(`📊 ${areaName} - Rango de fechas:`, {
      "Días Planificados (únicos)": planificadoDays,
      "Días Ejecutados (únicos)": ejecutadoDays,
      "Índices planificados": Array.from(diasPlanificadosSet).slice(0, 5),
      "Índices ejecutados": Array.from(diasEjecutadosSet).slice(0, 5),
    });

    return { ejecutado: ejecutadoDays, planificado: planificadoDays };
  };

  const extractDailyDetails = (
    redesCellData: Record<string, string>,
    fondeoCellData: Record<string, string>,
    rentalCellData: Record<string, string>,
    habitabilidadCellData: Record<string, string>,
    ssoCellData: Record<string, string>,
    ingenieriaCellData: Record<string, string>,
    centroId: number,
    startDate: Date,
    endDate: Date,
  ): DayDetail[] => {
    const allDates = generateDates();
    const details: DayDetail[] = [];

    const normalizeDate = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);

    allDates.forEach((date, dateIdx) => {
      const normalizedDate = normalizeDate(date);

      if (normalizedDate < normalizedStart || normalizedDate > normalizedEnd) {
        return;
      }

      const analyzeArea = (cellData: Record<string, string>, areaName: string) => {
        const proyectadoActividades: string[] = [];
        const proyectadoValores: string[] = [];
        const realizadoActividades: string[] = [];
        const realizadoValores: string[] = [];

        Object.keys(cellData).forEach((key) => {
          const parts = key.split("-");
          if (parts.length < 3) return;

          const keyCentroId = parseInt(parts[0], 10);
          const keyDateIdx = parseInt(parts[parts.length - 1], 10);

          if (keyCentroId !== centroId || keyDateIdx !== dateIdx) return;

          let activityName = "";
          let rowType = "";

          if (parts.length === 4) {
            activityName = parts[1];
            rowType = parts[2];
          } else if (parts.length === 3) {
            activityName = parts[1];
            rowType = parts[1];
          }

          const value = cellData[key];
          if (!value || value.trim() === "" || EXCLUDED_VALUES.includes(value)) return;

          if (rowType.includes("proyectado")) {
            proyectadoActividades.push(activityName);
            proyectadoValores.push(value);
          }
          if (rowType.includes("realizado")) {
            realizadoActividades.push(activityName);
            realizadoValores.push(value);
          }
        });

        let estado = "disponible";
        let actividades: string[] = [];
        let valores: string[] = [];

        if (realizadoActividades.length > 0) {
          estado = "ejecutado";
          actividades = realizadoActividades;
          valores = realizadoValores;
        } else if (proyectadoActividades.length > 0) {
          estado = "planificado";
          actividades = proyectadoActividades;
          valores = proyectadoValores;
        }

        return { estado, actividades, valores };
      };

      const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const diaSemana = diasSemana[date.getDay()];
      const dia = date.getDate().toString().padStart(2, "0");
      const mes = (date.getMonth() + 1).toString().padStart(2, "0");
      const año = date.getFullYear();
      const fechaFormateada = `${diaSemana} ${dia}/${mes}/${año}`;

      const dayDetail: DayDetail = {
        fecha: fechaFormateada,
        redes: analyzeArea(redesCellData, "redes"),
        fondeo: analyzeArea(fondeoCellData, "fondeo"),
        rental: analyzeArea(rentalCellData, "rental"),
        habitabilidad: analyzeArea(habitabilidadCellData, "habitabilidad"),
        sso: analyzeArea(ssoCellData, "sso"),
        ingenieria: analyzeArea(ingenieriaCellData, "ingenieria"),
      };

      details.push(dayDetail);
    });

    return details;
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "ejecutado":
        return (
          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-semibold">✓ Ejecutado</span>
        );
      case "planificado":
        return (
          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-semibold">📅 Planificado</span>
        );
      case "disponible":
        return (
          <span className="px-2 py-1 bg-gray-400 text-white text-xs rounded-full font-semibold">⚪ Disponible</span>
        );
      default:
        return <span className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded-full">-</span>;
    }
  };

  // Función para obtener el avance global del área
  const getAvanceGlobalArea = (area: string): number => {
    const areaMetrics = metrics[area as keyof typeof metrics];
    if (!areaMetrics || areaMetrics.planificado === 0) return 0;
    return Math.round((areaMetrics.ejecutado / areaMetrics.planificado) * 100);
  };

  // ========== FUNCIÓN GENERAR INFORME PDF ==========
  const generateProfessionalReport = async () => {
    setIsGeneratingReport(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      const primaryColor = [30, 58, 138];
      const accentColor = [20, 184, 166];
      const textColor = [51, 65, 85];
      const lightGray = [241, 245, 249];

      pdf.setFillColor(...primaryColor);
      pdf.rect(0, 0, pageWidth, 40, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text("Informe de Gestion Operacional", margin, 20);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const currentDate = new Date().toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      pdf.text(`Generado el ${currentDate}`, margin, 30);

      yPosition = 50;

      pdf.setFillColor(...lightGray);
      pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 15, 3, 3, "F");

      pdf.setTextColor(...textColor);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Centro de Operaciones: ${DEFAULT_CENTRO_NAMES[selectedCentroId]}`, margin + 5, yPosition + 10);

      yPosition += 25;

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...primaryColor);
      pdf.text("Resumen Ejecutivo", margin, yPosition);

      yPosition += 10;

      const metricBoxWidth = (pageWidth - 2 * margin - 10) / 3;
      const metricBoxHeight = 25;

      const drawMetricBox = (x: number, y: number, title: string, value: string, subtitle: string, color: number[]) => {
        pdf.setFillColor(...color);
        pdf.roundedRect(x, y, metricBoxWidth, metricBoxHeight, 2, 2, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text(title, x + 5, y + 6);

        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.text(value, x + 5, y + 16);

        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.text(subtitle, x + 5, y + 21);
      };

      drawMetricBox(
        margin,
        yPosition,
        "PLANIFICADO",
        totales.totalPlanificado.toString(),
        "Actividades programadas",
        [71, 85, 105],
      );
      drawMetricBox(
        margin + metricBoxWidth + 5,
        yPosition,
        "EJECUTADO",
        totales.totalEjecutado.toString(),
        "Actividades completadas",
        [20, 184, 166],
      );
      drawMetricBox(
        margin + 2 * (metricBoxWidth + 5),
        yPosition,
        "DISPONIBLE",
        totales.totalDisponible.toString(),
        "Actividades pendientes",
        [59, 130, 246],
      );

      yPosition += metricBoxHeight + 15;

      pdf.setFillColor(...accentColor);
      pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 30, 3, 3, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Avance Global del Proyecto", margin + 5, yPosition + 10);

      pdf.setFontSize(24);
      pdf.text(`${totales.totalAvanceGlobalReal}%`, pageWidth - margin - 40, yPosition + 22);

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `${totales.totalDiasEjecutados} de ${totales.totalDiasPlanificados} dias ejecutados`,
        margin + 5,
        yPosition + 20,
      );

      yPosition += 40;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...primaryColor);
      pdf.text("Detalle por Area Operacional", margin, yPosition);

      yPosition += 8;

      const colWidths = [70, 22, 22, 22, 24];

      pdf.setFillColor(...primaryColor);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");

      let xPos = margin + 2;
      pdf.text("Area", xPos, yPosition + 6);
      xPos += colWidths[0];
      pdf.text("Plan.", xPos, yPosition + 6);
      xPos += colWidths[1];
      pdf.text("Ejec.", xPos, yPosition + 6);
      xPos += colWidths[2];
      pdf.text("Disp.", xPos, yPosition + 6);
      xPos += colWidths[3];
      pdf.text("Avance", xPos, yPosition + 6);

      yPosition += 8;

      const areas = [
        { name: "Programacion Redes", data: metrics.redes },
        { name: "Programacion Fondeo", data: metrics.fondeo },
        { name: "Programacion Rental", data: metrics.rental },
        { name: "Habitabilidad", data: metrics.habitabilidad },
        { name: "Area SSO", data: metrics.sso },
        { name: "Ingenieria", data: metrics.ingenieria },
      ];

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);

      areas.forEach((area, idx) => {
        const rowY = yPosition + idx * 7;

        if (idx % 2 === 0) {
          pdf.setFillColor(...lightGray);
          pdf.rect(margin, rowY, pageWidth - 2 * margin, 7, "F");
        }

        pdf.setTextColor(...textColor);

        xPos = margin + 2;
        pdf.text(area.name, xPos, rowY + 5);
        xPos += colWidths[0];
        pdf.text(area.data.planificado.toString(), xPos, rowY + 5);
        xPos += colWidths[1];
        pdf.text(area.data.ejecutado.toString(), xPos, rowY + 5);
        xPos += colWidths[2];
        pdf.text(area.data.disponible.toString(), xPos, rowY + 5);
        xPos += colWidths[3];

        const avance = area.data.planificado > 0 ? Math.round((area.data.ejecutado / area.data.planificado) * 100) : 0;
        if (avance >= 80) {
          pdf.setTextColor(22, 163, 74);
        } else if (avance >= 50) {
          pdf.setTextColor(59, 130, 246);
        } else {
          pdf.setTextColor(239, 68, 68);
        }
        pdf.setFont("helvetica", "bold");
        pdf.text(`${avance}%`, xPos, rowY + 5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...textColor);
      });

      yPosition += areas.length * 7 + 5;

      pdf.setFillColor(...primaryColor);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);

      xPos = margin + 2;
      pdf.text("TOTAL", xPos, yPosition + 6);
      xPos += colWidths[0];
      pdf.text(totales.totalPlanificado.toString(), xPos, yPosition + 6);
      xPos += colWidths[1];
      pdf.text(totales.totalEjecutado.toString(), xPos, yPosition + 6);
      xPos += colWidths[2];
      pdf.text(totales.totalDisponible.toString(), xPos, yPosition + 6);
      xPos += colWidths[3];
      pdf.text(`${totales.totalAvanceGlobalReal}%`, xPos, yPosition + 6);

      yPosition += 15;

      if (dateRangeMetrics && startDate && endDate) {
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...primaryColor);
        pdf.text("Analisis por Periodo", margin, yPosition);

        yPosition += 8;

        pdf.setFillColor(...lightGray);
        pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 12, 2, 2, "F");

        pdf.setTextColor(...textColor);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text(`Periodo: ${dateRangeMetrics.startDate} al ${dateRangeMetrics.endDate}`, margin + 5, yPosition + 8);

        yPosition += 18;

        const periodAreas = [
          { name: "Redes", data: dateRangeMetrics.redes },
          { name: "Fondeo", data: dateRangeMetrics.fondeo },
          { name: "Rental", data: dateRangeMetrics.rental },
          { name: "Habitabilidad", data: dateRangeMetrics.habitabilidad },
          { name: "SSO", data: dateRangeMetrics.sso },
          { name: "Ingenieria", data: dateRangeMetrics.ingenieria },
        ];

        const boxWidth = (pageWidth - 2 * margin - 10) / 3;
        const boxHeight = 22;

        periodAreas.forEach((area, idx) => {
          const row = Math.floor(idx / 3);
          const col = idx % 3;
          const x = margin + col * (boxWidth + 5);
          const y = yPosition + row * (boxHeight + 5);

          const avance = area.data.avance;
          let boxColor;
          if (avance === 100) {
            boxColor = [34, 197, 94];
          } else if (avance >= 50) {
            boxColor = [234, 179, 8];
          } else {
            boxColor = [239, 68, 68];
          }

          pdf.setFillColor(...boxColor);
          pdf.roundedRect(x, y, boxWidth, boxHeight, 2, 2, "F");

          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "bold");
          pdf.text(area.name, x + 3, y + 6);

          pdf.setFontSize(16);
          pdf.text(`${avance}%`, x + 3, y + 15);

          pdf.setFontSize(7);
          pdf.setFont("helvetica", "normal");
          pdf.text(`${area.data.ejecutado}/${area.data.planificado}`, x + 3, y + 19);
        });

        yPosition += 2 * (boxHeight + 5) + 10;

        pdf.setFillColor(...accentColor);
        pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 20, 3, 3, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("Avance Total del Periodo", margin + 5, yPosition + 8);

        pdf.setFontSize(20);
        pdf.text(`${dateRangeMetrics.total.avance}%`, pageWidth - margin - 35, yPosition + 15);

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `${dateRangeMetrics.total.ejecutado} de ${dateRangeMetrics.total.planificado} dias`,
          margin + 5,
          yPosition + 15,
        );
      }

      const footerY = pageHeight - 15;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.text("Sistema de Gestion Operaciones - Informe Confidencial", margin, footerY);
      pdf.text(`Pagina 1 de 1`, pageWidth - margin - 20, footerY);

      const fileName = `Informe_Operacional_${DEFAULT_CENTRO_NAMES[selectedCentroId].replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);

      console.log("✅ Informe generado exitosamente:", fileName);
    } catch (error) {
      console.error("❌ Error generando informe:", error);
      alert("Error al generar el informe. Por favor, intente nuevamente.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // ========== EFFECT: CARGAR DATOS ==========
  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      console.log("🔄 Cargando datos para centro:", selectedCentroId, DEFAULT_CENTRO_NAMES[selectedCentroId]);

      try {
        const [redes, fondeo, rental, habitabilidad, sso, ingenieria] = await Promise.all([
          loadFromSupabase("animacion-redes"),
          loadFromSupabase("animacion-fondeo"),
          loadFromSupabase("animacion-rental"),
          loadFromSupabase("animacion-habitabilidad"),
          loadFromSupabase("animacion-sso"),
          loadFromSupabase("animacion-ingenieria"),
        ]);

        if (cancelled) return;

        const dates = generateDates();

        const mRedes = computeGanttMetrics(redes.data?.cellData || {}, [selectedCentroId], dates);
        const mFondeo = computeGanttMetrics(fondeo.data?.cellData || {}, [selectedCentroId], dates);
        const mRental = computeGanttMetrics(rental.data?.cellData || {}, [selectedCentroId], dates);
        const mHabit = computeGanttMetrics(habitabilidad.data?.cellData || {}, [selectedCentroId], dates);
        const mSSO = computeGanttMetrics(sso.data?.cellData || {}, [selectedCentroId], dates);
        const mIng = computeGanttMetrics(ingenieria.data?.cellData || {}, [selectedCentroId], dates);

        console.log("📊 Métricas calculadas (ResumenTab usando computeGanttMetrics):");
        console.log("   - Redes:", mRedes);
        console.log("   - Fondeo:", mFondeo);
        console.log("   - Rental:", mRental);
        console.log("   - Habitabilidad:", mHabit);
        console.log("   - SSO:", mSSO);
        console.log("   - Ingeniería:", mIng);

        setMetrics({
          redes: mRedes,
          fondeo: mFondeo,
          rental: mRental,
          habitabilidad: mHabit,
          sso: mSSO,
          ingenieria: mIng,
        });

        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);

          const redesData = computeDateRangeMetricsDirectFromDB(
            redes.data?.cellData || {},
            selectedCentroId,
            start,
            end,
            "Redes",
          );
          const fondeoData = computeDateRangeMetricsDirectFromDB(
            fondeo.data?.cellData || {},
            selectedCentroId,
            start,
            end,
            "Fondeo",
          );
          const rentalData = computeDateRangeMetricsDirectFromDB(
            rental.data?.cellData || {},
            selectedCentroId,
            start,
            end,
            "Rental",
          );
          const habitabilidadData = computeDateRangeMetricsDirectFromDB(
            habitabilidad.data?.cellData || {},
            selectedCentroId,
            start,
            end,
            "Habitabilidad",
          );
          const ssoData = computeDateRangeMetricsDirectFromDB(
            sso.data?.cellData || {},
            selectedCentroId,
            start,
            end,
            "SSO",
          );
          const ingenieriaData = computeDateRangeMetricsDirectFromDB(
            ingenieria.data?.cellData || {},
            selectedCentroId,
            start,
            end,
            "Ingeniería",
          );

          const getMetricsWithAvance = (data: { ejecutado: number; planificado: number }) => ({
            ...data,
            avance: data.planificado > 0 ? Math.round((data.ejecutado / data.planificado) * 100) : 0,
          });

          const totalEjecutado =
            redesData.ejecutado +
            fondeoData.ejecutado +
            rentalData.ejecutado +
            habitabilidadData.ejecutado +
            ssoData.ejecutado +
            ingenieriaData.ejecutado;
          const totalPlanificado =
            redesData.planificado +
            fondeoData.planificado +
            rentalData.planificado +
            habitabilidadData.planificado +
            ssoData.planificado +
            ingenieriaData.planificado;
          const totalAvance = totalPlanificado > 0 ? Math.round((totalEjecutado / totalPlanificado) * 100) : 0;

          setDateRangeMetrics({
            startDate: start.toLocaleDateString("es-CL"),
            endDate: end.toLocaleDateString("es-CL"),
            redes: getMetricsWithAvance(redesData),
            fondeo: getMetricsWithAvance(fondeoData),
            rental: getMetricsWithAvance(rentalData),
            habitabilidad: getMetricsWithAvance(habitabilidadData),
            sso: getMetricsWithAvance(ssoData),
            ingenieria: getMetricsWithAvance(ingenieriaData),
            total: {
              ejecutado: totalEjecutado,
              planificado: totalPlanificado,
              avance: totalAvance,
            },
          });

          const details = extractDailyDetails(
            redes.data?.cellData || {},
            fondeo.data?.cellData || {},
            rental.data?.cellData || {},
            habitabilidad.data?.cellData || {},
            sso.data?.cellData || {},
            ingenieria.data?.cellData || {},
            selectedCentroId,
            start,
            end,
          );
          setDailyDetails(details);
        } else {
          setDateRangeMetrics(null);
          setDailyDetails([]);
        }
      } catch (e) {
        console.error("Error cargando métricas de Supabase", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedCentroId, startDate, endDate, forceReload]);

  // ========== EFFECT: CALCULAR TOTALES ==========
  React.useEffect(() => {
    console.log("\n🔍 ESTADO METRICS AL CALCULAR TOTALES:", metrics);

    const totalPlanificado =
      Number(metrics.redes.planificado) +
      Number(metrics.fondeo.planificado) +
      Number(metrics.rental.planificado) +
      Number(metrics.habitabilidad.planificado) +
      Number(metrics.sso.planificado) +
      Number(metrics.ingenieria.planificado);

    const totalEjecutado =
      Number(metrics.redes.ejecutado || 0) +
      Number(metrics.fondeo.ejecutado || 0) +
      Number(metrics.rental.ejecutado || 0) +
      Number(metrics.habitabilidad.ejecutado || 0) +
      Number(metrics.sso.ejecutado || 0) +
      Number(metrics.ingenieria.ejecutado || 0);

    const totalEjecutadoTotal =
      Number(metrics.redes.ejecutadoTotal || 0) +
      Number(metrics.fondeo.ejecutadoTotal || 0) +
      Number(metrics.rental.ejecutadoTotal || 0) +
      Number(metrics.habitabilidad.ejecutadoTotal || 0) +
      Number(metrics.sso.ejecutadoTotal || 0) +
      Number(metrics.ingenieria.ejecutadoTotal || 0);

    const totalDisponible =
      Number(metrics.redes.disponible || 0) +
      Number(metrics.fondeo.disponible || 0) +
      Number(metrics.rental.disponible || 0) +
      Number(metrics.habitabilidad.disponible || 0) +
      Number(metrics.sso.disponible || 0) +
      Number(metrics.ingenieria.disponible || 0);

    const totalDiasPlanificados =
      Number(metrics.redes.diasPlanificados || 0) +
      Number(metrics.fondeo.diasPlanificados || 0) +
      Number(metrics.rental.diasPlanificados || 0) +
      Number(metrics.habitabilidad.diasPlanificados || 0) +
      Number(metrics.sso.diasPlanificados || 0) +
      Number(metrics.ingenieria.diasPlanificados || 0);

    const totalDiasEjecutados =
      Number(metrics.redes.diasEjecutados || 0) +
      Number(metrics.fondeo.diasEjecutados || 0) +
      Number(metrics.rental.diasEjecutados || 0) +
      Number(metrics.habitabilidad.diasEjecutados || 0) +
      Number(metrics.sso.diasEjecutados || 0) +
      Number(metrics.ingenieria.diasEjecutados || 0);

    const totalAvanceGlobalReal =
      totalPlanificado > 0 && Number.isFinite(totalEjecutado)
        ? Math.round((totalEjecutado / totalPlanificado) * 100)
        : 0;

    const totalAvanceGlobalProyectado =
      totalDiasPlanificados > 0 && Number.isFinite(totalDiasEjecutados)
        ? Math.round((totalDiasEjecutados / totalDiasPlanificados) * 100)
        : 0;

    console.log("\n📊 TOTALES CALCULADOS:", {
      totalPlanificado,
      totalEjecutado,
      totalEjecutadoTotal,
      totalDisponible,
      totalDiasPlanificados,
      totalDiasEjecutados,
      totalAvanceGlobalReal,
      totalAvanceGlobalProyectado,
    });

    setTotales({
      totalPlanificado,
      totalEjecutado,
      totalEjecutadoTotal,
      totalDisponible,
      totalDiasPlanificados,
      totalDiasEjecutados,
      totalAvanceGlobalReal,
      totalAvanceGlobalProyectado,
    });
  }, [metrics]);

  // Función para renderizar las tarjetas de área con tareas
  const renderAreaCard = (
    areaKey: string,
    areaName: string,
    icon: string,
    areaMetrics: { avance: number; ejecutado: number; planificado: number }
  ) => {
    const avanceGlobal = getAvanceGlobalArea(areaKey);
    const isExpanded = expandedArea === areaKey;
    
    return (
      <div key={areaKey} className="flex flex-col">
        <div
          onClick={() => handleToggleArea(areaKey)}
          className={`p-4 rounded-lg shadow-lg border-2 cursor-pointer transition-all hover:scale-105 ${
            areaMetrics.avance === 100 
              ? "bg-green-500 border-green-600" 
              : "bg-yellow-500 border-yellow-600"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <h6 className="font-bold text-slate-900">{areaName}</h6>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-900" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-900" />
            )}
          </div>
          
          {/* Porcentaje Periodo */}
          <div className="mb-2">
            <div className="text-xs text-black font-medium">Porcentaje Periodo</div>
            <div className="text-3xl font-bold text-slate-900">{areaMetrics.avance}%</div>
          </div>
          
          {/* Avance Global Área */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-black font-medium">Avance Global Área</div>
              <div className="text-xl font-bold text-slate-800">{avanceGlobal}%</div>
            </div>
          </div>
          
          <div className="text-sm text-slate-800 mt-1">
            Ejecutado: {areaMetrics.ejecutado} / {areaMetrics.planificado}
          </div>
        </div>
        
        {/* Panel de Tareas expandible */}
        {isExpanded && (
          <div className="mt-2 bg-slate-800 rounded-lg p-4 border border-slate-600">
            <h6 className="text-white font-semibold mb-3 flex items-center gap-2">
              📋 Tareas - {areaName}
            </h6>
            
            {loadingTareas ? (
              <div className="text-slate-400 text-center py-4">Cargando tareas...</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {areaTareas.map((tarea) => (
                  <div
                    key={tarea.id}
                    className={`p-3 rounded-lg border ${
                      tarea.comentario 
                        ? "bg-blue-900/50 border-blue-500" 
                        : "bg-slate-700 border-slate-600"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium">{tarea.nombre_tarea}</span>
                          {tarea.comentario && (
                            <MessageSquare className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        
                        {editingTareaId === tarea.id ? (
                          <div className="mt-2">
                            <textarea
                              value={editingComentario}
                              onChange={(e) => setEditingComentario(e.target.value)}
                              placeholder="Escribir comentario..."
                              className="w-full p-2 text-sm bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-400 resize-none"
                              rows={2}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSaveComentario(tarea.id, editingComentario)}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Guardar
                              </button>
                              <button
                                onClick={() => {
                                  setEditingTareaId(null);
                                  setEditingComentario("");
                                }}
                                className="px-3 py-1 bg-slate-600 text-white text-xs rounded hover:bg-slate-500 flex items-center gap-1"
                              >
                                <X className="w-3 h-3" /> Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          tarea.comentario && (
                            <div className="mt-1 text-xs text-blue-300 italic">
                              💬 {tarea.comentario}
                            </div>
                          )
                        )}
                      </div>
                      
                      {editingTareaId !== tarea.id && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingTareaId(tarea.id);
                              setEditingComentario(tarea.comentario || "");
                            }}
                            className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                            title="Editar comentario"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteTarea(tarea.id)}
                            className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {areaTareas.length === 0 && (
                  <div className="text-slate-400 text-center py-4">
                    No hay tareas para esta área
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ========== RENDER ==========
  return (
    <div className="space-y-6">
      {/* Filtro por Centro */}
      <div className="ocean-card">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-xl font-semibold mb-4">Seleccionar Centro</h3>
            <select
              className="ocean-input w-full"
              value={selectedCentroId}
              onChange={(e) => {
                const newCentroId = parseInt(e.target.value);
                console.log("🔄 Cambiando centro de", selectedCentroId, "a", newCentroId);
                onCentroChange(newCentroId);
              }}
              disabled={isLoading}
            >
              {DEFAULT_CENTRO_IDS.map((id) => (
                <option key={id} value={id}>
                  {DEFAULT_CENTRO_NAMES[id]}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha de Siembra */}
          <div className="flex items-end gap-2">
            <div>
              <label className="text-sm font-medium text-foreground/70 block mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                Fecha Siembra
              </label>
              <input
                type="date"
                value={fechaSiembra}
                onChange={(e) => setFechaSiembra(e.target.value)}
                className="ocean-input px-3 py-2"
              />
            </div>
            <button
              onClick={handleSaveFechaSiembra}
              disabled={savingFechaSiembra || !fechaSiembra}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
              title="Guardar fecha de siembra"
            >
              {savingFechaSiembra ? "..." : <Save className="w-4 h-4" />}
            </button>
            {diasRestantes !== null && (
              <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                diasRestantes < 0 
                  ? "bg-red-100 text-red-700 border border-red-300" 
                  : diasRestantes <= 7 
                    ? "bg-amber-100 text-amber-700 border border-amber-300"
                    : "bg-green-100 text-green-700 border border-green-300"
              }`}>
                {diasRestantes < 0 
                  ? `${Math.abs(diasRestantes)} días pasados` 
                  : diasRestantes === 0 
                    ? "¡HOY!" 
                    : `${diasRestantes} días restantes`}
              </div>
            )}
          </div>

          <button
            onClick={generateProfessionalReport}
            disabled={isGeneratingReport || isLoading}
            className={`px-6 py-3 rounded-lg shadow-lg font-semibold flex items-center gap-3 transition-all ${
              isGeneratingReport || isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            }`}
          >
            {isGeneratingReport ? (
              <>
                <span className="animate-spin">⏳</span>
                Generando...
              </>
            ) : (
              <>
                <span>📄</span>
                Generar Informe PDF
              </>
            )}
          </button>

          <div className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg font-semibold flex items-center gap-2">
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Cargando...
              </>
            ) : (
              <>
                <span>✅</span>
                Datos Cargados
              </>
            )}
          </div>
        </div>
      </div>

      {/* Métricas Consolidadas */}
      <div className="ocean-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Resumen Consolidado - {DEFAULT_CENTRO_NAMES[selectedCentroId]}</h3>
          <button
            onClick={async () => {
              const password = prompt("🔒 Ingrese la contraseña para limpiar todos los datos:");
              if (password !== "1") {
                alert("❌ Contraseña incorrecta");
                return;
              }

              if (
                confirm(
                  "⚠️ ¿LIMPIAR TODOS LOS DATOS?\n\nEsto borrará:\n- Todos los calendarios de las 6 pestañas\n- Datos en Supabase\n- LocalStorage\n\n¿Estás seguro?",
                )
              ) {
                try {
                  const tablas = [
                    "animacion-redes",
                    "animacion-fondeo",
                    "animacion-rental",
                    "animacion-habitabilidad",
                    "animacion-sso",
                    "animacion-ingenieria",
                  ];
                  for (const tabla of tablas) {
                    localStorage.removeItem(`gantt-${tabla}`);
                  }
                  window.location.reload();
                } catch (e) {
                  alert("Error al limpiar datos: " + e);
                }
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium"
            title="Limpiar todos los datos de todas las pestañas"
          >
            🗑️ Limpiar Todo
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <div className="text-3xl font-bold text-slate-700">{totales.totalPlanificado}</div>
            <div className="text-sm text-slate-600 mt-2">Planificado</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <div className="text-3xl font-bold text-emerald-700">{totales.totalEjecutadoTotal}</div>
            <div className="text-sm text-slate-600 mt-2">Ejecutado</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <div className="text-3xl font-bold text-amber-600">{totales.totalEjecutadoTotal - totales.totalEjecutado}</div>
            <div className="text-sm text-slate-600 mt-2">Días Desviaciones</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <div className="text-3xl font-bold text-teal-600">{totales.totalEjecutado}</div>
            <div className="text-sm text-slate-600 mt-2">Día Trabajado</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <div className="text-3xl font-bold text-blue-700">{totales.totalDisponible}</div>
            <div className="text-sm text-slate-600 mt-2">Disponible</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <div className="text-3xl font-bold text-orange-600">
              {/* Suma de días extras de cada área */}
              {Math.max(0, metrics.redes.ejecutadoTotal - metrics.redes.planificado) +
               Math.max(0, metrics.fondeo.ejecutadoTotal - metrics.fondeo.planificado) +
               Math.max(0, metrics.rental.ejecutadoTotal - metrics.rental.planificado) +
               Math.max(0, metrics.habitabilidad.ejecutadoTotal - metrics.habitabilidad.planificado) +
               Math.max(0, metrics.sso.ejecutadoTotal - metrics.sso.planificado) +
               Math.max(0, metrics.ingenieria.ejecutadoTotal - metrics.ingenieria.planificado)}
            </div>
            <div className="text-sm text-slate-600 mt-2">Días Extras</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            {(() => {
              const avance = totales.totalPlanificado > 0 ? Math.round((totales.totalEjecutado / totales.totalPlanificado) * 100) : 0;
              return (
                <>
                  <div
                    className={`text-3xl font-bold ${
                      avance >= 80
                        ? "text-teal-700"
                        : avance >= 50
                          ? "text-blue-600"
                          : "text-red-700"
                    }`}
                  >
                    {avance}%
                  </div>
                  <div className="text-sm text-slate-600 mt-2">Avance Global Real</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {totales.totalEjecutado}/{totales.totalPlanificado} días
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Avance Global por Área */}
      <div className="ocean-card">
        <h3 className="text-xl font-semibold mb-4">Avance Global por Área</h3>

        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700 border-b-2 border-slate-300">
                <th className="text-left p-3 font-semibold text-white">Área</th>
                <th className="text-center p-3 font-semibold text-white">Planificado</th>
                <th className="text-center p-3 font-semibold text-white">Ejecutado</th>
                <th className="text-center p-3 font-semibold text-white">Días Desviaciones</th>
                <th className="text-center p-3 font-semibold text-white">Días Trabajados</th>
                <th className="text-center p-3 font-semibold text-white">Disponible</th>
                <th className="text-center p-3 font-semibold text-white">Días Extras</th>
                <th className="text-center p-3 font-semibold text-white">Avance Global Real</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-slate-700 hover:text-white transition-colors">
                <td className="p-3 font-medium">📡 Programación Redes</td>
                <td className="text-center p-3">{metrics.redes.planificado}</td>
                <td className="text-center p-3 text-emerald-600 font-semibold">{metrics.redes.ejecutadoTotal}</td>
                <td className="text-center p-3 text-amber-600 font-semibold">{metrics.redes.ejecutadoTotal - metrics.redes.ejecutado}</td>
                <td className="text-center p-3 text-teal-600 font-semibold">{metrics.redes.ejecutado}</td>
                <td className="text-center p-3">{metrics.redes.disponible}</td>
                <td className="text-center p-3 text-orange-600">{Math.max(0, metrics.redes.ejecutadoTotal - metrics.redes.planificado)}</td>
                <td className="text-center p-3">
                  {(() => {
                    const avance = metrics.redes.planificado > 0 ? Math.round((metrics.redes.ejecutado / metrics.redes.planificado) * 100) : 0;
                    return (
                      <span className={`px-3 py-1 rounded-full font-semibold ${avance >= 80 ? "bg-green-100 text-green-700" : avance >= 50 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                        {avance}%
                      </span>
                    );
                  })()}
                </td>
              </tr>
              <tr className="border-b hover:bg-slate-700 hover:text-white transition-colors">
                <td className="p-3 font-medium">⚓ Programación Fondeo</td>
                <td className="text-center p-3">{metrics.fondeo.planificado}</td>
                <td className="text-center p-3 text-emerald-600 font-semibold">{metrics.fondeo.ejecutadoTotal}</td>
                <td className="text-center p-3 text-amber-600 font-semibold">{metrics.fondeo.ejecutadoTotal - metrics.fondeo.ejecutado}</td>
                <td className="text-center p-3 text-teal-600 font-semibold">{metrics.fondeo.ejecutado}</td>
                <td className="text-center p-3">{metrics.fondeo.disponible}</td>
                <td className="text-center p-3 text-orange-600">{Math.max(0, metrics.fondeo.ejecutadoTotal - metrics.fondeo.planificado)}</td>
                <td className="text-center p-3">
                  {(() => {
                    const avance = metrics.fondeo.planificado > 0 ? Math.round((metrics.fondeo.ejecutado / metrics.fondeo.planificado) * 100) : 0;
                    return (
                      <span className={`px-3 py-1 rounded-full font-semibold ${avance >= 80 ? "bg-green-100 text-green-700" : avance >= 50 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                        {avance}%
                      </span>
                    );
                  })()}
                </td>
              </tr>
              <tr className="border-b hover:bg-slate-700 hover:text-white transition-colors">
                <td className="p-3 font-medium">🚤 Programación Rental</td>
                <td className="text-center p-3">{metrics.rental.planificado}</td>
                <td className="text-center p-3 text-emerald-600 font-semibold">{metrics.rental.ejecutadoTotal}</td>
                <td className="text-center p-3 text-amber-600 font-semibold">{metrics.rental.ejecutadoTotal - metrics.rental.ejecutado}</td>
                <td className="text-center p-3 text-teal-600 font-semibold">{metrics.rental.ejecutado}</td>
                <td className="text-center p-3">{metrics.rental.disponible}</td>
                <td className="text-center p-3 text-orange-600">{Math.max(0, metrics.rental.ejecutadoTotal - metrics.rental.planificado)}</td>
                <td className="text-center p-3">
                  {(() => {
                    const avance = metrics.rental.planificado > 0 ? Math.round((metrics.rental.ejecutado / metrics.rental.planificado) * 100) : 0;
                    return (
                      <span className={`px-3 py-1 rounded-full font-semibold ${avance >= 80 ? "bg-green-100 text-green-700" : avance >= 50 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                        {avance}%
                      </span>
                    );
                  })()}
                </td>
              </tr>
              <tr className="border-b hover:bg-slate-700 hover:text-white transition-colors">
                <td className="p-3 font-medium">🏠 Habitabilidad</td>
                <td className="text-center p-3">{metrics.habitabilidad.planificado}</td>
                <td className="text-center p-3 text-emerald-600 font-semibold">{metrics.habitabilidad.ejecutadoTotal}</td>
                <td className="text-center p-3 text-amber-600 font-semibold">{metrics.habitabilidad.ejecutadoTotal - metrics.habitabilidad.ejecutado}</td>
                <td className="text-center p-3 text-teal-600 font-semibold">{metrics.habitabilidad.ejecutado}</td>
                <td className="text-center p-3">{metrics.habitabilidad.disponible}</td>
                <td className="text-center p-3 text-orange-600">{Math.max(0, metrics.habitabilidad.ejecutadoTotal - metrics.habitabilidad.planificado)}</td>
                <td className="text-center p-3">
                  {(() => {
                    const avance = metrics.habitabilidad.planificado > 0 ? Math.round((metrics.habitabilidad.ejecutado / metrics.habitabilidad.planificado) * 100) : 0;
                    return (
                      <span className={`px-3 py-1 rounded-full font-semibold ${avance >= 80 ? "bg-green-100 text-green-700" : avance >= 50 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                        {avance}%
                      </span>
                    );
                  })()}
                </td>
              </tr>
              <tr className="border-b hover:bg-slate-700 hover:text-white transition-colors">
                <td className="p-3 font-medium">🦺 Área SSO</td>
                <td className="text-center p-3">{metrics.sso.planificado}</td>
                <td className="text-center p-3 text-emerald-600 font-semibold">{metrics.sso.ejecutadoTotal}</td>
                <td className="text-center p-3 text-amber-600 font-semibold">{metrics.sso.ejecutadoTotal - metrics.sso.ejecutado}</td>
                <td className="text-center p-3 text-teal-600 font-semibold">{metrics.sso.ejecutado}</td>
                <td className="text-center p-3">{metrics.sso.disponible}</td>
                <td className="text-center p-3 text-orange-600">{Math.max(0, metrics.sso.ejecutadoTotal - metrics.sso.planificado)}</td>
                <td className="text-center p-3">
                  {(() => {
                    const avance = metrics.sso.planificado > 0 ? Math.round((metrics.sso.ejecutado / metrics.sso.planificado) * 100) : 0;
                    return (
                      <span className={`px-3 py-1 rounded-full font-semibold ${avance >= 80 ? "bg-green-100 text-green-700" : avance >= 50 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                        {avance}%
                      </span>
                    );
                  })()}
                </td>
              </tr>
              <tr className="border-b hover:bg-slate-700 hover:text-white transition-colors">
                <td className="p-3 font-medium">🔧 Ingeniería</td>
                <td className="text-center p-3">{metrics.ingenieria.planificado}</td>
                <td className="text-center p-3 text-emerald-600 font-semibold">{metrics.ingenieria.ejecutadoTotal}</td>
                <td className="text-center p-3 text-amber-600 font-semibold">{metrics.ingenieria.ejecutadoTotal - metrics.ingenieria.ejecutado}</td>
                <td className="text-center p-3 text-teal-600 font-semibold">{metrics.ingenieria.ejecutado}</td>
                <td className="text-center p-3">{metrics.ingenieria.disponible}</td>
                <td className="text-center p-3 text-orange-600">{Math.max(0, metrics.ingenieria.ejecutadoTotal - metrics.ingenieria.planificado)}</td>
                <td className="text-center p-3">
                  {(() => {
                    const avance = metrics.ingenieria.planificado > 0 ? Math.round((metrics.ingenieria.ejecutado / metrics.ingenieria.planificado) * 100) : 0;
                    return (
                      <span className={`px-3 py-1 rounded-full font-semibold ${avance >= 80 ? "bg-green-100 text-green-700" : avance >= 50 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                        {avance}%
                      </span>
                    );
                  })()}
                </td>
              </tr>
              <tr className="bg-slate-800 font-bold border-t-2 border-slate-400 text-white">
                <td className="p-3">🎯 TOTAL</td>
                <td className="text-center p-3">{totales.totalPlanificado}</td>
                <td className="text-center p-3 text-emerald-400">{totales.totalEjecutadoTotal}</td>
                <td className="text-center p-3 text-amber-400">{totales.totalEjecutadoTotal - totales.totalEjecutado}</td>
                <td className="text-center p-3 text-teal-400">{totales.totalEjecutado}</td>
                <td className="text-center p-3">{totales.totalDisponible}</td>
                <td className="text-center p-3 text-orange-400">
                  {Math.max(0, metrics.redes.ejecutadoTotal - metrics.redes.planificado) +
                   Math.max(0, metrics.fondeo.ejecutadoTotal - metrics.fondeo.planificado) +
                   Math.max(0, metrics.rental.ejecutadoTotal - metrics.rental.planificado) +
                   Math.max(0, metrics.habitabilidad.ejecutadoTotal - metrics.habitabilidad.planificado) +
                   Math.max(0, metrics.sso.ejecutadoTotal - metrics.sso.planificado) +
                   Math.max(0, metrics.ingenieria.ejecutadoTotal - metrics.ingenieria.planificado)}
                </td>
                <td className="text-center p-3">
                  <span className={`px-3 py-1 rounded-full font-semibold ${totales.totalAvanceGlobalReal >= 80 ? "bg-green-600 text-white" : totales.totalAvanceGlobalReal >= 50 ? "bg-blue-600 text-white" : "bg-red-600 text-white"}`}>
                    {totales.totalAvanceGlobalReal}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Análisis por Periodo */}
      <div className="ocean-card">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowDateRangeDetail(!showDateRangeDetail)}
        >
          <h3 className="text-xl font-semibold">📅 Seleccionar Periodo</h3>
          <span className="text-2xl">{showDateRangeDetail ? "▼" : "►"}</span>
        </div>

        {showDateRangeDetail && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-foreground/70 block mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="ocean-input px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground/70 block mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="ocean-input px-3 py-2"
                />
              </div>
            </div>

            {dateRangeMetrics && (
              <div className="space-y-4 mt-6">
                <div className="bg-slate-700 p-4 rounded-lg">
                  <h5 className="text-lg font-semibold text-white mb-2">
                    📊 Periodo: {dateRangeMetrics.startDate} al {dateRangeMetrics.endDate}
                  </h5>
                  <p className="text-slate-300 text-sm">Haga clic en una tarjeta para ver las tareas del área</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {renderAreaCard("redes", "Redes", "📡", dateRangeMetrics.redes)}
                  {renderAreaCard("fondeo", "Fondeo", "⚓", dateRangeMetrics.fondeo)}
                  {renderAreaCard("rental", "Rental", "🚤", dateRangeMetrics.rental)}
                  {renderAreaCard("habitabilidad", "Habitabilidad", "🏠", dateRangeMetrics.habitabilidad)}
                  {renderAreaCard("sso", "SSO", "🦺", dateRangeMetrics.sso)}
                  {renderAreaCard("ingenieria", "Ingeniería", "🔧", dateRangeMetrics.ingenieria)}
                </div>

                <div
                  className={`p-6 rounded-lg shadow-xl border-4 ${dateRangeMetrics.total.avance === 100 ? "bg-green-600 border-green-700" : dateRangeMetrics.total.avance >= 80 ? "bg-yellow-600 border-yellow-700" : "bg-red-600 border-red-700"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h6 className="text-lg font-bold text-white mb-1">🎯 TOTAL CONSOLIDADO</h6>
                      <div className="text-sm text-white opacity-90">
                        Ejecutado: {dateRangeMetrics.total.ejecutado} / {dateRangeMetrics.total.planificado}
                      </div>
                    </div>
                    <div className="text-5xl font-bold text-white">{dateRangeMetrics.total.avance}%</div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setShowDailyDetail(!showDailyDetail)}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium flex items-center justify-center gap-2"
                  >
                    {showDailyDetail ? "▼ Ocultar Detalle Día por Día" : "► Ver Detalle Día por Día"}
                  </button>
                </div>

                {showDailyDetail && dailyDetails.length > 0 && (
                  <div className="mt-6 bg-slate-900 p-6 rounded-lg">
                    <h6 className="text-lg font-bold text-white mb-4">
                      📋 Detalle Día por Día - {DEFAULT_CENTRO_NAMES[selectedCentroId]}
                    </h6>
                    <div className="mb-4 text-sm text-slate-300">
                      <p>📊 Mostrando {dailyDetails.length} días del periodo seleccionado</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border border-slate-600">
                        <thead>
                          <tr className="bg-slate-700">
                            <th className="p-3 text-left text-white border border-slate-600 sticky left-0 bg-slate-700 z-10 min-w-[140px]">
                              📅 Fecha
                            </th>
                            <th className="p-2 text-center text-white border border-slate-600 bg-blue-800">
                              📡 Redes
                            </th>
                            <th className="p-2 text-center text-white border border-slate-600 bg-teal-800">
                              ⚓ Fondeo
                            </th>
                            <th className="p-2 text-center text-white border border-slate-600 bg-purple-800">
                              🚤 Rental
                            </th>
                            <th className="p-2 text-center text-white border border-slate-600 bg-orange-800">
                              🏠 Habitabilidad
                            </th>
                            <th className="p-2 text-center text-white border border-slate-600 bg-red-800">🦺 SSO</th>
                            <th className="p-2 text-center text-white border border-slate-600 bg-green-800">
                              🔧 Ingeniería
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyDetails.map((day, idx) => {
                            const esFinde = day.fecha.startsWith("Sáb") || day.fecha.startsWith("Dom");
                            const rowClass = esFinde
                              ? "border-b border-slate-600 bg-slate-800 hover:bg-slate-700"
                              : "border-b border-slate-600 hover:bg-slate-800";

                            return (
                              <tr key={idx} className={rowClass}>
                                <td
                                  className={`p-3 font-semibold border border-slate-600 sticky left-0 z-10 ${esFinde ? "bg-slate-800 text-yellow-300" : "bg-slate-900 text-white"}`}
                                >
                                  {day.fecha}
                                </td>
                                <td className="p-2 text-center border border-slate-600">
                                  <div className="flex flex-col items-center gap-1">
                                    {getEstadoBadge(day.redes.estado)}
                                    {day.redes.actividades.length > 0 && (
                                      <div className="text-xs text-slate-300 mt-1">
                                        {day.redes.actividades.map((act, i) => (
                                          <div key={i}>
                                            {act}: {day.redes.valores[i]}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-2 text-center border border-slate-600">
                                  <div className="flex flex-col items-center gap-1">
                                    {getEstadoBadge(day.fondeo.estado)}
                                    {day.fondeo.actividades.length > 0 && (
                                      <div className="text-xs text-slate-300 mt-1">
                                        {day.fondeo.actividades.map((act, i) => (
                                          <div key={i}>
                                            {act}: {day.fondeo.valores[i]}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-2 text-center border border-slate-600">
                                  <div className="flex flex-col items-center gap-1">
                                    {getEstadoBadge(day.rental.estado)}
                                    {day.rental.actividades.length > 0 && (
                                      <div className="text-xs text-slate-300 mt-1">
                                        {day.rental.actividades.map((act, i) => (
                                          <div key={i}>
                                            {act}: {day.rental.valores[i]}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-2 text-center border border-slate-600">
                                  <div className="flex flex-col items-center gap-1">
                                    {getEstadoBadge(day.habitabilidad.estado)}
                                    {day.habitabilidad.actividades.length > 0 && (
                                      <div className="text-xs text-slate-300 mt-1">
                                        {day.habitabilidad.actividades.map((act, i) => (
                                          <div key={i}>
                                            {act}: {day.habitabilidad.valores[i]}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-2 text-center border border-slate-600">
                                  <div className="flex flex-col items-center gap-1">
                                    {getEstadoBadge(day.sso.estado)}
                                    {day.sso.actividades.length > 0 && (
                                      <div className="text-xs text-slate-300 mt-1">
                                        {day.sso.actividades.map((act, i) => (
                                          <div key={i}>
                                            {act}: {day.sso.valores[i]}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-2 text-center border border-slate-600">
                                  <div className="flex flex-col items-center gap-1">
                                    {getEstadoBadge(day.ingenieria.estado)}
                                    {day.ingenieria.actividades.length > 0 && (
                                      <div className="text-xs text-slate-300 mt-1">
                                        {day.ingenieria.actividades.map((act, i) => (
                                          <div key={i}>
                                            {act}: {day.ingenieria.valores[i]}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!dateRangeMetrics && startDate && endDate && (
              <div className="bg-slate-800 p-6 rounded-lg text-center text-slate-400">
                Cargando datos del periodo...
              </div>
            )}

            {!startDate || !endDate ? (
              <div className="bg-slate-800 p-6 rounded-lg text-center text-slate-400">
                Seleccione un rango de fechas para ver el detalle
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

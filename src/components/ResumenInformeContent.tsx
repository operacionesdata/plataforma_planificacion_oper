// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Save,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Edit3,
  AlertCircle,
  BarChart3,
  Download,
  Filter,
  Layers,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { loadFromSupabase } from "@/services/googleSheetsService";
import { DEFAULT_CENTRO_IDS, DEFAULT_CENTRO_NAMES } from "@/constants/centros";

// Definición de las 6 áreas operacionales
const AREAS_OPERACIONALES = [
  { id: "animacion-fondeo", nombre: "Programación Fondeo", color: "#3b82f6", icon: "⚓" },
  { id: "animacion-redes", nombre: "Programación Redes", color: "#10b981", icon: "🕸️" },
  { id: "animacion-rental", nombre: "Programación Rental", color: "#f59e0b", icon: "📦" },
  { id: "animacion-habitabilidad", nombre: "Habitabilidad", color: "#8b5cf6", icon: "🏠" },
  { id: "animacion-sso", nombre: "Área SSO", color: "#ef4444", icon: "⚠️" },
  { id: "animacion-ingenieria", nombre: "Ingeniería", color: "#06b6d4", icon: "🔧" },
];

// Colores para gráficos
const CHART_COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
};

const DESVIACIONES_CONFIG = [
  { code: "NAVEG", name: "Navegación", icon: "⛵", color: CHART_COLORS.info },
  { code: "PTOCE", name: "Puerto Cerrado", icon: "🔴", color: CHART_COLORS.danger },
  { code: "RELEV", name: "Relevo", icon: "👥", color: CHART_COLORS.success },
  { code: "INSSO", name: "Incumplimiento SSO", icon: "⚠️", color: CHART_COLORS.warning },
];

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

const formatFullDate = (date: Date) => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

interface CellData {
  [key: string]: string;
}

interface AreaMetrics {
  areaId: string;
  areaNombre: string;
  planificado: number;
  ejecutado: number;
  ejecutadoTotal: number;
  disponible: number;
  diasExtras: number;
  avance: number;
  desviaciones: {
    total: number;
    navegacion: number;
    puertoCerrado: number;
    relevo: number;
    incumplimientoSSO: number;
  };
}

interface CentroAreaMetrics extends AreaMetrics {
  centroId: number;
  centroNombre: string;
}

const ResumenInformeContent: React.FC = () => {
  const [dates] = useState(generateDates());
  const [centroNames] = useState<{ [key: number]: string }>(DEFAULT_CENTRO_NAMES);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const analyticsRef = useRef<HTMLDivElement>(null);

  // Estados para filtros
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["animacion-fondeo"]);
  const [selectedCentros, setSelectedCentros] = useState<number[]>(DEFAULT_CENTRO_IDS);
  const [showCentrosSelector, setShowCentrosSelector] = useState<boolean>(false);

  // Estados para datos cargados
  const [areasData, setAreasData] = useState<{ [areaId: string]: { cellData: CellData; ganttRowGroups: any[] } }>({});
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Cargar datos de todas las áreas seleccionadas
  useEffect(() => {
    const loadAreasData = async () => {
      setIsLoadingData(true);
      const newAreasData: typeof areasData = {};

      for (const areaId of selectedAreas) {
        const result = await loadFromSupabase(areaId);
        if (result.success && result.data) {
          newAreasData[areaId] = {
            cellData: result.data.cellData || {},
            ganttRowGroups: result.data.ganttRowGroups || [
              {
                id: "default",
                rows: [
                  { id: "B1", label: "Recursos" },
                  { id: "proyectado", label: "Proyectado" },
                  { id: "realizado", label: "Realizado" },
                ],
              },
            ],
          };
        }
      }

      setAreasData(newAreasData);
      setIsLoadingData(false);
    };

    if (selectedAreas.length > 0) {
      loadAreasData();
    }
  }, [selectedAreas]);

  // Calcular métricas por área y centro - CORREGIDO
  const calculateMetrics = (
    areaId: string,
    centroId: number,
    cellData: CellData,
    ganttRowGroups: any[],
  ): CentroAreaMetrics => {
    console.log(`\n🔍 Calculando métricas para ${areaId} - Centro ${centroNames[centroId]}:`, {
      totalKeys: Object.keys(cellData).length,
      centroKeys: Object.keys(cellData).filter(k => k.startsWith(`${centroId}-`)).length,
    });

    let planificado = 0;
    let ejecutadoTotal = 0;  // Todos los realizados (incluyendo anomalías)
    let ejecutado = 0;       // Solo trabajo real (sin anomalías)
    let diasNavegacion = 0;
    let diasPuertoCerrado = 0;
    let diasRelevo = 0;
    let diasIncumplimientoSSO = 0;

    // Obtener todas las filas de tipo proyectado y realizado
    const filasProyectado: string[] = [];
    const filasRealizado: string[] = [];

    ganttRowGroups.forEach((group) => {
      group.rows.forEach((row) => {
        if (row.id.includes("proyectado")) {
          filasProyectado.push(row.id);
        }
        if (row.id.includes("realizado")) {
          filasRealizado.push(row.id);
        }
      });
    });

      // Recorrer todas las fechas
    dates.forEach((_, dateIndex) => {
      // Contar proyectado
      filasProyectado.forEach((rowId) => {
        const key = `${centroId}-${rowId}-${dateIndex}`;
        const valor = cellData[key];
        if (valor && valor !== "🗑️" && valor.trim() !== "") {
          planificado++;
        }
      });

      // Contar ejecutado y desviaciones
      filasRealizado.forEach((rowId) => {
        const key = `${centroId}-${rowId}-${dateIndex}`;
        const valor = cellData[key];
        if (valor && valor !== "🗑️" && valor.trim() !== "") {
          ejecutadoTotal++;  // Contar TODOS los realizados

          // Extraer código de actividad - soportar múltiples formatos
          let activityCode = valor.trim();
          
          // Si tiene formato "CODIGO:NUMERO", extraer solo el código
          if (activityCode.includes(":")) {
            activityCode = activityCode.split(":")[0].trim();
          }
          
          // Si tiene formato "CODIGO-NUMERO", extraer solo el código
          if (activityCode.includes("-")) {
            activityCode = activityCode.split("-")[0].trim();
          }

          // Normalizar mayúsculas/minúsculas y buscar desviaciones
          const normalizedCode = activityCode.toUpperCase();
          
          // Contar desviaciones - buscar coincidencias parciales también
          let isDesviacion = false;
          if (normalizedCode.includes("NAVEG") || normalizedCode === "N") {
            diasNavegacion++;
            isDesviacion = true;
          } else if (normalizedCode.includes("PTOCE") || normalizedCode === "PC") {
            diasPuertoCerrado++;
            isDesviacion = true;
          } else if (normalizedCode.includes("RELEV") || normalizedCode === "R") {
            diasRelevo++;
            isDesviacion = true;
          } else if (normalizedCode.includes("INSSO") || normalizedCode.includes("SSO")) {
            diasIncumplimientoSSO++;
            isDesviacion = true;
          } else if (normalizedCode === "D1" || normalizedCode === "D2" || normalizedCode === "D3" || normalizedCode === "D4") {
            isDesviacion = true;
          }
          
          // Solo contar como trabajo real si NO es una desviación
          if (!isDesviacion) {
            ejecutado++;
          }
        }
      });
    });

    const totalDesviaciones = diasNavegacion + diasPuertoCerrado + diasRelevo + diasIncumplimientoSSO;
    const disponible = Math.max(0, planificado - ejecutadoTotal);
    const diasExtras = Math.max(0, ejecutadoTotal - planificado);
    const avance = planificado > 0 ? Math.round((ejecutado / planificado) * 100) : 0;

    const area = AREAS_OPERACIONALES.find((a) => a.id === areaId);

    // Log de resumen para debug
    console.log(`📊 Resumen ${area?.nombre || areaId} - Centro ${centroNames[centroId]}:`, {
      centroId,
      planificado,
      ejecutadoTotal,
      ejecutado,
      disponible,
      diasExtras,
      avance: `${avance}%`,
      "Total Desviaciones": totalDesviaciones,
    });

    return {
      areaId,
      areaNombre: area?.nombre || areaId,
      centroId,
      centroNombre: centroNames[centroId],
      planificado,
      ejecutado,
      ejecutadoTotal,
      disponible,
      diasExtras,
      avance,
      desviaciones: {
        total: totalDesviaciones,
        navegacion: diasNavegacion,
        puertoCerrado: diasPuertoCerrado,
        relevo: diasRelevo,
        incumplimientoSSO: diasIncumplimientoSSO,
      },
    };
  };

  // Calcular métricas consolidadas - CORREGIDO
  const analyticsData = useMemo(() => {
    const metricas: CentroAreaMetrics[] = [];

    selectedAreas.forEach((areaId) => {
      const areaData = areasData[areaId];
      if (!areaData) return;

      selectedCentros.forEach((centroId) => {
        const metrica = calculateMetrics(areaId, centroId, areaData.cellData, areaData.ganttRowGroups);
        metricas.push(metrica);
      });
    });

    // Log de todas las métricas calculadas
    console.log("📊 TODAS LAS MÉTRICAS CALCULADAS:", metricas);

    // Agregación por área
    const metricasPorArea: { [areaId: string]: AreaMetrics } = {};
    metricas.forEach((m) => {
      if (!metricasPorArea[m.areaId]) {
        metricasPorArea[m.areaId] = {
          areaId: m.areaId,
          areaNombre: m.areaNombre,
          planificado: 0,
          ejecutado: 0,
          ejecutadoTotal: 0,
          disponible: 0,
          diasExtras: 0,
          avance: 0,
          desviaciones: {
            total: 0,
            navegacion: 0,
            puertoCerrado: 0,
            relevo: 0,
            incumplimientoSSO: 0,
          },
        };
      }
      const area = metricasPorArea[m.areaId];
      area.planificado += m.planificado;
      area.ejecutado += m.ejecutado;
      area.ejecutadoTotal += m.ejecutadoTotal;
      area.disponible += m.disponible;
      area.diasExtras += m.diasExtras;
      area.desviaciones.total += m.desviaciones.total;
      area.desviaciones.navegacion += m.desviaciones.navegacion;
      area.desviaciones.puertoCerrado += m.desviaciones.puertoCerrado;
      area.desviaciones.relevo += m.desviaciones.relevo;
      area.desviaciones.incumplimientoSSO += m.desviaciones.incumplimientoSSO;
    });

    // Recalcular avance por área
    Object.values(metricasPorArea).forEach((area) => {
      area.avance = area.planificado > 0 ? Math.round((area.ejecutado / area.planificado) * 100) : 0;
    });

    console.log("📊 MÉTRICAS POR ÁREA:", metricasPorArea);

    // Datos para gráfico comparativo por área
    const avancePorArea = Object.values(metricasPorArea).map((area) => ({
      area: area.areaNombre,
      Planificado: area.planificado,
      Ejecutado: area.ejecutado,
      Disponible: area.disponible,
      "Avance %": area.avance,
    }));

    // Datos para gráfico de desviaciones totales
    const desviacionesTotales = DESVIACIONES_CONFIG.map((config) => {
      const total = Object.values(metricasPorArea).reduce((sum, area) => {
        switch (config.code) {
          case "NAVEG":
            return sum + area.desviaciones.navegacion;
          case "PTOCE":
            return sum + area.desviaciones.puertoCerrado;
          case "RELEV":
            return sum + area.desviaciones.relevo;
          case "INSSO":
            return sum + area.desviaciones.incumplimientoSSO;
          default:
            return sum;
        }
      }, 0);

      return {
        name: config.name,
        value: total,
        color: config.color,
        icon: config.icon,
      };
    }).filter((d) => d.value > 0);

    // Datos para tabla detallada por centro y área
    const tablaDetallada = metricas.map((m) => ({
      centro: m.centroNombre,
      area: m.areaNombre,
      planificado: m.planificado,
      ejecutado: m.ejecutado,
      ejecutadoTotal: m.ejecutadoTotal,
      disponible: m.disponible,
      diasExtras: m.diasExtras,
      avance: m.avance,
      desviacionesTotal: m.desviaciones.total,
      navegacion: m.desviaciones.navegacion,
      puertoCerrado: m.desviaciones.puertoCerrado,
      relevo: m.desviaciones.relevo,
      incumplimientoSSO: m.desviaciones.incumplimientoSSO,
    }));

    // Datos para gráfico radar de áreas
    const radarData = AREAS_OPERACIONALES.filter((area) => selectedAreas.includes(area.id)).map((area) => {
      const areaMetrics = metricasPorArea[area.id];
      return {
        area: area.nombre,
        avance: areaMetrics?.avance || 0,
      };
    });

    // Resumen global
    const totalPlanificado = Object.values(metricasPorArea).reduce((sum, area) => sum + area.planificado, 0);
    const totalEjecutado = Object.values(metricasPorArea).reduce((sum, area) => sum + area.ejecutado, 0);
    const totalEjecutadoTotal = Object.values(metricasPorArea).reduce((sum, area) => sum + area.ejecutadoTotal, 0);
    const totalDisponible = Object.values(metricasPorArea).reduce((sum, area) => sum + area.disponible, 0);
    const avanceGlobal = totalPlanificado > 0 ? Math.round((totalEjecutado / totalPlanificado) * 100) : 0;
    const totalDesviaciones = Object.values(metricasPorArea).reduce((sum, area) => sum + area.desviaciones.total, 0);

    // Días Extras = suma de días extras de cada área (cuando ejecutadoTotal > planificado por área)
    const totalDiasExtras = Object.values(metricasPorArea).reduce((sum, area) => sum + area.diasExtras, 0);

    console.log("📊 RESUMEN GLOBAL:", {
      totalPlanificado,
      totalEjecutado,
      totalEjecutadoTotal,
      totalDisponible,
      avanceGlobal,
      totalDesviaciones,
      totalDiasExtras,
    });

    return {
      metricas,
      metricasPorArea: Object.values(metricasPorArea),
      avancePorArea,
      desviacionesTotales,
      tablaDetallada,
      radarData,
      resumenGlobal: {
        planificado: totalPlanificado,
        ejecutado: totalEjecutado,
        ejecutadoTotal: totalEjecutadoTotal,
        disponible: totalDisponible,
        avance: avanceGlobal,
        desviaciones: totalDesviaciones,
        diasExtras: totalDiasExtras,
      },
    };
  }, [areasData, selectedAreas, selectedCentros, centroNames, dates]);

  // Función para exportar a PDF
  const exportToPDF = async () => {
    if (!analyticsRef.current) return;

    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Título del reporte
      pdf.setFontSize(20);
      pdf.setTextColor(44, 62, 80);
      pdf.text("Reporte de Análisis Multi-Área", pageWidth / 2, 20, { align: "center" });

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, pageWidth / 2, 28, { align: "center" });

      pdf.setFontSize(10);
      pdf.text(`Áreas: ${selectedAreas.length} | Centros: ${selectedCentros.length}`, pageWidth / 2, 35, {
        align: "center",
      });

      // Capturar cada sección del dashboard
      const sections = analyticsRef.current.querySelectorAll(".analytics-section");
      let yPosition = 45;

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;

        if (yPosition > pageHeight - 60 && i > 0) {
          pdf.addPage();
          yPosition = 20;
        }

        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (yPosition + imgHeight > pageHeight - 10) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.addImage(imgData, "PNG", 10, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      }

      pdf.save(`reporte-multi-area-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Error al generar el PDF. Por favor, intente nuevamente.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Toggle de selección de área
  const toggleArea = (areaId: string) => {
    if (selectedAreas.includes(areaId)) {
      if (selectedAreas.length > 1) {
        setSelectedAreas(selectedAreas.filter((id) => id !== areaId));
      }
    } else {
      setSelectedAreas([...selectedAreas, areaId]);
    }
  };

  // Toggle de selección de centro
  const toggleCentro = (centroId: number) => {
    if (selectedCentros.includes(centroId)) {
      if (selectedCentros.length > 1) {
        setSelectedCentros(selectedCentros.filter((id) => id !== centroId));
      }
    } else {
      setSelectedCentros([...selectedCentros, centroId]);
    }
  };

  return (
    <div className="ocean-card space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 size={32} />
            Resumen Ejecutivo Multi-Área
          </h2>
          <p className="text-slate-300 mt-2">
            Análisis consolidado de {selectedAreas.length} área(s) y {selectedCentros.length} centro(s)
          </p>
        </div>
        <button
          onClick={exportToPDF}
          disabled={isGeneratingPDF}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg disabled:opacity-50"
        >
          <Download size={20} />
          {isGeneratingPDF ? "Generando PDF..." : "Descargar PDF"}
        </button>
      </div>

      {/* Filtros de Áreas y Centros */}
      <div className="space-y-4">
        {/* Selector de Áreas */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="text-blue-600" size={24} />
            <h3 className="font-bold text-slate-900 text-lg">Seleccionar Áreas Operacionales</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {AREAS_OPERACIONALES.map((area) => (
              <label
                key={area.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                  selectedAreas.includes(area.id)
                    ? "bg-blue-50 border-blue-500"
                    : "bg-slate-50 border-slate-200 hover:border-blue-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedAreas.includes(area.id)}
                  onChange={() => toggleArea(area.id)}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-2xl">{area.icon}</span>
                <span className="font-semibold text-slate-900 text-sm">{area.nombre}</span>
                {selectedAreas.includes(area.id) && (
                  <span className="ml-auto px-2 py-1 bg-blue-600 text-white text-xs rounded-full">✓</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Selector de Centros - Colapsable */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => setShowCentrosSelector(!showCentrosSelector)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Filter className="text-green-600" size={24} />
              <h3 className="font-bold text-slate-900 text-lg">Seleccionar Centros Acuícolas</h3>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                {selectedCentros.length} seleccionados
              </span>
            </div>
            {showCentrosSelector ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>

          {showCentrosSelector && (
            <div className="p-4 border-t animate-in slide-in-from-top duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {DEFAULT_CENTRO_IDS.map((centroId) => (
                  <label
                    key={centroId}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                      selectedCentros.includes(centroId)
                        ? "bg-green-50 border-green-500"
                        : "bg-slate-50 border-slate-200 hover:border-green-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCentros.includes(centroId)}
                      onChange={() => toggleCentro(centroId)}
                      className="w-5 h-5 text-green-600"
                    />
                    <span className="font-semibold text-slate-900 text-sm">{centroNames[centroId]}</span>
                    {selectedCentros.includes(centroId) && (
                      <span className="ml-auto px-2 py-1 bg-green-600 text-white text-xs rounded-full">✓</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoadingData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-900 font-semibold">Cargando datos de las áreas seleccionadas...</p>
        </div>
      )}

      {/* Dashboard de Analytics */}
      {!isLoadingData && (
        <div
          className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border-2 border-blue-200"
          ref={analyticsRef}
        >
          {/* Resumen Global */}
          <div className="analytics-section">
            <h4 className="text-2xl font-bold text-slate-900 mb-4">📊 Resumen Global</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg shadow-lg text-white">
                <div className="text-3xl font-bold">{analyticsData.resumenGlobal.planificado}</div>
                <div className="text-xs mt-2 opacity-90">Planificado</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg shadow-lg text-white">
                <div className="text-3xl font-bold">{analyticsData.resumenGlobal.ejecutado}</div>
                <div className="text-xs mt-2 opacity-90">Ejecutado</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-lg shadow-lg text-white">
                <div className="text-3xl font-bold">{analyticsData.resumenGlobal.desviaciones}</div>
                <div className="text-xs mt-2 opacity-90">Días Desviaciones</div>
              </div>
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-4 rounded-lg shadow-lg text-white">
                <div className="text-3xl font-bold">{analyticsData.resumenGlobal.ejecutado}</div>
                <div className="text-xs mt-2 opacity-90">Días Trabajados</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-lg shadow-lg text-white">
                <div className="text-3xl font-bold">{analyticsData.resumenGlobal.disponible}</div>
                <div className="text-xs mt-2 opacity-90">Disponible</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg shadow-lg text-white">
                <div className="text-3xl font-bold">{analyticsData.resumenGlobal.diasExtras}</div>
                <div className="text-xs mt-2 opacity-90">Días Extras</div>
              </div>
              <div
                className={`p-4 rounded-lg shadow-lg text-white ${
                  analyticsData.resumenGlobal.avance >= 80
                    ? "bg-gradient-to-br from-green-500 to-green-600"
                    : analyticsData.resumenGlobal.avance >= 50
                      ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
                      : "bg-gradient-to-br from-red-500 to-red-600"
                }`}
              >
                <div className="text-3xl font-bold">{analyticsData.resumenGlobal.avance}%</div>
                <div className="text-xs mt-2 opacity-90">Avance Global Real</div>
              </div>
            </div>
          </div>

          {/* Gráfico Comparativo por Área */}
          <div className="analytics-section">
            <h4 className="text-xl font-bold text-slate-900 mb-4">📊 Comparativa por Área Operacional</h4>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.avancePorArea}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Planificado" fill={CHART_COLORS.primary} />
                  <Bar dataKey="Ejecutado" fill={CHART_COLORS.success} />
                  <Bar dataKey="Disponible" fill={CHART_COLORS.warning} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Desviaciones - CORREGIDO */}
          <div className="analytics-section">
            <h4 className="text-xl font-bold text-slate-900 mb-4">⚠️ Distribución de Desviaciones</h4>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              {analyticsData.desviacionesTotales.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={analyticsData.desviacionesTotales}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={(entry) => {
                          const total = analyticsData.desviacionesTotales.reduce((sum, d) => sum + d.value, 0);
                          const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
                          return `${entry.icon} ${entry.name}: ${entry.value} días (${percentage}%)`;
                        }}
                      >
                        {analyticsData.desviacionesTotales.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => {
                        const total = analyticsData.desviacionesTotales.reduce((sum, d) => sum + d.value, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return [`${value} días (${percentage}%)`, 'Cantidad'];
                      }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Detalle de Desviaciones - AGREGADO */}
                  <div className="mt-6 space-y-3">
                    <h5 className="font-bold text-slate-900 text-lg">Detalle por Tipo de Desviación:</h5>
                    {analyticsData.desviacionesTotales.map((desviacion) => {
                      const total = analyticsData.desviacionesTotales.reduce((sum, d) => sum + d.value, 0);
                      const percentage = total > 0 ? ((desviacion.value / total) * 100).toFixed(1) : 0;
                      return (
                        <div
                          key={desviacion.name}
                          className="flex justify-between items-center p-4 rounded-lg"
                          style={{
                            backgroundColor: `${desviacion.color}20`,
                            borderLeft: `4px solid ${desviacion.color}`,
                          }}
                        >
                          <span className="flex items-center gap-2 font-semibold text-slate-900">
                            <span className="text-2xl">{desviacion.icon}</span>
                            {desviacion.name}
                          </span>
                          <div className="text-right flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold" style={{ color: desviacion.color }}>
                                {desviacion.value}
                              </div>
                              <div className="text-sm text-slate-600">días</div>
                            </div>
                            <div className="bg-slate-100 px-3 py-2 rounded-lg">
                              <div className="text-xl font-bold text-slate-800">{percentage}%</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-lg font-semibold">✅ No hay desviaciones registradas</p>
                  <p className="text-sm mt-2">Todas las operaciones se ejecutaron según lo planificado</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabla Detallada por Centro y Área */}
          <div className="analytics-section">
            <h4 className="text-xl font-bold text-slate-900 mb-4">📋 Detalle por Centro y Área</h4>
            <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-3 py-3 text-left">Centro</th>
                    <th className="px-3 py-3 text-left">Área</th>
                    <th className="px-3 py-3 text-center">Plan.</th>
                    <th className="px-3 py-3 text-center">Ejec.</th>
                    <th className="px-3 py-3 text-center">Días Desv.</th>
                    <th className="px-3 py-3 text-center">Días Trab.</th>
                    <th className="px-3 py-3 text-center">Disp.</th>
                    <th className="px-3 py-3 text-center">Días Extras</th>
                    <th className="px-3 py-3 text-center">Avance %</th>
                    <th className="px-3 py-3 text-center">⛵</th>
                    <th className="px-3 py-3 text-center">🔴</th>
                    <th className="px-3 py-3 text-center">👥</th>
                    <th className="px-3 py-3 text-center">⚠️</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.tablaDetallada.map((row, index) => {
                    return (
                      <tr key={index} className={index % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                        <td className="px-3 py-3 font-semibold text-slate-900">{row.centro}</td>
                        <td className="px-3 py-3 text-slate-700">{row.area}</td>
                        <td className="px-3 py-3 text-center text-blue-600 font-bold">{row.planificado}</td>
                        <td className="px-3 py-3 text-center text-green-600 font-bold">{row.ejecutadoTotal}</td>
                        <td className="px-3 py-3 text-center text-orange-600 font-bold">{row.desviacionesTotal}</td>
                        <td className="px-3 py-3 text-center text-teal-600 font-bold">{row.ejecutado}</td>
                        <td className="px-3 py-3 text-center text-amber-600 font-bold">{row.disponible}</td>
                        <td className="px-3 py-3 text-center text-purple-600 font-bold">{row.diasExtras}</td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`px-2 py-1 rounded-full font-bold text-xs ${
                              row.avance >= 80
                                ? "bg-green-100 text-green-800"
                                : row.avance >= 50
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {row.avance}%
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-blue-600">{row.navegacion || "-"}</td>
                        <td className="px-3 py-3 text-center text-red-600">{row.puertoCerrado || "-"}</td>
                        <td className="px-3 py-3 text-center text-green-600">{row.relevo || "-"}</td>
                        <td className="px-3 py-3 text-center text-amber-600">{row.incumplimientoSSO || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumenInformeContent;

// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { Save, Plus, X, Edit3, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import {
  saveToSupabase,
  loadFromSupabase,
  saveSharedFines,
  loadSharedFines,
  clearAllLocalStorage,
} from "@/services/googleSheetsService";
import type { GanttData } from "@/services/googleSheetsService";
import { DEFAULT_CENTRO_IDS, DEFAULT_CENTRO_NAMES } from "@/constants/centros";
import { useGanttPermissions } from "@/hooks/useGanttPermissions";
import { PermissionBadges, AccessDenied } from "@/components/PermissionBadges";

// Configuración de recursos con nueva paleta de colores
const barcos = [
  { number: "1", code: "BZU", name: "Bza. Santa Úrsula", color: "#95b8f6" },
  { number: "2", code: "LMC", name: "LM Caleb", color: "#add5fa" },
  { number: "3", code: "CAT", name: "Cat Estero", color: "#fa5f49" },
  { number: "4", code: "CON", name: "Cono", color: "#f9a59a" },
  { number: "5", code: "LML", name: "LM Levi", color: "#f9d99a" },
  { number: "6", code: "ISC", name: "Isaí Cat", color: "#95b8f6" },
  { number: "7", code: "IL", name: "Isla Lemu", color: "#add5fa" },
  { number: "8", code: "CU", name: "Cuadrilla", color: "#fa5f49" },
  { code: "🗑️", name: "Borrar", color: "#F1F5F9" },
];

// Generar fechas: Noviembre y Diciembre 2025 + Todo el año 2026
const generateDates = () => {
  const dates = [];

  // Noviembre 2025 (1-30)
  const novStart = new Date(2025, 10, 1);
  const novEnd = new Date(2025, 10, 30);
  for (let date = new Date(novStart); date <= novEnd; date.setDate(date.getDate() + 1)) {
    dates.push(new Date(date));
  }

  // Diciembre 2025 (1-31)
  const decStart = new Date(2025, 11, 1);
  const decEnd = new Date(2025, 11, 31);
  for (let date = new Date(decStart); date <= decEnd; date.setDate(date.getDate() + 1)) {
    dates.push(new Date(date));
  }

  // Todo el año 2026 (1 enero - 31 diciembre)
  const year2026Start = new Date(2026, 0, 1);
  const year2026End = new Date(2026, 11, 31);
  for (let date = new Date(year2026Start); date <= year2026End; date.setDate(date.getDate() + 1)) {
    dates.push(new Date(date));
  }

  return dates;
};

// Función para obtener el número de semana ISO
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

// Función para formatear fecha
const formatDate = (date: Date) => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const dayName = ["D", "L", "M", "M", "J", "V", "S"][date.getDay()];
  const weekNumber = getWeekNumber(date);
  return { day, month, dayName, weekNumber };
};

// Función para formatear fecha completa
const formatDateFull = (date: Date) => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Función para determinar si es fin de semana
const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Función para determinar si es día pasado
const isPast = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

// Función para determinar si es hoy
const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

interface CellData {
  [key: string]: string;
}

interface GanttRowGroup {
  id: string;
  rows: {
    id: string;
    label: string;
  }[];
}

interface WeekComment {
  text: string;
  author: string;
  timestamp: string;
}

interface WeekComments {
  [key: string]: WeekComment;
}

// Tipo de actividad seleccionada
type TipoActividad =
  | "LINEAS_FONDEO"
  | "PASADORES"
  | "FLOTADORES"
  | "INFLADO_FLOTADORES"
  | "CORCHETES"
  | "CALZOS"
  | "PISOS"
  | "TAPA_BUTILOS"
  | "LIMPIEZA_FLOTADORES"
  | "ACCESORIOS"
  | "RESANADO_PINTADO"
  | "POSTES"
  | "BARANDAS"
  | "SOPORTE_PAJARERA"
  | "TRAZABILIDAD_FLOTADORES"
  | "TRAZABILIDAD_PASADORES"
  | "NAVEGACION"
  | "PUERTO_CERRADO"
  | "RELEVO"
  | "INCUMPLIMIENTO_SSO";

export const GanttCalendarFondeo: React.FC = () => {
  const { canView, canEditProyectado, canEditRealizado, checkEditPermission, getAuthorName, hasAnyEditPermission, profile, isAdmin } = useGanttPermissions('fondeo');
  
  const [lineasFondeo, setLineasFondeo] = useState<number>(100);
  const [pasadores, setPasadores] = useState<number>(90);
  const [flotadores, setFlotadores] = useState<number>(100);
  const [infladoFlotadores, setInfladoFlotadores] = useState<number>(110);
  const [corchetes, setCorchetes] = useState<number>(100);
  const [calzos, setCalzos] = useState<number>(14);
  const [pisos, setPisos] = useState<number>(100);
  const [tapaButilos, setTapaButilos] = useState<number>(90);
  const [limpiezaFlotadores, setLimpiezaFlotadores] = useState<number>(180);
  const [postes, setPostes] = useState<number>(0);
  const [barandas, setBarandas] = useState<number>(0);
  const [soportePajarera, setSoportePajarera] = useState<number>(0);
  const [trazabilidadFlotadores, setTrazabilidadFlotadores] = useState<number>(0);
  const [trazabilidadPasadores, setTrazabilidadPasadores] = useState<number>(0);

  const [selectedBarco, setSelectedBarco] = useState<string>("BZU");
  const [selectedActividad, setSelectedActividad] = useState<TipoActividad>("LINEAS_FONDEO");
  const [cellData, setCellData] = useState<CellData>({});
  const [selectedCentros, setSelectedCentros] = useState<number[]>([DEFAULT_CENTRO_IDS[0]]);
  const [dates] = useState(generateDates());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<"success" | "error" | null>(null);
  const [sharedFines, setSharedFines] = useState<{ [key: string]: boolean }>({});
  const [centroNames, setCentroNames] = useState<{ [key: number]: string }>(DEFAULT_CENTRO_NAMES);
  const [barcoNames, setBarcoNames] = useState<{ [key: string]: string }>({
    BZU: "Bza. Santa Úrsula",
    LMC: "LM Caleb",
    CAT: "Cat Estero",
    CON: "Cono",
    LML: "LM Levi",
    ISC: "Isaí Cat",
    IL: "Isla Lemu",
    CU: "Cuadrilla",
  });
  const [showModal, setShowModal] = useState<TipoActividad | null>(null);
  const [ganttRowGroups, setGanttRowGroups] = useState<GanttRowGroup[]>([
    {
      id: "default",
      rows: [
        { id: "B1", label: "🚢 Recursos Asignados" },
        { id: "proyectado", label: "📋 Proyectado" },
        { id: "realizado", label: "✅ Realizado" },
      ],
    },
  ]);

  // Estados para comentarios por semana con información del autor
  const [weekComments, setWeekComments] = useState<WeekComments>({});
  const [editingWeek, setEditingWeek] = useState<string | null>(null);
  const [tempWeekComment, setTempWeekComment] = useState<string>("");
  const [viewingWeekComment, setViewingWeekComment] = useState<string | null>(null);

  // Estados para los selectores colapsables
  const [showActivitySelector, setShowActivitySelector] = useState<boolean>(false);
  const [showResourceSelector, setShowResourceSelector] = useState<boolean>(false);

  // Función para verificar si una actividad es desviación
  const esActividadDesviacion = (activityCode: string): boolean => {
    return ["NAVEGACION", "PUERTO_CERRADO", "RELEVO", "INCUMPLIMIENTO_SSO"].includes(activityCode);
  };

  // Calcular métricas incluyendo todos los grupos
  const metrics = useMemo(() => {
    let planificado = 0;
    let totalRealizadoConDesviaciones = 0; // TODOS los días en realizado
    let ejecutadoSinDesviaciones = 0; // Solo días de trabajo real

    // Contadores de desviaciones
    let diasNavegacion = 0;
    let diasPuertoCerrado = 0;
    let diasRelevo = 0;
    let diasIncumplimientoSSO = 0;

    selectedCentros.forEach((centroId) => {
      ganttRowGroups.forEach((group) => {
        group.rows.forEach((row) => {
          if (row.id.includes("proyectado")) {
            // Contar días únicos con actividades en proyectado
            dates.forEach((_, dateIndex) => {
              const proyectadoKey = `${centroId}-${row.id}-${dateIndex}`;
              const valorProyectado = cellData[proyectadoKey];

              if (valorProyectado && valorProyectado !== "🗑️") {
                planificado++;
              }
            });
          }

          if (row.id.includes("realizado")) {
            dates.forEach((_, dateIndex) => {
              const realizadoKey = `${centroId}-${row.id}-${dateIndex}`;
              const valorRealizado = cellData[realizadoKey];

              if (valorRealizado && valorRealizado !== "🗑️") {
                // Contar TODOS los días en realizado (incluyendo desviaciones)
                totalRealizadoConDesviaciones++;

                // Contar solo trabajo real (sin desviaciones)
                if (!esActividadDesviacion(valorRealizado)) {
                  ejecutadoSinDesviaciones++;
                }

                // Contar desviaciones para el panel de análisis
                if (valorRealizado === "NAVEGACION") diasNavegacion++;
                else if (valorRealizado === "PUERTO_CERRADO") diasPuertoCerrado++;
                else if (valorRealizado === "RELEVO") diasRelevo++;
                else if (valorRealizado === "INCUMPLIMIENTO_SSO") diasIncumplimientoSSO++;
              }
            });
          }
        });
      });
    });

    // Disponible = planificado - (todos los días realizados incluyendo desviaciones)
    // Nunca puede ser negativo
    const disponible = Math.max(0, planificado - totalRealizadoConDesviaciones);

    // Avance se calcula solo con días de trabajo real vs planificado
    const avance = planificado > 0 ? Math.round((ejecutadoSinDesviaciones / planificado) * 100) : 0;

    // Días Extras = días realizados que exceden lo planificado (incluyendo desviaciones)
    const diasExtras = Math.max(0, totalRealizadoConDesviaciones - planificado);

    // Calcular desviaciones totales
    const totalDesviaciones = diasNavegacion + diasPuertoCerrado + diasRelevo + diasIncumplimientoSSO;

    return {
      planificado,
      ejecutado: ejecutadoSinDesviaciones, // Solo trabajo real
      disponible,
      avance,
      diasExtras, // Nuevo campo
      desviaciones: {
        total: totalDesviaciones,
        navegacion: { dias: diasNavegacion },
        puertoCerrado: { dias: diasPuertoCerrado },
        relevo: { dias: diasRelevo },
        incumplimientoSSO: { dias: diasIncumplimientoSSO },
      },
    };
  }, [cellData, selectedCentros, dates, ganttRowGroups]);

  // Calcular fechas de inicio y fin del proyectado
  const calcularFechasProyectado = () => {
    let fechaInicio: Date | null = null;
    let fechaFin: Date | null = null;

    selectedCentros.forEach((centroId) => {
      dates.forEach((date, dateIndex) => {
        ganttRowGroups.forEach((group) => {
          group.rows.forEach((row) => {
            if (row.id.includes("proyectado")) {
              const key = `${centroId}-${row.id}-${dateIndex}`;
              if (cellData[key]) {
                if (!fechaInicio || date < fechaInicio) {
                  fechaInicio = date;
                }
                if (!fechaFin || date > fechaFin) {
                  fechaFin = date;
                }
              }
            }
          });
        });
      });
    });

    return { fechaInicio, fechaFin };
  };

  const { fechaInicio, fechaFin } = calcularFechasProyectado();

  // Mapeo de actividades a números
  const actividadNumero: Record<TipoActividad, string> = {
    LINEAS_FONDEO: "1",
    PASADORES: "2",
    FLOTADORES: "3",
    INFLADO_FLOTADORES: "4",
    CORCHETES: "5",
    CALZOS: "6",
    PISOS: "7",
    TAPA_BUTILOS: "8",
    LIMPIEZA_FLOTADORES: "9",
    ACCESORIOS: "10",
    RESANADO_PINTADO: "11",
    POSTES: "P",
    BARANDAS: "B",
    SOPORTE_PAJARERA: "SP",
    TRAZABILIDAD_FLOTADORES: "TF",
    TRAZABILIDAD_PASADORES: "TP",
    NAVEGACION: "N",
    PUERTO_CERRADO: "PC",
    RELEVO: "R",
    INCUMPLIMIENTO_SSO: "IS",
  };

  // Calcular días según el tipo de actividad
  const calcularDias = (tipo: TipoActividad): number => {
    switch (tipo) {
      case "LINEAS_FONDEO":
        return Math.ceil(lineasFondeo / 4);
      case "PASADORES":
        return Math.ceil(pasadores / 45);
      case "FLOTADORES":
        return Math.ceil(flotadores / 10);
      case "INFLADO_FLOTADORES":
        return Math.ceil(infladoFlotadores / 55);
      case "CORCHETES":
        return Math.ceil(corchetes / 50);
      case "CALZOS":
        return Math.ceil(calzos / 7);
      case "PISOS":
        return Math.ceil(pisos / 10);
      case "TAPA_BUTILOS":
        return Math.ceil(tapaButilos / 30);
      case "LIMPIEZA_FLOTADORES":
        return Math.ceil(limpiezaFlotadores / 60);
      case "ACCESORIOS":
        return 2;
      case "RESANADO_PINTADO":
        return 3;
      case "NAVEGACION":
      case "PUERTO_CERRADO":
      case "RELEVO":
      case "INCUMPLIMIENTO_SSO":
        return 1;
      case "POSTES":
      case "BARANDAS":
      case "SOPORTE_PAJARERA":
      case "TRAZABILIDAD_FLOTADORES":
      case "TRAZABILIDAD_PASADORES":
        return 1;
      default:
        return 0;
    }
  };

  // Obtener valor a mostrar (número o nombre+porcentaje)
  const getValorMostrar = (tipo: TipoActividad): string => {
    switch (tipo) {
      case "POSTES":
        return `P${postes}%`;
      case "BARANDAS":
        return `B${barandas}%`;
      case "SOPORTE_PAJARERA":
        return `SP${soportePajarera}%`;
      case "TRAZABILIDAD_FLOTADORES":
        return `TF${trazabilidadFlotadores}%`;
      case "TRAZABILIDAD_PASADORES":
        return `TP${trazabilidadPasadores}%`;
      default:
        return actividadNumero[tipo] || "";
    }
  };

  // Agregar grupo de 3 filas
  const addGanttRowGroup = () => {
    const timestamp = Date.now();
    const newGroup: GanttRowGroup = {
      id: `group-${timestamp}`,
      rows: [
        { id: `recursos-${timestamp}`, label: "🚢 Recursos Asignados" },
        { id: `proyectado-${timestamp}`, label: "📋 Proyectado" },
        { id: `realizado-${timestamp}`, label: "✅ Realizado" },
      ],
    };
    setGanttRowGroups([...ganttRowGroups, newGroup]);
  };

  // Eliminar grupo completo
  const removeGanttRowGroup = (groupId: string) => {
    if (groupId === "default") return;

    const group = ganttRowGroups.find((g) => g.id === groupId);
    if (!group) return;

    const newCellData = { ...cellData };
    selectedCentros.forEach((centroId) => {
      group.rows.forEach((row) => {
        dates.forEach((_, dateIndex) => {
          delete newCellData[`${centroId}-${row.id}-${dateIndex}`];
        });
      });
    });
    setCellData(newCellData);
    setGanttRowGroups(ganttRowGroups.filter((g) => g.id !== groupId));
  };

  // Actualizar label de fila
  const updateRowLabel = (groupId: string, rowId: string, newLabel: string) => {
    setGanttRowGroups(
      ganttRowGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              rows: group.rows.map((row) => (row.id === rowId ? { ...row, label: newLabel } : row)),
            }
          : group,
      ),
    );
  };

  // Manejar comentarios de semana con información del autor
  const openWeekCommentEditor = (weekNumber: number, centroId: number) => {
    const weekKey = `${centroId}-week-${weekNumber}`;

    // Si existe un comentario, mostrar en modo visualización
    if (weekComments[weekKey]) {
      setViewingWeekComment(weekKey);
    } else {
      // Si no existe, abrir en modo edición
      setEditingWeek(weekKey);
      setTempWeekComment("");
    }
  };

  const saveWeekComment = async () => {
    if (editingWeek) {
      const newComments = { ...weekComments };
      if (tempWeekComment.trim()) {
        newComments[editingWeek] = {
          text: tempWeekComment,
          author: getAuthorName(),
          timestamp: new Date().toISOString(),
        };
      } else {
        delete newComments[editingWeek];
      }
      setWeekComments(newComments);
      setEditingWeek(null);
      setTempWeekComment("");

      await saveToSupabase("animacion-fondeo", {
        cellData,
        centroNames: {},
        barcoNames,
        selectedCentros,
        ganttRowGroups,
        weekComments: newComments,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const cancelWeekComment = () => {
    setEditingWeek(null);
    setTempWeekComment("");
  };

  const closeViewingComment = () => {
    setViewingWeekComment(null);
  };

  const editFromViewing = () => {
    if (viewingWeekComment) {
      setEditingWeek(viewingWeekComment);
      setTempWeekComment(weekComments[viewingWeekComment]?.text || "");
      setViewingWeekComment(null);
    }
  };

  const deleteWeekComment = async () => {
    if (viewingWeekComment) {
      const newComments = { ...weekComments };
      delete newComments[viewingWeekComment];
      setWeekComments(newComments);
      setViewingWeekComment(null);

      await saveToSupabase("animacion-fondeo", {
        cellData,
        centroNames: {},
        barcoNames,
        selectedCentros,
        ganttRowGroups,
        weekComments: newComments,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Manejar clic en celda (SIN modificar, ya funciona el desplazamiento)
  const handleCellClick = async (centroId: number, rowType: string, dateIndex: number) => {
    // Verificar permisos antes de editar
    if (!checkEditPermission(rowType)) {
      return;
    }
    
    const key = `${centroId}-${rowType}-${dateIndex}`;

    const isRecursosRow = rowType.includes("recursos") || rowType === "B1";

    if (isRecursosRow) {
      if (selectedBarco === "🗑️") {
        const newData = { ...cellData };
        delete newData[key];
        setCellData(newData);
      } else {
        const newData = { ...cellData, [key]: selectedBarco };
        setCellData(newData);
      }
    } else {
      if (selectedActividad === ("BORRAR" as any) || selectedBarco === "🗑️") {
        const newData = { ...cellData };
        delete newData[key];
        setCellData(newData);
      } else {
        let newData = { ...cellData };

        // SI ES REALIZADO: solo 1 día
        if (rowType.includes("realizado")) {
          newData[key] = selectedActividad;
        } else if (rowType.includes("proyectado")) {
          // SI ES PROYECTADO: verificar si hay actividades existentes y desplazarlas
          const diasTotales = calcularDias(selectedActividad);

          // Verificar si hay actividades en el rango donde se va a insertar
          let hayActividadesEnRango = false;
          for (let i = 0; i < diasTotales && dateIndex + i < dates.length; i++) {
            const checkKey = `${centroId}-${rowType}-${dateIndex + i}`;
            if (newData[checkKey]) {
              hayActividadesEnRango = true;
              break;
            }
          }

          // Si hay actividades, desplazarlas
          if (hayActividadesEnRango) {
            // Desplazar actividades existentes
            const actividadesADesplazar: Array<{ index: number; valor: string }> = [];
            for (let i = dateIndex; i < dates.length; i++) {
              const checkKey = `${centroId}-${rowType}-${i}`;
              if (newData[checkKey]) {
                actividadesADesplazar.push({ index: i, valor: newData[checkKey] });
                delete newData[checkKey];
              }
            }
            actividadesADesplazar.forEach(({ index, valor }) => {
              const nuevaPosicion = index + diasTotales;
              if (nuevaPosicion < dates.length) {
                const newKey = `${centroId}-${rowType}-${nuevaPosicion}`;
                newData[newKey] = valor;
              }
            });
          }

          // Insertar la nueva actividad
          for (let i = 0; i < diasTotales && dateIndex + i < dates.length; i++) {
            const newKey = `${centroId}-${rowType}-${dateIndex + i}`;
            newData[newKey] = selectedActividad;
          }
        }

        setCellData(newData);
      }
    }

    await saveToSupabase("animacion-fondeo", {
      cellData,
      centroNames: {},
      barcoNames,
      selectedCentros,
      ganttRowGroups,
      weekComments,
      timestamp: new Date().toISOString(),
    });
  };

  // Obtener color de fondo de celda
  const getCellBackgroundColor = (centroId: number, rowType: string, dateIndex: number, date: Date) => {
    const key = `${centroId}-${rowType}-${dateIndex}`;
    const value = cellData[key];

    if (value) {
      const isRecursosRow = rowType.includes("recursos") || rowType === "B1";

      if (isRecursosRow) {
        const barco = barcos.find((b) => b.code === value);
        return barco?.color || "#ffffff";
      } else {
        const colorMap: Record<string, string> = {
          LINEAS_FONDEO: "#95b8f6",
          PASADORES: "#add5fa",
          FLOTADORES: "#fa5f49",
          INFLADO_FLOTADORES: "#f9a59a",
          CORCHETES: "#f9d99a",
          CALZOS: "#10b981",
          PISOS: "#5eead4",
          TAPA_BUTILOS: "#fb923c",
          LIMPIEZA_FLOTADORES: "#0ea5e9",
          ACCESORIOS: "#a78bfa",
          RESANADO_PINTADO: "#f472b6",
          POSTES: "#fbbf24",
          BARANDAS: "#34d399",
          SOPORTE_PAJARERA: "#60a5fa",
          TRAZABILIDAD_FLOTADORES: "#c084fc",
          TRAZABILIDAD_PASADORES: "#fb7185",
          NAVEGACION: "#3b82f6",
          PUERTO_CERRADO: "#dc2626",
          RELEVO: "#10b981",
          INCUMPLIMIENTO_SSO: "#f59e0b",
        };
        return colorMap[value] || "#95b8f6";
      }
    }

    if (isToday(date)) return "#FFF9C4";
    if (isPast(date)) return "#F5F5F5";
    if (isWeekend(date)) return "#FFEBEE";
    return "#ffffff";
  };

  // Obtener color de texto de celda
  const getCellTextColor = (backgroundColor: string) => {
    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  };

  const handleBarcoNameChange = (barcoCode: string, newName: string) => {
    setBarcoNames((prev) => ({
      ...prev,
      [barcoCode]: newName,
    }));
  };

  // Funciones de guardado y carga
  const saveData = async () => {
    setIsSyncing(true);
    setLastSyncStatus(null);

    const dataToSave: GanttData = {
      cellData,
      centroNames: {},
      barcoNames,
      selectedCentros,
      ganttRowGroups,
      weekComments,
      timestamp: new Date().toISOString(),
    };

    const result = await saveToSupabase("animacion-fondeo", dataToSave);

    setIsSyncing(false);
    setLastSyncStatus(result.success ? "success" : "error");

    const button = document.getElementById("save-button");
    if (button) {
      const originalText = button.innerHTML;
      if (result.success) {
        button.innerHTML = "✓ Guardado en Supabase";
        button.style.backgroundColor = "#059669";
      } else {
        button.innerHTML = "⚠ Error al guardar";
        button.style.backgroundColor = "#f59e0b";
      }
      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.backgroundColor = "";
      }, 3000);
    }
  };

  const loadData = async () => {
    setIsSyncing(true);

    clearAllLocalStorage();

    const result = await loadFromSupabase("animacion-fondeo");

    if (result.success && result.data) {
      setCellData(result.data.cellData || {});
      setBarcoNames(result.data.barcoNames || barcoNames);
      setSelectedCentros([DEFAULT_CENTRO_IDS[0]]);
      setWeekComments(result.data.weekComments || {});
      if (result.data.ganttRowGroups) {
        setGanttRowGroups(result.data.ganttRowGroups);
      }
      setLastSyncStatus("success");
    } else {
      setCellData({});
      setWeekComments({});
      setLastSyncStatus("error");
    }

    const fines = await loadSharedFines();
    setSharedFines(fines);

    setIsSyncing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="ocean-card space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Calendario Tipo Gantt - Fondeo</h2>
          {fechaInicio && fechaFin && (
            <div className="text-sm text-white mt-2">
              📅 Inicio: {formatDateFull(fechaInicio)} | Término: {formatDateFull(fechaFin)}
            </div>
          )}
        </div>
        <button
          id="save-button"
          onClick={saveData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Save size={16} />
          Guardar
        </button>
      </div>

      {/* Usuario autenticado - nombre automático para comentarios */}
      <div className="p-4 rounded-lg" style={{ background: "#2c3e50" }}>
        <div className="flex items-center gap-4">
          <span className="font-medium text-white">👤 Usuario:</span>
          <span className="text-white font-semibold">{profile?.nombre || 'No autenticado'}</span>
        </div>
      </div>

      {/* Panel de Resultados Globales */}
      <div className="p-4 rounded-lg" style={{ background: "#2c3e50" }}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div className="bg-white p-3 rounded-lg shadow">
            <div className="text-2xl font-bold text-black">{metrics.planificado}</div>
            <div className="text-sm text-black">Planificado</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow">
            <div className="text-2xl font-bold text-black">{metrics.ejecutado}</div>
            <div className="text-sm text-black">Ejecutado</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow">
            <div className="text-2xl font-bold text-black">{metrics.disponible}</div>
            <div className="text-sm text-black">Disponible</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow">
            <div
              className={`text-2xl font-bold ${metrics.avance >= 80 ? "text-black" : metrics.avance >= 50 ? "text-black" : "text-red-700"}`}
            >
              {metrics.avance}%
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {metrics.ejecutado}/{metrics.planificado}
            </div>
            <div className="text-sm text-black">Avance Global</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow">
            <div className={`text-2xl font-bold ${metrics.diasExtras > 0 ? "text-red-700" : "text-black"}`}>
              {metrics.diasExtras}
            </div>
            <div className="text-sm text-black">Días Extras</div>
          </div>
        </div>

        {/* Principales Desviaciones */}
        <div className="mt-4 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold text-black mb-3">📊 Principales Desviaciones</h3>

          {metrics.desviaciones.total > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                <span className="font-semibold text-black">Total Desviaciones:</span>
                <span className="text-black">{metrics.desviaciones.total} días registrados</span>
              </div>

              {metrics.desviaciones.puertoCerrado.dias > 0 && (
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="text-black">🔴 Puerto Cerrado:</span>
                  <span className="text-black">{metrics.desviaciones.puertoCerrado.dias} días</span>
                </div>
              )}

              {metrics.desviaciones.navegacion.dias > 0 && (
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-black">⛵ Navegación:</span>
                  <span className="text-black">{metrics.desviaciones.navegacion.dias} días</span>
                </div>
              )}

              {metrics.desviaciones.relevo.dias > 0 && (
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-black">👥 Relevo:</span>
                  <span className="text-black">{metrics.desviaciones.relevo.dias} días</span>
                </div>
              )}

              {metrics.desviaciones.incumplimientoSSO.dias > 0 && (
                <div className="flex justify-between items-center p-2 bg-amber-50 rounded">
                  <span className="text-black">⚠️ Incumplimiento SSO:</span>
                  <span className="text-black">{metrics.desviaciones.incumplimientoSSO.dias} días</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-600 text-center py-2">No hay desviaciones registradas</p>
          )}
        </div>
      </div>

      {/* Filtro por Centro */}
      <div className="p-4 rounded-lg" style={{ background: "#2c3e50" }}>
        <div className="flex items-center gap-4">
          <span className="font-medium text-white">Seleccionar Centro:</span>
          <select
            value={(selectedCentros[0] ?? 1).toString()}
            onChange={(e) => setSelectedCentros([parseInt(e.target.value)])}
            className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 h-10"
          >
            {DEFAULT_CENTRO_IDS.map((centroId) => (
              <option key={centroId} value={centroId}>
                {centroNames[centroId]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selector de Actividades Colapsable */}
      <div className="p-4 rounded-lg" style={{ background: "#2c3e50" }}>
        <button
          onClick={() => setShowActivitySelector(!showActivitySelector)}
          className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
        >
          <span className="flex items-center gap-2">
            📋 Selector de Actividades
            {selectedActividad && selectedActividad !== ("BORRAR" as any) && (
              <span className="text-sm bg-blue-800 px-2 py-1 rounded">{selectedActividad.replace(/_/g, " ")}</span>
            )}
          </span>
          {showActivitySelector ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showActivitySelector && (
          <div className="mt-4 space-y-4 animate-in slide-in-from-top duration-200">
            <h3 className="font-medium text-white text-lg">Actividades:</h3>

            <div className="grid grid-cols-4 gap-3">
              {/* Fila 1 */}
              <button
                onClick={() => setShowModal("LINEAS_FONDEO")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "LINEAS_FONDEO"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                1. Líneas Fondeo
              </button>

              <button
                onClick={() => setShowModal("PASADORES")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "PASADORES"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                2. Pasadores
              </button>

              <button
                onClick={() => setShowModal("FLOTADORES")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "FLOTADORES"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                3. Flotadores
              </button>

              <button
                onClick={() => setShowModal("INFLADO_FLOTADORES")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "INFLADO_FLOTADORES"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                4. Inflado Flotadores
              </button>

              {/* Fila 2 */}
              <button
                onClick={() => setShowModal("CORCHETES")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "CORCHETES"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                5. Corchetes
              </button>

              <button
                onClick={() => setShowModal("CALZOS")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "CALZOS"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                6. Calzos
              </button>

              <button
                onClick={() => setShowModal("PISOS")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "PISOS"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                7. Pisos
              </button>

              <button
                onClick={() => setShowModal("TAPA_BUTILOS")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "TAPA_BUTILOS"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                8. Tapa Butilos
              </button>

              {/* Fila 3 */}
              <button
                onClick={() => setShowModal("LIMPIEZA_FLOTADORES")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "LIMPIEZA_FLOTADORES"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                9. Limpieza Flotadores
              </button>

              <button
                onClick={() => setSelectedActividad("ACCESORIOS")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "ACCESORIOS"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                10. Accesorios (2d)
              </button>

              <button
                onClick={() => setSelectedActividad("RESANADO_PINTADO")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "RESANADO_PINTADO"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                11. Resanado/Pintado (3d)
              </button>

              <button
                onClick={() => setShowModal("POSTES")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "POSTES"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                📍 Postes ({postes}%)
              </button>

              {/* Fila 4 */}
              <button
                onClick={() => setShowModal("BARANDAS")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "BARANDAS"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                🚧 Barandas ({barandas}%)
              </button>

              <button
                onClick={() => setShowModal("SOPORTE_PAJARERA")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "SOPORTE_PAJARERA"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                🦅 Sop. Pajarera ({soportePajarera}%)
              </button>

              <button
                onClick={() => setShowModal("TRAZABILIDAD_FLOTADORES")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "TRAZABILIDAD_FLOTADORES"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                📊 Traz. Flotadores ({trazabilidadFlotadores}%)
              </button>

              <button
                onClick={() => setShowModal("TRAZABILIDAD_PASADORES")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "TRAZABILIDAD_PASADORES"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                📈 Traz. Pasadores ({trazabilidadPasadores}%)
              </button>

              {/* Fila 5 - Desviaciones */}
              <button
                onClick={() => setSelectedActividad("NAVEGACION")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "NAVEGACION"
                    ? "bg-orange-500 text-white"
                    : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
              >
                ⛵ Navegación (1d)
              </button>

              <button
                onClick={() => setSelectedActividad("PUERTO_CERRADO")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "PUERTO_CERRADO"
                    ? "bg-orange-500 text-white"
                    : "bg-red-700 text-white hover:bg-red-600"
                }`}
              >
                🚫 Puerto Cerrado (1d)
              </button>

              <button
                onClick={() => setSelectedActividad("RELEVO")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "RELEVO"
                    ? "bg-orange-500 text-white"
                    : "bg-emerald-700 text-white hover:bg-emerald-600"
                }`}
              >
                🔄 Relevo (1d)
              </button>

              <button
                onClick={() => setSelectedActividad("INCUMPLIMIENTO_SSO")}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === "INCUMPLIMIENTO_SSO"
                    ? "bg-orange-500 text-white"
                    : "bg-amber-600 text-white hover:bg-amber-500"
                }`}
              >
                ⚠️ Incumplimiento SSO (1d)
              </button>
            </div>

            {/* Botón Borrar separado debajo */}
            <div className="mt-3">
              <button
                onClick={() => setSelectedActividad("BORRAR" as any)}
                className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                  selectedActividad === ("BORRAR" as any)
                    ? "bg-orange-500 text-white"
                    : "bg-slate-700 text-white hover:bg-slate-600"
                }`}
              >
                🗑️ Borrar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal para configurar valores */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-slate-900">{showModal.replace(/_/g, " ")}</h3>

            {showModal === "LINEAS_FONDEO" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Número de líneas:</label>
                  <input
                    type="number"
                    value={lineasFondeo}
                    onChange={(e) => setLineasFondeo(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">{calcularDias("LINEAS_FONDEO")} día(s)</span>
                  <span className="text-xs ml-2">({lineasFondeo} ÷ 4)</span>
                </div>
              </div>
            )}

            {showModal === "PASADORES" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Número de pasadores:</label>
                  <input
                    type="number"
                    value={pasadores}
                    onChange={(e) => setPasadores(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">{calcularDias("PASADORES")} día(s)</span>
                  <span className="text-xs ml-2">({pasadores} ÷ 45)</span>
                </div>
              </div>
            )}

            {showModal === "FLOTADORES" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Número de flotadores:</label>
                  <input
                    type="number"
                    value={flotadores}
                    onChange={(e) => setFlotadores(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">{calcularDias("FLOTADORES")} día(s)</span>
                  <span className="text-xs ml-2">({flotadores} ÷ 10)</span>
                </div>
              </div>
            )}

            {showModal === "INFLADO_FLOTADORES" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Número de flotadores:</label>
                  <input
                    type="number"
                    value={infladoFlotadores}
                    onChange={(e) => setInfladoFlotadores(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">{calcularDias("INFLADO_FLOTADORES")} día(s)</span>
                  <span className="text-xs ml-2">({infladoFlotadores} ÷ 55)</span>
                </div>
              </div>
            )}

            {showModal === "CORCHETES" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Número de corchetes:</label>
                  <input
                    type="number"
                    value={corchetes}
                    onChange={(e) => setCorchetes(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">{calcularDias("CORCHETES")} día(s)</span>
                  <span className="text-xs ml-2">({corchetes} ÷ 50)</span>
                </div>
              </div>
            )}

            {showModal === "CALZOS" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Número de calzos:</label>
                  <input
                    type="number"
                    value={calzos}
                    onChange={(e) => setCalzos(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">{calcularDias("CALZOS")} día(s)</span>
                  <span className="text-xs ml-2">({calzos} ÷ 7)</span>
                </div>
              </div>
            )}

            {showModal === "PISOS" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Número de pisos:</label>
                  <input
                    type="number"
                    value={pisos}
                    onChange={(e) => setPisos(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">{calcularDias("PISOS")} día(s)</span>
                  <span className="text-xs ml-2">({pisos} ÷ 10)</span>
                </div>
              </div>
            )}

            {showModal === "TAPA_BUTILOS" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Número de tapa butilos:</label>
                  <input
                    type="number"
                    value={tapaButilos}
                    onChange={(e) => setTapaButilos(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">{calcularDias("TAPA_BUTILOS")} día(s)</span>
                  <span className="text-xs ml-2">({tapaButilos} ÷ 30)</span>
                </div>
              </div>
            )}

            {showModal === "LIMPIEZA_FLOTADORES" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Número de flotadores:</label>
                  <input
                    type="number"
                    value={limpiezaFlotadores}
                    onChange={(e) => setLimpiezaFlotadores(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">{calcularDias("LIMPIEZA_FLOTADORES")} día(s)</span>
                  <span className="text-xs ml-2">({limpiezaFlotadores} ÷ 60)</span>
                </div>
              </div>
            )}

            {showModal === "POSTES" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Porcentaje (0-100%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={postes}
                    onChange={(e) => setPostes(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Mostrará: P{postes}%</span>
                </div>
              </div>
            )}

            {showModal === "BARANDAS" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Porcentaje (0-100%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={barandas}
                    onChange={(e) => setBarandas(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Mostrará: B{barandas}%</span>
                </div>
              </div>
            )}

            {showModal === "SOPORTE_PAJARERA" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Porcentaje (0-100%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={soportePajarera}
                    onChange={(e) => setSoportePajarera(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Mostrará: SP{soportePajarera}%</span>
                </div>
              </div>
            )}

            {showModal === "TRAZABILIDAD_FLOTADORES" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Porcentaje (0-100%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={trazabilidadFlotadores}
                    onChange={(e) =>
                      setTrazabilidadFlotadores(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Mostrará: TF{trazabilidadFlotadores}%</span>
                </div>
              </div>
            )}

            {showModal === "TRAZABILIDAD_PASADORES" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Porcentaje (0-100%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={trazabilidadPasadores}
                    onChange={(e) =>
                      setTrazabilidadPasadores(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Mostrará: TP{trazabilidadPasadores}%</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedActividad(showModal);
                  setShowModal(null);
                }}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Seleccionar
              </button>
              <button
                onClick={() => setShowModal(null)}
                className="flex-1 bg-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selector de Recursos Colapsable */}
      <div className="p-4 rounded-lg" style={{ background: "#2c3e50" }}>
        <button
          onClick={() => setShowResourceSelector(!showResourceSelector)}
          className="w-full flex items-center justify-between px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
        >
          <span className="flex items-center gap-2">
            🚢 Selector de Recursos
            {selectedBarco && selectedBarco !== "🗑️" && (
              <span className="text-sm bg-green-800 px-2 py-1 rounded">
                {barcoNames[selectedBarco] || barcos.find((b) => b.code === selectedBarco)?.name || selectedBarco}
              </span>
            )}
          </span>
          {showResourceSelector ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showResourceSelector && (
          <div className="mt-4 animate-in slide-in-from-top duration-200">
            <h3 className="font-medium text-white mb-3">Recursos:</h3>
            <div className="flex flex-wrap gap-2">
              {barcos
                .filter((b) => b.code !== "🗑️")
                .map((barco) => (
                  <div
                    key={barco.code}
                    style={{
                      backgroundColor: selectedBarco === barco.code ? barco.color : "#475569",
                    }}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer text-white hover:opacity-80 flex items-center gap-2"
                    onClick={() => setSelectedBarco(barco.code)}
                  >
                    <span className="font-bold">{barco.number}</span>
                    <input
                      type="text"
                      value={barcoNames[barco.code] || barco.name}
                      onChange={(e) => handleBarcoNameChange(barco.code, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent border-none outline-none text-center min-w-[120px] max-w-[200px] text-white placeholder-white/50"
                      placeholder={barco.name}
                    />
                  </div>
                ))}
            </div>
            <div className="mt-3">
              <button
                onClick={() => setSelectedBarco("🗑️")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedBarco === "🗑️" ? "bg-blue-500 text-white" : "bg-slate-600 text-white hover:bg-slate-500"
                }`}
              >
                🗑️ Borrar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Calendario Gantt con scroll horizontal */}
      <div className="rounded-lg border bg-white">
        <div className="flex">
          {/* Columna fija de labels */}
          <div className="flex-shrink-0 bg-white border-r sticky left-0 z-10">
            {/* Encabezado CENTROS ACUÍCOLAS */}
            <div
              className="bg-slate-600 text-white p-2 font-bold text-center border flex items-center justify-center"
              style={{ width: "200px", height: "76px" }}
            >
              <div>CENTROS ACUÍCOLAS</div>
            </div>

            {selectedCentros.map((centroId) => (
              <div key={centroId}>
                {/* Nombre del Centro */}
                <div
                  className="bg-slate-700 text-center border"
                  style={{
                    width: "200px",
                    height: "60px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <input
                    type="text"
                    value={centroNames[centroId]}
                    readOnly
                    className="w-[180px] bg-white text-slate-900 font-bold rounded px-2 py-1 text-xs"
                  />
                </div>

                {/* Grupos de filas */}
                {ganttRowGroups.map((group) => (
                  <div key={group.id}>
                    {group.rows.map((row) => (
                      <div
                        key={row.id}
                        className="bg-slate-300 p-1 text-sm text-center border font-medium text-black flex items-center justify-center gap-1"
                        style={{ width: "200px", height: "32px" }}
                      >
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) => updateRowLabel(group.id, row.id, e.target.value)}
                          className="flex-1 bg-transparent border-none outline-none text-center text-xs"
                        />
                        {group.id !== "default" && row.id === group.rows[0].id && (
                          <button
                            onClick={() => removeGanttRowGroup(group.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Eliminar grupo"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}

            {/* Botón Agregar Grupo */}
            <div className="p-2 border-t">
              <button
                onClick={addGanttRowGroup}
                className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors w-full justify-center"
              >
                <Plus size={14} />
                Agregar Grupo
              </button>
            </div>
          </div>

          {/* Área con scroll horizontal */}
          <div className="overflow-x-auto flex-1">
            <div className="min-w-max">
              {/* Fila de número de semana CON COMENTARIOS */}
              <div className="flex gap-px bg-slate-400 p-2" style={{ height: "76px" }}>
                {dates.map((date, index) => {
                  const { weekNumber } = formatDate(date);
                  const prevWeekNumber = index > 0 ? formatDate(dates[index - 1]).weekNumber : null;
                  const isFirstDayOfWeek = weekNumber !== prevWeekNumber;

                  let consecutiveDays = 1;
                  for (let i = index + 1; i < dates.length; i++) {
                    if (formatDate(dates[i]).weekNumber === weekNumber) {
                      consecutiveDays++;
                    } else {
                      break;
                    }
                  }

                  if (isFirstDayOfWeek) {
                    const weekKey = `${selectedCentros[0]}-week-${weekNumber}`;
                    const hasComment = weekComments[weekKey];

                    return (
                      <div
                        key={`week-${index}`}
                        className="text-xs font-bold text-center p-1 border bg-blue-200 flex flex-col items-center justify-center gap-1"
                        style={{
                          width: `${consecutiveDays * 25 + (consecutiveDays - 1)}px`,
                          flexShrink: 0,
                          color: "#000000",
                        }}
                      >
                        <span>S{weekNumber}</span>
                        <button
                          onClick={() => openWeekCommentEditor(weekNumber, selectedCentros[0])}
                          className={`p-1 rounded hover:bg-blue-300 transition-colors ${hasComment ? "text-amber-600" : "text-slate-600"}`}
                          title={hasComment ? "Ver comentario" : "Agregar comentario"}
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Encabezado de fechas */}
              <div className="flex gap-px bg-slate-300 p-2" style={{ height: "60px" }}>
                {dates.map((date, index) => {
                  const { day, month, dayName } = formatDate(date);
                  const isCurrentDay = isToday(date);
                  const isWeekendDay = isWeekend(date);

                  return (
                    <div
                      key={index}
                      className={`text-xs text-center p-1 border flex flex-col items-center justify-center ${
                        isCurrentDay
                          ? "bg-orange-100 border-orange-500 border-2 font-bold"
                          : isWeekendDay
                            ? "bg-red-100"
                            : ""
                      }`}
                      style={{ width: "25px", flexShrink: 0 }}
                    >
                      <div style={{ color: "#000000" }}>{dayName}</div>
                      <div style={{ color: "#000000" }}>{day}</div>
                      <div style={{ color: "#000000" }}>{month}</div>
                    </div>
                  );
                })}
              </div>

              {/* Filas de datos */}
              {selectedCentros.map((centroId) => (
                <div key={centroId}>
                  {/* Grupos de filas */}
                  {ganttRowGroups.map((group) => (
                    <div key={group.id}>
                      {group.rows.map((row) => (
                        <div key={row.id} className="flex gap-px" style={{ height: "32px" }}>
                          {dates.map((date, dateIndex) => {
                            const backgroundColor = getCellBackgroundColor(centroId, row.id, dateIndex, date);
                            const textColor = getCellTextColor(backgroundColor);
                            const value = cellData[`${centroId}-${row.id}-${dateIndex}`];

                            let displayValue = "";
                            let tooltipText = "";

                            if (value) {
                              const isRecursosRow = row.id.includes("recursos") || row.id === "B1";

                              if (isRecursosRow) {
                                const recurso = barcos.find((b) => b.code === value);
                                displayValue = recurso?.number || "";
                                tooltipText = barcoNames[value] || recurso?.name || "";
                              } else {
                                displayValue = getValorMostrar(value as TipoActividad);
                                tooltipText = `Actividad: ${value}`;
                              }
                            }

                            return (
                              <div
                                key={dateIndex}
                                className="border cursor-pointer flex items-center justify-center text-[10px] font-bold hover:opacity-80"
                                style={{
                                  backgroundColor,
                                  color: textColor,
                                  width: "25px",
                                  flexShrink: 0,
                                }}
                                onClick={() => handleCellClick(centroId, row.id, dateIndex)}
                                title={tooltipText}
                              >
                                {displayValue}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para VER comentario de semana */}
      {viewingWeekComment && weekComments[viewingWeekComment] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Comentario de Semana</h3>
              <button onClick={closeViewingComment} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm text-slate-700">
                    <strong>Autor:</strong> {weekComments[viewingWeekComment].author}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(weekComments[viewingWeekComment].timestamp).toLocaleString("es-CL")}
                  </p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-white rounded border border-slate-200">
                <p className="text-slate-900 whitespace-pre-wrap">{weekComments[viewingWeekComment].text}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={editFromViewing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                ✏️ Editar
              </button>
              <button
                onClick={deleteWeekComment}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                🗑️ Eliminar
              </button>
              <button
                onClick={closeViewingComment}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para EDITAR comentario de semana */}
      {editingWeek && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Editar Comentario de Semana</h3>
              <button onClick={cancelWeekComment} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            {weekComments[editingWeek] && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-slate-700">
                  <strong>Comentario anterior de:</strong> {weekComments[editingWeek].author}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(weekComments[editingWeek].timestamp).toLocaleString("es-CL")}
                </p>
              </div>
            )}

            <textarea
              value={tempWeekComment}
              onChange={(e) => setTempWeekComment(e.target.value)}
              placeholder="Escribe un comentario para esta semana..."
              className="w-full h-40 p-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={saveWeekComment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Guardar
              </button>
              <button
                onClick={cancelWeekComment}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Widget del Clima */}
      <div className="p-4 bg-slate-100 rounded-lg">
        <h3 className="font-medium text-slate-900 mb-3">Clima y condiciones</h3>
        <iframe
          title="Mapa del clima Windy"
          loading="lazy"
          src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km/h&zoom=8&overlay=wind&product=ecmwf&level=surface&lat=-44.742&lon=-73.019&detailLat=-45.553&detailLon=-73.872&detail=true&message=true"
          className="w-full h-[400px] rounded-lg"
          style={{ border: "none" }}
        />
      </div>
    </div>
  );
};

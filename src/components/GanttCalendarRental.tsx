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

// Configuración Rental
const actividades = [
  { number: "1", code: "MONDIG", name: "Sistema Monitoreo Digital", color: "#95b8f6", diasPorJaula: 0.9 },
  { number: "2", code: "FOTOPE", name: "Fotoperiodo", color: "#add5fa", diasPorJaula: 0.7 },
  { number: "3", code: "EXTMOR", name: "Sistema Extracción Mortalidad", color: "#fa5f49", diasPorJaula: 0.5 },
  { number: "4", code: "INSALI", name: "Instalación de Sistema de Alimentación", color: "#f9a59a", diasPorJaula: 1.5 },
  { code: "🗑️", name: "Borrar", color: "#F1F5F9", diasPorJaula: 0 },
];

// Actividades de desviación
const actividadesDesviacion = [
  { code: "NAVEG", name: "⛵ Navegación", color: "#3b82f6" },
  { code: "PTOCE", name: "🔴 Puerto Cerrado", color: "#dc2626" },
  { code: "RELEV", name: "👥 Relevo", color: "#10b981" },
  { code: "INSSO", name: "⚠️ Incumplimiento SSO", color: "#f59e0b" },
];

// Configuración de recursos tecnológicos con nueva paleta de colores
const recursos = [
  { number: "1", code: "NOVA", name: "Novatech", color: "#95b8f6" },
  { number: "2", code: "OMNI", name: "Omnifish", color: "#add5fa" },
  { number: "3", code: "BIOL", name: "Bioled", color: "#fa5f49" },
  { number: "4", code: "WOLF", name: "Wolffish", color: "#f9a59a" },
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
const formatFullDate = (date: Date) => {
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

export const GanttCalendarRental: React.FC = () => {
  const { canView, canEditProyectado, canEditRealizado, checkEditPermission, getAuthorName, hasAnyEditPermission, profile, isAdmin } = useGanttPermissions('rental');
  
  const [numJaulas, setNumJaulas] = useState<number>(7);
  const [selectedActivity, setSelectedActivity] = useState<string>("MONDIG");
  const [selectedRecurso, setSelectedRecurso] = useState<string>("NOVA");
  const [cellData, setCellData] = useState<CellData>({});
  const [selectedCentros, setSelectedCentros] = useState<number[]>([DEFAULT_CENTRO_IDS[0]]);
  const [dates] = useState(generateDates());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<"success" | "error" | null>(null);
  const [sharedFines, setSharedFines] = useState<{ [key: string]: boolean }>({});
  const [centroNames, setCentroNames] = useState<{ [key: number]: string }>(DEFAULT_CENTRO_NAMES);
  const [recursoNames, setRecursoNames] = useState<{ [key: string]: string }>({
    NOVA: "Novatech",
    OMNI: "Omnifish",
    BIOL: "Bioled",
    WOLF: "Wolffish",
  });
  const [ganttRowGroups, setGanttRowGroups] = useState<GanttRowGroup[]>([
    {
      id: "default",
      rows: [
        { id: "B1", label: "🔧 Recursos Asignados" },
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
    return ["NAVEG", "PTOCE", "RELEV", "INSSO"].includes(activityCode);
  };

  // Calcular métricas directamente en el componente
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
                if (valorRealizado === "NAVEG") diasNavegacion++;
                else if (valorRealizado === "PTOCE") diasPuertoCerrado++;
                else if (valorRealizado === "RELEV") diasRelevo++;
                else if (valorRealizado === "INSSO") diasIncumplimientoSSO++;
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

  // Calcular fecha de inicio y fin de programación
  const calcularFechasProgramacion = () => {
    let minIndex: number | null = null;
    let maxIndex: number | null = null;

    selectedCentros.forEach((centroId) => {
      dates.forEach((_, dateIndex) => {
        ganttRowGroups.forEach((group) => {
          group.rows.forEach((row) => {
            if (row.id.includes("proyectado")) {
              const key = `${centroId}-${row.id}-${dateIndex}`;
              if (cellData[key]) {
                if (minIndex === null || dateIndex < minIndex) {
                  minIndex = dateIndex;
                }
                if (maxIndex === null || dateIndex > maxIndex) {
                  maxIndex = dateIndex;
                }
              }
            }
          });
        });
      });
    });

    if (minIndex !== null && maxIndex !== null) {
      return {
        inicio: dates[minIndex],
        fin: dates[maxIndex],
      };
    }

    return null;
  };

  const fechasProgramacion = calcularFechasProgramacion();

  // Agregar grupo de 3 filas
  const addGanttRowGroup = () => {
    const timestamp = Date.now();
    const newGroup: GanttRowGroup = {
      id: `group-${timestamp}`,
      rows: [
        { id: `recursos-${timestamp}`, label: "🔧 Recursos Asignados" },
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

      await saveToSupabase("animacion-rental", {
        cellData,
        centroNames: {},
        barcoNames: recursoNames,
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

      await saveToSupabase("animacion-rental", {
        cellData,
        centroNames: {},
        barcoNames: recursoNames,
        selectedCentros,
        ganttRowGroups,
        weekComments: newComments,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Función para desplazar actividades existentes en proyectado
  const desplazarActividadesProyectado = (
    centroId: number,
    rowType: string,
    startIndex: number,
    diasAInsertar: number,
  ): CellData => {
    const newData = { ...cellData };

    // Encontrar todas las actividades que necesitan ser desplazadas
    const actividadesADesplazar: Array<{ index: number; valor: string }> = [];

    for (let i = startIndex; i < dates.length; i++) {
      const key = `${centroId}-${rowType}-${i}`;
      if (newData[key]) {
        actividadesADesplazar.push({ index: i, valor: newData[key] });
        delete newData[key]; // Limpiar posición original
      }
    }

    // Recolocar las actividades desplazadas
    actividadesADesplazar.forEach(({ index, valor }) => {
      const nuevaPosicion = index + diasAInsertar;
      if (nuevaPosicion < dates.length) {
        const newKey = `${centroId}-${rowType}-${nuevaPosicion}`;
        newData[newKey] = valor;
      }
    });

    return newData;
  };

  // Manejar clic en celda
  const handleCellClick = async (centroId: number, rowType: string, dateIndex: number) => {
    // Verificar permisos antes de editar
    if (!checkEditPermission(rowType)) {
      return;
    }
    
    const key = `${centroId}-${rowType}-${dateIndex}`;

    const isRecursosRow = rowType.includes("recursos") || rowType === "B1";

    if (isRecursosRow) {
      if (selectedRecurso === "🗑️") {
        const newData = { ...cellData };
        delete newData[key];
        setCellData(newData);
      } else {
        const newData = { ...cellData, [key]: selectedRecurso };
        setCellData(newData);
      }
    } else {
      if (selectedActivity === "🗑️") {
        const newData = { ...cellData };
        delete newData[key];
        setCellData(newData);
      } else {
        // Verificar si es una desviación
        const esDesviacion = actividadesDesviacion.find((d) => d.code === selectedActivity);

        let newData = { ...cellData };

        // SI ES REALIZADO: solo 1 día
        if (rowType.includes("realizado")) {
          newData[key] = selectedActivity;
        } else if (rowType.includes("proyectado")) {
          // SI ES PROYECTADO: calcular días según la actividad
          if (esDesviacion) {
            // Las desviaciones siempre duran 1 día - DESPLAZAR primero
            newData = desplazarActividadesProyectado(centroId, rowType, dateIndex, 1);
            newData[key] = selectedActivity;
          } else {
            // Actividades normales con cálculo de días
            const actividad = actividades.find((a) => a.code === selectedActivity);
            const diasPorJaula = actividad?.diasPorJaula || 0;
            const diasTotales = Math.ceil(diasPorJaula * numJaulas);

            // SIEMPRE desplazar actividades existentes
            newData = desplazarActividadesProyectado(centroId, rowType, dateIndex, diasTotales);

            // Insertar la nueva actividad
            for (let i = 0; i < diasTotales && dateIndex + i < dates.length; i++) {
              const newKey = `${centroId}-${rowType}-${dateIndex + i}`;
              newData[newKey] = selectedActivity;
            }
          }
        }

        setCellData(newData);
      }
    }

    await saveToSupabase("animacion-rental", {
      cellData,
      centroNames: {},
      barcoNames: recursoNames,
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
        const recurso = recursos.find((r) => r.code === value);
        return recurso?.color || "#ffffff";
      } else {
        const actividad = actividades.find((a) => a.code === value);
        if (actividad) return actividad.color;

        const desviacion = actividadesDesviacion.find((d) => d.code === value);
        return desviacion?.color || "#ffffff";
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

  const handleRecursoNameChange = (recursoCode: string, newName: string) => {
    setRecursoNames((prev) => ({
      ...prev,
      [recursoCode]: newName,
    }));
  };

  // Funciones de guardado y carga
  const saveData = async () => {
    setIsSyncing(true);
    setLastSyncStatus(null);

    const dataToSave: GanttData = {
      cellData,
      centroNames: {},
      barcoNames: recursoNames,
      selectedCentros,
      ganttRowGroups,
      weekComments,
      timestamp: new Date().toISOString(),
    };

    const result = await saveToSupabase("animacion-rental", dataToSave);

    setIsSyncing(false);
    setLastSyncStatus(result.success ? "success" : "error");

    const button = document.getElementById("save-button-rental");
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
    const result = await loadFromSupabase("animacion-rental");

    if (result.success && result.data) {
      setCellData(result.data.cellData || {});
      setRecursoNames(result.data.barcoNames || recursoNames);
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

  // Cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="ocean-card space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Calendario Tipo Gantt - Rental </h2>
          <div className="text-sm text-white mt-1">
            {fechasProgramacion ? (
              <>
                📅 Inicio: {formatFullDate(fechasProgramacion.inicio)} | Término:{" "}
                {formatFullDate(fechasProgramacion.fin)}
              </>
            ) : (
              <span className="text-white">Sin programación registrada</span>
            )}
          </div>
        </div>
        <button
          id="save-button-rental"
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
            {selectedActivity && selectedActivity !== "🗑️" && (
              <span className="text-sm bg-blue-800 px-2 py-1 rounded">
                {actividades.find((a) => a.code === selectedActivity)?.name ||
                  actividadesDesviacion.find((d) => d.code === selectedActivity)?.name ||
                  selectedActivity}
              </span>
            )}
          </span>
          {showActivitySelector ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showActivitySelector && (
          <div className="mt-4 space-y-4 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-4">
              <h3 className="font-medium text-white">Actividades:</h3>

              <div className="flex items-center gap-2">
                <label className="text-white text-sm">Cantidad de jaulas:</label>
                <select
                  value={numJaulas}
                  onChange={(e) => setNumJaulas(parseInt(e.target.value))}
                  className="bg-white border border-slate-300 rounded px-3 py-1 text-slate-900"
                >
                  {Array.from({ length: 21 }, (_, i) => i + 4).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {actividades
                .filter((a) => a.code !== "🗑️")
                .map((actividad) => {
                  const diasTotales = Math.ceil(actividad.diasPorJaula * numJaulas);

                  return (
                    <button
                      key={actividad.code}
                      onClick={() => setSelectedActivity(actividad.code)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        selectedActivity === actividad.code
                          ? "bg-orange-500 text-white"
                          : "bg-slate-600 text-white hover:bg-slate-500"
                      }`}
                      title={`${actividad.name} - ${diasTotales} días (${actividad.diasPorJaula} días por jaula × ${numJaulas} jaulas)`}
                    >
                      {actividad.number} - {actividad.name}
                      <div className="text-xs mt-1">({diasTotales} días)</div>
                    </button>
                  );
                })}
            </div>

            {/* Botones de Desviaciones */}
            <div className="mt-4 grid grid-cols-4 gap-3">
              {actividadesDesviacion.map((desviacion) => (
                <button
                  key={desviacion.code}
                  onClick={() => setSelectedActivity(desviacion.code)}
                  style={{
                    backgroundColor: selectedActivity === desviacion.code ? "#f97316" : desviacion.color,
                  }}
                  className="px-4 py-3 rounded-lg text-sm font-medium transition-all text-white hover:opacity-80"
                >
                  {desviacion.name}
                  <div className="text-xs mt-1">(1 día)</div>
                </button>
              ))}
            </div>

            {/* Botón Borrar */}
            <div className="mt-3">
              <button
                onClick={() => setSelectedActivity("🗑️")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedActivity === "🗑️" ? "bg-orange-500 text-white" : "bg-slate-700 text-white hover:bg-slate-600"
                }`}
              >
                🗑️ Borrar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selector de Recursos Colapsable */}
      <div className="p-4 rounded-lg" style={{ background: "#2c3e50" }}>
        <button
          onClick={() => setShowResourceSelector(!showResourceSelector)}
          className="w-full flex items-center justify-between px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
        >
          <span className="flex items-center gap-2">
            🔧 Selector de Recursos
            {selectedRecurso && selectedRecurso !== "🗑️" && (
              <span className="text-sm bg-green-800 px-2 py-1 rounded">
                {recursoNames[selectedRecurso] ||
                  recursos.find((r) => r.code === selectedRecurso)?.name ||
                  selectedRecurso}
              </span>
            )}
          </span>
          {showResourceSelector ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showResourceSelector && (
          <div className="mt-4 animate-in slide-in-from-top duration-200">
            <h3 className="font-medium text-white mb-3">Recursos:</h3>
            <div className="flex flex-wrap gap-2">
              {recursos
                .filter((r) => r.code !== "🗑️")
                .map((recurso) => (
                  <div
                    key={recurso.code}
                    style={{
                      backgroundColor: selectedRecurso === recurso.code ? recurso.color : "#475569",
                    }}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer text-white hover:opacity-80 flex items-center gap-2"
                    onClick={() => setSelectedRecurso(recurso.code)}
                  >
                    <span className="font-bold">{recurso.number}</span>
                    <input
                      type="text"
                      value={recursoNames[recurso.code] || recurso.name}
                      onChange={(e) => handleRecursoNameChange(recurso.code, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent border-none outline-none text-center min-w-[120px] max-w-[200px] text-white placeholder-white/50"
                      placeholder={recurso.name}
                    />
                  </div>
                ))}
            </div>
            <div className="mt-3">
              <button
                onClick={() => setSelectedRecurso("🗑️")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedRecurso === "🗑️" ? "bg-blue-500 text-white" : "bg-slate-600 text-white hover:bg-slate-500"
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
                                const recurso = recursos.find((r) => r.code === value);
                                displayValue = recurso?.number || "";
                                tooltipText = recursoNames[value] || recurso?.name || "";
                              } else {
                                const actividad = actividades.find((a) => a.code === value);
                                const desviacion = actividadesDesviacion.find((d) => d.code === value);

                                if (actividad) {
                                  displayValue = actividad.number || "";
                                  tooltipText = actividad.name || "";
                                } else if (desviacion) {
                                  displayValue =
                                    desviacion.code === "NAVEG"
                                      ? "N"
                                      : desviacion.code === "PTOCE"
                                        ? "PC"
                                        : desviacion.code === "RELEV"
                                          ? "R"
                                          : "IS";
                                  tooltipText = desviacion.name || "";
                                }
                              }
                            }

                            return (
                              <div
                                key={dateIndex}
                                className="border cursor-pointer flex items-center justify-center text-xs font-bold hover:opacity-80"
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

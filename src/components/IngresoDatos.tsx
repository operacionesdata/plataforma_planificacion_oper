// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Save, ChevronDown, ChevronUp } from "lucide-react";
import { loadFromSupabase, saveToSupabase } from "@/services/googleSheetsService";
import { DEFAULT_CENTRO_NAMES } from "@/constants/centros";
import { toast } from "sonner";

// Mapeo completo de códigos a nombres de actividades
const ACTIVIDAD_NOMBRES: Record<string, string> = {
  // === REDES - Apertura ===
  CALOB: "Calado de Lobero + Relingado",
  CAPEC: "Calado de Pecera + Amarra Oreja",
  TORRE: "Instalación de Torre y Red Pajarera",
  COSLO: "Costura de Lobero + Refuerzos",
  PESPE: "Instalación de Pesos Peceros",
  PESAN: "Instalación de Pesos Ángel y Taloneras",
  TENSO: "Instalación de Tensores Adicionales",
  TENPE: "Instalación de Tensores de Pecera",
  FRALO: "Instalación de Franja Lobera",
  REFES: "Instalación de Refuerzo en Esquinas",
  REPLO: "Reparaciones Roturas Loberas",
  // === REDES - Desarme ===
  RETLO: "Retiro de Lobero",
  DESCO: "Descostura de Lobero + Refuerzos",
  RETPP: "Retiro de Pesos Peceros",
  RETPA: "Retiro de Pesos Ángel + Tensor Prin",
  RETFL: "Retiro de Franja Lobera",
  COTLO: "Corte Tensores Loberos",
  COUDC: "Corte de Uniones de Centrales",
  COSEP: "Corte de Separador",
  // === FONDEO ===
  LINEAS_FONDEO: "Líneas de Fondeo",
  PASADORES: "Pasadores",
  FLOTADORES: "Flotadores",
  INFLADO_FLOTADORES: "Inflado Flotadores",
  CORCHETES: "Corchetes",
  CALZOS: "Calzos",
  PISOS: "Pisos",
  TAPA_BUTILOS: "Tapa Butilos",
  LIMPIEZA_FLOTADORES: "Limpieza Flotadores",
  ACCESORIOS: "Accesorios",
  RESANADO_PINTADO: "Resanado y Pintado",
  POSTES: "Postes",
  BARANDAS: "Barandas",
  SOPORTE_PAJARERA: "Soporte Pajarera",
  TRAZABILIDAD_FLOTADORES: "Trazabilidad Flotadores",
  TRAZABILIDAD_PASADORES: "Trazabilidad Pasadores",
  // === DESVIACIONES ===
  NAVEG: "Navegación",
  PTOCE: "Puerto Cerrado",
  RELEV: "Relevo",
  INSSO: "Incumplimiento SSO",
  NAVEGACION: "Navegación",
  PUERTO_CERRADO: "Puerto Cerrado",
  INCUMPLIMIENTO_SSO: "Incumplimiento SSO",
  // === RENTAL ===
  ENTREGA: "Entrega",
  DEVOLUCION: "Devolución",
  MANTENIMIENTO: "Mantenimiento",
  INSTALACION: "Instalación",
  // === HABITABILIDAD ===
  LIMPIEZA: "Limpieza",
  SANITIZADO: "Sanitizado",
  REPARACION: "Reparación",
  INSPECCION: "Inspección",
  // === SSO ===
  AUDITORIA: "Auditoría",
  CAPACITACION: "Capacitación",
  SIMULACRO: "Simulacro",
  REVISION_EPP: "Revisión EPP",
  // === INGENIERIA ===
  DISEÑO: "Diseño",
  SUPERVISION: "Supervisión",
  MEJORA: "Mejora",
  EVALUACION: "Evaluación",
};

// Códigos de recursos/barcos (para excluir del selector de actividades)
const BARCO_CODES = ['BZU', 'LMC', 'CAT', 'CON', 'LML', 'ISC', 'IL', 'CU'];

const getActividadNombre = (code: string): string => {
  return ACTIVIDAD_NOMBRES[code] || code;
};

const esActividad = (code: string): boolean => {
  return !BARCO_CODES.includes(code) && code !== '🗑️';
};

// Configuración de áreas
const AREAS = [
  { id: "redes", name: "Programación Redes", sheetKey: "animacion-redes" },
  { id: "fondeo", name: "Programación Fondeo", sheetKey: "animacion-fondeo" },
  { id: "rental", name: "Programación Rental", sheetKey: "animacion-rental" },
  { id: "habitabilidad", name: "Habitabilidad", sheetKey: "animacion-habitabilidad" },
  { id: "sso", name: "Área SSO", sheetKey: "animacion-sso" },
  { id: "ingenieria", name: "Ingeniería", sheetKey: "animacion-ingenieria" },
];

// Generar fechas: Nov 2025 + Dec 2025 + Todo 2026
const generateDates = () => {
  const dates: Date[] = [];
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

const dates = generateDates();

// Encontrar índice del día actual
const getTodayIndex = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dates.findIndex(d => {
    const dateToCheck = new Date(d);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck.getTime() === today.getTime();
  });
};

// Representa una entrada planificada HOY para un centro en un grupo específico
interface PlanToday {
  centroId: number;
  centroName: string;
  groupId: string;
  groupLabel: string;
  proyectadoRowId: string;
  realizadoRowId: string;
  actividadPlanificada: string;
  actividadRealizada: string | null;
}

const IngresoDatos: React.FC = () => {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [plansToday, setPlansToday] = useState<PlanToday[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [pendingChanges, setPendingChanges] = useState<{ [key: string]: string }>({});
  const [actividadesDisponibles, setActividadesDisponibles] = useState<string[]>([]);
  const [selectedActividades, setSelectedActividades] = useState<{ [key: string]: string }>({});
  const [expandedCentros, setExpandedCentros] = useState<Set<number>>(new Set());

  const todayIndex = getTodayIndex();
  const today = todayIndex >= 0 ? dates[todayIndex] : new Date();

  useEffect(() => {
    if (selectedArea) {
      loadAreaData(selectedArea);
    }
  }, [selectedArea]);

  const loadAreaData = async (areaId: string) => {
    setLoading(true);
    setPlansToday([]);
    setPendingChanges({});
    setSelectedActividades({});

    const area = AREAS.find(a => a.id === areaId);
    if (!area) return;

    try {
      const result = await loadFromSupabase(area.sheetKey);

      if (result.success && result.data) {
        setOriginalData(result.data);
        const cellData = result.data.cellData || {};
        const ganttRowGroups = result.data.ganttRowGroups || [
          {
            id: "default",
            rows: [
              { id: "B1", label: "🚢 Recursos" },
              { id: "proyectado", label: "📋 Proyectado" },
              { id: "realizado", label: "✅ Realizado" },
            ],
          },
        ];
        const selectedCentros = result.data.selectedCentros || [];
        const centroNames = result.data.centroNames || DEFAULT_CENTRO_NAMES;

        if (todayIndex < 0) {
          toast.error("La fecha actual está fuera del rango del calendario");
          setLoading(false);
          return;
        }

        // Collect all unique activities used in cellData
        const actividadesSet = new Set<string>();
        Object.values(cellData).forEach((value: string) => {
          if (value && value !== '🗑️' && esActividad(value)) {
            actividadesSet.add(value);
          }
        });
        setActividadesDisponibles(Array.from(actividadesSet).sort());

        // Find plans for TODAY across all centers and all groups
        const plans: PlanToday[] = [];

        selectedCentros.forEach((centroId: number) => {
          ganttRowGroups.forEach((group: any) => {
            // Find proyectado and realizado rows in this group
            const proyectadoRow = group.rows.find((r: any) => r.id.includes('proyectado'));
            const realizadoRow = group.rows.find((r: any) => r.id.includes('realizado'));

            if (!proyectadoRow || !realizadoRow) return;

            // Check if there's a planned activity for TODAY
            const proyectadoKey = `${centroId}-${proyectadoRow.id}-${todayIndex}`;
            const proyectadoValue = cellData[proyectadoKey];

            if (proyectadoValue && proyectadoValue !== '🗑️') {
              // Check if there's already a realizado value for today
              const realizadoKey = `${centroId}-${realizadoRow.id}-${todayIndex}`;
              const realizadoValue = cellData[realizadoKey];

              const groupLabel = ganttRowGroups.length > 1
                ? `Grupo ${ganttRowGroups.indexOf(group) + 1}`
                : "";

              plans.push({
                centroId,
                centroName: centroNames[centroId] || DEFAULT_CENTRO_NAMES[centroId] || `Centro ${centroId}`,
                groupId: group.id,
                groupLabel,
                proyectadoRowId: proyectadoRow.id,
                realizadoRowId: realizadoRow.id,
                actividadPlanificada: proyectadoValue,
                actividadRealizada: (realizadoValue && realizadoValue !== '🗑️') ? realizadoValue : null,
              });
            }
          });
        });

        plans.sort((a, b) => a.centroName.localeCompare(b.centroName));
        setPlansToday(plans);

        // Expand all centers by default
        const centroIds = new Set(plans.map(p => p.centroId));
        setExpandedCentros(centroIds);
      } else {
        toast.error("No se encontraron datos para esta área");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const toggleCentro = (centroId: number) => {
    setExpandedCentros(prev => {
      const newSet = new Set(prev);
      if (newSet.has(centroId)) {
        newSet.delete(centroId);
      } else {
        newSet.add(centroId);
      }
      return newSet;
    });
  };

  // Unique key for each plan entry (centro + group)
  const getPlanKey = (plan: PlanToday) => `${plan.centroId}-${plan.groupId}`;

  const handleSelectActividad = (plan: PlanToday, actividad: string) => {
    const planKey = getPlanKey(plan);

    setSelectedActividades(prev => ({
      ...prev,
      [planKey]: actividad,
    }));

    // Build the cellData key for the realizado row
    const cellDataKey = `${plan.centroId}-${plan.realizadoRowId}-${todayIndex}`;
    setPendingChanges(prev => ({
      ...prev,
      [cellDataKey]: actividad,
    }));
  };

  const handleSave = async () => {
    if (!selectedArea || !originalData || Object.keys(pendingChanges).length === 0) return;

    setSaving(true);
    const area = AREAS.find(a => a.id === selectedArea);
    if (!area) return;

    try {
      // Merge pending changes into existing cellData
      const newCellData = { ...originalData.cellData, ...pendingChanges };

      const saveData = {
        ...originalData,
        cellData: newCellData,
        timestamp: new Date().toISOString(),
      };

      const result = await saveToSupabase(area.sheetKey, saveData);

      if (result.success) {
        toast.success("Datos guardados exitosamente — se reflejarán en el Gantt del área");
        setPendingChanges({});
        setOriginalData({ ...originalData, cellData: newCellData });

        // Update local state to reflect saved activities
        setPlansToday(prev =>
          prev.map(plan => {
            const planKey = getPlanKey(plan);
            const selected = selectedActividades[planKey];
            if (selected) {
              return { ...plan, actividadRealizada: selected };
            }
            return plan;
          })
        );
        setSelectedActividades({});
      } else {
        toast.error("Error al guardar: " + result.message);
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Error al guardar datos");
    } finally {
      setSaving(false);
    }
  };

  const formatDateShort = (date: Date) => {
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    return `${dayNames[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
  };

  // Group plans by centroId
  const plansByCentro = plansToday.reduce((acc, plan) => {
    if (!acc[plan.centroId]) {
      acc[plan.centroId] = { centroName: plan.centroName, plans: [] };
    }
    acc[plan.centroId].plans.push(plan);
    return acc;
  }, {} as { [centroId: number]: { centroName: string; plans: PlanToday[] } });

  return (
    <div className="ocean-card p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary mb-1">📝 Ingreso de Datos</h2>
        <p className="text-muted-foreground text-sm">
          Registre las actividades ejecutadas hoy — {formatDateShort(today)}
        </p>
      </div>

      {/* Selector de área */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Seleccionar Área</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {AREAS.map(area => (
            <button
              key={area.id}
              onClick={() => setSelectedArea(area.id)}
              className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                selectedArea === area.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 bg-card/50 hover:border-primary/30 text-foreground/80"
              }`}
            >
              {area.name}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Cargando datos...</span>
        </div>
      )}

      {selectedArea && !loading && plansToday.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay centros con planificación para hoy ({formatDateShort(today)})</p>
        </div>
      )}

      {selectedArea && !loading && plansToday.length > 0 && (
        <>
          {/* Lista de centros con planificación hoy */}
          <div className="space-y-4">
            {Object.entries(plansByCentro).map(([centroIdStr, { centroName, plans }]) => {
              const centroId = parseInt(centroIdStr);
              const allDone = plans.every(p => p.actividadRealizada || selectedActividades[getPlanKey(p)]);

              return (
                <div key={centroId} className="border border-border/30 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCentro(centroId)}
                    className="w-full flex items-center justify-between p-4 bg-card/30 hover:bg-card/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{centroName}</span>
                      <span className="text-sm text-muted-foreground">
                        ({plans.length} {plans.length === 1 ? 'actividad' : 'actividades'} hoy)
                      </span>
                      {allDone && (
                        <span className="text-sm text-green-500 font-medium">✓ Completado</span>
                      )}
                    </div>
                    {expandedCentros.has(centroId) ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  {expandedCentros.has(centroId) && (
                    <div className="p-4 border-t border-border/20">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/30">
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Fecha</th>
                            {plans.length > 1 && (
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Grupo</th>
                            )}
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Planificado</th>
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Ejecutado</th>
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plans.map((plan) => {
                            const planKey = getPlanKey(plan);
                            const selectedAct = selectedActividades[planKey];
                            const displayRealizado = selectedAct || plan.actividadRealizada;

                            return (
                              <tr key={planKey} className="border-b border-border/20">
                                <td className="py-3 px-3 font-medium">
                                  {formatDateShort(today)}
                                </td>
                                {plans.length > 1 && (
                                  <td className="py-3 px-3 text-muted-foreground text-xs">
                                    {plan.groupLabel}
                                  </td>
                                )}
                                <td className="py-3 px-3">
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                                    {getActividadNombre(plan.actividadPlanificada)}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  {displayRealizado ? (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                                      {getActividadNombre(displayRealizado)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  <select
                                    value={selectedAct || ""}
                                    onChange={(e) => handleSelectActividad(plan, e.target.value)}
                                    className="px-2 py-1 rounded text-xs bg-card border border-border/50 text-foreground focus:border-primary focus:outline-none"
                                  >
                                    <option value="">Seleccione actividad</option>
                                    {actividadesDisponibles.map(act => (
                                      <option key={act} value={act}>{getActividadNombre(act)}</option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botón guardar */}
          <div className="mt-6 flex items-center justify-between p-4 bg-card/30 rounded-lg border border-border/30">
            <span className="text-sm text-muted-foreground">
              {Object.keys(pendingChanges).length > 0
                ? `${Object.keys(pendingChanges).length} cambio(s) pendiente(s)`
                : "Seleccione actividades para registrar"}
            </span>
            <button
              onClick={handleSave}
              disabled={saving || Object.keys(pendingChanges).length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default IngresoDatos;

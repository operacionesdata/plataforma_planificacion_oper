import React from 'react';

export interface Metrics {
  planificado: number;
  ejecutado: number;        // Sin anomalías (días de trabajo real)
  ejecutadoTotal: number;   // Con anomalías (todos los días realizados)
  disponible: number;       // planificado - ejecutadoTotal
  avanceGlobal: number;
  diasPlanificados: number;
  diasEjecutados: number;   // Días únicos sin anomalías
}

// Valores excluidos del cálculo de avance - ANOMALÍAS/DESVIACIONES
// Códigos completos (usados en GanttCalendarFondeo): NAVEGACION, PUERTO_CERRADO, RELEVO, INCUMPLIMIENTO_SSO
// Códigos medios (usados en otros Gantt): NAVEG, PTOCE, RELEV, INSSO
// Códigos cortos: N, PC, R, IS, D1-D4
const EXCLUDED_VALUES = [
  'NAVEGACION', 'PUERTO_CERRADO', 'RELEVO', 'INCUMPLIMIENTO_SSO',  // Códigos completos (Fondeo)
  'NAVEG', 'PTOCE', 'RELEV', 'INSSO',  // Códigos medios
  'N', 'PC', 'R', 'IS',  // Códigos cortos
  'D1', 'D2', 'D3', 'D4'  // Días de descanso
];

export function computeGanttMetrics(
  cellData: Record<string, string>,
  selectedCentros: number[],
  dates: Date[],
  centroInstances?: unknown
): Metrics {
  let planificado = 0;
  let ejecutado = 0;         // Sin anomalías (trabajo real)
  let ejecutadoTotal = 0;    // Con anomalías (todos los realizados)
  let disponible = 0;
  let desviacion = 0;

  // Contadores de días únicos
  const diasConProyectado = new Set<number>();
  // diasConRealizado: SOLO días con trabajo real (excluyendo anomalías N, PC, R)
  const diasConRealizado = new Set<number>();

  // Si no hay centros seleccionados, devolver 0s
  if (!selectedCentros || selectedCentros.length === 0) {
    console.log('[GanttMetrics] No hay centros seleccionados, devolviendo 0s');
    return { planificado: 0, ejecutado: 0, ejecutadoTotal: 0, disponible: 0, avanceGlobal: 0, diasPlanificados: 0, diasEjecutados: 0 };
  }

  const centrosToProcess = selectedCentros;

  console.log('[GanttMetrics] Procesando centros:', centrosToProcess);

  centrosToProcess.forEach((centro) => {
    const byDateInstProj = new Map<number, Set<number>>();
    const byDateInstReal = new Map<number, Set<number>>();       // Sin anomalías
    const byDateInstRealTotal = new Map<number, Set<number>>();  // CON anomalías
    const legacyProj = new Set<number>();
    const legacyReal = new Set<number>();       // Sin anomalías
    const legacyRealTotal = new Set<number>();  // CON anomalías

    let keysFoundForCentro = 0;
    let anomaliasEncontradas = 0;
    let diasTrabajoReal = 0;

    // Clasificar claves por centro
    for (const key in cellData) {
      if (!key.startsWith(`${centro}-`)) continue;
      
      keysFoundForCentro++;
      const value = cellData[key];
      const trimmedValue = value?.trim?.() || value;
      const upperValue = trimmedValue?.toUpperCase?.() || trimmedValue;
      const isAnomalia = EXCLUDED_VALUES.includes(upperValue);
      
      const parts = key.split('-');

      // Formato con instancia: <centro>-<instancia>-<tipo>-<fecha>
      if (parts.length === 4 && (parts[2] === 'proyectado' || parts[2] === 'realizado')) {
        const instanceIndex = parseInt(parts[1], 10);
        const tipo = parts[2];
        const dateIndex = parseInt(parts[3], 10);
        if (Number.isNaN(instanceIndex) || Number.isNaN(dateIndex)) continue;
        
        if (tipo === 'proyectado') {
          // Proyectado: contar todo
          if (!byDateInstProj.has(dateIndex)) byDateInstProj.set(dateIndex, new Set());
          byDateInstProj.get(dateIndex)!.add(instanceIndex);
          diasConProyectado.add(dateIndex);
        } else {
          // Realizado TOTAL (incluyendo anomalías)
          if (!byDateInstRealTotal.has(dateIndex)) byDateInstRealTotal.set(dateIndex, new Set());
          byDateInstRealTotal.get(dateIndex)!.add(instanceIndex);
          
          // Realizado SIN anomalías (días de trabajo real)
          if (isAnomalia) {
            anomaliasEncontradas++;
          } else {
            if (!byDateInstReal.has(dateIndex)) byDateInstReal.set(dateIndex, new Set());
            byDateInstReal.get(dateIndex)!.add(instanceIndex);
            diasConRealizado.add(dateIndex);
            diasTrabajoReal++;
          }
        }
        continue;
      }

      // Formato legado (sin instancia): <centro>-<tipo>-<fecha>
      if (parts.length === 3 && (parts[1] === 'proyectado' || parts[1] === 'realizado')) {
        const tipo = parts[1];
        const dateIndex = parseInt(parts[2], 10);
        if (Number.isNaN(dateIndex)) continue;
        
        if (tipo === 'proyectado') {
          legacyProj.add(dateIndex);
          diasConProyectado.add(dateIndex);
        } else {
          // Realizado TOTAL (incluyendo anomalías)
          legacyRealTotal.add(dateIndex);
          
          // Realizado SIN anomalías
          if (isAnomalia) {
            anomaliasEncontradas++;
          } else {
            legacyReal.add(dateIndex);
            diasConRealizado.add(dateIndex);
            diasTrabajoReal++;
          }
        }
      }
      // Nota: Ignoramos claves con formato barco (1-B1-37) ya que son "recursos asignados", no proyectado/realizado
    }
    
    console.log(`[GanttMetrics] Centro ${centro}: anomalías=${anomaliasEncontradas}, diasTrabajoReal=${diasTrabajoReal}`);

    // Consolidar conteos por fecha
    const allDateIndexes = new Set<number>([
      ...Array.from(byDateInstProj.keys()),
      ...Array.from(byDateInstReal.keys()),
      ...Array.from(byDateInstRealTotal.keys()),
      ...Array.from(legacyProj.values()),
      ...Array.from(legacyReal.values()),
      ...Array.from(legacyRealTotal.values()),
    ]);

    for (const dateIndex of allDateIndexes) {
      const projInst = byDateInstProj.get(dateIndex);
      const realInst = byDateInstReal.get(dateIndex) || new Set<number>();
      const realInstTotal = byDateInstRealTotal.get(dateIndex) || new Set<number>();
      
      // SIEMPRE contar ejecutadoTotal de instancias (realizado incluyendo anomalías)
      const countRealTotalFromInstances = realInstTotal.size;
      
      if (projInst && projInst.size > 0) {
        const countProj = projInst.size;
        const countReal = realInst.size > 0 ? Math.min(projInst.size, realInst.size) : 0;
        const countDesv = Math.max(0, realInst.size - projInst.size);
        
        planificado += countProj;
        ejecutado += countReal;
        ejecutadoTotal += countRealTotalFromInstances;
        disponible += Math.max(0, countProj - countRealTotalFromInstances);
        desviacion += countDesv;
      } else if (countRealTotalFromInstances > 0) {
        // Días con realizado pero sin proyectado (días extras)
        ejecutadoTotal += countRealTotalFromInstances;
        ejecutado += realInst.size; // trabajo sin anomalías
      } else {
        const hasProj = legacyProj.has(dateIndex);
        const hasReal = legacyReal.has(dateIndex);
        const hasRealTotal = legacyRealTotal.has(dateIndex);
        
        // Contar ejecutadoTotal independientemente de si hay proyectado
        if (hasRealTotal) ejecutadoTotal += 1;
        
        if (hasProj) {
          planificado += 1;
          if (hasReal) ejecutado += 1;
          if (!hasRealTotal) disponible += 1;
        } else if (hasReal) {
          desviacion += 1;
        }
      }
    }
  });

  const avanceGlobal = planificado > 0 ? Math.round((ejecutado / planificado) * 100) : 0;
  const diasPlanificados = diasConProyectado.size;
  const diasEjecutados = diasConRealizado.size;
  
  console.log('[GanttMetrics Debug v7]', { 
    actividades: { planificado, ejecutado, ejecutadoTotal, disponible, desviacion, avanceGlobal },
    dias: { diasPlanificados, diasEjecutados }
  });

  return { planificado, ejecutado, ejecutadoTotal, disponible, avanceGlobal, diasPlanificados, diasEjecutados };
}


// Hook que usa la función pura con memoización de React
export function useGanttMetrics(
  cellData: Record<string, string>,
  selectedCentros: number[],
  dates: Date[],
  centroInstances?: unknown
): Metrics {
  return React.useMemo(
    () => computeGanttMetrics(cellData, selectedCentros, dates, centroInstances),
    [cellData, selectedCentros, dates, centroInstances]
  );
}

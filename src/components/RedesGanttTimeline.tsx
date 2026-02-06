import React, { useMemo } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Ship, CheckCircle } from 'lucide-react';
import { RedesProgramacion } from './ProgramarRedes';

interface RedesGanttTimelineProps {
  programaciones: RedesProgramacion[];
}

const RedesGanttTimeline: React.FC<RedesGanttTimelineProps> = ({ programaciones }) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Calcular rango de 2 meses para el Gantt
  const { startDate, endDate, totalDays, dates } = useMemo(() => {
    const start = new Date(today);
    start.setDate(1); // Inicio del mes actual
    const end = new Date(today);
    end.setMonth(end.getMonth() + 2);
    end.setDate(0); // Último día del mes siguiente
    
    const days: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return {
      startDate: start,
      endDate: end,
      totalDays: days.length,
      dates: days
    };
  }, [today]);

  // Agrupar programaciones por embarcación
  const programacionesPorBarco = useMemo(() => {
    const grouped: Record<string, RedesProgramacion[]> = {};
    programaciones.forEach(prog => {
      if (!grouped[prog.embarcacion]) {
        grouped[prog.embarcacion] = [];
      }
      grouped[prog.embarcacion].push(prog);
    });
    // Ordenar por fecha de inicio
    Object.keys(grouped).forEach(barco => {
      grouped[barco].sort((a, b) => 
        new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
      );
    });
    return grouped;
  }, [programaciones]);

  // Historial de programaciones finalizadas (últimos 30 días)
  const historialFinalizadas = useMemo(() => {
    const hace30Dias = new Date(today);
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    
    return programaciones
      .filter(prog => {
        const termino = new Date(prog.fechaTermino);
        return termino < today && termino >= hace30Dias;
      })
      .sort((a, b) => new Date(b.fechaTermino).getTime() - new Date(a.fechaTermino).getTime());
  }, [programaciones, today]);

  // Función para obtener posición en el Gantt
  const getPositionAndWidth = (fechaInicio: string, fechaTermino: string) => {
    const inicio = new Date(fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    const termino = new Date(fechaTermino);
    termino.setHours(0, 0, 0, 0);
    
    const diffStart = Math.floor((inicio.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const diffEnd = Math.floor((termino.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const left = Math.max(0, (diffStart / totalDays) * 100);
    const width = Math.max(1, ((diffEnd - diffStart + 1) / totalDays) * 100);
    
    return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
  };

  // Posición de la línea de hoy (centrada en la celda del día)
  const todayPosition = useMemo(() => {
    const diff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    // Centrar la línea en medio de la celda del día actual
    const cellWidth = 100 / totalDays;
    return `${(diff * cellWidth) + (cellWidth / 2)}%`;
  }, [today, startDate, totalDays]);

  // Obtener color según estado
  const getEstadoColor = (fechaInicio: string, fechaTermino: string) => {
    const inicio = new Date(fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    const termino = new Date(fechaTermino);
    termino.setHours(0, 0, 0, 0);
    
    if (today > termino) return 'bg-gray-400'; // Finalizado
    if (today < inicio) return 'bg-amber-500'; // Pendiente
    return 'bg-orange-500'; // Activo
  };

  // Generar etiquetas de meses
  const monthLabels = useMemo(() => {
    const labels: { month: string; position: number; width: number; startIndex: number; endIndex: number }[] = [];
    let currentMonth = -1;
    let monthStart = 0;
    
    dates.forEach((date, index) => {
      if (date.getMonth() !== currentMonth) {
        if (currentMonth !== -1) {
          labels.push({
            month: new Date(dates[monthStart]).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }),
            position: (monthStart / totalDays) * 100,
            width: ((index - monthStart) / totalDays) * 100,
            startIndex: monthStart,
            endIndex: index - 1
          });
        }
        currentMonth = date.getMonth();
        monthStart = index;
      }
    });
    // Último mes
    labels.push({
      month: new Date(dates[monthStart]).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }),
      position: (monthStart / totalDays) * 100,
      width: ((dates.length - monthStart) / totalDays) * 100,
      startIndex: monthStart,
      endIndex: dates.length - 1
    });
    
    return labels;
  }, [dates, totalDays]);

  return (
    <div className="space-y-4">
      {/* Gantt de Programación */}
      <Card className="bg-background/80 backdrop-blur-sm p-4 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Ship className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-foreground">Programación Redes</h3>
          <Badge variant="secondary" className="ml-auto bg-orange-500/20 text-orange-400">
            {Object.keys(programacionesPorBarco).length} embarcaciones
          </Badge>
        </div>

        {Object.keys(programacionesPorBarco).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Ship className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No hay programaciones Redes</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Header alineado con la grilla (respeta el ancho de la columna de embarcación) */}
            <div className="flex items-start gap-2">
              <div className="w-28 flex-shrink-0" />
              <div className="flex-1">
                {/* Header con meses */}
                <div className="relative h-6 bg-muted/30 rounded-t">
                  {monthLabels.map((label, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-full flex items-center justify-center text-xs font-medium text-muted-foreground border-l border-border first:border-l-0"
                      style={{ left: `${label.position}%`, width: `${label.width}%` }}
                    >
                      {label.month}
                    </div>
                  ))}
                </div>

                {/* Fila de días del mes */}
                <div className="relative h-5 bg-muted/20 mb-1 flex">
                  {dates.map((date, index) => {
                    const dayOfMonth = date.getDate();
                    const isToday = date.toDateString() === today.toDateString();
                    const dayWidth = 100 / totalDays;

                    return (
                      <div
                        key={index}
                        className={`flex-shrink-0 h-full flex items-center justify-center text-[8px] border-r border-border/20 last:border-r-0 ${isToday ? 'bg-red-500/20 text-red-500 font-bold' : 'text-muted-foreground'}`}
                        style={{ width: `${dayWidth}%` }}
                      >
                        {dayOfMonth}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Filas por embarcación */}
            {Object.entries(programacionesPorBarco).map(([barco, progs]) => (
              <div key={barco} className="flex items-center gap-2">
                <div className="w-28 text-xs font-medium text-foreground truncate flex-shrink-0" title={barco}>
                  🚢 {barco}
                </div>
                <div className="flex-1 relative h-8 bg-muted/20 rounded">
                  {/* Línea vertical de fecha actual */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: todayPosition }}
                  >
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                  
                  {/* Barras de programación */}
                  {progs.map((prog, idx) => {
                    const { left, width } = getPositionAndWidth(prog.fechaInicio, prog.fechaTermino);
                    const colorClass = getEstadoColor(prog.fechaInicio, prog.fechaTermino);
                    
                    return (
                      <div
                        key={idx}
                        className={`absolute top-1 h-6 ${colorClass} rounded text-white text-[10px] flex items-center justify-center overflow-hidden cursor-pointer hover:brightness-110 transition-all`}
                        style={{ left, width, minWidth: '20px' }}
                        title={`${prog.centro}\n${new Date(prog.fechaInicio).toLocaleDateString('es-CL')} - ${new Date(prog.fechaTermino).toLocaleDateString('es-CL')}`}
                      >
                        <span className="truncate px-1">{prog.centro}</span>
                      </div>
                    );
                  })}
                  
                  {/* Flechas conectando programaciones */}
                  {progs.length > 1 && progs.slice(0, -1).map((prog, idx) => {
                    const { left: left1, width: width1 } = getPositionAndWidth(prog.fechaInicio, prog.fechaTermino);
                    const { left: left2 } = getPositionAndWidth(progs[idx + 1].fechaInicio, progs[idx + 1].fechaTermino);
                    const end1 = parseFloat(left1) + parseFloat(width1);
                    const start2 = parseFloat(left2);
                    
                    if (start2 > end1) {
                      return (
                        <div
                          key={`arrow-${idx}`}
                          className="absolute top-3.5 h-1 bg-gray-500 rounded"
                          style={{ 
                            left: `${end1}%`, 
                            width: `${start2 - end1}%`,
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, #6b7280 4px, #6b7280 10px)',
                          }}
                        >
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-gray-500" />
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}

            {/* Leyenda */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span className="text-muted-foreground">Activo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-muted-foreground">Pendiente</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gray-400" />
                <span className="text-muted-foreground">Finalizado</span>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <div className="w-3 h-0.5 bg-red-500" />
                <span className="text-muted-foreground">Fecha actual</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Historial de Programaciones Finalizadas (SIN Última Visita por Centro) */}
      {historialFinalizadas.length > 0 && (
        <Card className="bg-background/80 backdrop-blur-sm p-4 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-bold text-foreground">Historial Reciente</h3>
            <Badge variant="secondary" className="ml-auto">
              Últimos 30 días
            </Badge>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {historialFinalizadas.map((prog, idx) => {
              const termino = new Date(prog.fechaTermino);
              const diasDesde = Math.floor((today.getTime() - termino.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 bg-muted/30 rounded text-sm"
                >
                  <Ship className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{prog.embarcacion}</div>
                    <div className="text-xs text-muted-foreground truncate">{prog.centro}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-muted-foreground">
                      {new Date(prog.fechaInicio).toLocaleDateString('es-CL')} - {termino.toLocaleDateString('es-CL')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Hace {diasDesde} día{diasDesde !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default RedesGanttTimeline;
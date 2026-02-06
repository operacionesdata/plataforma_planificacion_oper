import React, { useMemo, useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Ship, Calendar, AlertTriangle, Clock, CheckCircle, Package, Plus, Trash2, X, Loader2, ClipboardPaste, Pencil, Check } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { LISProgramacion } from './ProgramarLIS';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CentroMaterial {
  id: string;
  centro: string;
  material: string;
  pedido: boolean;
  en_traslado: boolean;
  recepcionado: boolean;
  p?: string;
  codigo_material?: string;
  cantidad?: number;
  um?: string;
  grupo_articulos?: string;
  almacen?: string;
  gcp?: string;
  orgc?: string;
  solicitante?: string;
}

interface LISGanttTimelineProps {
  programaciones: LISProgramacion[];
}

const LISGanttTimeline: React.FC<LISGanttTimelineProps> = ({ programaciones }) => {
  const [expandedCentro, setExpandedCentro] = useState<string | null>(null);
  const [materiales, setMateriales] = useState<CentroMaterial[]>([]);
  const [loadingMateriales, setLoadingMateriales] = useState(false);
  const [newMaterial, setNewMaterial] = useState('');
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [isPasting, setIsPasting] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Cargar materiales cuando se expande un centro
  useEffect(() => {
    if (expandedCentro) {
      loadMateriales(expandedCentro);
    }
  }, [expandedCentro]);

  const loadMateriales = async (centro: string) => {
    setLoadingMateriales(true);
    try {
      const { data, error } = await supabase
        .from('centro_materiales')
        .select('*')
        .eq('centro', centro)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMateriales(data || []);
    } catch (error) {
      console.error('Error cargando materiales:', error);
      toast.error('Error al cargar materiales');
    } finally {
      setLoadingMateriales(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.trim() || !expandedCentro) return;
    
    setSavingMaterial(true);
    try {
      const { data, error } = await supabase
        .from('centro_materiales')
        .insert({
          centro: expandedCentro,
          material: newMaterial.trim(),
          pedido: false,
          en_traslado: false,
          recepcionado: false
        })
        .select()
        .single();

      if (error) throw error;
      setMateriales(prev => [...prev, data]);
      setNewMaterial('');
      toast.success('Material agregado');
    } catch (error) {
      console.error('Error agregando material:', error);
      toast.error('Error al agregar material');
    } finally {
      setSavingMaterial(false);
    }
  };

  // Función para parsear texto pegado desde Excel
  const handlePasteMateriales = async () => {
    if (!pasteText.trim() || !expandedCentro) return;
    
    setIsPasting(true);
    try {
      const lines = pasteText.trim().split('\n').filter(line => line.trim());
      const materialesNuevos: any[] = [];
      
      for (const line of lines) {
        // Dividir por tabs (formato Excel)
        const columns = line.split('\t');
        
        if (columns.length >= 2) {
          // Formato: P, MATERIAL, Columna5, CANTIDAD2, UM, Columna8, GRUPO ARTICULOS, CENTRO, ALMACEN, GCP, ORGC, SOLICITANTE, ...
          const materialData = {
            centro: expandedCentro,
            p: columns[0]?.trim() || '',
            codigo_material: columns[1]?.trim() || '',
            material: columns[1]?.trim() || '', // Código material como nombre si no hay otro
            cantidad: parseFloat(columns[3]?.trim()) || 0,
            um: columns[4]?.trim() || '',
            grupo_articulos: columns[6]?.trim() || '',
            almacen: columns[8]?.trim() || '',
            gcp: columns[9]?.trim() || '',
            orgc: columns[10]?.trim() || '',
            solicitante: columns[11]?.trim() || '',
            pedido: false,
            en_traslado: false,
            recepcionado: false
          };
          materialesNuevos.push(materialData);
        }
      }
      
      if (materialesNuevos.length > 0) {
        const { data, error } = await supabase
          .from('centro_materiales')
          .insert(materialesNuevos)
          .select();

        if (error) throw error;
        setMateriales(prev => [...prev, ...(data || [])]);
        setPasteText('');
        setShowPasteArea(false);
        toast.success(`${materialesNuevos.length} materiales agregados`);
      } else {
        toast.error('No se encontraron materiales válidos en el texto pegado');
      }
    } catch (error) {
      console.error('Error pegando materiales:', error);
      toast.error('Error al agregar materiales');
    } finally {
      setIsPasting(false);
    }
  };

  const handleUpdateMaterial = async (id: string, field: 'pedido' | 'en_traslado' | 'recepcionado', value: boolean) => {
    try {
      const { error } = await supabase
        .from('centro_materiales')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;
      setMateriales(prev => 
        prev.map(m => m.id === id ? { ...m, [field]: value } : m)
      );
    } catch (error) {
      console.error('Error actualizando material:', error);
      toast.error('Error al actualizar');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('centro_materiales')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMateriales(prev => prev.filter(m => m.id !== id));
      toast.success('Material eliminado');
    } catch (error) {
      console.error('Error eliminando material:', error);
      toast.error('Error al eliminar');
    }
  };

  // Calcular rango de 2 meses para el Gantt
  const { startDate, endDate, totalDays, dates } = useMemo(() => {
    const start = new Date(today);
    start.setDate(1);
    const end = new Date(today);
    end.setMonth(end.getMonth() + 2);
    end.setDate(0);
    
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
    const grouped: Record<string, LISProgramacion[]> = {};
    programaciones.forEach(prog => {
      if (!grouped[prog.embarcacion]) {
        grouped[prog.embarcacion] = [];
      }
      grouped[prog.embarcacion].push(prog);
    });
    Object.keys(grouped).forEach(barco => {
      grouped[barco].sort((a, b) => 
        new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
      );
    });
    return grouped;
  }, [programaciones]);

  // Calcular última visita por centro (para etiquetas debajo de barras)
  const ultimaVisitaPorCentro = useMemo(() => {
    const visitas: Record<string, { fecha: Date; embarcacion: string; diasDesde: number }> = {};
    
    programaciones.forEach(prog => {
      const termino = new Date(prog.fechaTermino);
      termino.setHours(0, 0, 0, 0);
      
      if (termino <= today) {
        const existing = visitas[prog.centro];
        if (!existing || termino > existing.fecha) {
          const diasDesde = Math.floor((today.getTime() - termino.getTime()) / (1000 * 60 * 60 * 24));
          if (diasDesde <= 30) {
            visitas[prog.centro] = {
              fecha: termino,
              embarcacion: prog.embarcacion,
              diasDesde
            };
          }
        }
      }
    });
    
    return visitas;
  }, [programaciones, today]);

  // Historial de programaciones finalizadas
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
    
    if (today > termino) return 'bg-gray-400';
    if (today < inicio) return 'bg-amber-500';
    return 'bg-green-500';
  };

  // Obtener color y etiqueta según días desde última visita
  const getColorDiasDesdeVisita = (dias: number) => {
    if (dias < 10) return { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-500', label: 'OK' };
    if (dias <= 15) return { bg: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-500', label: 'Atención' };
    return { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-500', label: 'Crítico' };
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
          <Ship className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Programación LIS</h3>
          <Badge variant="secondary" className="ml-auto">
            {Object.keys(programacionesPorBarco).length} embarcaciones
          </Badge>
        </div>

        {Object.keys(programacionesPorBarco).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Ship className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No hay programaciones LIS</p>
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
              <div key={barco} className="flex items-start gap-2">
                <div className="w-28 text-xs font-medium text-foreground truncate flex-shrink-0 pt-1" title={barco}>
                  🚢 {barco}
                </div>
                <div className="flex-1 relative min-h-[48px] bg-muted/20 rounded">
                  {/* Línea vertical de fecha actual */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: todayPosition }}
                  >
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                  
                  {/* Barras de programación con etiquetas de días */}
                  {progs.map((prog, idx) => {
                    const { left, width } = getPositionAndWidth(prog.fechaInicio, prog.fechaTermino);
                    const colorClass = getEstadoColor(prog.fechaInicio, prog.fechaTermino);
                    const visitaInfo = ultimaVisitaPorCentro[prog.centro];
                    const isExpanded = expandedCentro === prog.centro;
                    
                    // Solo mostrar etiqueta si la programación está finalizada
                    const termino = new Date(prog.fechaTermino);
                    termino.setHours(0, 0, 0, 0);
                    const isFinished = today > termino;
                    
                    return (
                      <div key={idx} className="absolute" style={{ left, width, minWidth: '30px', top: '4px' }}>
                        {/* Barra de programación */}
                        <div
                          className={`h-6 ${colorClass} rounded text-white text-[10px] flex items-center justify-center overflow-hidden cursor-pointer hover:brightness-110 transition-all ${isExpanded ? 'ring-2 ring-primary' : ''}`}
                          title={`${prog.centro}\n${new Date(prog.fechaInicio).toLocaleDateString('es-CL')} - ${new Date(prog.fechaTermino).toLocaleDateString('es-CL')}`}
                          onClick={() => setExpandedCentro(isExpanded ? null : prog.centro)}
                        >
                          <span className="truncate px-1">{prog.centro}</span>
                        </div>
                        
                        {/* Etiqueta de días desde última visita (solo para finalizadas) */}
                        {isFinished && visitaInfo && (
                          <div 
                            className={`mt-0.5 px-1 py-0.5 rounded text-[9px] font-bold text-white text-center ${getColorDiasDesdeVisita(visitaInfo.diasDesde).bg} cursor-pointer`}
                            onClick={() => setExpandedCentro(isExpanded ? null : prog.centro)}
                          >
                            {visitaInfo.diasDesde}d
                          </div>
                        )}
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
                          className="absolute h-1 bg-gray-500 rounded"
                          style={{ 
                            left: `${end1}%`, 
                            width: `${start2 - end1}%`,
                            top: '14px',
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
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
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

            {/* Leyenda de días */}
            <div className="flex items-center gap-4 pt-2 text-xs flex-wrap">
              <span className="text-muted-foreground font-medium">Días desde última visita:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-muted-foreground">&lt;10d</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span className="text-muted-foreground">10-15d</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-muted-foreground">&gt;15d</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Panel de Materiales del Centro Expandido */}
      {expandedCentro && (
        <Card className="bg-background/80 backdrop-blur-sm p-4 border border-primary/50 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground flex-1">Materiales - {expandedCentro}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedCentro(null)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {loadingMateriales ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Botones de acción */}
              <div className="flex gap-2 mb-4 flex-wrap">
                <Button
                  variant={showPasteArea ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowPasteArea(!showPasteArea)}
                  className="gap-1"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  Pegar desde Excel
                </Button>
              </div>
              
              {/* Área para pegar desde Excel */}
              {showPasteArea && (
                <div className="mb-4 p-3 border border-border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-2">
                    Pega los datos desde Excel (formato: P, MATERIAL, Columna5, CANTIDAD2, UM, Columna8, GRUPO ARTICULOS, CENTRO, ALMACEN, GCP, ORGC, SOLICITANTE...)
                  </p>
                  <Textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Pega aquí los datos de Excel..."
                    className="min-h-[100px] text-xs font-mono mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handlePasteMateriales}
                      disabled={!pasteText.trim() || isPasting}
                      size="sm"
                      className="gap-1"
                    >
                      {isPasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Agregar Materiales
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setPasteText(''); setShowPasteArea(false); }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Agregar nuevo material manualmente */}
              <div className="flex gap-2 mb-4">
                <Input
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                  placeholder="Agregar material manualmente..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
                />
                <Button
                  onClick={handleAddMaterial}
                  disabled={!newMaterial.trim() || savingMaterial}
                  size="sm"
                  className="gap-1"
                >
                  {savingMaterial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Agregar
                </Button>
              </div>

              {/* Tabla de materiales */}
              {materiales.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin materiales registrados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-1 font-medium text-muted-foreground">P</th>
                        <th className="text-left py-2 px-1 font-medium text-muted-foreground">Código</th>
                        <th className="text-left py-2 px-1 font-medium text-muted-foreground">Cant</th>
                        <th className="text-left py-2 px-1 font-medium text-muted-foreground">UM</th>
                        <th className="text-left py-2 px-1 font-medium text-muted-foreground">Grupo</th>
                        <th className="text-left py-2 px-1 font-medium text-muted-foreground">Almacén</th>
                        <th className="text-left py-2 px-1 font-medium text-muted-foreground">GCP</th>
                        <th className="text-left py-2 px-1 font-medium text-muted-foreground">Solicitante</th>
                        <th className="text-center py-2 px-1 font-medium text-muted-foreground">Pedido</th>
                        <th className="text-center py-2 px-1 font-medium text-muted-foreground">Traslado</th>
                        <th className="text-center py-2 px-1 font-medium text-muted-foreground">Recibido</th>
                        <th className="text-center py-2 px-1 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {materiales.map((mat) => (
                        <tr key={mat.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-1 px-1 text-foreground">{mat.p || '-'}</td>
                          <td className="py-1 px-1 text-foreground font-medium">{mat.codigo_material || mat.material}</td>
                          <td className="py-1 px-1 text-foreground">{mat.cantidad || 0}</td>
                          <td className="py-1 px-1 text-foreground">{mat.um || '-'}</td>
                          <td className="py-1 px-1 text-foreground truncate max-w-[80px]" title={mat.grupo_articulos}>{mat.grupo_articulos || '-'}</td>
                          <td className="py-1 px-1 text-foreground">{mat.almacen || '-'}</td>
                          <td className="py-1 px-1 text-foreground">{mat.gcp || '-'}</td>
                          <td className="py-1 px-1 text-foreground">{mat.solicitante || '-'}</td>
                          <td className="py-1 px-1 text-center">
                            <Checkbox
                              checked={mat.pedido}
                              onCheckedChange={(checked) => handleUpdateMaterial(mat.id, 'pedido', !!checked)}
                              className="mx-auto"
                            />
                          </td>
                          <td className="py-1 px-1 text-center">
                            <Checkbox
                              checked={mat.en_traslado}
                              onCheckedChange={(checked) => handleUpdateMaterial(mat.id, 'en_traslado', !!checked)}
                              className="mx-auto"
                            />
                          </td>
                          <td className="py-1 px-1 text-center">
                            <Checkbox
                              checked={mat.recepcionado}
                              onCheckedChange={(checked) => handleUpdateMaterial(mat.id, 'recepcionado', !!checked)}
                              className="mx-auto"
                            />
                          </td>
                          <td className="py-1 px-1 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMaterial(mat.id)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Resumen de estado */}
              {materiales.length > 0 && (
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-xs flex-wrap">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500">
                    Pedidos: {materiales.filter(m => m.pedido).length}/{materiales.length}
                  </Badge>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500">
                    En Traslado: {materiales.filter(m => m.en_traslado).length}/{materiales.length}
                  </Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500">
                    Recepcionados: {materiales.filter(m => m.recepcionado).length}/{materiales.length}
                  </Badge>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* Seguimiento de Última Visita por Centro */}
      {Object.keys(ultimaVisitaPorCentro).length > 0 && (
        <Card className="bg-background/80 backdrop-blur-sm p-4 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Última Visita por Centro</h3>
            <span className="text-xs text-muted-foreground ml-2">(máx 30 días)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {Object.entries(ultimaVisitaPorCentro)
              .sort((a, b) => b[1].diasDesde - a[1].diasDesde)
              .map(([centro, info]) => {
                const color = getColorDiasDesdeVisita(info.diasDesde);
                const isExpanded = expandedCentro === centro;
                return (
                  <div
                    key={centro}
                    className={`p-2 rounded-lg border cursor-pointer transition-all hover:scale-105 ${color.border} ${info.diasDesde > 15 ? 'bg-red-500/10' : info.diasDesde >= 10 ? 'bg-yellow-500/10' : 'bg-green-500/10'} ${isExpanded ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setExpandedCentro(isExpanded ? null : centro)}
                  >
                    <div className="text-xs font-medium text-foreground truncate" title={centro}>
                      {centro}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-lg font-bold ${color.text}`}>
                        {info.diasDesde}d
                      </span>
                      {info.diasDesde > 15 && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {info.embarcacion}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {info.fecha.toLocaleDateString('es-CL')}
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-muted-foreground">&lt;10 días</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-muted-foreground">10-15 días</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-muted-foreground">&gt;15 días (Crítico)</span>
            </div>
          </div>
        </Card>
      )}

      {/* Historial de Programaciones Finalizadas */}
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
                  className="flex items-center gap-3 p-2 bg-muted/30 rounded text-sm cursor-pointer hover:bg-muted/50"
                  onClick={() => setExpandedCentro(expandedCentro === prog.centro ? null : prog.centro)}
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

export default LISGanttTimeline;

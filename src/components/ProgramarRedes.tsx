import React, { useState, useEffect } from "react";
import { Lock, Plus, Trash2, Ship, Calendar, MapPin, Save, Eye, EyeOff, Pencil } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const centrosData = [
  { name: "Ahoní", lat: -42.7495138888889, lng: -73.5851277777778 },
  { name: "Arbolito", lat: -44.3464972222222, lng: -73.641225 },
  { name: "Aulen", lat: -41.8827527777778, lng: -72.8250083333333 },
  { name: "Benjamín", lat: -44.5983222222222, lng: -74.0522583333333 },
  { name: "Cabudahue", lat: -42.5487444444444, lng: -72.6151361111111 },
  { name: "Cahuelmó", lat: -42.2570222222222, lng: -72.4380888888889 },
  { name: "Canal Piure", lat: -44.3214027777778, lng: -73.679675 },
  { name: "Carmencita", lat: -44.5376527777778, lng: -73.9158138888889 },
  { name: "Cascajal", lat: -41.63255, lng: -72.3291083333333 },
  { name: "Chaiquén", lat: -41.4399694444444, lng: -72.2967888888889 },
  { name: "Chilco", lat: -42.5230555555556, lng: -72.6191611111111 },
  { name: "Chilco 2", lat: -41.6886194444444, lng: -72.4849361111111 },
  { name: "Chonos", lat: -44.3638694444444, lng: -73.7803361111111 },
  { name: "Contao", lat: -41.8154194444444, lng: -72.7572861111111 },
  { name: "Costa Pucheguín", lat: -41.601, lng: -72.3296416666667 },
  { name: "Edwards", lat: -42.7371027777778, lng: -73.01085 },
  { name: "Este Filomena", lat: -44.432625, lng: -73.5879 },
  { name: "Este Jechica", lat: -44.4328527777778, lng: -73.7559916666667 },
  { name: "Este Lamalec", lat: -44.3921972222222, lng: -73.6133722222222 },
  { name: "Estero Gallo", lat: -44.365725, lng: -73.6519166666667 },
  { name: "Estero Piure", lat: -44.3872305555556, lng: -73.7090416666667 },
  { name: "Factoría", lat: -41.5713833333333, lng: -72.3488527777778 },
  { name: "Farellones", lat: -41.6859694444444, lng: -72.4728861111111 },
  { name: "Filomena 2", lat: -44.4230666666667, lng: -73.605575 },
  { name: "Fiordo Largo", lat: -42.5468277777778, lng: -72.5434083333333 },
  { name: "Forsyth", lat: -44.2839277777778, lng: -74.2382111111111 },
  { name: "Francisco", lat: -44.48435, lng: -73.6982944444444 },
  { name: "Garrao", lat: -44.3539722222222, lng: -73.6927083333333 },
  { name: "Islotes", lat: -42.881225, lng: -72.7692777777778 },
  { name: "Izaza", lat: -44.5627416666667, lng: -74.2298111111111 },
  { name: "James", lat: -44.8656138888889, lng: -74.0997194444444 },
  { name: "Johnson 1", lat: -44.3443777777778, lng: -74.2658277777778 },
  { name: "Johnson 2", lat: -44.3568972222222, lng: -74.2469805555556 },
  { name: "King", lat: -44.5898861111111, lng: -74.1119666666667 },
  { name: "Lamalec", lat: -44.3974444444444, lng: -73.6419777777778 },
  { name: "Leptepu", lat: -42.4774222222222, lng: -72.4377944444444 },
  { name: "Leucayec", lat: -44.1172472222222, lng: -73.6604388888889 },
  { name: "Licha", lat: -44.3506805555556, lng: -73.7333055555556 },
  { name: "Loncochalgua", lat: -42.3710222222222, lng: -72.4339333333333 },
  { name: "Marilmó", lat: -42.2250805555556, lng: -72.5330444444444 },
  { name: "Marimelli", lat: -41.6879416666667, lng: -72.4631305555556 },
  { name: "Martita", lat: -44.5576166666667, lng: -73.9939666666667 },
  { name: "Mañihueico", lat: -41.7694527777778, lng: -72.689775 },
  { name: "Midhurts", lat: -44.1837611111111, lng: -74.3464194444444 },
  { name: "Nieves", lat: -42.5505722222222, lng: -72.5286222222222 },
  { name: "Norte Garrao", lat: -44.3577777777778, lng: -73.6288388888889 },
  { name: "Paso Lautaro", lat: -44.6186666666667, lng: -74.3294277777778 },
  { name: "Peñasmó", lat: -41.7457583333333, lng: -73.2554083333333 },
  { name: "Piedra Blanca", lat: -42.3445027777778, lng: -72.4546388888889 },
  { name: "Pillán", lat: -42.5591555555556, lng: -72.4956638888889 },
  { name: "Pilpilehue", lat: -42.7249055555556, lng: -73.6088722222222 },
  { name: "Playa Maqui", lat: -41.0937972222222, lng: -72.9682055555556 },
  { name: "Polcura", lat: -37.3029833333333, lng: -71.6583805555556 },
  { name: "Porcelana", lat: -42.4645777777778, lng: -72.4439888888889 },
  { name: "Pucheguín", lat: -41.555075, lng: -72.3142861111111 },
  { name: "Puelche", lat: -41.7386944444444, lng: -72.6529305555556 },
  { name: "Puerto Argentino", lat: -42.5673, lng: -72.5672666666667 },
  { name: "Puerto Róbalo", lat: -44.5972555555556, lng: -74.2734888888889 },
  { name: "Pumalín", lat: -42.6910027777778, lng: -72.8114277777778 },
  { name: "Punta Alta", lat: -44.5894138888889, lng: -74.177925 },
  { name: "Reñihue 3", lat: -42.5163305555556, lng: -72.7029916666667 },
  { name: "Río Chagual", lat: -41.8247722222222, lng: -72.7796333333333 },
  { name: "Río Chilco 1", lat: -41.6884333333333, lng: -72.5135472222222 },
  { name: "San José", lat: -41.7896944444444, lng: -73.1871138888889 },
  { name: "San José (acopio)", lat: -41.78735, lng: -73.1910444444444 },
  { name: "Sin Nombre", lat: -44.5921388888889, lng: -74.227525 },
  { name: "Sur Garrao", lat: -44.4411361111111, lng: -73.6760388888889 },
  { name: "Sur Jechica", lat: -44.4534166666667, lng: -73.77335 },
  { name: "Sureste Izaza", lat: -44.5592305555556, lng: -74.1329555555556 },
  { name: "Sweste Filomena", lat: -44.464575, lng: -73.6528583333333 },
  { name: "Sweste Tahuenahuec", lat: -44.5532694444444, lng: -74.05675 },
  { name: "Tahuenahuec", lat: -44.5598527777778, lng: -74.0284666666667 },
  { name: "Terao", lat: -42.7027972222222, lng: -73.6298 },
  { name: "Tomé", lat: -36.6232277777778, lng: -72.9391916666667 },
  { name: "Weste Filomena", lat: -44.4756527777778, lng: -73.6415555555556 },
  { name: "Williams 1", lat: -44.8910611111111, lng: -74.4219416666667 },
  { name: "Williams 2", lat: -44.9093611111111, lng: -74.3361388888889 },
  { name: "Williams Sector 2", lat: -44.9020416666667, lng: -74.2614138888889 },
  { name: "Yelcho", lat: -42.4029944444444, lng: -72.73455 },
];

export interface RedesProgramacion {
  id: string;
  centro: string;
  fechaInicio: string;
  fechaTermino: string;
  embarcacion: string;
}

interface ProgramarRedesProps {
  onHasChanges?: (hasChanges: boolean) => void;
}

const PASSWORD = "123";

export const ProgramarRedes = React.forwardRef<any, ProgramarRedesProps>(({ onHasChanges }, ref) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [programaciones, setProgramaciones] = useState<RedesProgramacion[]>([]);
  const [originalProgramaciones, setOriginalProgramaciones] = useState<RedesProgramacion[]>([]);

  const [selectedCentros, setSelectedCentros] = useState<string[]>([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaTermino, setFechaTermino] = useState("");
  const [embarcacion, setEmbarcacion] = useState("");
  const [searchCentro, setSearchCentro] = useState("");

  const [editingProg, setEditingProg] = useState<RedesProgramacion | null>(null);
  const [editFechaInicio, setEditFechaInicio] = useState("");
  const [editFechaTermino, setEditFechaTermino] = useState("");

  // Exponer función de guardado al padre
  React.useImperativeHandle(ref, () => ({
    guardarCambios: async () => {
      try {
        const nuevas = programaciones.filter((p) => p.id.startsWith("temp-"));
        const eliminadas = originalProgramaciones.filter((orig) => !programaciones.find((p) => p.id === orig.id));
        const editadas = programaciones.filter((p) => {
          if (p.id.startsWith("temp-")) return false;
          const original = originalProgramaciones.find((o) => o.id === p.id);
          if (!original) return false;
          return original.fechaInicio !== p.fechaInicio || original.fechaTermino !== p.fechaTermino;
        });

        if (nuevas.length > 0) {
          const insertData = nuevas.map((p) => ({
            centro: p.centro,
            fecha_inicio: p.fechaInicio,
            fecha_termino: p.fechaTermino,
            embarcacion: p.embarcacion,
          }));
          const { error } = await supabase.from("redes_programaciones").insert(insertData);
          if (error) throw error;
        }

        if (eliminadas.length > 0) {
          for (const prog of eliminadas) {
            const { error } = await supabase.from("redes_programaciones").delete().eq("id", prog.id);
            if (error) throw error;
          }
        }

        if (editadas.length > 0) {
          for (const prog of editadas) {
            const { error } = await supabase
              .from("redes_programaciones")
              .update({
                fecha_inicio: prog.fechaInicio,
                fecha_termino: prog.fechaTermino,
              })
              .eq("id", prog.id);
            if (error) throw error;
          }
        }

        // Recargar datos frescos
        const { data } = await supabase
          .from("redes_programaciones")
          .select("*")
          .order("fecha_inicio", { ascending: true });

        if (data) {
          const mapped: RedesProgramacion[] = data.map((d) => ({
            id: d.id,
            centro: d.centro,
            fechaInicio: d.fecha_inicio,
            fechaTermino: d.fecha_termino,
            embarcacion: d.embarcacion,
          }));
          setProgramaciones(mapped);
          setOriginalProgramaciones(JSON.parse(JSON.stringify(mapped)));
          if (onHasChanges) onHasChanges(false);
        }

        return true;
      } catch (err) {
        console.error("Error:", err);
        throw err;
      }
    },
  }));

  // Detectar cambios
  useEffect(() => {
    const hasChanges = JSON.stringify(programaciones) !== JSON.stringify(originalProgramaciones);
    if (onHasChanges) onHasChanges(hasChanges);
  }, [programaciones, originalProgramaciones, onHasChanges]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;

    const loadData = async () => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from("redes_programaciones")
          .select("*")
          .order("fecha_inicio", { ascending: true });

        if (error) {
          console.error("Error:", error);
          if (mounted) setIsLoading(false);
          return;
        }

        if (data && mounted) {
          const mapped: RedesProgramacion[] = data.map((d) => ({
            id: d.id,
            centro: d.centro,
            fechaInicio: d.fecha_inicio,
            fechaTermino: d.fecha_termino,
            embarcacion: d.embarcacion,
          }));

          setProgramaciones(mapped);
          setOriginalProgramaciones(JSON.parse(JSON.stringify(mapped)));
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error:", err);
        if (mounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PASSWORD) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Contraseña incorrecta");
      setPassword("");
    }
  };

  const toggleCentro = (centro: string) => {
    setSelectedCentros((prev) => (prev.includes(centro) ? prev.filter((c) => c !== centro) : [...prev, centro]));
  };

  const handleAgregarProgramacion = () => {
    if (selectedCentros.length === 0 || !fechaInicio || !fechaTermino || !embarcacion.trim()) {
      toast.error("Complete todos los campos");
      return;
    }

    const nuevasProgramaciones: RedesProgramacion[] = selectedCentros.map((centro) => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      centro,
      fechaInicio,
      fechaTermino,
      embarcacion: embarcacion.trim(),
    }));

    setProgramaciones([...programaciones, ...nuevasProgramaciones]);
    toast.success(`${selectedCentros.length} programación(es) agregada(s)`);

    setSelectedCentros([]);
    setFechaInicio("");
    setFechaTermino("");
    setEmbarcacion("");
  };

  const handleEliminarLocal = (id: string) => {
    const updated = programaciones.filter((p) => p.id !== id);
    setProgramaciones(updated);
    toast.success("Eliminada");
  };

  const openEditModal = (prog: RedesProgramacion) => {
    setEditingProg(prog);
    setEditFechaInicio(prog.fechaInicio);
    setEditFechaTermino(prog.fechaTermino);
  };

  const handleEditarLocal = () => {
    if (!editingProg || !editFechaInicio || !editFechaTermino) {
      toast.error("Complete ambas fechas");
      return;
    }

    const updated = programaciones.map((p) =>
      p.id === editingProg.id ? { ...p, fechaInicio: editFechaInicio, fechaTermino: editFechaTermino } : p,
    );
    setProgramaciones(updated);
    toast.success("Actualizada");
    setEditingProg(null);
  };

  const calcularDiasRestantes = (fechaTermino: string): number => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const termino = new Date(fechaTermino);
      termino.setHours(0, 0, 0, 0);
      const diff = termino.getTime() - hoy.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const getEstadoProgramacion = (prog: RedesProgramacion) => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const inicio = new Date(prog.fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      const termino = new Date(prog.fechaTermino);
      termino.setHours(0, 0, 0, 0);

      if (hoy < inicio) return "pendiente";
      if (hoy > termino) return "finalizado";
      return "activo";
    } catch {
      return "pendiente";
    }
  };

  const filteredCentros = centrosData.filter((c) => c.name.toLowerCase().includes(searchCentro.toLowerCase()));

  const programacionesPorEmbarcacion = React.useMemo(() => {
    const agrupado = programaciones.reduce(
      (acc, prog) => {
        if (!acc[prog.embarcacion]) {
          acc[prog.embarcacion] = [];
        }
        acc[prog.embarcacion].push(prog);
        return acc;
      },
      {} as Record<string, RedesProgramacion[]>,
    );

    Object.keys(agrupado).forEach((emb) => {
      agrupado[emb].sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
    });

    return agrupado;
  }, [programaciones]);

  if (!isAuthenticated) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <Card className="bg-background/90 backdrop-blur-sm p-8 w-full max-w-md border border-border">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-orange-500/20 p-4 rounded-full mb-4">
              <Lock size={40} className="text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Programar Redes</h2>
            <p className="text-muted-foreground text-center text-sm">Ingrese la clave para acceder</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese clave"
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="bg-destructive/20 border border-destructive/50 rounded-lg p-3 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
              Ingresar
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (isLoading && programaciones.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <Card className="bg-background/80 backdrop-blur-sm p-4 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <Ship className="w-6 h-6 text-orange-500" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Programar Redes</h2>
            <p className="text-sm text-muted-foreground">Asigne embarcaciones a centros con fechas de operación</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Seleccionar Centro(s)</label>
            <Input
              value={searchCentro}
              onChange={(e) => setSearchCentro(e.target.value)}
              placeholder="Buscar centro..."
              className="mb-2"
            />
            <div className="max-h-48 overflow-y-auto border border-border rounded-md p-2 bg-background/50">
              {filteredCentros.map((centro) => (
                <label
                  key={centro.name}
                  className="flex items-center gap-2 p-1 hover:bg-orange-500/10 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCentros.includes(centro.name)}
                    onChange={() => toggleCentro(centro.name)}
                    className="rounded"
                  />
                  <span className="text-sm text-foreground">{centro.name}</span>
                </label>
              ))}
            </div>
            {selectedCentros.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedCentros.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs bg-orange-500/20 text-orange-300">
                    {c}
                    <button onClick={() => toggleCentro(c)} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">Fecha Inicio</label>
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Fecha Término</label>
              <Input type="date" value={fechaTermino} onChange={(e) => setFechaTermino(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Embarcación</label>
              <Input
                value={embarcacion}
                onChange={(e) => setEmbarcacion(e.target.value)}
                placeholder="Nombre de la embarcación"
              />
            </div>
            <Button onClick={handleAgregarProgramacion} className="w-full gap-2 bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4" />
              Agregar ({selectedCentros.length})
            </Button>
          </div>
        </div>
      </Card>

      <Card className="flex-1 bg-background/80 backdrop-blur-sm p-4 border border-border overflow-auto">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Programaciones
        </h3>

        {Object.keys(programacionesPorEmbarcacion).length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No hay programaciones</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(programacionesPorEmbarcacion).map(([embarcacion, progs]) => (
              <div key={embarcacion} className="border border-border rounded-lg p-4 bg-background/50">
                <div className="flex items-center gap-2 mb-3">
                  <Ship className="w-5 h-5 text-orange-500" />
                  <span className="font-bold text-foreground">{embarcacion}</span>
                  <Badge variant="outline" className="border-orange-500 text-orange-400">
                    {progs.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {progs.map((prog, index) => {
                    const estado = getEstadoProgramacion(prog);
                    const diasRestantes = calcularDiasRestantes(prog.fechaTermino);
                    const esNuevo = prog.id.startsWith("temp-");

                    let lineColor = "";
                    if (estado === "pendiente") {
                      const pendientesAnt = progs
                        .slice(0, index)
                        .filter((p) => getEstadoProgramacion(p) === "pendiente").length;

                      if (pendientesAnt === 0) lineColor = "border-red-500";
                      else if (pendientesAnt === 1) lineColor = "border-orange-500";
                      else lineColor = "border-green-500";
                    }

                    return (
                      <div
                        key={prog.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          esNuevo
                            ? "bg-green-500/10 border-green-500 border-2"
                            : estado === "activo"
                              ? "bg-orange-500/10 border-orange-500"
                              : estado === "pendiente"
                                ? `bg-muted/50 ${lineColor} border-dashed border-2`
                                : "bg-muted/30 border-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin
                            className={`w-4 h-4 ${estado === "activo" ? "text-orange-500" : "text-muted-foreground"}`}
                          />
                          <div>
                            <div className="font-medium text-foreground flex items-center gap-2">
                              {prog.centro}
                              {esNuevo && (
                                <Badge variant="secondary" className="text-xs bg-green-600">
                                  NUEVO
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(prog.fechaInicio).toLocaleDateString("es-CL")} -{" "}
                              {new Date(prog.fechaTermino).toLocaleDateString("es-CL")}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {estado === "activo" && (
                            <Badge variant="default" className="bg-orange-500">
                              {diasRestantes} días
                            </Badge>
                          )}
                          {estado === "pendiente" && (
                            <Badge variant="outline" className={lineColor.replace("border-", "text-")}>
                              Espera
                            </Badge>
                          )}
                          {estado === "finalizado" && <Badge variant="secondary">Finalizado</Badge>}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(prog)}
                            className="text-orange-500 hover:bg-orange-500/10"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEliminarLocal(prog.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!editingProg} onOpenChange={(open) => !open && setEditingProg(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-orange-500" />
              Editar
            </DialogTitle>
          </DialogHeader>

          {editingProg && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="font-medium">{editingProg.centro}</span>
                <span className="text-muted-foreground">-</span>
                <Ship className="w-4 h-4 text-orange-500" />
                <span className="font-medium">{editingProg.embarcacion}</span>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Fecha Inicio</label>
                  <Input type="date" value={editFechaInicio} onChange={(e) => setEditFechaInicio(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Fecha Término</label>
                  <Input type="date" value={editFechaTermino} onChange={(e) => setEditFechaTermino(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingProg(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditarLocal} className="gap-2 bg-orange-500 hover:bg-orange-600">
                  <Save className="w-4 h-4" />
                  Aplicar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default ProgramarRedes;

import { MapPin, Info, Ship, Calendar, Filter, ClipboardList, Trash2, Save, Package, Plus, X, Loader2, Pencil, Check, ClipboardPaste } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { RedesProgramacion, ProgramarRedes } from "./ProgramarRedes";
import RedesGanttTimeline from "./RedesGanttTimeline";

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

// Centros de cultivo Camanchaca
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

interface FlotaRedesMapProps {
  redesProgramaciones?: RedesProgramacion[];
  onProgramacionChange?: (programaciones: RedesProgramacion[]) => void;
}

const REDES_CENTROS_FILTER_KEY = "redes_centros_filter";

const FlotaRedesMap: React.FC<FlotaRedesMapProps> = ({ redesProgramaciones = [], onProgramacionChange }) => {
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedCentrosFilter, setSelectedCentrosFilter] = useState<string[]>([]);
  const [showCentroFilter, setShowCentroFilter] = useState(false);
  const [centroFilterSearch, setCentroFilterSearch] = useState("");
  const [showProgramarRedes, setShowProgramarRedes] = useState(false);
  const [hasRedesChanges, setHasRedesChanges] = useState(false);
  const [isSavingRedes, setIsSavingRedes] = useState(false);
  const [selectedCentroMateriales, setSelectedCentroMateriales] = useState<string | null>(null);
  const [materiales, setMateriales] = useState<CentroMaterial[]>([]);
  const [loadingMateriales, setLoadingMateriales] = useState(false);
  const [newMaterial, setNewMaterial] = useState('');
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialName, setEditingMaterialName] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const programarRedesRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Funciones de gestión de materiales
  const loadMateriales = useCallback(async (centro: string) => {
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
  }, []);

  const handleAddMaterial = async () => {
    if (!newMaterial.trim() || !selectedCentroMateriales) return;
    
    setSavingMaterial(true);
    try {
      const { data, error } = await supabase
        .from('centro_materiales')
        .insert({
          centro: selectedCentroMateriales,
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
    if (!pasteText.trim() || !selectedCentroMateriales) return;
    
    setIsPasting(true);
    try {
      const lines = pasteText.trim().split('\n').filter(line => line.trim());
      const materialesNuevos: any[] = [];
      
      for (const line of lines) {
        const columns = line.split('\t');
        
        if (columns.length >= 2) {
          const materialData = {
            centro: selectedCentroMateriales,
            p: columns[0]?.trim() || '',
            codigo_material: columns[1]?.trim() || '',
            material: columns[1]?.trim() || '',
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
        toast.error('No se encontraron materiales válidos');
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

  const handleUpdateMaterialName = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      const { error } = await supabase
        .from('centro_materiales')
        .update({ material: newName.trim() })
        .eq('id', id);

      if (error) throw error;
      setMateriales(prev => 
        prev.map(m => m.id === id ? { ...m, material: newName.trim() } : m)
      );
      setEditingMaterialId(null);
      setEditingMaterialName('');
      toast.success('Material actualizado');
    } catch (error) {
      console.error('Error actualizando material:', error);
      toast.error('Error al actualizar');
    }
  };

  const openMaterialesPanel = useCallback((centro: string) => {
    setSelectedCentroMateriales(centro);
    loadMateriales(centro);
  }, [loadMateriales]);

  const closeMaterialesPanel = useCallback(() => {
    setSelectedCentroMateriales(null);
    setEditingMaterialId(null);
    setEditingMaterialName('');
  }, []);

  // Escuchar evento global para abrir/cerrar materiales desde popup del mapa
  useEffect(() => {
    const handleOpenMateriales = (event: CustomEvent<string>) => {
      openMaterialesPanel(event.detail);
    };
    
    const handleCloseMateriales = () => {
      closeMaterialesPanel();
    };
    
    window.addEventListener('openMaterialesPanelRedes', handleOpenMateriales as EventListener);
    window.addEventListener('closeMaterialesPanelRedes', handleCloseMateriales);
    return () => {
      window.removeEventListener('openMaterialesPanelRedes', handleOpenMateriales as EventListener);
      window.removeEventListener('closeMaterialesPanelRedes', handleCloseMateriales);
    };
  }, [openMaterialesPanel, closeMaterialesPanel]);

  // Cargar filtro de centros desde Supabase
  useEffect(() => {
    const loadCentrosFilter = async () => {
      try {
        const { data, error } = await supabase
          .from("flota_config")
          .select("config_value")
          .eq("config_key", REDES_CENTROS_FILTER_KEY)
          .maybeSingle();

        if (error) {
          console.error("Error cargando filtro de centros Redes:", error);
          return;
        }

        if (data && Array.isArray(data.config_value)) {
          setSelectedCentrosFilter(data.config_value as string[]);
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };

    loadCentrosFilter();
  }, []);

  // Guardar filtro de centros en Supabase
  const saveCentrosFilterToSupabase = async (centros: string[]) => {
    try {
      const { error } = await supabase.from("flota_config").upsert(
        {
          config_key: REDES_CENTROS_FILTER_KEY,
          config_value: centros,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "config_key" },
      );

      if (error) {
        console.error("Error guardando filtro de centros Redes:", error);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // Cargar programaciones Redes desde Supabase
  const [localRedesProgramaciones, setLocalRedesProgramaciones] = useState<RedesProgramacion[]>([]);
  const [isLoadingProgramaciones, setIsLoadingProgramaciones] = useState(true);

  const loadProgramacionesFromSupabase = async () => {
    setIsLoadingProgramaciones(true);
    try {
      const { data, error } = await supabase
        .from("redes_programaciones")
        .select("*")
        .order("fecha_inicio", { ascending: true });

      if (error) {
        console.error("Error cargando programaciones Redes:", error);
        toast.error("Error al cargar programaciones");
        return;
      }

      if (data) {
        const mapped: RedesProgramacion[] = data.map((d) => ({
          id: d.id,
          centro: d.centro,
          fechaInicio: d.fecha_inicio,
          fechaTermino: d.fecha_termino,
          embarcacion: d.embarcacion,
        }));
        setLocalRedesProgramaciones(mapped);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error al cargar programaciones");
    } finally {
      setIsLoadingProgramaciones(false);
    }
  };

  useEffect(() => {
    loadProgramacionesFromSupabase();
  }, []);

  useEffect(() => {
    if (!showProgramarRedes) {
      loadProgramacionesFromSupabase();
    }
  }, [showProgramarRedes]);

  const activeRedesProgramaciones = redesProgramaciones.length > 0 ? redesProgramaciones : localRedesProgramaciones;

  // Filtrar solo programaciones activas/pendientes para el mapa
  const programacionesParaMapa = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return activeRedesProgramaciones.filter((prog) => {
      const termino = new Date(prog.fechaTermino);
      termino.setHours(0, 0, 0, 0);
      return termino >= hoy;
    });
  }, [activeRedesProgramaciones]);

  // Función para guardar cambios de Redes
  const handleGuardarRedes = async () => {
    setIsSavingRedes(true);
    try {
      await programarRedesRef.current?.guardarCambios();
      toast.success("✅ Cambios guardados correctamente");
      setShowProgramarRedes(false);
      loadProgramacionesFromSupabase();
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Error al guardar cambios");
    } finally {
      setIsSavingRedes(false);
    }
  };

  // Función para borrar todas las programaciones Redes
  const handleBorrarTodo = async () => {
    const clave = prompt("Ingresa la clave para borrar:");
    if (clave !== "123") {
      toast.error("Clave incorrecta");
      return;
    }

    setIsDeletingAll(true);
    try {
      const { error } = await supabase
        .from("redes_programaciones")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      setLocalRedesProgramaciones([]);

      if (onProgramacionChange) {
        onProgramacionChange([]);
      }

      toast.success("Todas las programaciones Redes han sido eliminadas");
    } catch (error) {
      console.error("Error al borrar programaciones:", error);
      toast.error("Error al borrar las programaciones");
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Filtrar centros por selección múltiple
  const filteredCentros = centrosData.filter((centro) => {
    return selectedCentrosFilter.length === 0 || selectedCentrosFilter.includes(centro.name);
  });

  const centrosFilteredBySearch = centrosData.filter((c) =>
    c.name.toLowerCase().includes(centroFilterSearch.toLowerCase()),
  );

  const toggleCentroFilter = (centroName: string) => {
    setSelectedCentrosFilter((prev) => {
      const newValue = prev.includes(centroName) ? prev.filter((c) => c !== centroName) : [...prev, centroName];
      saveCentrosFilterToSupabase(newValue);
      return newValue;
    });
  };

  const clearCentrosFilter = () => {
    setSelectedCentrosFilter([]);
    saveCentrosFilterToSupabase([]);
  };

  // Helper functions
  const getEstadoProgramacion = (prog: RedesProgramacion) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(prog.fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    const termino = new Date(prog.fechaTermino);
    termino.setHours(0, 0, 0, 0);

    if (hoy < inicio) return "pendiente";
    if (hoy > termino) return "finalizado";
    return "activo";
  };

  const calcularDiasRestantes = (fechaTermino: string): number => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const termino = new Date(fechaTermino);
    termino.setHours(0, 0, 0, 0);
    const diff = termino.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Initialize map
  useEffect(() => {
    const loadLeaflet = async () => {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!window.L) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => setMapLoaded(true);
        document.head.appendChild(script);
      } else {
        setMapLoaded(true);
      }
    };

    loadLeaflet();
  }, []);

  // Initialize / update map (no re-create on every change)
  const markersLayerRef = useRef<any>(null);
  const routesLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !window.L) return;

    const L = window.L;
    const container = mapContainerRef.current;

    // Create map once
    if (!mapRef.current) {
      // If the DOM node was previously used by Leaflet, reset it
      if ((container as any)._leaflet_id) delete (container as any)._leaflet_id;
      container.innerHTML = "";

      const map = L.map(container, {
        center: [-42.5, -73.5],
        zoom: 7,
        zoomControl: true,
      });

      mapRef.current = map;

      const esriSatellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Esri", maxZoom: 19 },
      );

      const esriLabels = L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 },
      );

      esriSatellite.addTo(map);
      esriLabels.addTo(map);

      const baseLayers = {
        "🛰️ Satélite": L.layerGroup([esriSatellite, esriLabels]),
        "🗺️ Calles": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "OpenStreetMap",
        }),
      };

      L.control.layers(baseLayers, {}, { position: "topright" }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      routesLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    const routesLayer = routesLayerRef.current;

    // Clear dynamic layers (avoid removing/creating map)
    markersLayer?.clearLayers?.();
    routesLayer?.clearLayers?.();

    const bounds = L.latLngBounds([]);

    // Agrupar programaciones por embarcación
    const redesPorEmbarcacion: Record<string, RedesProgramacion[]> = {};
    programacionesParaMapa.forEach((prog) => {
      if (!redesPorEmbarcacion[prog.embarcacion]) redesPorEmbarcacion[prog.embarcacion] = [];
      redesPorEmbarcacion[prog.embarcacion].push(prog);
    });

    // Ordenar por fecha
    Object.keys(redesPorEmbarcacion).forEach((emb) => {
      redesPorEmbarcacion[emb].sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
    });

    // Add markers for centers
    filteredCentros.forEach((centro) => {
      const redesParaCentro = programacionesParaMapa.filter((p) => p.centro === centro.name);
      const redesActivo = redesParaCentro.find((p) => getEstadoProgramacion(p) === "activo");
      const redesPendiente = redesParaCentro.find((p) => getEstadoProgramacion(p) === "pendiente");

      let iconToUse = L.divIcon({
        html: `<div style="display: flex; align-items: center; gap: 4px;">
          <div style="background: #f97316; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); flex-shrink: 0;"></div>
          <div style="background: rgba(0,0,0,0.75); color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px; white-space: nowrap; font-weight: 500;">${centro.name}</div>
        </div>`,
        className: "",
        iconSize: [150, 20],
        iconAnchor: [7, 10],
        popupAnchor: [60, -10],
      });

      if (redesActivo) {
        iconToUse = L.divIcon({
          html: `<div style="display: flex; align-items: center; gap: 4px;">
            <div style="background: #ea580c; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); flex-shrink: 0;"></div>
            <div style="background: rgba(234,88,12,0.9); color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px; white-space: nowrap; font-weight: 600;">${centro.name}</div>
          </div>`,
          className: "",
          iconSize: [150, 24],
          iconAnchor: [9, 12],
          popupAnchor: [60, -12],
        });
      } else if (redesPendiente) {
        iconToUse = L.divIcon({
          html: `<div style="display: flex; align-items: center; gap: 4px;">
            <div style="background: #f59e0b; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); flex-shrink: 0;"></div>
            <div style="background: rgba(245,158,11,0.9); color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px; white-space: nowrap; font-weight: 600;">${centro.name}</div>
          </div>`,
          className: "",
          iconSize: [150, 22],
          iconAnchor: [8, 11],
          popupAnchor: [60, -11],
        });
      }

      const marker = L.marker([centro.lat, centro.lng], { icon: iconToUse });
      marker.addTo(markersLayer);
      bounds.extend([centro.lat, centro.lng]);

      // Popup content
      let popupContent = `
        <div style="padding: 8px; min-width: 220px;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px; color: #ea580c;">📍 ${centro.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;"><strong>Lat:</strong> ${centro.lat.toFixed(6)}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;"><strong>Lng:</strong> ${centro.lng.toFixed(6)}</div>
      `;

      if (redesParaCentro.length > 0) {
        popupContent += `<div style="margin-top: 8px;">`;

        redesParaCentro.forEach((prog) => {
          const estado = getEstadoProgramacion(prog);
          const diasRestantes = calcularDiasRestantes(prog.fechaTermino);

          let bgColor = "#6b7280";
          let statusText = "Finalizado";
          let statusIcon = "✅";

          if (estado === "activo") {
            bgColor = "#ea580c";
            statusText = `${diasRestantes} días restantes`;
            statusIcon = "🚢";
          } else if (estado === "pendiente") {
            const diasParaLlegar = Math.ceil(
              (new Date(prog.fechaInicio).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
            );
            bgColor = "#f59e0b";
            statusText = `Llega en ${diasParaLlegar} días`;
            statusIcon = "🕐";
          }

          popupContent += `
            <div style="background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
              <div style="color: white; font-weight: bold; font-size: 13px; margin-bottom: 4px;">${statusIcon} ${prog.embarcacion}</div>
              <div style="color: white; font-size: 11px; margin-bottom: 2px;">📅 Inicio: ${new Date(prog.fechaInicio).toLocaleDateString("es-CL")}</div>
              <div style="color: white; font-size: 11px; margin-bottom: 6px;">📅 Término: ${new Date(prog.fechaTermino).toLocaleDateString("es-CL")}</div>
              <div style="background: white; color: ${bgColor}; font-weight: bold; font-size: 12px; padding: 6px; border-radius: 6px; text-align: center;">${statusText}</div>
            </div>
          `;
        });

        popupContent += `</div>`;
      }

      // Botón para gestionar materiales
      popupContent += `
        <div style="margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          <button 
            onclick="window.dispatchEvent(new CustomEvent('openMaterialesPanelRedes', { detail: '${centro.name}' }))"
            style="width: 100%; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 8px 12px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 6px;"
          >
            📦 Gestionar Materiales
          </button>
        </div>
      `;

      popupContent += `</div>`;
      marker.bindPopup(popupContent);
    });

    // Draw routes
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;
    const bearingDeg = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
      const φ1 = toRad(from.lat);
      const φ2 = toRad(to.lat);
      const Δλ = toRad(to.lng - from.lng);
      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      return (toDeg(Math.atan2(y, x)) + 360) % 360;
    };

    Object.entries(redesPorEmbarcacion).forEach(([embarcacion, progs]) => {
      if (progs.length < 2) return;

      const activoIndex = progs.findIndex((p) => getEstadoProgramacion(p) === "activo");

      progs.forEach((prog, index) => {
        if (index === progs.length - 1) return;

        const centroActual = centrosData.find((c) => c.name === prog.centro);
        const centroSiguiente = centrosData.find((c) => c.name === progs[index + 1].centro);
        if (!centroActual || !centroSiguiente) return;

        let lineColor = "#6b7280";
        if (activoIndex >= 0) {
          const posicionRelativa = index - activoIndex;
          if (posicionRelativa === 0) lineColor = "#ef4444";
          else if (posicionRelativa === 1) lineColor = "#f97316";
          else if (posicionRelativa >= 2) lineColor = "#22c55e";
        } else {
          if (index === 0) lineColor = "#ef4444";
          else if (index === 1) lineColor = "#f97316";
          else lineColor = "#22c55e";
        }

        const polyline = L.polyline(
          [
            [centroActual.lat, centroActual.lng],
            [centroSiguiente.lat, centroSiguiente.lng],
          ],
          {
            color: lineColor,
            weight: 2,
            opacity: 0.8,
            dashArray: "10, 10",
          },
        );

        polyline.addTo(routesLayer);

        // Flecha (dirección) sobre la ruta
        const b = bearingDeg(centroActual, centroSiguiente);
        const t = 0.7;
        const arrowLat = centroActual.lat + (centroSiguiente.lat - centroActual.lat) * t;
        const arrowLng = centroActual.lng + (centroSiguiente.lng - centroActual.lng) * t;
        const arrowIcon = L.divIcon({
          className: "",
          html: `<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid ${lineColor};transform: rotate(${b}deg);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        L.marker([arrowLat, arrowLng], { icon: arrowIcon, interactive: false }).addTo(routesLayer);

        polyline.bindPopup(`
          <div style="padding: 8px;">
            <div style="font-weight: bold; color: #ea580c;">🚢 ${embarcacion}</div>
            <div style="font-size: 12px; margin-top: 4px;">${prog.centro} → ${progs[index + 1].centro}</div>
          </div>
        `);
      });
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Listener para cerrar panel de materiales al hacer clic en el mapa (no en un centro)
    const handleMapClick = () => {
      window.dispatchEvent(new CustomEvent('closeMaterialesPanelRedes'));
    };
    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [mapLoaded, filteredCentros, programacionesParaMapa]);

  // Cleanup only on unmount
  useEffect(() => {
    return () => {
      const container = mapContainerRef.current;
      if (mapRef.current) {
        try {
          mapRef.current.off?.();
          mapRef.current.remove();
        } catch (e) {
          console.warn("Error cleaning up map:", e);
        }
        mapRef.current = null;
      }
      markersLayerRef.current = null;
      routesLayerRef.current = null;
      if (container) {
        try {
          container.innerHTML = "";
        } catch {
          // ignore
        }
        if ((container as any)._leaflet_id) delete (container as any)._leaflet_id;
      }
    };
  }, []);

  // Si abrimos "Programar", destruimos el mapa para evitar instancias colgadas
  useEffect(() => {
    if (showProgramarRedes) {
      const container = mapContainerRef.current;
      if (mapRef.current) {
        try {
          mapRef.current.off?.();
          mapRef.current.remove();
        } catch (e) {
          console.warn("Error cleaning up map when opening Programar Redes:", e);
        }
        mapRef.current = null;
      }
      markersLayerRef.current = null;
      routesLayerRef.current = null;

      if (container) {
        try {
          container.innerHTML = "";
        } catch {
          // ignore
        }
        if ((container as any)._leaflet_id) {
          delete (container as any)._leaflet_id;
        }
      }
    }
  }, [showProgramarRedes]);

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <Card className="bg-background/80 backdrop-blur-sm p-4 border border-border">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-bold text-foreground">Flota Redes - Centros de Cultivo</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredCentros.length} de {centrosData.length} centros
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setShowInfo(!showInfo)} variant="outline" size="sm" className="gap-2">
                <Info className="w-4 h-4" />
                {showInfo ? "Ocultar" : "Ver"} Info
              </Button>
              <Button
                onClick={() => setShowProgramarRedes(!showProgramarRedes)}
                variant={showProgramarRedes ? "default" : "outline"}
                size="sm"
                className={`gap-2 ${showProgramarRedes ? "bg-orange-500 hover:bg-orange-600" : ""}`}
              >
                <ClipboardList className="w-4 h-4" />
                Programar Redes
              </Button>
              {hasRedesChanges && (
                <Button
                  onClick={handleGuardarRedes}
                  variant="default"
                  size="sm"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  disabled={isSavingRedes}
                >
                  <Save className="w-4 h-4" />
                  {isSavingRedes ? "Guardando..." : "Guardar Redes"}
                </Button>
              )}
              <Button
                onClick={handleBorrarTodo}
                variant="destructive"
                size="sm"
                className="gap-2"
                disabled={isDeletingAll || activeRedesProgramaciones.length === 0}
              >
                <Trash2 className="w-4 h-4" />
                {isDeletingAll ? "Borrando..." : "Borrar"}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Filtro multi-selección de centros */}
            <div className="relative">
              <Button
                onClick={() => setShowCentroFilter(!showCentroFilter)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtrar Centros
                {selectedCentrosFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-orange-500/20 text-orange-400">
                    {selectedCentrosFilter.length}
                  </Badge>
                )}
              </Button>

              {showCentroFilter && (
                <div
                  className="absolute bottom-full left-0 mb-2 w-72 bg-background border border-border rounded-lg shadow-xl p-3"
                  style={{ zIndex: 9999 }}
                >
                  <Input
                    value={centroFilterSearch}
                    onChange={(e) => setCentroFilterSearch(e.target.value)}
                    placeholder="Buscar centro..."
                    className="mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {centrosFilteredBySearch.map((centro) => (
                      <label
                        key={centro.name}
                        className="flex items-center gap-2 p-1.5 hover:bg-orange-500/10 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCentrosFilter.includes(centro.name)}
                          onChange={() => toggleCentroFilter(centro.name)}
                          className="rounded"
                        />
                        <span className="text-sm text-foreground">{centro.name}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2 pt-2 border-t border-border">
                    <Button variant="ghost" size="sm" onClick={clearCentrosFilter} className="flex-1">
                      Limpiar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowCentroFilter(false)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {selectedCentrosFilter.length > 0 && (
              <Button onClick={() => clearCentrosFilter()} variant="ghost" size="sm">
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Mostrar centros seleccionados */}
          {selectedCentrosFilter.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedCentrosFilter.map((c) => (
                <Badge key={c} variant="secondary" className="text-xs bg-orange-500/20 text-orange-300">
                  {c}
                  <button onClick={() => toggleCentroFilter(c)} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {showInfo && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-sm space-y-2">
              <p className="text-foreground">
                📍 <strong>{centrosData.length} centros</strong> desde Biobío hasta Aysén
              </p>
              <p className="text-foreground">
                🚢 <strong>{activeRedesProgramaciones.length} programaciones</strong> de Redes
              </p>
              <p className="text-muted-foreground text-xs mt-2">
                💡 Clic en marcadores para ver detalles · Vista satelital Esri
              </p>
            </div>
          )}
        </div>
      </Card>

      {showProgramarRedes ? (
        <Card className="flex-1 bg-background/50 backdrop-blur-sm overflow-hidden">
          <ProgramarRedes ref={programarRedesRef} onHasChanges={setHasRedesChanges} />
        </Card>
      ) : (
        <>
          <Card className="bg-background/50 backdrop-blur-sm overflow-hidden relative">
            <div ref={mapContainerRef} className="w-full" style={{ height: "600px" }} />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="text-center space-y-3">
                  <MapPin className="w-12 h-12 text-orange-500 mx-auto animate-pulse" />
                  <p className="text-sm text-muted-foreground">Cargando mapa satelital...</p>
                </div>
              </div>
            )}
          </Card>

          {/* Panel de Materiales del Centro */}
          {selectedCentroMateriales && (
            <Card className="bg-background/95 backdrop-blur-sm p-4 border border-purple-500/50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-500" />
                    <h3 className="font-bold text-foreground">Materiales - {selectedCentroMateriales}</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={closeMaterialesPanel}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Botón para pegar desde Excel */}
                <div className="flex gap-2">
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
                  <div className="p-3 border border-border rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2">
                      Pega los datos desde Excel (P, MATERIAL, Columna5, CANTIDAD2, UM, ...)
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
                        className="gap-1 bg-purple-500 hover:bg-purple-600"
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
                <div className="flex gap-2">
                  <Input
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    placeholder="Agregar material manualmente..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
                  />
                  <Button 
                    onClick={handleAddMaterial} 
                    disabled={savingMaterial || !newMaterial.trim()}
                    size="sm"
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    {savingMaterial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Lista/Tabla de materiales */}
                {loadingMateriales ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  </div>
                ) : materiales.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay materiales registrados</p>
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
                  <div className="flex items-center gap-4 pt-3 border-t border-border text-xs flex-wrap">
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
              </div>
            </Card>
          )}

          {/* Gantt Timeline */}
          <RedesGanttTimeline programaciones={activeRedesProgramaciones} />
        </>
      )}

      <Card className="bg-background/80 backdrop-blur-sm p-3 border border-border">
        <div className="flex items-center justify-between flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white" />
              <span className="text-muted-foreground">Centro de Cultivo</span>
            </div>
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-orange-500" />
              <span className="text-muted-foreground">Programación Redes</span>
            </div>
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
              {filteredCentros.length} centros
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            Programaciones de Redes
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FlotaRedesMap;

import { MapPin, Info, Ship, Calendar, Filter, ClipboardList, Save, Package, Plus, Trash2, X, Loader2, Pencil, Check } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CENTRO_NAMES } from "@/constants/centros";
import { LISProgramacion, ProgramarLIS } from "./ProgramarLIS";
import LISGanttTimeline from "./LISGanttTimeline";

interface CentroMaterial {
  id: string;
  centro: string;
  material: string;
  pedido: boolean;
  en_traslado: boolean;
  recepcionado: boolean;
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

interface ResourceLocation {
  recurso: string;
  centro: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  area: string;
}

interface FlotaMapProps {
  lisProgramaciones?: LISProgramacion[];
  onProgramacionChange?: (programaciones: LISProgramacion[]) => void;
}

const CENTROS_FILTER_KEY = "centros_filter";

const FlotaMap: React.FC<FlotaMapProps> = ({ lisProgramaciones = [], onProgramacionChange }) => {
  const [showInfo, setShowInfo] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [recursos, setRecursos] = useState<ResourceLocation[]>([]);
  const [showRecursos, setShowRecursos] = useState(true);
  const [filterArea, setFilterArea] = useState<string>("todas");
  const [selectedCentrosFilter, setSelectedCentrosFilter] = useState<string[]>([]);
  const [showCentroFilter, setShowCentroFilter] = useState(false);
  const [centroFilterSearch, setCentroFilterSearch] = useState("");
  const [showProgramarLIS, setShowProgramarLIS] = useState(false);
  const [hasLISChanges, setHasLISChanges] = useState(false);
  const [isSavingLIS, setIsSavingLIS] = useState(false);
  const [selectedCentroMateriales, setSelectedCentroMateriales] = useState<string | null>(null);
  const [materiales, setMateriales] = useState<CentroMaterial[]>([]);
  const [loadingMateriales, setLoadingMateriales] = useState(false);
  const [newMaterial, setNewMaterial] = useState('');
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialName, setEditingMaterialName] = useState('');
  const programarLISRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Cargar filtro de centros desde Supabase
  useEffect(() => {
    const loadCentrosFilter = async () => {
      try {
        const { data, error } = await supabase
          .from("flota_config")
          .select("config_value")
          .eq("config_key", CENTROS_FILTER_KEY)
          .maybeSingle();

        if (error) {
          console.error("Error cargando filtro de centros:", error);
          return;
        }

        if (data && Array.isArray(data.config_value)) {
          setSelectedCentrosFilter(data.config_value as string[]);
          console.log("✅ Filtro de centros cargado desde Supabase:", data.config_value);
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
      const { error } = await supabase
        .from("flota_config")
        .update({ config_value: centros, updated_at: new Date().toISOString() })
        .eq("config_key", CENTROS_FILTER_KEY);

      if (error) {
        console.error("Error guardando filtro de centros:", error);
        return;
      }

      console.log("✅ Filtro de centros guardado en Supabase:", centros);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // Cargar programaciones LIS desde Supabase
  const [localLisProgramaciones, setLocalLisProgramaciones] = useState<LISProgramacion[]>([]);
  const [isLoadingProgramaciones, setIsLoadingProgramaciones] = useState(true);

  // Función para cargar programaciones desde Supabase
  const loadProgramacionesFromSupabase = async () => {
    setIsLoadingProgramaciones(true);
    try {
      const { data, error } = await supabase
        .from("lis_programaciones")
        .select("*")
        .order("fecha_inicio", { ascending: true });

      if (error) {
        console.error("Error cargando programaciones desde Supabase:", error);
        toast.error("Error al cargar programaciones");
        return;
      }

      if (data) {
        const mapped: LISProgramacion[] = data.map((d) => ({
          id: d.id,
          centro: d.centro,
          fechaInicio: d.fecha_inicio,
          fechaTermino: d.fecha_termino,
          embarcacion: d.embarcacion,
        }));
        setLocalLisProgramaciones(mapped);
        console.log("✅ Programaciones LIS cargadas desde Supabase:", mapped.length);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error al cargar programaciones");
    } finally {
      setIsLoadingProgramaciones(false);
    }
  };

  // Cargar programaciones al montar el componente
  useEffect(() => {
    loadProgramacionesFromSupabase();
  }, []);

  // Recargar programaciones cuando se cierra el panel de Programar LIS
  useEffect(() => {
    if (!showProgramarLIS) {
      loadProgramacionesFromSupabase();
    }
  }, [showProgramarLIS]);

  const activeLisProgramaciones = lisProgramaciones.length > 0 ? lisProgramaciones : localLisProgramaciones;

  // Filtrar solo programaciones activas/pendientes para el mapa (excluir finalizadas)
  const programacionesParaMapa = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return activeLisProgramaciones.filter((prog) => {
      const termino = new Date(prog.fechaTermino);
      termino.setHours(0, 0, 0, 0);
      return termino >= hoy; // Solo activas y pendientes
    });
  }, [activeLisProgramaciones]);

  // Función para guardar cambios de LIS
  const handleGuardarLIS = async () => {
    setIsSavingLIS(true);
    try {
      await programarLISRef.current?.guardarCambios();
      toast.success("✅ Cambios guardados correctamente");
      setShowProgramarLIS(false);
      loadProgramacionesFromSupabase();
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Error al guardar cambios");
    } finally {
      setIsSavingLIS(false);
    }
  };

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

  // Escuchar evento global para abrir materiales desde popup del mapa
  useEffect(() => {
    const handleOpenMateriales = (event: CustomEvent<string>) => {
      openMaterialesPanel(event.detail);
    };
    
    const handleCloseMateriales = () => {
      closeMaterialesPanel();
    };
    
    window.addEventListener('openMaterialesPanel', handleOpenMateriales as EventListener);
    window.addEventListener('closeMaterialesPanel', handleCloseMateriales);
    return () => {
      window.removeEventListener('openMaterialesPanel', handleOpenMateriales as EventListener);
      window.removeEventListener('closeMaterialesPanel', handleCloseMateriales);
    };
  }, [openMaterialesPanel, closeMaterialesPanel]);

  // Debug: mostrar programaciones activas
  useEffect(() => {
    console.log("📊 Programaciones LIS activas:", activeLisProgramaciones.length, activeLisProgramaciones);
    console.log("🗺️ Programaciones para mapa:", programacionesParaMapa.length);
  }, [activeLisProgramaciones, programacionesParaMapa]);

  // Filtrar centros por selección múltiple
  const filteredCentros = centrosData.filter((centro) => {
    const matchesFilter = selectedCentrosFilter.length === 0 || selectedCentrosFilter.includes(centro.name);
    return matchesFilter;
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

  const filteredRecursos = filterArea === "todas" ? recursos : recursos.filter((r) => r.area === filterArea);

  const centerLat = centrosData.reduce((sum, c) => sum + c.lat, 0) / centrosData.length;
  const centerLng = centrosData.reduce((sum, c) => sum + c.lng, 0) / centrosData.length;

  const generateDatesForExtraction = () => {
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

  useEffect(() => {
    const fetchRecursos = async () => {
      try {
        const areas = [
          { key: "animacion-redes", name: "Redes" },
          { key: "animacion-fondeo", name: "Fondeo" },
          { key: "animacion-arriendo", name: "Arriendo/Tecnología" },
          { key: "animacion-habitabilidad", name: "Habitabilidad" },
          { key: "animacion-sso", name: "SSO" },
          { key: "animacion-ingenieria", name: "Ingeniería" },
        ];

        let allRecursos: ResourceLocation[] = [];

        for (const area of areas) {
          const localData = localStorage.getItem(area.key);
          let ganttData: any = null;

          if (localData) {
            try {
              ganttData = JSON.parse(localData);
              console.log(`📦 ${area.name}: localStorage`);
            } catch (e) {
              console.log(`⚠️ ${area.name}: error localStorage`);
            }
          }

          if (!ganttData) {
            try {
              const url = `https://kxktxgsduopimfvzbiwi.supabase.co/rest/v1/gantt_data?sheet_name=eq.${area.key}&order=updated_at.desc&limit=1`;
              const response = await fetch(url, {
                headers: {
                  apikey:
                    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4a3R4Z3NkdW9waW1mdnpiaXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNTMyNDEsImV4cCI6MjA0ODcyOTI0MX0.UxnFgRd1bQ5EJeMlDg5h5W3eLI9LCj-8hQPRQl2eRso",
                  Authorization:
                    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4a3R4Z3NkdW9waW1mdnpiaXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNTMyNDEsImV4cCI6MjA0ODcyOTI0MX0.UxnFgRd1bQ5EJeMlDg5h5W3eLI9LCj-8hQPRQl2eRso",
                },
              });

              if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                  const record = data[0];
                  ganttData = {
                    cellData: record.cell_data || {},
                    centroNames: record.centro_names || {},
                    barcoNames: record.barco_names || {},
                  };
                  console.log(`☁️ ${area.name}: Supabase`);
                }
              }
            } catch (err) {
              console.log(`⚠️ ${area.name}: error Supabase`);
            }
          }

          if (ganttData && ganttData.cellData) {
            const cellData = ganttData.cellData;
            const centroNames = ganttData.centroNames || {};
            const barcoNames = ganttData.barcoNames || {};

            const barcosList = [
              { code: "BZU", name: barcoNames.BZU || "Bza. Santa Úrsula" },
              { code: "LMC", name: barcoNames.LMC || "LM Caleb" },
              { code: "CAT", name: barcoNames.CAT || "Cat Estero" },
              { code: "CON", name: barcoNames.CON || "Cono" },
              { code: "LML", name: barcoNames.LML || "LM Levi" },
              { code: "ISC", name: barcoNames.ISC || "Isaí Cat" },
              { code: "IL", name: barcoNames.IL || "Isla Lemu" },
              { code: "CU", name: barcoNames.CU || "Cuadrilla" },
            ];

            const dates = generateDatesForExtraction();

            Object.entries(cellData).forEach(([key, value]: [string, any]) => {
              const parts = key.split("-");
              if (parts.length < 3) return;

              const centroId = parseInt(parts[0]);
              const rowId = parts.slice(1, -1).join("-");
              const dateIndex = parseInt(parts[parts.length - 1]);

              if (!rowId.includes("recursos") && rowId !== "B1") return;

              const barco = barcosList.find((b) => b.code === value);
              if (!barco) return;

              const centroNombre = centroNames[centroId] || DEFAULT_CENTRO_NAMES[centroId] || `Centro ${centroId}`;

              if (dateIndex >= 0 && dateIndex < dates.length) {
                const fecha = dates[dateIndex];

                const existenteIndex = allRecursos.findIndex(
                  (r) => r.recurso === barco.name && r.centro === centroNombre && r.area === area.name,
                );

                if (existenteIndex >= 0) {
                  const existente = allRecursos[existenteIndex];
                  const fechaActual = new Date(fecha);
                  const fechaInicioExistente = new Date(existente.fecha_inicio);
                  const fechaFinExistente = new Date(existente.fecha_fin);

                  if (fechaActual < fechaInicioExistente) {
                    existente.fecha_inicio = fecha.toISOString().split("T")[0];
                  }
                  if (fechaActual > fechaFinExistente) {
                    existente.fecha_fin = fecha.toISOString().split("T")[0];
                  }

                  const inicio = new Date(existente.fecha_inicio);
                  const fin = new Date(existente.fecha_fin);
                  existente.dias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                  allRecursos[existenteIndex] = existente;
                } else {
                  allRecursos.push({
                    recurso: barco.name,
                    centro: centroNombre,
                    fecha_inicio: fecha.toISOString().split("T")[0],
                    fecha_fin: fecha.toISOString().split("T")[0],
                    dias: 1,
                    area: area.name,
                  });
                }
              }
            });
          }
        }

        setRecursos(allRecursos);
        console.log("🎯 Total recursos:", allRecursos.length);
      } catch (error) {
        console.error("❌ Error:", error);
      }
    };

    fetchRecursos();
  }, []);

  useEffect(() => {
    // Cargar Leaflet CSS (una sola vez globalmente, no remover al desmontar porque otros tabs lo usan)
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Cargar Leaflet JS (una sola vez)
    if (!(window as any).L) {
      const existing = document.querySelector('script[src*="leaflet.js"]');
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.onload = () => setMapLoaded(true);
        document.head.appendChild(script);
      }
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Initialize / update map (no re-create on every change)
  const centrosLayerRef = useRef<any>(null);
  const rutasLayerRef = useRef<any>(null);
  const recursosLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return;

    // @ts-ignore
    const L = window.L;
    if (!L) return;

    const container = mapContainerRef.current;

    // Create map once
    if (!mapRef.current) {
      if ((container as any)._leaflet_id) delete (container as any)._leaflet_id;
      container.innerHTML = "";

      const map = L.map(container).setView([centerLat, centerLng], 7);
      mapRef.current = map;

      const baseMaps = {
        Mapa: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        }),
        Satélite: L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "© Esri",
            maxZoom: 19,
          },
        ),
        Híbrido: L.layerGroup([
          L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            attribution: "© Esri",
          }),
          L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            {
              attribution: "© Esri",
            },
          ),
        ]),
        Terreno: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenTopoMap",
          maxZoom: 17,
        }),
      };

      baseMaps["Satélite"].addTo(map);
      L.control.layers(baseMaps).addTo(map);

      centrosLayerRef.current = L.layerGroup().addTo(map);
      rutasLayerRef.current = L.layerGroup().addTo(map);
      recursosLayerRef.current = L.layerGroup().addTo(map);

      // Cerrar panel de materiales al hacer clic en el mapa (fuera de popups)
      map.on('click', () => {
        window.dispatchEvent(new CustomEvent('closeMaterialesPanel'));
      });
    }

    const map = mapRef.current;
    const centrosLayer = centrosLayerRef.current;
    const rutasLayer = rutasLayerRef.current;
    const recursosLayer = recursosLayerRef.current;

    centrosLayer?.clearLayers?.();
    rutasLayer?.clearLayers?.();
    recursosLayer?.clearLayers?.();

    const bounds = L.latLngBounds([]);

    const calcularDiasRestantes = (fechaTermino: string): number => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const termino = new Date(fechaTermino);
      termino.setHours(0, 0, 0, 0);
      const diff = termino.getTime() - hoy.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const getEstadoProgramacion = (prog: LISProgramacion) => {
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

    // Agrupar programaciones por embarcación
    const lisPorEmbarcacion: Record<string, LISProgramacion[]> = {};
    programacionesParaMapa.forEach((prog) => {
      if (!lisPorEmbarcacion[prog.embarcacion]) lisPorEmbarcacion[prog.embarcacion] = [];
      lisPorEmbarcacion[prog.embarcacion].push(prog);
    });

    Object.keys(lisPorEmbarcacion).forEach((emb) => {
      lisPorEmbarcacion[emb].sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
    });

    // Marcadores de centros
    filteredCentros.forEach((centro) => {
      const lisParaCentro = programacionesParaMapa.filter((p) => p.centro === centro.name);
      const lisActivo = lisParaCentro.find((p) => getEstadoProgramacion(p) === "activo");
      const lisPendiente = lisParaCentro.find((p) => getEstadoProgramacion(p) === "pendiente");

      let iconToUse = L.divIcon({
        html: `<div style="display: flex; align-items: center; gap: 4px;">
          <div style="background: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); flex-shrink: 0;"></div>
          <div style="background: rgba(0,0,0,0.75); color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px; white-space: nowrap; font-weight: 500;">${centro.name}</div>
        </div>`,
        className: "",
        iconSize: [150, 20],
        iconAnchor: [7, 10],
        popupAnchor: [60, -10],
      });

      if (lisActivo) {
        iconToUse = L.divIcon({
          html: `<div style="display: flex; align-items: center; gap: 4px;">
            <div style="background: #22c55e; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); flex-shrink: 0;"></div>
            <div style="background: rgba(34,197,94,0.9); color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px; white-space: nowrap; font-weight: 600;">${centro.name}</div>
          </div>`,
          className: "",
          iconSize: [150, 24],
          iconAnchor: [9, 12],
          popupAnchor: [60, -12],
        });
      } else if (lisPendiente) {
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
      marker.addTo(centrosLayer);
      bounds.extend([centro.lat, centro.lng]);

      let popupContent = `
        <div style="padding: 8px; min-width: 220px;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px; color: #1e40af;">📍 ${centro.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;"><strong>Lat:</strong> ${centro.lat.toFixed(6)}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;"><strong>Lng:</strong> ${centro.lng.toFixed(6)}</div>
      `;

      if (lisParaCentro.length > 0) {
        popupContent += `<div style="margin-top: 8px;">`;

        lisParaCentro.forEach((prog) => {
          const estado = getEstadoProgramacion(prog);
          const diasRestantes = calcularDiasRestantes(prog.fechaTermino);

          let bgColor = "#6b7280";
          let statusText = "Finalizado";
          let statusIcon = "✅";

          if (estado === "activo") {
            bgColor = "#22c55e";
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

      // Botón de materiales
      popupContent += `
        <div style="margin-top: 12px; border-top: 1px solid #e5e7eb; padding-top: 10px;">
          <button 
            onclick="window.dispatchEvent(new CustomEvent('openMaterialesPanel', { detail: '${centro.name}' }))"
            style="width: 100%; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; font-weight: bold; font-size: 12px; padding: 10px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;"
          >
            📦 Gestionar Materiales
          </button>
        </div>
      `;

      popupContent += `</div>`;
      marker.bindPopup(popupContent);
    });

    // Rutas
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;
    const bearingDeg = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
      // Bearing desde el norte (0..360)
      const φ1 = toRad(from.lat);
      const φ2 = toRad(to.lat);
      const Δλ = toRad(to.lng - from.lng);
      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      return (toDeg(Math.atan2(y, x)) + 360) % 360;
    };

    Object.entries(lisPorEmbarcacion).forEach(([embarcacion, progs]) => {
      if (progs.length < 2) return;

      const activoIndex = progs.findIndex((p) => getEstadoProgramacion(p) === "activo");

      progs.forEach((prog, index) => {
        if (index === progs.length - 1) return;

        const centroActual = centrosData.find((c) => c.name === prog.centro);
        const centroSiguiente = centrosData.find((c) => c.name === progs[index + 1].centro);
        if (!centroActual || !centroSiguiente) return;

        const estado = getEstadoProgramacion(prog);
        const estadoSiguiente = getEstadoProgramacion(progs[index + 1]);

        let lineColor = "#6b7280";

        if (estado === "finalizado" && estadoSiguiente === "finalizado") {
          lineColor = "#9ca3af";
        } else if (activoIndex >= 0) {
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
            dashArray: "12, 8",
            opacity: 0.9,
          },
        );

        polyline.addTo(rutasLayer);

        // Flecha (dirección) sobre la ruta
        const b = bearingDeg(centroActual, centroSiguiente);
        const t = 0.7; // posición a lo largo de la línea (70% hacia el destino)
        const arrowLat = centroActual.lat + (centroSiguiente.lat - centroActual.lat) * t;
        const arrowLng = centroActual.lng + (centroSiguiente.lng - centroActual.lng) * t;
        const arrowIcon = L.divIcon({
          className: "",
          html: `<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid ${lineColor};transform: rotate(${b}deg);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        L.marker([arrowLat, arrowLng], { icon: arrowIcon, interactive: false }).addTo(rutasLayer);

        polyline.bindPopup(`
          <div style="padding: 10px; min-width: 200px;">
            <div style="font-weight: bold; font-size: 14px; color: ${lineColor}; margin-bottom: 6px;">🚢 ${embarcacion}</div>
            <div style="font-size: 12px; color: #374151; margin-bottom: 4px;"><strong>Desde:</strong> ${prog.centro}</div>
            <div style="font-size: 12px; color: #374151; margin-bottom: 8px;"><strong>Hacia:</strong> ${progs[index + 1].centro}</div>
            <div style="font-size: 11px; color: #6b7280; padding: 6px; background: #f3f4f6; border-radius: 4px;">📅 ${new Date(progs[index + 1].fechaInicio).toLocaleDateString("es-CL")} - ${new Date(progs[index + 1].fechaTermino).toLocaleDateString("es-CL")}</div>
          </div>
        `);
      });
    });
    // Recursos (si aplica)
    if (showRecursos) {
      const recursosPorCentro: { [key: string]: ResourceLocation[] } = {};

      filteredRecursos.forEach((recurso) => {
        const centro = centrosData.find((c) => c.name === recurso.centro);
        if (!centro) return;
        if (!recursosPorCentro[centro.name]) recursosPorCentro[centro.name] = [];
        recursosPorCentro[centro.name].push(recurso);
      });

      const recursoIcon = L.divIcon({
        html: `<div style="background: #f59e0b; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        className: "",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -7],
      });

      Object.entries(recursosPorCentro).forEach(([centroNombre, recursosEnCentro]) => {
        const centro = centrosData.find((c) => c.name === centroNombre);
        if (!centro) return;

        recursosEnCentro.forEach((recurso, index) => {
          const offsetLat = (index % 3) * 0.015 - 0.015;
          const offsetLng = Math.floor(index / 3) * 0.015 - 0.015;

          const marker = L.marker([centro.lat + offsetLat, centro.lng + offsetLng], { icon: recursoIcon });
          marker.addTo(recursosLayer);

          const fechaInicio = new Date(recurso.fecha_inicio).toLocaleDateString("es-CL");
          const fechaFin = new Date(recurso.fecha_fin).toLocaleDateString("es-CL");

          marker.bindPopup(`
            <div style="padding: 10px; min-width: 240px;">
              <div style="font-weight: bold; font-size: 15px; margin-bottom: 8px; color: #f59e0b;">🚢 ${recurso.recurso}</div>
              <div style="background: #fef3c7; padding: 8px; border-radius: 6px; margin-bottom: 10px;">
                <div style="font-size: 13px; color: #92400e; font-weight: 700; text-align: center;">${recurso.area}</div>
              </div>
              <div style="font-size: 12px; color: #374151; margin-bottom: 6px;"><strong>📍 Centro:</strong> ${recurso.centro}</div>
              <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;"><strong>🟢 Inicio:</strong> ${fechaInicio}</div>
              <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;"><strong>🔴 Término:</strong> ${fechaFin}</div>
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 8px 12px; border-radius: 8px; text-align: center;">
                <span style="font-weight: bold; color: white; font-size: 16px;">⏱️ ${recurso.dias} día${recurso.dias !== 1 ? "s" : ""}</span>
              </div>
            </div>
          `);
        });
      });
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [mapLoaded, filteredCentros, filteredRecursos, showRecursos, programacionesParaMapa, filteredRecursos.length]);

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
      centrosLayerRef.current = null;
      rutasLayerRef.current = null;
      recursosLayerRef.current = null;
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
    if (showProgramarLIS) {
      const container = mapContainerRef.current;
      if (mapRef.current) {
        try {
          mapRef.current.off?.();
          mapRef.current.remove();
        } catch (e) {
          console.warn("Error cleaning up map when opening Programar LIS:", e);
        }
        mapRef.current = null;
      }
      centrosLayerRef.current = null;
      rutasLayerRef.current = null;
      recursosLayerRef.current = null;

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
  }, [showProgramarLIS]);

  const areasUnicas = ["todas", ...Array.from(new Set(recursos.map((r) => r.area)))];

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <Card className="bg-background/80 backdrop-blur-sm p-4 border border-border">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-foreground">Centros de Cultivo Camanchaca</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredCentros.length} de {centrosData.length} centros
                  {filteredRecursos.length > 0 && ` · ${filteredRecursos.length} recursos`}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setShowRecursos(!showRecursos)} variant="outline" size="sm" className="gap-2">
                <Ship className="w-4 h-4" />
                {showRecursos ? "Ocultar" : "Mostrar"} Recursos
              </Button>
              <Button onClick={() => setShowInfo(!showInfo)} variant="outline" size="sm" className="gap-2">
                <Info className="w-4 h-4" />
                {showInfo ? "Ocultar" : "Ver"} Info
              </Button>
              <Button
                onClick={() => setShowProgramarLIS(!showProgramarLIS)}
                variant={showProgramarLIS ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <ClipboardList className="w-4 h-4" />
                Programar LIS
              </Button>
              {hasLISChanges && (
                <Button
                  onClick={handleGuardarLIS}
                  variant="default"
                  size="sm"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  disabled={isSavingLIS}
                >
                  <Save className="w-4 h-4" />
                  {isSavingLIS ? "Guardando..." : "Guardar LIS"}
                </Button>
              )}
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
                  <Badge variant="secondary" className="ml-1">
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
                        className="flex items-center gap-2 p-1.5 hover:bg-primary/10 rounded cursor-pointer"
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
                    <Button variant="default" size="sm" onClick={() => setShowCentroFilter(false)} className="flex-1">
                      Cerrar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {recursos.length > 0 && (
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                {areasUnicas.map((area) => (
                  <option key={area} value={area}>
                    {area === "todas" ? "Todas las áreas" : area}
                  </option>
                ))}
              </select>
            )}

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
                <Badge key={c} variant="secondary" className="text-xs">
                  {c}
                  <button onClick={() => toggleCentroFilter(c)} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {showInfo && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm space-y-2">
              <p className="text-foreground">
                📍 <strong>{centrosData.length} centros</strong> desde Biobío hasta Aysén
              </p>
              {recursos.length > 0 && (
                <>
                  <p className="text-foreground">
                    🚢 <strong>{recursos.length} recursos</strong> desplegados
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs">
                    {areasUnicas
                      .filter((a) => a !== "todas")
                      .map((area) => {
                        const count = recursos.filter((r) => r.area === area).length;
                        return count > 0 ? (
                          <div key={area} className="flex items-center gap-2 bg-background/50 rounded px-2 py-1">
                            <Badge variant="secondary" className="text-xs">
                              {count}
                            </Badge>
                            <span className="text-muted-foreground">{area}</span>
                          </div>
                        ) : null;
                      })}
                  </div>
                </>
              )}
              <p className="text-muted-foreground text-xs mt-2">
                💡 Clic en marcadores para ver detalles · Vista satelital Esri
              </p>
            </div>
          )}
        </div>
      </Card>

      {showProgramarLIS ? (
        <Card className="flex-1 bg-background/50 backdrop-blur-sm overflow-hidden">
          <ProgramarLIS ref={programarLISRef} onHasChanges={setHasLISChanges} />
        </Card>
      ) : (
        <>
          <Card className="bg-background/50 backdrop-blur-sm overflow-hidden relative">
            <div ref={mapContainerRef} className="w-full" style={{ height: "600px" }} />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="text-center space-y-3">
                  <MapPin className="w-12 h-12 text-primary mx-auto animate-pulse" />
                  <p className="text-sm text-muted-foreground">Cargando mapa satelital...</p>
                </div>
              </div>
            )}
          </Card>

          {/* Panel de Materiales del Centro */}
          {selectedCentroMateriales && (
            <Card className="bg-background/80 backdrop-blur-sm p-4 border border-primary/50 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground flex-1">Materiales - {selectedCentroMateriales}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCentroMateriales(null)}
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
                  {/* Agregar nuevo material */}
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newMaterial}
                      onChange={(e) => setNewMaterial(e.target.value)}
                      placeholder="Agregar material (ej: Hilo Lobero)"
                      className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
                    />
                    <Button
                      onClick={handleAddMaterial}
                      disabled={savingMaterial || !newMaterial.trim()}
                      size="sm"
                      className="gap-1"
                    >
                      {savingMaterial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Agregar
                    </Button>
                  </div>

                  {/* Lista de materiales */}
                  {materiales.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No hay materiales registrados para este centro
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-[1fr,auto,auto,auto,auto] gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                        <div>Material</div>
                        <div className="text-center w-20">Pedido</div>
                        <div className="text-center w-20">En Traslado</div>
                        <div className="text-center w-20">Recepcionado</div>
                        <div className="w-8"></div>
                      </div>
                      {materiales.map((mat) => (
                        <div key={mat.id} className="grid grid-cols-[1fr,auto,auto,auto,auto] gap-2 items-center py-2 border-b border-border/50 last:border-b-0">
                          <div className="flex items-center gap-1">
                            {editingMaterialId === mat.id ? (
                              <>
                                <Input
                                  value={editingMaterialName}
                                  onChange={(e) => setEditingMaterialName(e.target.value)}
                                  className="h-7 text-sm flex-1"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateMaterialName(mat.id, editingMaterialName);
                                    if (e.key === 'Escape') { setEditingMaterialId(null); setEditingMaterialName(''); }
                                  }}
                                  autoFocus
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateMaterialName(mat.id, editingMaterialName)}
                                  className="h-7 w-7 p-0 text-green-600"
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="text-sm text-foreground flex-1">{mat.material}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setEditingMaterialId(mat.id); setEditingMaterialName(mat.material); }}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                          <div className="flex justify-center w-20">
                            <Checkbox
                              checked={mat.pedido}
                              onCheckedChange={(checked) => handleUpdateMaterial(mat.id, 'pedido', !!checked)}
                            />
                          </div>
                          <div className="flex justify-center w-20">
                            <Checkbox
                              checked={mat.en_traslado}
                              onCheckedChange={(checked) => handleUpdateMaterial(mat.id, 'en_traslado', !!checked)}
                            />
                          </div>
                          <div className="flex justify-center w-20">
                            <Checkbox
                              checked={mat.recepcionado}
                              onCheckedChange={(checked) => handleUpdateMaterial(mat.id, 'recepcionado', !!checked)}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMaterial(mat.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </Card>
          )}

          {/* Gantt Timeline y seguimiento de visitas */}
          <LISGanttTimeline programaciones={activeLisProgramaciones} />
        </>
      )}

      <Card className="bg-background/80 backdrop-blur-sm p-3 border border-border">
        <div className="flex items-center justify-between flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
              <span className="text-muted-foreground">Centro de Cultivo</span>
            </div>
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-amber-500" />
              <span className="text-muted-foreground">Recurso Desplegado</span>
            </div>
            <Badge variant="secondary">{filteredCentros.length} centros</Badge>
            {showRecursos && (
              <Badge variant="outline" className="bg-amber-500/10">
                {filteredRecursos.length} recursos
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            Datos de las 6 áreas operacionales
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FlotaMap;

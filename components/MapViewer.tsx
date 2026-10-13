"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, ScaleControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import shp from "shpjs";
import {
    Map as MapIcon,
    PanelLeftOpen
} from "lucide-react";
import L from "leaflet";
import { buildFeaturePopup, getChoroplethLabel } from "@/lib/layer-presentation";
import LayerPanel from "@/components/LayerPanel";
import PointLayer, { MapResizeObserver } from "@/components/PointLayer";
import MapNavigation from "@/components/MapNavigation";
import MapLegend from "@/components/MapLegend";
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_KEY;
const BASEMAP_URL =
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" +
    (CARTO_KEY ? `?key=${CARTO_KEY}` : "");

const PREDEFINED_COLORS = [
    "#99cc00", "#ff9900", "#339866", "#800080",
    "#ffcc99", "#33cccc", "#008080", "#666699",
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
];

const CHOROPLETH_CONFIG: Record<string, any> = {
    "ageb": {
        column: "e_idsm",
        mapping: {
            "Muy bajo": "#4b2c7f",
            "Bajo": "#3b509d",
            "Medio": "#d15c7a",
            "Alto": "#e17061",
            "Muy alto": "#9bb2c0",
            "Sin información": "#ffffff"
        },
        legendTitle: "Estratos IDS",
        headerTitle: "Índice de Desarrollo Social (IDS) de la Ciudad de México por AGEB, 2020"
    },
    "marginacion": {
        column: "GM_2020",
        mapping: {
            "Muy alto": "#4b2c7f",
            "Alto": "#3b509d",
            "Medio": "#d15c7a",
            "Bajo": "#e17061",
            "Muy bajo": "#9bb2c0",
        },
        legendTitle: "Grado de Marginación",
        headerTitle: "Grado de Marginación por Colonia, 2020"
    }
};

const LAYER_CATEGORIES = [
    {
        id: "sociales",
        name: "Servicios e infraestructura social",
        layers: [
            { id: "biciestacionamientos", name: "Biciestacionamientos", path: "/shapefiles/Social/Biciestacionamientos_Final" },
            { id: "centros_justicia", name: "Centros de Justicia para las Mujeres", path: "/shapefiles/Social/Centros_de_justicia" },
            { id: "motos", name: "Estacionamientos para motocicletas", path: "/shapefiles/Social/Estacionamientos_Moto" },
            { id: "pilares", name: "PILARES", path: "/shapefiles/Social/Pilares" },
            { id: "ut", name: "Unidades Territoriales Siempre Vivas", path: "/shapefiles/Social/UT" },
            { id: "utopias", name: "Utopías", path: "/shapefiles/Social/utopias" }
        ]
    },
    {
        id: "delitos",
        name: "Delitos registrados — 2025",
        subcategories: [
            {
                id: "delitos_personas",
                name: "Delitos contra personas, viviendas y negocios",
                layers: [
                    { id: "homicidios", name: "Homicidios dolosos", path: "/shapefiles/Delitos/Delitos a personas/Homicidios" },
                    { id: "robo_casa", name: "Robo a casa habitación con violencia", path: "/shapefiles/Delitos/Delitos a personas/ROBO A CASA HABITACIÓN" },
                    { id: "robo_cuenta", name: "Robo a cuentahabiente", path: "/shapefiles/Delitos/Delitos a personas/ROBO A CUENTAHABIENTE" },
                    { id: "robo_negocio", name: "Robo a negocio con violencia", path: "/shapefiles/Delitos/Delitos a personas/ROBO A NEGOCIO CON VIOLENCIA" },
                    { id: "violaciones", name: "Violaciones", path: "/shapefiles/Delitos/Delitos a personas/VIOLACIONES" }
                ]
            },
            {
                id: "delitos_vehiculos",
                name: "Robos en transporte y de vehículos",
                layers: [
                    { id: "robo_pasajero_microbus", name: "Robo a pasajero en microbús", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO A PASAJERO A BORDO DE MICROBUS" },
                    { id: "robo_pasajero_taxi", name: "Robo a pasajero en taxi", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO A PASAJERO A BORDO DE TAXI" },
                    { id: "robo_pasajero_metro", name: "Robo a pasajero en metro", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO A PASAJERO A BORDO DEL METRO" },
                    { id: "robo_repartidor", name: "Robo a repartidor", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO A REPARTIDOR" },
                    { id: "robo_transportista", name: "Robo a transportista", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO A TRASPORTISTA" },
                    { id: "robo_moto_violencia", name: "Robo de motocicleta con violencia", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO DE MOTOCICLETA CON VIOLENCIA" },
                    { id: "robo_moto_sin_violencia", name: "Robo de motocicleta sin violencia", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO DE MOTOCICLETA SIN VIOLENCIA" },
                    { id: "robo_vehiculo_particular_violencia", name: "Robo de vehículo particular con violencia", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO DE VEHICULO DE SERVICIO PARTICULAR CON VIOLENCIA" },
                    { id: "robo_vehiculo_publico_sin_violencia", name: "Robo de vehículo público sin violencia", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO DE VEHICULO DE SERVICIO PÚBLICO SIN VIOLENCIA" },
                    { id: "robo_vehiculo", name: "Robo de vehículo — total", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO DE VEHICULO" }
                ]
            }
        ]
    },
    {
        id: "ni_una_menos",
        name: "Incidentes (Ni Una Repartidora Menos)",
        layers: [
            { id: "acoso", name: "Acoso y agresión", path: "/shapefiles/Ni una menos/Acoso y agresióin" },
            { id: "asaltos", name: "Asaltos", path: "/shapefiles/Ni una menos/Asaltos" },
            { id: "fraudes", name: "Fraudes", path: "/shapefiles/Ni una menos/Fraudes" },
            { id: "intento_asalto", name: "Intento de asalto", path: "/shapefiles/Ni una menos/Intento de asalto" }
        ]
    },
    {
        id: "socio_demograficas",
        name: "Indicadores sociodemográficos",
        layers: [
            { id: "marginacion", name: "Marginación por colonia — 2020", path: "/shapefiles/Socio demografico/GradoMarginación" },
            { id: "ageb", name: "IDS por AGEB - 2020", path: "/shapefiles/Socio demografico/ids_ageb_cdmx" }
        ]
    }
];


export default function MapViewer() {
    const [layers, setLayers] = useState<any[]>([]);
    const [baseLayer, setBaseLayer] = useState<any>(null);
    const [pending, setPending] = useState<Record<string, boolean>>({});
    const pendingIds = useRef(new Set<string>());
    const loading = Object.values(pending).some(Boolean);
    const [desktopPanelOpen, setDesktopPanelOpen] = useState(true);
    const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
    const [mobile, setMobile] = useState(false);
    const panelButton = useRef<HTMLButtonElement>(null);
    const pointRenderer = useMemo(() => L.canvas({ tolerance: 5 }), []);
    const [searchQuery, setSearchQuery] = useState("");
    const colorIndex = useRef(0);

    const [activePredefined, setActivePredefined] = useState<Record<string, boolean>>({});
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        sociales: true,
        delitos: false,
        ni_una_menos: false,
        socio_demograficas: false
    });

    const toggleCategory = (id: string) => {
        setOpenCategories(prev => ({ ...prev, [id]: !(prev[id] ?? id.startsWith("delitos_")) }));
    };

    const closePanel = () => {
        setMobilePanelOpen(false);
        if (!mobile) setDesktopPanelOpen(false);
        requestAnimationFrame(() => panelButton.current?.focus());
    };

    const openPanel = () => {
        if (mobile) setMobilePanelOpen(true);
        else setDesktopPanelOpen(true);
        requestAnimationFrame(() => document.getElementById("layer-search")?.focus());
    };

    useEffect(() => {
        const media = window.matchMedia("(max-width: 767px)");
        const update = () => { setMobile(media.matches); setMobilePanelOpen(false); };
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);

    useEffect(() => {
        if (!mobilePanelOpen || !mobile) return;
        const panel = document.getElementById("layer-panel");
        document.getElementById("layer-search")?.focus();
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") { setMobilePanelOpen(false); requestAnimationFrame(() => panelButton.current?.focus()); }
            if (event.key !== "Tab" || !panel) return;
            const controls = Array.from(panel.querySelectorAll<HTMLElement>("button, input, summary")).filter(element => element.getClientRects().length > 0 && !element.hasAttribute("disabled"));
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [mobilePanelOpen, mobile]);

    const getNextColor = () => {
        const c = PREDEFINED_COLORS[colorIndex.current % PREDEFINED_COLORS.length];
        colorIndex.current += 1;
        return c;
    };

    useEffect(() => {
        const loadDefaults = async () => {
            try {
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                if (!baseUrl) return;
                const base = await shp(baseUrl + "/shapefiles/09mun");
                setBaseLayer(base);
            } catch (e) {
                console.error("Failed to load base layer", e);
            }
        };
        loadDefaults();
    }, []);

    const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const query = normalizeSearch(searchQuery.trim());
    const filteredCategories = LAYER_CATEGORIES.map(category => {
        const filteredLayers = category.layers?.filter(l =>
            normalizeSearch(l.name).includes(query)
        );

        const filteredSubcategories = category.subcategories?.map(sub => ({
            ...sub,
            layers: sub.layers.filter(l =>
                normalizeSearch(l.name).includes(query)
            )
        })).filter(sub => sub.layers.length > 0);

        if ((filteredLayers && filteredLayers.length > 0) || (filteredSubcategories && filteredSubcategories.length > 0)) {
            return {
                ...category,
                layers: filteredLayers,
                subcategories: filteredSubcategories
            };
        }
        return null;
    }).filter((category): category is NonNullable<typeof category> => category !== null);

    const togglePredefinedLayer = async (layerConfig: any) => {
        if (pendingIds.current.has(layerConfig.id)) return;
        const isCurrentlyActive = !!activePredefined[layerConfig.id];
        setActivePredefined(prev => ({ ...prev, [layerConfig.id]: !isCurrentlyActive }));

        if (layers.some(l => l.id === layerConfig.id)) {
            setLayers(prev => prev.map(l => l.id === layerConfig.id ? { ...l, active: !isCurrentlyActive, isNew: false } : l));
            return;
        }

        if (!isCurrentlyActive) {
            pendingIds.current.add(layerConfig.id);
            setPending(prev => ({ ...prev, [layerConfig.id]: true }));
            try {
                const baseUrl = window.location.origin;
                const fullPath = baseUrl + encodeURI(layerConfig.path);
                const geojson = await shp(fullPath);
                const loadedLayer = {
                    id: layerConfig.id,
                    name: layerConfig.name,
                    data: geojson,
                    color: layerConfig.color || getNextColor(),
                    active: true,
                    isNew: true
                };
                setLayers(prev => [...prev, loadedLayer]);
            } catch (err) {
                console.error(`Error loading predefined layer ${layerConfig.name}:`, err);
                setActivePredefined(prev => ({ ...prev, [layerConfig.id]: false }));
            } finally {
                pendingIds.current.delete(layerConfig.id);
                setPending(prev => ({ ...prev, [layerConfig.id]: false }));
            }
        }
    };

    // Selecciona la última capa sociodemográfica activa.
    const getActiveChoroplethLayer = () => {
        for (let i = layers.length - 1; i >= 0; i--) {
            const l = layers[i];
            if (l.active && CHOROPLETH_CONFIG[l.id]) return l;
        }
        return null;
    };

    const activeChoropleth = getActiveChoroplethLayer();
    const panelOpen = mobile ? mobilePanelOpen : desktopPanelOpen;
    const activeLayers = layers.filter(layer => layer.active);
    const loadingCount = Object.values(pending).filter(Boolean).length;

    return (
        <div className="flex flex-col h-screen h-[100dvh] w-full font-inter bg-[#f8f9fa] overflow-hidden">
            <header className="h-14 bg-[#9D2148] flex items-center justify-between px-4 md:px-6 z-30 shrink-0 shadow-md">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-1.5 rounded-lg">
                        <MapIcon size={18} className="text-white" />
                    </div>
                    <span className="text-white font-semibold tracking-tight">Visor CDMX</span>
                </div>
            </header>

            <div className="map-workspace flex flex-1 min-h-0 overflow-hidden">
                {!panelOpen && <button ref={panelButton} type="button" className="layer-reopen-tab" aria-label="Abrir panel de capas" aria-controls="layer-panel" aria-expanded={false} onClick={openPanel}><PanelLeftOpen size={18} aria-hidden="true" /><span>Capas</span></button>}
                {mobilePanelOpen && <button type="button" className="layer-panel-backdrop" aria-label="Cerrar panel de capas" tabIndex={-1} onClick={closePanel} />}
                <LayerPanel categories={filteredCategories} query={searchQuery} onQuery={setSearchQuery} active={activePredefined} colors={Object.fromEntries(layers.map(layer => [layer.id, layer.color]))} pending={pending} open={openCategories} onToggleGroup={toggleCategory} onToggleLayer={togglePredefinedLayer} desktopOpen={desktopPanelOpen} mobileOpen={mobilePanelOpen} onClose={closePanel} />

                <main className="flex-1 min-w-0 relative bg-slate-100 overflow-hidden">
                    {loading && (
                        <div className="map-load-notice" role="status"><span className="map-load-spinner" aria-hidden="true" /><span>Cargando {loadingCount === 1 ? "capa" : `${loadingCount} capas`}…</span></div>
                    )}

                    <MapContainer
                        center={[19.4326, -99.1332]}
                        zoom={11}
                        className="h-full w-full"
                        zoomControl={false}
                    >
                        <MapResizeObserver />
                        <MapNavigation />
                        <ScaleControl position="bottomleft" imperial={false} maxWidth={110} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url={BASEMAP_URL}
                        />

                        {baseLayer && (
                            <GeoJSON
                                data={baseLayer}
                                style={{
                                    color: "#333333",
                                    weight: 1.5,
                                    fillOpacity: 0,
                                    dashArray: "5, 5"
                                }}
                            />
                        )}

                        {layers.filter(l => l.active).map(layer => CHOROPLETH_CONFIG[layer.id] ? (
                            <GeoJSON
                                key={`${layer.id}-${layer.isNew}`}
                                data={layer.data}
                                style={(feature) => {
                                    const config = CHOROPLETH_CONFIG[layer.id];
                                    const val = getChoroplethLabel(layer.id, feature?.properties ?? {}, config.column);
                                    return {
                                        fillColor: config.mapping[val] || "#ffffff",
                                        weight: 1,
                                        opacity: 1,
                                        color: 'white',
                                        fillOpacity: 0.8
                                    };
                                }}
                                onEachFeature={(feature, leafletLayer) => {
                                    leafletLayer.bindPopup(
                                        buildFeaturePopup(layer.id, layer.name, feature.properties ?? {}),
                                        { className: "map-feature-popup", minWidth: 240, maxWidth: 360, maxHeight: 420 }
                                    );
                                }}
                            />
                        ) : (
                            <PointLayer key={layer.id} id={layer.id} name={layer.name} color={layer.color} data={layer.data} renderer={pointRenderer} />
                        ))}
                    </MapContainer>

                    <MapLegend layers={activeLayers} configurations={CHOROPLETH_CONFIG} mobile={mobile} />

                    {activeChoropleth && (
                        <div className={`map-active-layer${panelOpen ? "" : " has-reopen-tab"}`}>
                            <p>Capa activa</p>
                            <h3 title={CHOROPLETH_CONFIG[activeChoropleth.id]?.headerTitle}>{activeChoropleth.name}</h3>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}

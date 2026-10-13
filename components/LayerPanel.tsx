import { ChevronDown, PanelLeftClose, Search, X } from "lucide-react";
import { getCrimePeriod, TEMPORAL_EXPLANATION } from "@/lib/layer-presentation";
import { getSymbolKind } from "@/lib/map-symbols";
import LayerSymbol from "@/components/LayerSymbol";

type LayerConfig = { id: string; name: string; path: string };
type Category = { id: string; name: string; layers?: LayerConfig[]; subcategories?: { id: string; name: string; layers: LayerConfig[] }[] };
type Props = {
    categories: Category[];
    query: string;
    onQuery: (value: string) => void;
    active: Record<string, boolean>;
    colors: Record<string, string>;
    pending: Record<string, boolean>;
    open: Record<string, boolean>;
    onToggleGroup: (id: string) => void;
    onToggleLayer: (layer: LayerConfig) => void;
    desktopOpen: boolean;
    mobileOpen: boolean;
    onClose: () => void;
};

export default function LayerPanel({ categories, query, onQuery, active, colors, pending, open, onToggleGroup, onToggleLayer, desktopOpen, mobileOpen, onClose }: Props) {
    const searching = query.trim().length > 0;
    const layerRow = (layer: LayerConfig) => (
        <label key={layer.id} className={`layer-row${active[layer.id] ? " is-active" : ""}`}>
            <input type="checkbox" checked={!!active[layer.id]} disabled={pending[layer.id]} onChange={() => onToggleLayer(layer)} />
            <LayerSymbol kind={getSymbolKind(layer.id)} color={colors[layer.id]} />
            <span className="layer-row-text">
                <span>{layer.name}</span>
                {getCrimePeriod(layer.id) && <span className="layer-period">{getCrimePeriod(layer.id)}</span>}
                {pending[layer.id] && <span className="layer-period" role="status">Cargando…</span>}
            </span>
        </label>
    );

    return (
        <aside id="layer-panel" aria-label="Capas del mapa" className={`layer-panel${desktopOpen ? "" : " is-desktop-closed"}${mobileOpen ? " is-mobile-open" : ""}`}>
            <div className="layer-panel-heading">
                <div className="layer-panel-title"><h2>Capas</h2><button type="button" className="panel-icon-button" onClick={onClose} aria-label="Cerrar panel de capas"><PanelLeftClose size={19} /></button></div>
                <div className="layer-search">
                    <Search size={16} aria-hidden="true" />
                    <input id="layer-search" type="search" aria-label="Buscar capas" placeholder="Buscar capas..." value={query} onChange={event => onQuery(event.target.value)} />
                    {query && <button type="button" onClick={() => onQuery("")} aria-label="Limpiar búsqueda"><X size={16} /></button>}
                </div>
                <p className="layer-panel-hint">Selecciona las capas que quieres consultar.</p>
            </div>
            <div className="layer-panel-list">
                {categories.length === 0 && <p className="layer-empty" role="status">No se encontraron capas.</p>}
                {categories.map(category => {
                    const expanded = searching || !!open[category.id];
                    const count = [...(category.layers ?? []), ...(category.subcategories?.flatMap(sub => sub.layers) ?? [])].filter(layer => active[layer.id]).length;
                    return (
                        <section key={category.id} className="layer-category">
                            <button type="button" className="layer-group-button" aria-expanded={expanded} aria-controls={`group-${category.id}`} onClick={() => onToggleGroup(category.id)}>
                                <ChevronDown size={15} className={expanded ? "" : "is-collapsed"} aria-hidden="true" />
                                <span>{category.name}</span>
                                {count > 0 && <span className="layer-active-count" aria-label={`${count} capas activas`}>{count}</span>}
                            </button>
                            {expanded && <div id={`group-${category.id}`} className="layer-group-content">
                                {category.id === "delitos" && <details className="layer-period-note"><summary>Sobre los periodos</summary><p>{TEMPORAL_EXPLANATION}</p></details>}
                                {category.layers?.map(layerRow)}
                                {category.subcategories?.map(sub => {
                                    const subExpanded = searching || open[sub.id] !== false;
                                    return <div key={sub.id} className="layer-subgroup">
                                        <button type="button" className="layer-subgroup-button" aria-expanded={subExpanded} aria-controls={`group-${sub.id}`} onClick={() => onToggleGroup(sub.id)}><ChevronDown size={13} className={subExpanded ? "" : "is-collapsed"} aria-hidden="true" /><span>{sub.name}</span></button>
                                        {subExpanded && <div id={`group-${sub.id}`}>{sub.layers.map(layerRow)}</div>}
                                    </div>;
                                })}
                            </div>}
                        </section>
                    );
                })}
            </div>
            <div className="layer-panel-footer">
                <div className="layer-symbol-key" aria-label="Simbología de las capas"><span><LayerSymbol kind="circle" />Fiscalía</span><span><LayerSymbol kind="triangle" />NURM</span><span><LayerSymbol kind="square" />Servicios</span></div>
                <details className="layer-sources"><summary>Fuentes de información</summary><p>Fuentes: Fiscalía General de Justicia CDMX, Reportes de incidentes al mapa de Ni Una Repartidora Menos, INEGI, Portal de transparencia CDMX.</p></details>
            </div>
        </aside>
    );
}

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getSymbolKind } from "@/lib/map-symbols";
import LayerSymbol from "@/components/LayerSymbol";

type Layer = { id: string; name: string; color: string };
type Configuration = { legendTitle: string; mapping: Record<string, string> };
type Props = { layers: Layer[]; configurations: Record<string, Configuration>; mobile: boolean };

export default function MapLegend({ layers, configurations, mobile }: Props) {
    const [expanded, setExpanded] = useState(!mobile);
    useEffect(() => setExpanded(!mobile), [mobile]);
    if (layers.length === 0) return null;

    return (
        <aside className="map-legend" aria-label="Leyenda del mapa">
            <button type="button" className="map-legend-toggle" aria-expanded={expanded} aria-controls="map-legend-content" onClick={() => setExpanded(value => !value)}>
                <span>Leyenda</span><span className="map-legend-count">{layers.length} {layers.length === 1 ? "capa" : "capas"}</span><ChevronDown size={15} className={expanded ? "" : "is-collapsed"} aria-hidden="true" />
            </button>
            {expanded && <div id="map-legend-content" className="map-legend-content">
                {layers.map(layer => {
                    const config = configurations[layer.id];
                    return config ? (
                        <section key={layer.id} className="map-legend-section" aria-label={layer.name}>
                            <h3>{layer.name}</h3>
                            <p className="map-legend-subtitle">{config.legendTitle}</p>
                            <ul>{Object.entries(config.mapping).map(([label, color]) => <li key={label}><span className="map-legend-swatch" style={{ backgroundColor: color }} aria-hidden="true" /><span>{label}</span></li>)}</ul>
                        </section>
                    ) : (
                        <div key={layer.id} className="map-legend-point"><LayerSymbol kind={getSymbolKind(layer.id)} color={layer.color} /><span>{layer.name}</span></div>
                    );
                })}
            </div>}
        </aside>
    );
}

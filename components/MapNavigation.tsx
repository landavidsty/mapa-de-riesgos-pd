import { useEffect, useRef, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { Minus, Plus, RotateCcw } from "lucide-react";
import L from "leaflet";

export default function MapNavigation() {
    const map = useMap();
    const container = useRef<HTMLDivElement>(null);
    const readZoom = () => ({ zoom: map.getZoom(), min: map.getMinZoom(), max: map.getMaxZoom() });
    const [view, setView] = useState(readZoom);
    useMapEvents({ zoomend: () => setView(readZoom()), zoomlevelschange: () => setView(readZoom()) });

    useEffect(() => {
        if (!container.current) return;
        L.DomEvent.disableClickPropagation(container.current);
        L.DomEvent.disableScrollPropagation(container.current);
    }, []);

    return (
        <div ref={container} className="map-navigation" role="group" aria-label="Navegación del mapa" onKeyDown={event => event.stopPropagation()}>
            <button type="button" aria-label="Acercar mapa" title="Acercar" disabled={view.zoom >= view.max} onClick={() => map.zoomIn()}><Plus size={18} aria-hidden="true" /></button>
            <button type="button" aria-label="Alejar mapa" title="Alejar" disabled={view.zoom <= view.min} onClick={() => map.zoomOut()}><Minus size={18} aria-hidden="true" /></button>
            <button type="button" aria-label="Volver a la vista de CDMX" title="Vista de CDMX" onClick={() => map.setView([19.4326, -99.1332], 11)}><RotateCcw size={17} aria-hidden="true" /></button>
        </div>
    );
}

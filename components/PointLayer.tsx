import { useEffect, useMemo, useRef } from "react";
import { GeoJSON, useMap, useMapEvents } from "react-leaflet";
import type { GeoJsonObject } from "geojson";
import L from "leaflet";
import { buildFeaturePopup } from "@/lib/layer-presentation";
import { getSymbolKind, getSymbolPath, getSymbolSize } from "@/lib/map-symbols";

type Props = { id: string; name: string; color: string; data: GeoJsonObject; renderer: L.Canvas };

export default function PointLayer({ id, name, color, data, renderer }: Props) {
    const map = useMap();
    const group = useRef<L.GeoJSON>(null);
    const selected = useRef<L.Layer | null>(null);
    const triangleCenters = useRef(new WeakMap<L.Layer, L.LatLng>());
    const kind = getSymbolKind(id);
    const icons = useMemo(() => new Map<string, L.DivIcon>(), [color, kind]);

    const trianglePoints = (center: L.LatLng, size: number) => {
        const point = map.latLngToLayerPoint(center);
        return [[0, -7], [7, 6], [-7, 6]].map(([x, y]) =>
            map.layerPointToLatLng(L.point(point.x + x * size / 16, point.y + y * size / 16))
        );
    };

    const icon = (size: number, active: boolean) => {
        const key = `${size}-${active}`;
        let result = icons.get(key);
        if (!result) {
            const visibleSize = size + (active ? 3 : 0);
            const viewBox = kind === "star" ? "1 1 14 14" : "0 0 16 16";
            result = L.divIcon({
                className: `map-point-marker${active ? " is-selected" : ""}`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
                popupAnchor: [0, -visibleSize / 2],
                html: `<svg aria-hidden="true" width="${visibleSize}" height="${visibleSize}" viewBox="${viewBox}" overflow="visible"><path d="${getSymbolPath(kind)}" fill="${color}" fill-opacity="0.85" stroke="#fff" stroke-width="${active ? 1.5 : size >= 8 ? 0.75 : 0}" /></svg>`
            });
            icons.set(key, result);
        }
        return result;
    };

    const updatePoint = (point: L.Layer) => {
        const size = getSymbolSize(map.getZoom(), kind);
        const active = selected.current === point;
        if (point instanceof L.Polygon) {
            const center = triangleCenters.current.get(point);
            if (center) point.setLatLngs(trianglePoints(center, size + (active ? 3 : 0)));
            point.setStyle({ weight: active ? 1.5 : size >= 8 ? 0.75 : 0 });
            if (active) point.bringToFront();
        } else if (point instanceof L.CircleMarker) {
            point.setRadius(size / 2 + (active ? 1.5 : 0));
            point.setStyle({ weight: active ? 1.5 : size >= 8 ? 0.75 : 0 });
            if (active) point.bringToFront();
        } else if (point instanceof L.Marker) {
            point.setIcon(icon(size, active));
            point.setZIndexOffset(active ? 1000 : 0);
        }
    };

    useMapEvents({ zoomend: () => group.current?.eachLayer(updatePoint) });

    return (
        <GeoJSON
            ref={group}
            data={data}
            pointToLayer={(_feature, latlng) => {
                const size = getSymbolSize(map.getZoom(), kind);
                if (kind === "triangle") {
                    const point = L.polygon(trianglePoints(latlng, size), { renderer, fillColor: color, color: "#fff", weight: size >= 8 ? 0.75 : 0, opacity: 1, fillOpacity: 0.85 });
                    triangleCenters.current.set(point, latlng);
                    return point;
                }
                return kind === "circle"
                    ? L.circleMarker(latlng, { renderer, radius: size / 2, fillColor: color, color: "#fff", weight: size >= 8 ? 0.75 : 0, opacity: 1, fillOpacity: 0.85 })
                    : L.marker(latlng, { icon: icon(size, false), title: name, keyboard: true });
            }}
            onEachFeature={(feature, point) => {
                point.bindPopup(buildFeaturePopup(id, name, feature.properties ?? {}), { className: "map-feature-popup", minWidth: 240, maxWidth: 360, maxHeight: 420 });
                point.on("popupopen", () => { selected.current = point; updatePoint(point); });
                point.on("popupclose", () => { if (selected.current === point) selected.current = null; updatePoint(point); });
            }}
        />
    );
}

export function MapResizeObserver() {
    const map = useMap();
    useEffect(() => {
        let frame = 0;
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
        });
        observer.observe(map.getContainer());
        return () => { observer.disconnect(); cancelAnimationFrame(frame); };
    }, [map]);
    return null;
}

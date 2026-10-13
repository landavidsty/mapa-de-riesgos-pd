import { getSymbolPath, type SymbolKind } from "@/lib/map-symbols";

export default function LayerSymbol({ kind, color = "currentColor" }: { kind: SymbolKind; color?: string }) {
    return (
        <svg className="layer-symbol" width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
            <path d={getSymbolPath(kind)} fill={color} fillOpacity={kind === "area" ? 0.2 : 1} stroke={kind === "area" ? color : "none"} strokeWidth="1" />
        </svg>
    );
}

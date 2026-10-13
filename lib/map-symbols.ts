export type SymbolKind = "circle" | "triangle" | "square" | "area";

const SOCIAL_IDS = new Set(["biciestacionamientos", "centros_justicia", "motos", "pilares", "ut", "utopias"]);
const COMMUNITY_IDS = new Set(["acoso", "asaltos", "fraudes", "intento_asalto"]);

export function getSymbolKind(id: string): SymbolKind {
    if (id === "ageb" || id === "marginacion") return "area";
    if (SOCIAL_IDS.has(id)) return "square";
    if (COMMUNITY_IDS.has(id)) return "triangle";
    return "circle";
}

export function getSymbolSize(zoom: number, kind: SymbolKind): number {
    if (kind === "circle" || kind === "triangle" || kind === "square") {
        const size = zoom <= 15 ? 8 : zoom <= 17 ? 7 : 6;
        return size + (kind === "triangle" ? 2 : 0);
    }
    if (zoom <= 11) return 4;
    if (zoom <= 13) return 6;
    if (zoom <= 15) return 8;
    return 10;
}

export function getSymbolPath(kind: SymbolKind): string {
    if (kind === "triangle") return "M8 1 L15 14 L1 14 Z";
    if (kind === "square") return "M2 2 H14 V14 H2 Z";
    if (kind === "area") return "M1 3 L6 1 L10 4 L15 2 V13 L10 15 L6 12 L1 14 Z";
    return "M8 1 A7 7 0 1 0 8 15 A7 7 0 1 0 8 1 Z";
}

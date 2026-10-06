import { CDMX_ALCALDIAS } from "./cdmx-alcaldias";

type Properties = Record<string, unknown>;
export const TEMPORAL_EXPLANATION = "Las etiquetas indican los meses con registros según la fecha de inicio de la carpeta. La fuente consultada corresponde al año 2025.";
const CRIME_IDS = new Set(["homicidios", "robo_casa", "robo_cuenta", "robo_negocio", "violaciones", "robo_pasajero_microbus", "robo_pasajero_taxi", "robo_pasajero_metro", "robo_repartidor", "robo_transportista", "robo_moto_violencia", "robo_moto_sin_violencia", "robo_vehiculo_particular_violencia", "robo_vehiculo_publico_sin_violencia", "robo_vehiculo"]);
const SOCIAL_IDS = new Set(["biciestacionamientos", "centros_justicia", "motos", "pilares", "ut", "utopias"]);
const COMMUNITY_IDS = new Set(["acoso", "asaltos", "fraudes", "intento_asalto"]);
const PERIOD_NOTES: Record<string, string> = {
    robo_transportista: "* La base original contiene registros iniciados en mayo, junio, julio, agosto, septiembre, noviembre y diciembre de 2025. No contiene registros de esta categoría en enero–abril ni en octubre.",
    robo_vehiculo_publico_sin_violencia: "* La base original contiene registros iniciados de enero a noviembre de 2025. No contiene registros de esta categoría en diciembre."
};
export function getCrimePeriod(id: string): string | undefined {
    if (!CRIME_IDS.has(id)) return undefined;
    if (id === "robo_transportista") return "May–sep y nov–dic 2025*";
    if (id === "robo_vehiculo_publico_sin_violencia") return "Ene–nov 2025*";
    return "2025";
}

export function isMissing(value: unknown): boolean {
    return value === null || value === undefined || (typeof value === "number" && !Number.isFinite(value)) || (typeof value === "string" && value.trim() === "");
}
export function escapeHtml(value: unknown): string {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
}
const fold = (value: unknown) => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
const keyFold = (value: string) => fold(value).replace(/[^a-z0-9]/g, "");
export function normalizeLevel(value: unknown): string {
    if (isMissing(value)) return "Sin información";
    const key = fold(value);
    const levels: Record<string, string> = { "muy bajo": "Muy bajo", bajo: "Bajo", medio: "Medio", alto: "Alto", "muy alto": "Muy alto" };
    if (levels[key]) return levels[key];
    if (/^sin (informacion|informacin|informaci.n)$/.test(key)) return "Sin información";
    return String(value).trim();
}
export function getChoroplethLabel(id: string, props: Properties, column: string): string {
    if (id === "ageb" && isMissing(props.ids)) return "Sin información";
    return normalizeLevel(props[column]);
}
function code(value: unknown): string { return isMissing(value) ? "Sin información" : String(value); }
export function alcaldia(value: unknown): string {
    if (isMissing(value)) return "Sin información";
    const original = String(value).trim();
    const municipalCode = /^09\d{3}$/.test(original) ? original.slice(2) : original.padStart(3, "0");
    return CDMX_ALCALDIAS[municipalCode] ?? original;
}
function number(value: unknown, digits?: number): string {
    if (isMissing(value)) return "Sin información";
    const parsed = typeof value === "number" ? value : Number(String(value).trim());
    if (!Number.isFinite(parsed)) return String(value);
    return new Intl.NumberFormat("es-MX", { minimumFractionDigits: digits ?? 0, maximumFractionDigits: digits ?? 6 }).format(parsed);
}
export function formatDate(value: unknown): string {
    if (isMissing(value)) return "Sin información";
    let date: Date | undefined;
    if (value instanceof Date) date = value;
    else {
        const text = String(value).trim();
        const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(text);
        const local = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
        const parts = iso ? [+iso[1], +iso[2], +iso[3]] : local ? [+local[3], +local[2], +local[1]] : undefined;
        if (parts) {
            const [year, month, day] = parts;
            const candidate = new Date(Date.UTC(year, month - 1, day));
            if (candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day) date = candidate;
        }
    }
    return date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date) : String(value);
}
function originalValue(key: string, value: unknown): string {
    if (isMissing(value)) return "Sin información";
    // Never group, coerce or truncate geographic, administrative or record keys.
    if (/^(cve|clave|id|objectid|fid|ct_|cp$|mun$|loc$|sun_)/i.test(key)) return code(value);
    if (/fecha/i.test(key)) return formatDate(value);
    if (value instanceof Date) return formatDate(value);
    if (typeof value === "number") return number(value);
    return typeof value === "object" ? JSON.stringify(value) : String(value);
}
function row(label: string, value: string, highlight = false): string {
    return `<div class="feature-row${highlight ? " feature-row-highlight" : ""}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}
function paragraph(text: string): string { return `<p class="feature-note">${escapeHtml(text)}</p>`; }
function details(title: string, content: string): string {
    return `<details class="feature-details"><summary>${escapeHtml(title)}</summary>${content}</details>`;
}
function sourceLink(label: string, url: string): string {
    return `<p class="feature-note"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></p>`;
}
function percentage(value: unknown): string {
    if (isMissing(value)) return "Sin información";
    const parsed = typeof value === "number" ? value : Number(String(value).trim());
    if (!Number.isFinite(parsed)) return "Sin información";
    // Keep small nonzero percentages visible instead of rounding them to zero.
    return `${new Intl.NumberFormat("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: parsed !== 0 && Math.abs(parsed) < 0.01 ? 6 : 2
    }).format(parsed)} %`;
}

// Only mappings whose meaning AND percentage unit are corroborated in official
// CONAPO 2020 documentation and the SEMARNAT field dictionary are used here.
// Indicators without a documented meaning are not included in the popup.
const VERIFIED_MARGIN_PERCENTAGES: Record<string, string> = {
    SBASC: "Sin educación básica (15 años o más)",
    OVSDE: "Sin drenaje ni excusado",
    OVSEE: "Sin energía eléctrica",
    OVSAE: "Sin agua entubada",
    OVPT: "Piso de tierra"
};

// Explicit labels prevent undocumented database fields from leaking into details.
const DOCUMENTED_DETAILS: Array<[string[], string]> = [
    [["ID_CI"], "Identificador de la carpeta"],
    [["ID", "CLAVE_ID"], "Identificador del registro"],
    [["cvegeo"], "Clave geográfica del AGEB"],
    [["cve_ageb"], "Clave del AGEB"],
    [["CVE_COL"], "Clave de la colonia"],
    [["FECHA_INI", "FECHA DE INICIO"], "Fecha de inicio de la carpeta"],
    [["FECHA_HEC", "FECHA DE LOS HECHOS"], "Fecha de los hechos"],
    [["HORA_INI"], "Hora de inicio de la carpeta"],
    [["HORA_HEC"], "Hora de los hechos"],
    [["CALLE_1"], "Calle principal"],
    [["CALLE_2"], "Calle secundaria"]
];

/** Presentation only: no source feature, property, geometry or layer is mutated. */
export function buildFeaturePopup(id: string, name: string, props: Properties): string {
    const used = new Set<string>();
    const keys = Object.keys(props);
    const find = (aliases: string[]) => {
        for (const alias of aliases) {
            const key = keys.find(key => keyFold(key) === keyFold(alias));
            if (key !== undefined) return key;
        }
        return undefined;
    };
    const pick = (aliases: string[], label: string, formatter?: (value: unknown) => string, highlight = false): string => {
        const key = find(aliases);
        if (key === undefined) return "";
        used.add(key);
        return row(label, formatter ? formatter(props[key]) : originalValue(key, props[key]), highlight);
    };
    let title = name;
    let main = "";
    let extra = "";
    let notes = "";
    let kicker = "";
    let subtitle = "";
    const dataCard = id === "ageb" || id === "marginacion";
    const headerValue = (aliases: string[], formatter: (value: unknown) => string = code): string => {
        const key = find(aliases);
        if (key === undefined || isMissing(props[key])) return "";
        used.add(key);
        return formatter(props[key]);
    };

    if (CRIME_IDS.has(id)) {
        main += pick(["DELITO"], "Delito", id === "robo_cuenta" ? value => isMissing(value) ? "Sin información" : "Robo a cuentahabiente al salir del cajero con violencia" : undefined, true);
        main += pick(["MODALIDAD"], "Modalidad");
        main += pick(["FECHA_INI", "FECHA DE INICIO"], "Fecha de inicio de la carpeta", formatDate);
        main += pick(["FECHA_HEC", "FECHA DE LOS HECHOS"], "Fecha de los hechos", formatDate);
        main += pick(["COLONIA"], "Colonia");
        main += pick(["ALCALDIA"], "Alcaldía");
        main += row("Periodo de la capa", getCrimePeriod(id)!);
        notes += paragraph("Categorías seleccionadas de carpetas de investigación iniciadas en 2025. Ubicaciones aproximadas según la base original.");
        if (id === "robo_vehiculo") notes += paragraph("Esta capa incluye las subcategorías de robo de vehículos. Sus registros pueden coincidir con los de las capas específicas.");
        if (PERIOD_NOTES[id]) notes += paragraph(PERIOD_NOTES[id]);
        notes += paragraph(TEMPORAL_EXPLANATION);
        notes += paragraph("Fuente: Fiscalía General de Justicia de la Ciudad de México. Los puntos representan registros, no una probabilidad calculada de sufrir un delito.");
    } else if (SOCIAL_IDS.has(id)) {
        main += pick(["NOMBRE", "NOMBRE_PIL", "ESTACIONAM", "PLAZA_COME", "IZTAPALAPA"], "Nombre del lugar", undefined, true);
        main += pick(["DIRECCION", "DOMICILIO"], "Dirección");
        main += pick(["ALCALDIA"], "Alcaldía");
        main += pick(["TIPO"], "Tipo de lugar");
    } else if (COMMUNITY_IDS.has(id)) {
        main += pick(["Incidencia", "Incidente"], "Incidente reportado", undefined, true);
        main += pick(["Direccion"], "Dirección reportada");
        main += pick(["Calle"], "Calle");
        main += pick(["Colonia"], "Colonia");
        main += pick(["Alcaldia"], "Alcaldía");
        main += pick(["Fecha"], "Fecha del reporte", formatDate);
        notes += paragraph("Reportes de la comunidad recopilados por Ni Una Repartidora Menos. Esta capa es distinta de las carpetas de investigación de Fiscalía.");
        notes += paragraph("Los puntos representan reportes, no una probabilidad calculada de sufrir un delito.");
    } else if (id === "ageb") {
        title = "Desarrollo social";
        kicker = "IDS por AGEB · 2020";
        const agebCode = headerValue(["cve_ageb"]);
        const municipality = headerValue(["cve_mun"], alcaldia);
        subtitle = [agebCode ? `AGEB ${agebCode}` : "", municipality].filter(Boolean).join(" · ");
        main += row("Nivel de desarrollo social", getChoroplethLabel(id, props, "e_idsm"), true);
        main += pick(["ids"], "Valor del IDS", value => number(value, 3));
        const levelKey = find(["e_idsm"]);
        if (levelKey !== undefined) used.add(levelKey);
        main += pick(["pobtotal"], "Población total", value => isMissing(value) ? "Sin información" : `${number(value)} personas`);
        notes += paragraph("El IDS resume condiciones de desarrollo social. Un AGEB es un área geoestadística y no equivale necesariamente a una colonia.");
        notes += paragraph("Fuente: Evalúa CDMX, con datos del Censo 2020 de INEGI.");
        notes += sourceLink("Fuente y metodología", "https://datos.cdmx.gob.mx/dataset/indice-de-desarrollo-social-de-la-ciudad-de-mexico-2020");
    } else if (id === "marginacion") {
        kicker = "Marginación por colonia · 2020";
        title = headerValue(["COLONIA"]) || "Colonia sin nombre";
        subtitle = headerValue(["NOM_MUN"]) || headerValue(["CVE_MUN", "MUN"], alcaldia);
        main += pick(["GM_2020"], "Grado de marginación", normalizeLevel, true);
        let indicators = "";
        for (const [field, label] of Object.entries(VERIFIED_MARGIN_PERCENTAGES)) {
            indicators += pick([field], label, percentage);
        }
        if (indicators) extra += details("Indicadores disponibles", `<dl class="feature-indicators">${indicators}</dl>` + paragraph("Educación: porcentaje de población de 15 años o más. Vivienda y servicios: porcentaje de ocupantes de viviendas particulares."));
        notes += paragraph("El grado de marginación clasifica las condiciones de desventaja social de la colonia.");
        notes += sourceLink("Metodología de marginación 2020 · CONAPO", "https://www.gob.mx/conapo/documentos/indices-de-marginacion-2020-284372");
    }
    let technical = "";
    for (const [aliases, label] of DOCUMENTED_DETAILS) {
        const key = find(aliases);
        if (key !== undefined && !used.has(key)) technical += pick(aliases, label);
    }
    if (id !== "utopias") {
        technical += pick(["LATITUD", "Latitude", "COORD_Y"], "Latitud", value => number(value, 6));
        technical += pick(["LONGITUD", "Longitude", "COORD_X"], "Longitud", value => number(value, 6));
    }
    if (technical) extra += details(dataCard ? "Identificación geográfica" : "Detalles del registro", `<dl>${technical}</dl>`);
    const heading = `${kicker ? `<p class="feature-kicker">${escapeHtml(kicker)}</p>` : ""}<h3>${escapeHtml(title)}</h3>${subtitle ? `<p class="feature-subtitle">${escapeHtml(subtitle)}</p>` : ""}`;
    return `<article class="feature-card${dataCard ? " feature-card-data" : ""}" aria-label="${escapeHtml(title)}"><header>${heading}</header><dl>${main}</dl>${extra}${notes ? `<footer class="feature-footer">${notes}</footer>` : ""}</article>`;
}

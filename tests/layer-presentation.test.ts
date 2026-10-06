import { test } from "node:test";
import { strict as assert } from "node:assert";
import { buildFeaturePopup, getChoroplethLabel, getCrimePeriod, isMissing, normalizeLevel, alcaldia, formatDate } from "../lib/layer-presentation";

test("Los ausentes no incluyen ceros ni falso", () => {
    for (const value of [null, undefined, "", "  ", NaN]) assert.equal(isMissing(value), true);
    for (const value of [0, "0", false]) assert.equal(isMissing(value), false);
});
test("El IDS nulo no se clasifica como Muy bajo; cero sigue siendo válido", () => {
    assert.equal(getChoroplethLabel("ageb", { ids: null, e_idsm: "Muy bajo" }, "e_idsm"), "Sin información");
    assert.equal(getChoroplethLabel("ageb", { ids: 0, e_idsm: "Muy bajo" }, "e_idsm"), "Muy bajo");
    for (const value of ["sin información", "Sin informacin", "SIN INFORMACION", " Sin Información "]) assert.equal(normalizeLevel(value), "Sin información");
    const html = buildFeaturePopup("ageb", "IDS", { ids: null, e_idsm: "Muy bajo" });
    assert.match(html, /Sin información/);
    assert.doesNotMatch(html, /Muy bajo|0\.000/);
});
test("Las fichas escapan nombres y valores HTML y no exponen campos desconocidos", () => {
    const html = buildFeaturePopup("acoso", "<img src=x onerror=alert(1)>", { Incidencia: "<script>alert(1)</script>", Calle: "a&b", "<iframe>": "texto no documentado" });
    assert.doesNotMatch(html, /<script|<img|<iframe|texto no documentado/);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /a&amp;b/);
});
test("El IDS conserva claves y precisión y oculta todos los indicadores sin verificar", () => {
    const props = { e_idsm: "Alto", ids: 0.876155, pobtotal: 4515, cve_mun: "010", cvegeo: "090100001001A", cve_ageb: "001A", cve_ent: "09", pobres_tot: 2499, ids_ccevj: 0, ids_csj: 0.8, ids_caej: 1, ids_ctelj: 0.9, ids_cbdj: 0.9, ids_rei: 0.9, ids_cassi: 0.7, ids_casi: 0.8 };
    const before = JSON.stringify(props);
    const html = buildFeaturePopup("ageb", "IDS por AGEB - 2020", props);
    assert.equal(JSON.stringify(props), before);
    for (const text of ["0.876", "4,515 personas", "090100001001A", "Álvaro Obregón", "AGEB 001A", "Identificación geográfica"]) assert.ok(html.includes(text));
    for (const key of ["pobres_tot", ...Object.keys(props).filter(k => k.startsWith("ids_"))]) assert.ok(!html.includes(key));
    assert.doesNotMatch(html, /Ver componentes|no han podido|pobreza multidimensional/);
    assert.equal(alcaldia("09002"), "Azcapotzalco");
});
test("Los delitos conservan periodos, fechas distintas y un identificador con etiqueta clara", () => {
    assert.equal(getCrimePeriod("robo_transportista"), "May–sep y nov–dic 2025*");
    assert.equal(getCrimePeriod("robo_vehiculo_publico_sin_violencia"), "Ene–nov 2025*");
    assert.equal(getCrimePeriod("homicidios"), "2025");
    assert.equal(getCrimePeriod("pilares"), undefined);
    const html = buildFeaturePopup("robo_cuenta", "Robo a cuentahabiente", { DELITO: "ROBO", FECHA_INI: "2025-01-03", FECHA_HEC: "2024-12-30", MODALIDAD: null, ID_CI: 123 });
    for (const text of ["al salir del cajero con violencia", "Fecha de inicio de la carpeta", "Fecha de los hechos", "Sin información", "Identificador de la carpeta", "123"]) assert.ok(html.includes(text));
    assert.equal(formatDate("2025-02-31"), "2025-02-31");
});
test("Marginación muestra sólo indicadores documentados, sin redondear valores pequeños a cero", () => {
    const props = { COLONIA: "Aguilera", NOM_MUN: "Azcapotzalco", GM_2020: "Bajo", CVE_COL: "09002_0001", OVSEE: 0, OVSDE: 0.00126, SBASC: 16.378424, IM_2020: 151, IMN_2020: 0.966, POBTOT: 2180, P6A14NAE: 2.93, PSDSS: 24, OVHAC: 25, OVSREF: 3, OVSINT: 20, OVSCEL: 6, Shape_Area: 1, OBJECTID: 16974 };
    const before = JSON.stringify(props);
    const html = buildFeaturePopup("marginacion", "Marginación", props);
    assert.equal(JSON.stringify(props), before);
    for (const text of ["Aguilera", "Azcapotzalco", "Grado de marginación", "Bajo", "energía eléctrica", "0.00 %", "0.00126 %", "16.38 %", "Indicadores disponibles", "09002_0001"]) assert.ok(html.includes(text));
    for (const key of ["IM_2020", "IMN_2020", "POBTOT", "P6A14NAE", "PSDSS", "OVHAC", "OVSREF", "OVSINT", "OVSCEL", "Shape_Area", "OBJECTID"]) assert.ok(!html.includes(key));
});
test("PILARES no muestra los campos retirados, tampoco en desplegables", () => {
    const props = { NOMBRE_PIL: "Richard Wagner", ALCALDIA: "Gustavo A. Madero", CLAVE_ID: "001_NT_GAM", ESTATUS: "dato retirado A", STATUS: "dato retirado B", REGION: "dato retirado C", LATITUD: 19.46552 };
    const before = JSON.stringify(props);
    const html = buildFeaturePopup("pilares", "PILARES", props);
    assert.equal(JSON.stringify(props), before);
    for (const text of ["Richard Wagner", "Gustavo A. Madero", "001_NT_GAM"]) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /dato retirado|ESTATUS|STATUS|REGION|Estatus|Región/);
});
test("Utopías no muestra coordenadas ni metadatos retirados, sin modificar sus datos", () => {
    const props = { IZTAPALAPA: "Ixtapalcalli", DIRECCION: "Cuauhtémoc 55", ALCALDIA: "Iztapalapa", TIPO: "UTOPÍA", ID: "UT01", Latitude: 19.3586974, Longitude: -99.0907905, LATITUD: 19.3, LONGITUD: -99.1, COORD_X: -99.2, COORD_Y: 19.2, ESTADO: "dato retirado D" };
    const before = JSON.stringify(props);
    const html = buildFeaturePopup("utopias", "Utopías", props);
    assert.equal(JSON.stringify(props), before);
    for (const text of ["Ixtapalcalli", "Cuauhtémoc 55", "Iztapalapa", "UT01"]) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /Latitude|Longitude|Latitud|Longitud|LATITUD|LONGITUD|COORD_|19\.358|99\.090|dato retirado D/);
});
test("Los metadatos no documentados no aparecen en ninguna capa", () => {
    for (const id of ["utopias", "pilares", "motos", "centros_justicia", "ut", "biciestacionamientos", "acoso", "ageb", "marginacion", "homicidios"]) {
        const html = buildFeaturePopup(id, "Prueba", { ESTADO: "dato retirado E", campo_desconocido: "dato retirado F" });
        assert.doesNotMatch(html, /dato retirado E|dato retirado F|campo_desconocido|ESTADO/);
    }
});

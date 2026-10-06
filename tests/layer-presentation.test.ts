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
});
test("Las fichas escapan campos, nombres y valores HTML", () => {
    const html = buildFeaturePopup("acoso", "<img src=x onerror=alert(1)>", { Incidencia: "<script>alert(1)</script>", Calle: "a&b", "<iframe>": 0 });
    assert.doesNotMatch(html, /<script|<img|<iframe/);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /a&amp;b/);
    assert.match(html, /&lt;iframe&gt;/);
});
test("Las claves conservan ceros, los índices tres decimales y los campos sin verificar su código", () => {
    const props = { e_idsm: "Alto", ids: 0.876155, pobtotal: 4515, cve_mun: "010", cvegeo: "090100001001A", cve_ent: "09", pobres_tot: 2499, ids_ccevj: 0 };
    const before = JSON.stringify(props);
    const html = buildFeaturePopup("ageb", "IDS por AGEB - 2020", props);
    assert.equal(JSON.stringify(props), before);
    for (const text of ["0.876", "4,515 personas", "090100001001A", "Álvaro Obregón", "pobres_tot", "ids_ccevj", "Ver componentes del IDS", "Detalles técnicos"]) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /pobreza multidimensional/);
    assert.equal(alcaldia("09002"), "Azcapotzalco");
});
test("Los delitos tienen periodos y fechas distintas; las notas no filtran registros", () => {
    assert.equal(getCrimePeriod("robo_transportista"), "May–sep y nov–dic 2025*");
    assert.equal(getCrimePeriod("robo_vehiculo_publico_sin_violencia"), "Ene–nov 2025*");
    assert.equal(getCrimePeriod("homicidios"), "2025");
    assert.equal(getCrimePeriod("pilares"), undefined);
    const html = buildFeaturePopup("robo_cuenta", "Robo a cuentahabiente", { DELITO: "ROBO", FECHA_INI: "2025-01-03", FECHA_HEC: "2024-12-30", MODALIDAD: null, ID_CI: 123 });
    for (const text of ["al salir del cajero con violencia", "Fecha de inicio de la carpeta", "Fecha de los hechos", "Sin información", "ID_CI"]) assert.ok(html.includes(text));
    assert.equal(formatDate("2025-02-31"), "2025-02-31");
    assert.match(formatDate("2025-01-01"), /2025/);
});
test("Sólo aparecen campos existentes y los indicadores porcentuales conservan cero", () => {
    const social = buildFeaturePopup("pilares", "PILARES", { NOMBRE_PIL: "Prueba", LATITUD: 0 });
    assert.match(social, /Nombre del lugar/);
    assert.doesNotMatch(social, /<dt>Dirección<\/dt>/);
    const margin = buildFeaturePopup("marginacion", "Marginación", { COLONIA: "Prueba", NOM_MUN: "Coyoacán", GM_2020: "Bajo", OVSEE: 0, Shape_Area: 1 });
    assert.match(margin, /energía eléctrica/);
    assert.match(margin, /0\.00 %/);
    assert.match(margin, /Ver indicadores adicionales/);
    assert.match(margin, /Shape_Area/);
});

"""
Convierte el My Maps "Mapa de Riesgos CDMX" (KML) a las 4 capas de shapefile
de incidentes autorreportados que usa puntos-cdmx (carpeta "Ni una menos").

Esquema de columnas UNIFICADO para las 4 capas (mismo formato en todas,
sin las inconsistencias que había antes):
    Calle       - texto: dirección/ubicación reportada (limpia el "1.1", "1.85." etc. del inicio)
    Incidencia  - texto: categoría del incidente (Asaltos, Fraudes, etc.)
    Alcaldia    - texto: calculada automáticamente por ubicación geográfica,
                  usando los límites oficiales que ya están en el repo (09mun.shp)
    Longitud    - número: coordenada X en grados decimales
    Latitud     - número: coordenada Y en grados decimales
    Direccion   - texto: "Calle, Alcaldia"

Requiere: pyshp (shapefile), shapely
    pip install pyshp shapely --break-system-packages

Uso:
    python kml_to_shapefiles.py <ruta_al_repo>
    (el script descarga el KML de la URL pública automáticamente)
"""
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.request import urlopen

import shapefile
from shapely.geometry import Point, shape as shapely_shape
from pyproj import CRS, Transformer

MID = "1JYUI9M8nggvw26-7DnpfoH0-_gl61Fmq"
KML_URL = f"https://www.google.com/maps/d/kml?mid={MID}&forcekml=1"
NS = {"kml": "http://www.opengis.net/kml/2.2"}

# Nombre de carpeta en el KML (My Maps)  ->  nombre exacto de archivo que espera la app
# (el nombre de archivo debe coincidir carácter por carácter con lo que hay en
#  components/MapViewer.tsx, incluyendo errores de dedo ya existentes)
CATEGORY_TO_FILENAME = {
    "Asaltos": "Asaltos",
    "Fraudes": "Fraudes",
    "Intento de Asalto": "Intento de asalto",
    "Acoso y agresiones": "Acoso y agresióin",
}

NAME_PREFIX_RE = re.compile(r"^\d+(\.\d+)?\.?\s*")

PRJ_WGS84 = (
    'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,'
    '298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]'
)


def load_alcaldias(repo_path: Path):
    """Regresa (lista de (nombre_alcaldia, poligono_shapely), transformer WGS84->CRS de 09mun.shp).

    09mun.shp NO está en lat/lon: usa una proyección Lambert Cónica en metros
    (típica de INEGI). shpjs la reproyecta al vuelo en el navegador usando el
    .prj; aquí hacemos lo mismo con pyproj para poder comparar puntos.
    """
    sf_path = repo_path / "public" / "shapefiles" / "09mun.shp"
    sf = shapefile.Reader(str(sf_path), encoding="latin-1")
    polys = []
    for sr in sf.shapeRecords():
        geom = shapely_shape(sr.shape.__geo_interface__)
        polys.append((sr.record["NOMGEO"], geom))

    prj_wkt = (repo_path / "public" / "shapefiles" / "09mun.prj").read_text()
    crs_mun = CRS.from_wkt(prj_wkt)
    transformer = Transformer.from_crs("EPSG:4326", crs_mun, always_xy=True)
    return polys, transformer


def find_alcaldia(lon, lat, alcaldias, transformer):
    x, y = transformer.transform(lon, lat)
    pt = Point(x, y)
    for nombre, poly in alcaldias:
        if poly.contains(pt):
            return nombre
    # si no cae exactamente dentro (por ej. justo en un borde), usa la más cercana
    nearest = min(alcaldias, key=lambda na: na[1].distance(pt))
    return nearest[0]


def load_kml(source_path: str | None):
    if source_path:
        with open(source_path, "rb") as f:
            data = f.read()
    else:
        with urlopen(KML_URL, timeout=30) as resp:
            data = resp.read()
    return ET.fromstring(data)


def clean_name(raw_name: str) -> str:
    return NAME_PREFIX_RE.sub("", raw_name or "").strip()


def placemark_point(pm):
    """Regresa (lon, lat) del placemark; si es polígono, usa su centroide."""
    point_el = pm.find(".//kml:Point/kml:coordinates", NS)
    if point_el is not None and point_el.text:
        lon, lat, *_ = [float(x) for x in point_el.text.strip().split(",")]
        return lon, lat

    ring_el = pm.find(".//kml:Polygon//kml:outerBoundaryIs/kml:LinearRing/kml:coordinates", NS)
    if ring_el is not None and ring_el.text:
        pts = []
        for triplet in ring_el.text.strip().split():
            lon, lat, *_ = triplet.split(",")
            pts.append((float(lon), float(lat)))
        centroid = shapely_shape({"type": "Polygon", "coordinates": [pts]}).centroid
        return centroid.x, centroid.y

    return None


def convert(kml_source: str | None, repo_path: Path):
    root = load_kml(kml_source)
    document = root.find("kml:Document", NS)
    if document is None:
        document = root

    alcaldias, transformer = load_alcaldias(repo_path)

    records_by_category = {name: [] for name in CATEGORY_TO_FILENAME}

    for folder in document.findall("kml:Folder", NS):
        name_el = folder.find("kml:name", NS)
        folder_name = (name_el.text or "").strip() if name_el is not None else ""
        if folder_name not in records_by_category:
            continue  # otra capa (no es una de las 4 que nos toca)

        for pm in folder.findall("kml:Placemark", NS):
            coords = placemark_point(pm)
            if coords is None:
                continue
            lon, lat = coords
            name_el2 = pm.find("kml:name", NS)
            calle = clean_name(name_el2.text if name_el2 is not None else "")
            alcaldia = find_alcaldia(lon, lat, alcaldias, transformer)
            records_by_category[folder_name].append({
                "Calle": calle,
                "Incidencia": folder_name,
                "Alcaldia": alcaldia,
                "Longitud": round(lon, 7),
                "Latitud": round(lat, 7),
                "Direccion": f"{calle}, {alcaldia}",
            })

    return records_by_category


def write_shapefile(records, out_base: Path):
    out_base.parent.mkdir(parents=True, exist_ok=True)
    with shapefile.Writer(str(out_base), shapeType=shapefile.POINT) as w:
        w.field("Calle", "C", size=254)
        w.field("Incidencia", "C", size=254)
        w.field("Alcaldia", "C", size=254)
        w.field("Longitud", "N", size=24, decimal=7)
        w.field("Latitud", "N", size=24, decimal=7)
        w.field("Direccion", "C", size=254)
        for rec in records:
            w.point(rec["Longitud"], rec["Latitud"])
            w.record(**rec)

    out_base.with_suffix(".prj").write_text(PRJ_WGS84, encoding="utf-8")
    out_base.with_suffix(".cpg").write_text("UTF-8", encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python kml_to_shapefiles.py <ruta_al_repo> [kml_local_opcional]")
        sys.exit(1)

    repo = Path(sys.argv[1])
    kml_local = sys.argv[2] if len(sys.argv) > 2 else None

    data = convert(kml_local, repo)

    target_dir = repo / "public" / "shapefiles" / "Ni una menos"
    for category, filename in CATEGORY_TO_FILENAME.items():
        recs = data[category]
        write_shapefile(recs, target_dir / filename)
        print(f"{filename}.shp -> {len(recs)} incidentes")

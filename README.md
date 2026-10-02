# Visor Geoespacial CDMX – Mapa de riesgos

Visor web interactivo con capas geográficas de la Ciudad de México: delitos, incidentes reportados por repartidoras y repartidores, infraestructura social e indicadores sociodemográficos.

Sitio publicado: https://mapa-de-riesgos-pd.vercel.app/

## Capas

| Grupo | Contenido |
|---|---|
| Delitos | Delitos a personas y delitos con vehículos implicados (Fiscalía General de Justicia de la CDMX) |
| Incidentes (Ni Una Repartidora Menos) | Asaltos, intentos de asalto, fraudes y acoso y agresiones reportados por la comunidad |
| Sociales | Biciestacionamientos, centros de justicia, estacionamientos para moto, Pilares, UT y Utopías |
| Sociodemográficos | Grado de marginación y AGEB |

La capa base son los límites de las alcaldías (`09mun`). Las demás capas se activan desde el panel lateral.

## Cómo funciona

- Aplicación Next.js 14 (React + TypeScript) con mapas en Leaflet.
- Los shapefiles viven en `public/shapefiles/` y el navegador los lee directamente con `shpjs`. No hay servidor propio ni variables de entorno.
- Toda la lógica del mapa y la lista de capas está en `components/MapViewer.tsx`.
- Cada shapefile debe incluir su archivo `.prj`: de ahí se toma la proyección para colocarlo bien en el mapa (por ejemplo, `09mun` no está en latitud/longitud).

## Ejecutar en local

Requiere Node.js 18.17 o superior.

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Para probar la versión de producción:

```bash
npm run build
npm start
```

## Actualización automática de los incidentes

Los incidentes salen del mapa de Google My Maps "Mapa de Riesgos CDMX". Un flujo de GitHub Actions (`.github/workflows/sync-mapa-riesgos.yml`) los mantiene al día:

1. Corre cada 6 horas (hora UTC) o manualmente desde la pestaña **Actions → Run workflow**.
2. `scripts/kml_to_shapefiles.py` descarga el KML público del mapa y genera cuatro shapefiles en `public/shapefiles/Ni una menos/`.
3. La alcaldía de cada incidente se calcula por ubicación con los límites de `09mun`.
4. Si hubo cambios, el flujo los guarda en el repositorio y Vercel vuelve a publicar el sitio.

Cada capa generada tiene las mismas columnas: `Calle`, `Incidencia`, `Alcaldia`, `Longitud`, `Latitud` y `Direccion`.

Para que el flujo pueda guardar cambios, en **Settings → Actions → General → Workflow permissions** debe estar activada la opción *Read and write permissions*.

Para ejecutar el script a mano:

```bash
pip install pyshp shapely pyproj
python scripts/kml_to_shapefiles.py .
```

**Nombres de archivo.** El visor busca estas capas por nombre exacto: `Asaltos`, `Fraudes`, `Intento de asalto` y `Acoso y agresióin` (con esa ortografía). Si se renombra un archivo hay que cambiar también su ruta en `components/MapViewer.tsx`.

## Agregar una capa nueva

1. Copia el shapefile (`.shp`, `.shx`, `.dbf` y `.prj`) en una carpeta dentro de `public/shapefiles/`.
2. En `components/MapViewer.tsx`, agrega una entrada al grupo que corresponda con su `id`, el `name` que se verá en pantalla y el `path` sin extensión, por ejemplo `/shapefiles/Social/Pilares`.
3. Prueba en local y sube el cambio.

## Estructura del repositorio

```
app/                 Páginas y estilos de Next.js
components/          MapViewer.tsx: mapa, panel de capas y leyendas
public/shapefiles/   Capas del mapa
scripts/             Conversión del KML de My Maps a shapefile
.github/workflows/   Sincronización automática de incidentes
```

## Datos

- Delitos: Fiscalía General de Justicia de la Ciudad de México.
- Incidentes: reportes de la comunidad en el mapa "Ni Una Repartidora Menos".
- Límites de alcaldías, AGEB y grado de marginación: ver los metadatos de cada shapefile.

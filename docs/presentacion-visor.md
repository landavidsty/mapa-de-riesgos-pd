# Datos y fichas del visor

El visor incluye 27 capas seleccionables. Sus identificadores y rutas están definidos en `components/MapViewer.tsx`; las fichas se generan en `lib/layer-presentation.ts`.

## Periodos de delitos

Las etiquetas describen los meses con registros en la base anual de 2025 según FECHA DE INICIO, incluidos los expedientes sin coordenadas. Trece capas tienen registros en los doce meses. Robo a transportista tiene registros en mayo-septiembre y noviembre-diciembre; robo de vehículo público sin violencia, en enero-noviembre. Estas diferencias no acreditan cortes parciales de descarga.

## Fuentes

- [Evalúa CDMX: IDS 2020](https://datos.cdmx.gob.mx/dataset/indice-de-desarrollo-social-de-la-ciudad-de-mexico-2020), con datos del Censo 2020 de INEGI.
- [INEGI: catálogo de alcaldías](https://gaia.inegi.org.mx/wscatgeo/v2/mgem/09).
- [CONAPO: índices de marginación 2020](https://www.gob.mx/conapo/documentos/indices-de-marginacion-2020-284372) y [metodología](https://www.gob.mx/cms/uploads/attachment/file/783840/SDM_Parte9.pdf).
- [SIEG: metadatos de marginación por colonia](https://sieg.cdmx.gob.mx/layers/geonode%3Aim_colonia/layer_info_metadata).
- [SEMARNAT: diccionario de campos de marginación](https://geomaticasig1.semarnat.gob.mx/arcgis/rest/services/Hosted/%C3%8Dndice_de_marginaci%C3%B3n__2020/FeatureServer/78).

## Indicadores pendientes de definición

En IDS no están confirmadas las definiciones de `ids_ccevj`, `ids_csj`, `ids_caej`, `ids_ctelj`, `ids_cbdj`, `ids_rei`, `ids_cassi`, `ids_casi` y `pobres_tot` para esta versión de la capa.

En marginación están pendientes `POBTOT`, `P6A14NAE`, `PSDSS`, `OVHAC`, `OVSREF`, `OVSINT`, `OVSCEL`, `IM_2020` e `IMN_2020`. Las fichas omiten estos campos; sus valores permanecen en los archivos de datos.

Se muestran cinco porcentajes documentados: `SBASC` (población de 15 años o más sin educación básica), `OVSDE` (ocupantes sin drenaje ni excusado), `OVSEE` (sin energía eléctrica), `OVSAE` (sin agua entubada) y `OVPT` (piso de tierra). Los indicadores de vivienda y servicios se refieren a ocupantes de viviendas particulares. Sus valores no se multiplican por 100.

## Presentación

- Los valores ausentes se muestran como «Sin información»; cero y falso conservan su valor.
- Las claves geográficas se mantienen como texto. Las fechas de inicio de carpeta y de los hechos se muestran por separado.
- El IDS se presenta con tres decimales. Un valor nulo no se clasifica como «Muy bajo».
- Las fichas incluyen únicamente campos con significado documentado y escapan los textos incorporados al HTML.
- PILARES omite estatus y región. Utopías omite coordenadas y el campo `ESTADO`.
- Las pruebas de presentación se encuentran en `tests/layer-presentation.test.ts`.

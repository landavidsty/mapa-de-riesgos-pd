# Presentación del visor

La rama parte del commit `a5f4cc318c50480cc3ffce360765aab2b0f42d72` de `corregir-capas-delitos-2025-2026-10-05`: al revisar, main seguía en `9a40e782a4b025bb56f2a49689692b734005b342`. Se mantienen los 27 IDs y rutas de capas, y los 151 archivos de `public/` sin cambios. Las 15 capas de delitos conservan las correcciones anteriores. No se incorporan filtros de registros ni cambios de geometrías.

## Periodos de delitos

Las etiquetas usan FECHA DE INICIO y la tabla proporcionada, que incluye casos sin coordenadas. Son una descripción de los meses con registros en el Excel de 2025, no un corte de disponibilidad ni una conclusión sobre meses faltantes. Todas las capas indican 2025, excepto transportistas (`May–sep y nov–dic 2025*`) y vehículo público sin violencia (`Ene–nov 2025*`). Sus notas conservan el texto solicitado.

## Fuentes consultadas el 5 de octubre de 2026

- [Evalúa / Portal de Datos CDMX: IDS 2020 y diccionario de AGEB](https://datos.cdmx.gob.mx/dataset/indice-de-desarrollo-social-de-la-ciudad-de-mexico-2020). La descripción oficial confirma ocho dimensiones, la referencia censal 2020 y la fuente Evalúa. El portal y su API devolvieron errores 502 o tiempos de espera al intentar descargar el diccionario, tanto en `datos` como en `www.datos`. La metodología PDF de Evalúa tampoco pudo descargarse. No se aplican equivalencias basadas sólo en siglas.
- [INEGI, catálogo municipal de CDMX](https://gaia.inegi.org.mx/wscatgeo/v2/mgem/09), leído directamente: se verificaron las 16 alcaldías y sus claves de tres dígitos. `cvegeo`, `cve_ent`, `cve_mun`, `cve_loc` y `cve_ageb` se conservan como texto y no se agrupan numéricamente.
- [CONAPO, índices de marginación 2020](https://www.gob.mx/conapo/documentos/indices-de-marginacion-2020-284372), [cambios conceptuales y metodológicos](https://www.gob.mx/cms/uploads/attachment/file/783840/SDM_Parte9.pdf) y [metadatos del IPDP/SIEG de la capa de colonias](https://sieg.cdmx.gob.mx/layers/geonode%3Aim_colonia/layer_info_metadata). Las descripciones indexadas identifican el índice, grado, índice normalizado y el año 2020. Las descargas de CONAPO devolvieron 403 y SIEG 502/tiempo de espera.
- [Diccionario de campos de marginación 2020 publicado por SEMARNAT](https://geomaticasig1.semarnat.gob.mx/arcgis/rest/services/Hosted/%C3%8Dndice_de_marginaci%C3%B3n__2020/FeatureServer/78), leído completo. Junto con la documentación CONAPO, permite verificar estas correspondencias y su unidad porcentual: SBASC (15+ sin educación básica), OVSDE (ocupantes sin drenaje ni excusado), OVSEE (ocupantes sin energía eléctrica), OVSAE (ocupantes sin agua entubada), OVPT (ocupantes con piso de tierra). Se muestran como porcentajes originales, sin multiplicarlos por 100.

## Definiciones pendientes

No pudo confirmarse en el diccionario de **esta versión de IDS por AGEB** el significado preciso, unidad y sentido de `ids_ccevj`, `ids_csj`, `ids_caej`, `ids_ctelj`, `ids_cbdj`, `ids_rei`, `ids_cassi`, `ids_casi`, ni la definición de `pobres_tot`. Los nueve campos siguen disponibles con códigos originales en Detalles técnicos. No se describe `pobres_tot` como pobreza multidimensional ni se convierte un índice a porcentaje. Ver componentes del IDS señala expresamente el pendiente; no propone interpretaciones sin verificar.

En marginación quedan pendientes de contraste específico con el diccionario de la capa: `POBTOT`, `P6A14NAE`, `PSDSS`, `OVHAC`, `OVSREF`, `OVSINT`, `OVSCEL`, así como la unidad y sentido precisos de `IM_2020` e `IMN_2020`. Se mantienen sus códigos y valores originales en Ver indicadores adicionales; no se añaden unidades supuestas. Identificadores, claves y campos geométricos se conservan en Detalles técnicos.

## Comportamiento y validación

- Fichas separadas para servicios, delitos, comunidad, IDS y marginación; campos principales sólo cuando existen en el registro. Datos originales adicionales accesibles en secciones desplegables.
- Nulos, cadenas vacías y números no finitos se muestran como Sin información. Cero y falso no se consideran ausentes. Las fechas de inicio de carpeta y hechos se muestran por separado.
- Todos los textos incorporados al HTML se escapan. Las claves no se convierten a números; las fechas se formatean en UTC para evitar cambios de día.
- IDS: tres decimales; población con separador de miles. La clasificación y colores originales se conservan. Un IDS nulo se muestra blanco/Sin información, sin convertirse en cero. La leyenda contiene cinco niveles y una única entrada Sin información con borde gris.
- Secciones largas con desplazamiento, ajuste de palabras y desplegables nativos utilizables con teclado.
- Verificación automatizada de la igualdad byte por byte de public/ y del inventario de IDs/rutas, pruebas de fichas con todos los registros y pruebas específicas de escape HTML, ceros, nulos, fechas y claves. Compilación Next.js con verificación de tipos.

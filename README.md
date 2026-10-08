# Visor Geoespacial CDMX

Mapa de delitos, reportes comunitarios, servicios e indicadores sociodemográficos de la Ciudad de México.

Sitio: https://mapa-de-riesgos-pd.vercel.app/

## Datos

- Delitos: Fiscalía General de Justicia de la CDMX, 2025.
- Reportes comunitarios: Ni Una Repartidora Menos.
- Servicios e infraestructura social: biciestacionamientos, centros de justicia, estacionamientos para motocicletas, PILARES, Unidades Territoriales Siempre Vivas y Utopías.
- Índice de Desarrollo Social: Evalúa CDMX, 2020.
- Marginación: metodología CONAPO, 2020.
- Límites de alcaldías: INEGI.

Los archivos geográficos se encuentran en `public/shapefiles/`. Cada capa debe conservar sus archivos asociados.

## Ejecución

Requiere Node.js y npm. Configura `NEXT_PUBLIC_CARTO_KEY` con la clave de CARTO en `.env.local` o en el entorno de despliegue.

```bash
npm ci
npm run dev
```

Para ejecutar la versión de producción:

```bash
npm run build
npm start
```

## Actualización

Los reportes comunitarios se sincronizan desde Google My Maps mediante una tarea programada cada seis horas. Las demás capas se actualizan sustituyendo sus archivos.

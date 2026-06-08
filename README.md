[README.md](https://github.com/user-attachments/files/28722874/README.md)
# Visor de Detecciones UAS - DGAC

Mapa web para visualizar registros de drones/UAS desde un archivo CSV.

## Archivos

- `index.html`: estructura del visor.
- `style.css`: diseño visual.
- `app.js`: lógica del mapa, filtros, duplicados y trayectorias.
- `drones.csv`: base de datos normalizada desde el archivo recibido.
- `README.md`: instrucciones.

## Resumen del CSV cargado

- Total de registros: 165
- Registros mapeables: 109
- Registros sin coordenadas: 56
- IDs únicos: 45
- IDs repetidos: 20

## Cómo publicarlo en GitHub Pages

1. Crea un repositorio nuevo en GitHub, por ejemplo:
   `mapa-drones-dgac`

2. Sube estos archivos directamente a la raíz del repositorio:
   - `index.html`
   - `style.css`
   - `app.js`
   - `drones.csv`
   - `README.md`

3. En GitHub entra a:
   **Settings → Pages**

4. En **Build and deployment** selecciona:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`

5. Guarda los cambios.

6. El link quedará con una forma similar a:
   `https://TU-USUARIO.github.io/mapa-drones-dgac/`

## Cómo actualizar los datos

Cuando llegue un nuevo CSV, reemplaza `drones.csv` manteniendo estas columnas normalizadas:

- Hora de comienzo
- Duración
- Tipo
- ID
- FrecuenciaMHz
- Ubicación de inicio
- Última posición
- Sensor
- lat_inicio
- lon_inicio
- lat_ultima
- lon_ultima
- fecha
- hora
- repeticiones_id
- id_repetido
- mapeable

Si el CSV original viene igual al enviado por DGAC, se puede volver a normalizar antes de subirlo.

## Nota

El visor usa librerías públicas CDN:
- Leaflet
- Leaflet.markercluster
- PapaParse

Por eso requiere conexión a internet para cargar correctamente el mapa y las librerías.

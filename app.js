/* Visor de Detecciones UAS
   - Lee drones.csv desde GitHub Pages.
   - Marca IDs repetidos.
   - Dibuja inicio, última posición y trayectoria.
*/

const CSV_FILE = "drones.csv";

let registros = [];
let registrosFiltrados = [];
let boundsGlobal = null;

const map = L.map("map", { preferCanvas: true }).setView([-33.47, -70.75], 10);

const baseOSM = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

const baseTopo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxZoom: 17,
  attribution: "&copy; OpenTopoMap"
});

const capaInicio = L.markerClusterGroup();
const capaUltima = L.markerClusterGroup();
const capaTrayectorias = L.layerGroup();

map.addLayer(capaInicio);
map.addLayer(capaUltima);
map.addLayer(capaTrayectorias);

L.control.layers(
  { "Mapa": baseOSM, "Topográfico": baseTopo },
  { "Inicio": capaInicio, "Última posición": capaUltima, "Trayectorias": capaTrayectorias },
  { collapsed: false }
).addTo(map);

const iconInicio = (repetido) => L.divIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:${repetido ? "#d94b4b" : "#2fbf71"};
    border:2px solid white;box-shadow:0 0 8px rgba(0,0,0,.55);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const iconUltima = (repetido) => L.divIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:${repetido ? "#d94b4b" : "#3d8bfd"};
    border:2px solid white;box-shadow:0 0 8px rgba(0,0,0,.55);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

function limpiarNumero(valor) {
  if (valor === undefined || valor === null || valor === "") return null;
  const n = Number(String(valor).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function tieneCoord(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon);
}

function popupHTML(r, etiqueta) {
  const repetido = r.id_repetido === "SI";
  return `
    <div class="popup">
      <h3>${etiqueta} ${repetido ? "⚠️ ID repetido" : ""}</h3>
      <table>
        <tr><td>ID</td><td>${r.ID || ""}</td></tr>
        <tr><td>Tipo</td><td>${r.Tipo || ""}</td></tr>
        <tr><td>Fecha/hora</td><td>${r["Hora de comienzo"] || ""}</td></tr>
        <tr><td>Duración</td><td>${r["Duración"] || ""}</td></tr>
        <tr><td>Frecuencia</td><td>${r.FrecuenciaMHz || ""} MHz</td></tr>
        <tr><td>Sensor</td><td>${r.Sensor || ""}</td></tr>
        <tr><td>Repeticiones</td><td>${r.repeticiones_id || 1}</td></tr>
        <tr><td>Inicio</td><td>${r["Ubicación de inicio"] || "Sin dato"}</td></tr>
        <tr><td>Última</td><td>${r["Última posición"] || "Sin dato"}</td></tr>
      </table>
    </div>
  `;
}

function cargarMapa() {
  capaInicio.clearLayers();
  capaUltima.clearLayers();
  capaTrayectorias.clearLayers();

  const puntos = [];

  registrosFiltrados.forEach((r) => {
    const latI = limpiarNumero(r.lat_inicio);
    const lonI = limpiarNumero(r.lon_inicio);
    const latU = limpiarNumero(r.lat_ultima);
    const lonU = limpiarNumero(r.lon_ultima);
    const repetido = r.id_repetido === "SI";

    if (tieneCoord(latI, lonI)) {
      const mk = L.marker([latI, lonI], { icon: iconInicio(repetido) })
        .bindPopup(popupHTML(r, "Inicio"));
      capaInicio.addLayer(mk);
      puntos.push([latI, lonI]);
    }

    if (tieneCoord(latU, lonU)) {
      const mk = L.marker([latU, lonU], { icon: iconUltima(repetido) })
        .bindPopup(popupHTML(r, "Última posición"));
      capaUltima.addLayer(mk);
      puntos.push([latU, lonU]);
    }

    if (document.getElementById("mostrarTrayectorias").checked && tieneCoord(latI, lonI) && tieneCoord(latU, lonU)) {
      const color = repetido ? "#d94b4b" : "#f0c94a";
      const linea = L.polyline([[latI, lonI], [latU, lonU]], {
        color,
        weight: repetido ? 3 : 2,
        opacity: 0.75,
        dashArray: repetido ? null : "6,6"
      }).bindPopup(popupHTML(r, "Trayectoria"));
      capaTrayectorias.addLayer(linea);
    }
  });

  if (puntos.length > 0) {
    boundsGlobal = L.latLngBounds(puntos);
    map.fitBounds(boundsGlobal.pad(0.12));
  }
}

function actualizarStats() {
  const total = registros.length;
  const mapeables = registros.filter(r => r.mapeable === "SI").length;
  const sinCoord = registros.filter(r => r.mapeable !== "SI").length;
  const idsRepetidos = new Set(registros.filter(r => r.id_repetido === "SI").map(r => r.ID)).size;

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statMapeables").textContent = mapeables;
  document.getElementById("statSinCoord").textContent = sinCoord;
  document.getElementById("statRepetidos").textContent = idsRepetidos;
}

function aplicarFiltros() {
  const q = document.getElementById("buscar").value.trim().toLowerCase();
  const desde = document.getElementById("fechaDesde").value;
  const hasta = document.getElementById("fechaHasta").value;
  const soloRep = document.getElementById("soloRepetidos").checked;

  registrosFiltrados = registros.filter((r) => {
    const texto = `${r.ID} ${r.Tipo} ${r.Sensor} ${r.FrecuenciaMHz}`.toLowerCase();
    const okTexto = !q || texto.includes(q);
    const okRep = !soloRep || r.id_repetido === "SI";
    const fecha = r.fecha || "";
    const okDesde = !desde || fecha >= desde;
    const okHasta = !hasta || fecha <= hasta;
    return okTexto && okRep && okDesde && okHasta && r.mapeable === "SI";
  });

  cargarMapa();
}

function cargarListaRepetidos() {
  const cont = document.getElementById("listaRepetidos");
  const mapa = new Map();

  registros.filter(r => r.id_repetido === "SI").forEach((r) => {
    if (!mapa.has(r.ID)) mapa.set(r.ID, []);
    mapa.get(r.ID).push(r);
  });

  if (mapa.size === 0) {
    cont.innerHTML = "<p>No hay IDs repetidos.</p>";
    return;
  }

  cont.innerHTML = "";
  [...mapa.entries()]
    .sort((a,b) => b[1].length - a[1].length)
    .forEach(([id, arr]) => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `<strong>${id}</strong><small>${arr.length} detecciones</small>`;
      div.addEventListener("click", () => {
        document.getElementById("buscar").value = id;
        document.getElementById("soloRepetidos").checked = false;
        aplicarFiltros();
      });
      cont.appendChild(div);
    });
}

function inicializarFechas() {
  const fechas = registros.map(r => r.fecha).filter(Boolean).sort();
  if (fechas.length > 0) {
    document.getElementById("fechaDesde").value = fechas[0];
    document.getElementById("fechaHasta").value = fechas[fechas.length - 1];
  }
}

function instalarEventos() {
  ["buscar", "fechaDesde", "fechaHasta", "soloRepetidos", "mostrarTrayectorias"].forEach(id => {
    document.getElementById(id).addEventListener("input", aplicarFiltros);
    document.getElementById(id).addEventListener("change", aplicarFiltros);
  });

  document.getElementById("btnLimpiar").addEventListener("click", () => {
    document.getElementById("buscar").value = "";
    document.getElementById("soloRepetidos").checked = false;
    document.getElementById("mostrarTrayectorias").checked = true;
    inicializarFechas();
    aplicarFiltros();
  });

  document.getElementById("btnCentrar").addEventListener("click", () => {
    if (boundsGlobal) map.fitBounds(boundsGlobal.pad(0.12));
  });
}

const legend = L.control({ position: "bottomright" });
legend.onAdd = function () {
  const div = L.DomUtil.create("div", "legend");
  div.innerHTML = `
    <strong>Leyenda</strong><br>
    <span class="dot dot-green"></span>Inicio<br>
    <span class="dot dot-blue"></span>Última posición<br>
    <span class="dot dot-red"></span>ID repetido<br>
  `;
  return div;
};
legend.addTo(map);

Papa.parse(CSV_FILE, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: (result) => {
    registros = result.data;
    registrosFiltrados = registros.filter(r => r.mapeable === "SI");
    actualizarStats();
    inicializarFechas();
    cargarListaRepetidos();
    instalarEventos();
    aplicarFiltros();
  },
  error: (err) => {
    alert("No se pudo cargar drones.csv. Revisa que el archivo exista en el repositorio.");
    console.error(err);
  }
});

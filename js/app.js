/* ===============================
   CONFIG
============================== */
const API_URL = "https://script.google.com/macros/s/AKfycbyCF3QslyjMBHJOvVB9Y2JQ59nyQTHIJN6CLL-MeJqnkkBMFz4BY1NSLCsSM0xSgS3s/exec";
const CLAVE_SEGURIDAD = "A123";

let personaActual = null;
let registrosPersonas = [];
let db;

/* ===============================
   INDEXEDDB
============================== */
function abrirDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("miSistemaDB", 1);

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains("personas")) {
        db.createObjectStore("personas", { keyPath: "DOCUMENTO" });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = reject;
  });
}

function guardarEnDB(data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("personas", "readwrite");
    const store = tx.objectStore("personas");

    data.forEach(item => store.put(item));

    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

function obtenerTodasDB() {
  return new Promise((resolve) => {
    const tx = db.transaction("personas", "readonly");
    const store = tx.objectStore("personas");
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
  });
}

/* ===============================
   NORMALIZAR
============================== */
function normalizar(texto) {
  return (texto || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

/* ===============================
   CARGA ROBUSTA (FIX REAL)
============================== */
async function cargarRegistros() {
  try {
    const cache = await obtenerTodasDB();

    // ✔ USAR CACHE SI EXISTE
    if (cache && cache.length > 0) {
      registrosPersonas = cache;
      console.log("📦 IndexedDB:", cache.length);
      return;
    }

    // ❗ SI NO HAY CACHE → IR A API
    console.log("🌐 API Google Sheets...");

    const res = await fetch(`${API_URL}?todos=true`);
    const data = await res.json();

    if (Array.isArray(data)) {
      registrosPersonas = data.map(p => ({
        ...p,
        DOCUMENTO: (p.DOCUMENTO || "").toString()
      }));

      await guardarEnDB(registrosPersonas);
      console.log("💾 Guardado en IndexedDB");
    }

  } catch (err) {
    console.error("Error carga:", err);
    registrosPersonas = [];
  }
}

/* ===============================
   BUSQUEDA
============================== */
async function buscar() {
  const q = document.getElementById("dni").value.trim();
  const tbody = document.querySelector("#tablaResultado tbody");

  if (!q) return;

  tbody.innerHTML = `<tr><td colspan="5">Buscando...</td></tr>`;

  if (registrosPersonas.length === 0) {
    await cargarRegistros();
  }

  const query = normalizar(q);
  const esNumero = /^[0-9]+$/.test(query);

  const coincidencias = registrosPersonas.filter(p => {
    const doc = normalizar(p.DOCUMENTO);
    const nom = normalizar(p.NOMBRE);
    return esNumero ? doc.includes(query) : nom.includes(query);
  });

  if (coincidencias.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">Sin coincidencias</td></tr>`;
    return;
  }

  const grupos = {};
  coincidencias.forEach(p => {
    grupos[p.DOCUMENTO] = grupos[p.DOCUMENTO] || [];
    grupos[p.DOCUMENTO].push(p);
  });

  const lista = Object.values(grupos);

  tbody.innerHTML = lista.map((grupo, i) => {
    const p = grupo[0];
    const { color } = colorSemaforoPorRegistros(grupo);

    return `
      <tr>
        <td>${p.NOMBRE}</td>
        <td>${p.DOCUMENTO}</td>
        <td>${p.EMPRESA}</td>
        <td>
          <span class="semaforo"
                style="background:${color}"
                onclick="seleccionarGrupo(${i})"></span>
        </td>
        <td>${grupo[0].CODIGO_UNICO || "-"}</td>
      </tr>
    `;
  }).join("");

  window.gruposBusqueda = lista;
}

/* ===============================
   SELECCIÓN
============================== */
function seleccionarGrupo(i) {
  personaActual = window.gruposBusqueda[i];
  abrirModalSeguridad();
}

/* ===============================
   SEMAFORO
============================== */
function colorSemaforoPorRegistros(registros) {
  let penal = false;
  let laboral = false;

  registros.forEach(r => {
    const cat = normalizar(r.CATEGORIA);

    if (cat.includes("PENAL") || cat.includes("JUDICIAL")) penal = true;
    if (cat.includes("LABORAL")) laboral = true;
  });

  if (penal) return { color: "red" };
  if (laboral) return { color: "orange" };
  return { color: "green" };
}

/* ===============================
   MODALES (IMPORTANTE)
============================== */
function abrirModalAgregar() {
  const m = document.getElementById("modalAgregar");
  if (m) m.style.display = "flex";
}

function cerrarModalAgregar() {
  const m = document.getElementById("modalAgregar");
  if (m) m.style.display = "none";
}

/* ===============================
   INIT
============================== */
window.addEventListener("DOMContentLoaded", async () => {
  await abrirDB();
  await cargarRegistros();

  document.getElementById("btnBuscar").addEventListener("click", buscar);
  document.getElementById("dni").addEventListener("keydown", e => {
    if (e.key === "Enter") buscar();
  });

  document.getElementById("btnAgregar")?.addEventListener("click", abrirModalAgregar);
});

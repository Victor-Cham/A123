/* ===============================
   CONFIG
============================== */
const API_URL = "https://script.google.com/macros/s/AKfycbyCF3QslyjMBHJOvVB9Y2JQ59nyQTHIJN6CLL-MeJqnkkBMFz4BY1NSLCsSM0xSgS3s/exec";
const CLAVE_SEGURIDAD = "A123";

let personaActual = null;
let registrosPersonas = [];
let db;

/* ===============================
   INDEXEDDB INIT
============================== */
function abrirDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("miSistemaDB", 1);

    request.onupgradeneeded = function (e) {
      db = e.target.result;

      if (!db.objectStoreNames.contains("personas")) {
        db.createObjectStore("personas", { keyPath: "DOCUMENTO" });
      }
    };

    request.onsuccess = function (e) {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = function (e) {
      reject(e);
    };
  });
}

function guardarEnDB(data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("personas", "readwrite");
    const store = tx.objectStore("personas");

    data.forEach(item => {
      store.put(item);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject();
  });
}

function obtenerTodasDB() {
  return new Promise((resolve) => {
    const tx = db.transaction("personas", "readonly");
    const store = tx.objectStore("personas");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
  });
}

/* ===============================
   NORMALIZAR TEXTO (SIN ACENTOS)
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
   CARGA DE REGISTROS DESDE API
============================== */
async function cargarRegistros() {
  try {
    const cache = await obtenerTodasDB();

    // Si ya hay datos locales
    if (cache && cache.length > 0) {
      registrosPersonas = cache;
      return;
    }

    const res = await fetch(`${API_URL}?todos=true`);
    const data = await res.json();

    if (Array.isArray(data)) {
      registrosPersonas = data.map(p => ({
        ...p,
        DOCUMENTO: (p.DOCUMENTO || "").toString()
      }));

      await guardarEnDB(registrosPersonas);
    } else {
      registrosPersonas = [];
    }

  } catch (error) {
    registrosPersonas = [];
    console.error("Error al cargar registros:", error);
  }
}

/* ===============================
   BUSQUEDA INTELIGENTE
============================== */
async function buscar() {
  const queryRaw = document.getElementById("dni").value.trim();
  const tbody = document.querySelector("#tablaResultado tbody");

  if (!queryRaw) return;

  tbody.innerHTML = `<tr><td colspan="5">Buscando...</td></tr>`;

  if (registrosPersonas.length === 0) {
    await cargarRegistros();
  }

  const query = normalizar(queryRaw);
  const esNumero = /^[0-9]+$/.test(query);

  const coincidencias = registrosPersonas.filter(p => {
    const doc = normalizar(p.DOCUMENTO);
    const nombre = normalizar(p.NOMBRE);

    if (esNumero) return doc.includes(query);
    return nombre.includes(query);
  });

  if (coincidencias.length === 0) {
    personaActual = null;
    tbody.innerHTML = `<tr><td colspan="5">Sin coincidencias</td></tr>`;
    return;
  }

  const agrupados = {};

  coincidencias.forEach(p => {
    if (!agrupados[p.DOCUMENTO]) {
      agrupados[p.DOCUMENTO] = [];
    }
    agrupados[p.DOCUMENTO].push(p);
  });

  const resultadosAgrupados = Object.values(agrupados);

  tbody.innerHTML = resultadosAgrupados.map((grupo, index) => {

    const persona = grupo[0];
    const { color, codigo } = colorSemaforoPorRegistros(grupo);

    return `
      <tr>
        <td>${persona.NOMBRE}</td>
        <td>${persona.DOCUMENTO}</td>
        <td>${persona.EMPRESA}</td>
        <td>
          <span class="semaforo"
                style="background:${color}"
                onclick="seleccionarGrupo(${index})">
          </span>
        </td>
        <td>${codigo}</td>
      </tr>
    `;
  }).join("");

  window.gruposBusqueda = resultadosAgrupados;
}

/* ===============================
   SELECCIONAR PERSONA RESULTADO
============================== */
function seleccionarGrupo(index) {
  personaActual = window.gruposBusqueda[index];
  abrirModalSeguridad();
}

/* ===============================
   SEMAFORO POR CATEGORIA
============================== */
function colorSemaforoPorRegistros(registros) {
  if (!registros || registros.length === 0)
    return { color: "green", nivel: 3, codigo: "-" };

  let tienePenal = false;
  let tieneLaboral = false;
  let codigoPenal = null;
  let codigoLaboral = null;

  registros.forEach(r => {
    const cat = normalizar(r.CATEGORIA);
    const codigo = r.CODIGO_UNICO || "-";

    if (cat.includes("PENAL") || cat.includes("JUDICIAL")) {
      tienePenal = true;
      if (!codigoPenal) codigoPenal = codigo;
    }

    if (cat.includes("LABORAL")) {
      tieneLaboral = true;
      if (!codigoLaboral) codigoLaboral = codigo;
    }
  });

  if (tienePenal) return { color: "red", nivel: 1, codigo: codigoPenal };
  if (tieneLaboral) return { color: "orange", nivel: 2, codigo: codigoLaboral };

  return { color: "green", nivel: 3, codigo: registros[0].CODIGO_UNICO || "-" };
}

/* ===============================
   MODAL SEGURIDAD
============================== */
function abrirModalSeguridad() {
  if (!personaActual) return;
  document.getElementById("codigoAcceso").value = "";
  document.getElementById("mensajeError").textContent = "";
  document.getElementById("modal").style.display = "flex";
}

function validarCodigo() {
  const codigo = document.getElementById("codigoAcceso").value;
  if (codigo === CLAVE_SEGURIDAD) {
    cerrarModalSeguridad();
    mostrarDetalle();
  } else {
    document.getElementById("mensajeError").textContent = "Código incorrecto";
  }
}

function cerrarModalSeguridad() {
  document.getElementById("modal").style.display = "none";
}

/* ===============================
   MODAL DETALLE
============================== */
function mostrarDetalle() {
  const registros = personaActual;
  if (!registros || registros.length === 0) return;

  const base = registros[0];

  document.getElementById("detNombre").textContent = base.NOMBRE;
  document.getElementById("detDocumento").textContent = base.DOCUMENTO;
  document.getElementById("detEmpresa").textContent = base.EMPRESA;

  const { color } = colorSemaforoPorRegistros(registros);

  document.getElementById("detEstadoSemaforo").style.background = color;
  document.getElementById("detEstadoTexto").textContent =
    registros.length + " antecedente(s) encontrado(s)";

  const cont = document.getElementById("detDescripcion");

  cont.innerHTML = registros
    .sort((a, b) => new Date(b.FECHA) - new Date(a.FECHA))
    .map(p => `
      <div class="detalle-item-modal">
        <strong>Categoría:</strong> ${p.CATEGORIA || "-"}<br>
        <strong>Catálogo:</strong> ${p.CATALOGO || "-"}<br>
        <strong>Detalle:</strong> ${p.DESCRIPCION || "-"}<br>
        <strong>Fecha:</strong> ${formatearFecha(p.FECHA)}<br>
        <strong>Código:</strong> ${p.CODIGO_UNICO || "-"}<br>
        <strong>Archivo:</strong> ${p.ARCHIVO ? `<a href="${p.ARCHIVO}" target="_blank">Ver archivo</a>` : "-"}
      </div>
    `).join("");

  document.getElementById("modalDetalle").style.display = "flex";
}

/* ===============================
   GUARDAR PERSONA
============================== */
async function guardarPersona() {
  const nombre = document.getElementById("nuevoNombre").value.trim();
  const documento = document.getElementById("nuevoDocumento").value.trim();
  const empresa = document.getElementById("nuevaEmpresa").value.trim();

  try {
    const params = new URLSearchParams();

    params.append("NOMBRE", nombre);
    params.append("DOCUMENTO", documento);
    params.append("EMPRESA", empresa);

    const response = await fetch(API_URL, {
      method: "POST",
      body: params
    });

    const result = await response.json();

    registrosPersonas.unshift({
      NOMBRE: nombre,
      DOCUMENTO: documento,
      EMPRESA: empresa,
      CODIGO_UNICO: result.CODIGO_UNICO
    });

    const tx = db.transaction("personas", "readwrite");
    tx.objectStore("personas").put(registrosPersonas[0]);

  } catch (error) {
    console.error(error);
  }
}

/* ===============================
   UTIL
============================== */
function formatearFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-PE");
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
});

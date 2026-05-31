/* ===============================
   CONFIG
============================== */
const API_URL = "https://script.google.com/macros/s/AKfycbyCF3QslyjMBHJOvVB9Y2JQ59nyQTHIJN6CLL-MeJqnkkBMFz4BY1NSLCsSM0xSgS3s/exec";
const CLAVE_SEGURIDAD = "A123";

let personaActual = null;
let registrosPersonas = [];
let db = null;

/* ===============================
   INDEXEDDB (CACHE OPCIONAL)
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
  if (!db) return;

  const tx = db.transaction("personas", "readwrite");
  const store = tx.objectStore("personas");

  data.forEach(item => store.put(item));
}

/* ===============================
   TEXTO NORMALIZADO
============================== */
function normalizar(t) {
  return (t || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

/* ===============================
   CARGAR REGISTROS
============================== */
async function cargarRegistros() {
  try {
    console.log("📡 Cargando datos...");

    const res = await fetch(`${API_URL}?todos=true`);
    const data = await res.json();

    if (!Array.isArray(data)) {
      registrosPersonas = [];
      return;
    }

    registrosPersonas = data.map(p => ({
      ...p,
      DOCUMENTO: (p.DOCUMENTO || "").toString()
    }));

    guardarEnDB(registrosPersonas);

    console.log("✅ Datos cargados:", registrosPersonas.length);

  } catch (err) {
    console.error("Error API:", err);
  }
}

/* ===============================
   BUSCAR
============================== */
async function buscar() {
  const queryRaw = document.getElementById("dni")?.value?.trim();
  const tbody = document.querySelector("#tablaResultado tbody");

  if (!queryRaw) return;

  tbody.innerHTML = `<tr><td colspan="5">Buscando...</td></tr>`;

  const query = normalizar(queryRaw);
  const esNumero = /^[0-9]+$/.test(query);

  if (registrosPersonas.length === 0) {
    await cargarRegistros();
  }

  const coincidencias = registrosPersonas.filter(p => {
    const doc = normalizar(p.DOCUMENTO);
    const nombre = normalizar(p.NOMBRE);

    return esNumero ? doc.includes(query) : nombre.includes(query);
  });

  if (!coincidencias.length) {
    tbody.innerHTML = `<tr><td colspan="5">Sin coincidencias</td></tr>`;
    return;
  }

  const grupos = {};
  coincidencias.forEach(p => {
    if (!grupos[p.DOCUMENTO]) grupos[p.DOCUMENTO] = [];
    grupos[p.DOCUMENTO].push(p);
  });

  const resultado = Object.values(grupos);

  tbody.innerHTML = resultado.map((grupo, i) => {
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
            onclick="seleccionarGrupo(${i})"></span>
        </td>
        <td>${codigo}</td>
      </tr>
    `;
  }).join("");

  window.gruposBusqueda = resultado;
}

/* ===============================
   SELECCION
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
    if (cat.includes("PENAL")) penal = true;
    if (cat.includes("LABORAL")) laboral = true;
  });

  if (penal) return { color: "red", codigo: "PENAL" };
  if (laboral) return { color: "orange", codigo: "LABORAL" };
  return { color: "green", codigo: "-" };
}

/* ===============================
   MODALES
============================== */
function abrirModalSeguridad() {
  document.getElementById("modal").style.display = "flex";
}

function validarCodigo() {
  const code = document.getElementById("codigoAcceso").value;

  if (code === CLAVE_SEGURIDAD) {
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
   DETALLE
============================== */
function mostrarDetalle() {
  const registros = personaActual;
  const base = registros[0];

  document.getElementById("detNombre").textContent = base.NOMBRE;
  document.getElementById("detDocumento").textContent = base.DOCUMENTO;

  const cont = document.getElementById("detDescripcion");

  cont.innerHTML = registros.map(p => `
    <div class="detalle-item-modal">
      <b>${p.CATEGORIA}</b><br>
      ${p.DESCRIPCION || ""}
    </div>
  `).join("");

  document.getElementById("modalDetalle").style.display = "flex";
}

/* ===============================
   GUARDAR PERSONA (FIX REAL)
============================== */
async function guardarPersona() {
  try {
    const nombre = document.getElementById("nuevoNombre").value.trim();
    const documento = document.getElementById("nuevoDocumento").value.trim();
    const empresa = document.getElementById("nuevaEmpresa").value.trim();

    if (!nombre || !documento || !empresa) {
      alert("Completa los campos");
      return;
    }

    const params = new URLSearchParams();
    params.append("NOMBRE", nombre);
    params.append("DOCUMENTO", documento);
    params.append("EMPRESA", empresa);

    const res = await fetch(API_URL, {
      method: "POST",
      body: params
    });

    const result = await res.json();

    alert("Guardado OK");

    registrosPersonas.unshift({
      NOMBRE: nombre,
      DOCUMENTO: documento,
      EMPRESA: empresa
    });

  } catch (err) {
    console.error("Error guardar:", err);
  }
}

/* ===============================
   CATEGORIAS (FIX CLAVE)
============================== */
function cargarCategorias() {
  const select = document.getElementById("agregarCategoria");

  if (!select) return;

  select.innerHTML = `<option value="">--Seleccione--</option>`;

  if (!window.categorias || !Array.isArray(window.categorias)) {
    console.warn("⚠ categorias no cargadas");
    return;
  }

  window.categorias.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.nombre;
    opt.textContent = c.nombre;
    select.appendChild(opt);
  });
}

function cargarCatalogos() {
  const cat = document.getElementById("agregarCategoria")?.value;
  const select = document.getElementById("agregarCatalogo");

  if (!select) return;

  select.innerHTML = `<option value="">--Seleccione--</option>`;

  const categoria = window.categorias?.find(c => c.nombre === cat);
  if (!categoria) return;

  categoria.catalogos.forEach(x => {
    const opt = document.createElement("option");
    opt.value = x;
    opt.textContent = x;
    select.appendChild(opt);
  });
}

/* ===============================
   INIT
============================== */
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 INIT APP");

  await abrirDB();
  await cargarRegistros();

  document.getElementById("btnBuscar")?.addEventListener("click", buscar);
  document.getElementById("dni")?.addEventListener("keydown", e => {
    if (e.key === "Enter") buscar();
  });

  document.getElementById("btnAgregar")?.addEventListener("click", abrirModalAgregar);
  document.getElementById("btnGuardarPersona")?.addEventListener("click", guardarPersona);
  document.getElementById("agregarCategoria")?.addEventListener("change", cargarCatalogos);
});

/* ===============================
   CONFIG
=============================== */
const API_URL = "https://script.google.com/macros/s/AKfycbz6ZaAYkyXMQg7-SRcSQ9rkCvSB1VgmdCkcUoZsbrBcLELgKp_EN5a9bC7W-pu6RY6B/exec";
const CLAVE_SEGURIDAD = "A123";

let personaActual = null;

/* ===============================
   EVENTOS
=============================== */
// Buscar persona
document.getElementById("btnBuscar").addEventListener("click", buscar);
document.getElementById("dni").addEventListener("keydown", e => {
  if (e.key === "Enter") buscar();
});

// Botón agregar persona
document.getElementById("btnAgregar")?.addEventListener("click", abrirModalAgregar);

// Modal de registro
document.getElementById("btnGuardarPersona")?.addEventListener("click", guardarPersona);
document.getElementById("btnCancelarPersona")?.addEventListener("click", cerrarModalAgregar);

// Al cambiar categoría, cargar catálogo
document.getElementById("agregarCategoria")?.addEventListener("change", async function() {
  const categoriaId = this.value;
  const catalogoSelect = document.getElementById("agregarCatalogo");
  catalogoSelect.innerHTML = "<option>Cargando...</option>";

  if (!categoriaId) {
    catalogoSelect.innerHTML = '<option value="">--Seleccione categoría primero--</option>';
    return;
  }

  try {
    const res = await fetch(`${API_URL}?accion=listaCatalogo&categoriaId=${categoriaId}`);
    const data = await res.json();
    catalogoSelect.innerHTML = '<option value="">--Seleccione--</option>';
    data.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.nombre;
      catalogoSelect.appendChild(opt);
    });
  } catch (err) {
    catalogoSelect.innerHTML = '<option value="">Error al cargar catálogo</option>';
  }
});

/* ===============================
   BUSCAR PERSONA
=============================== */
async function buscar() {
  const criterio = document.getElementById("dni").value.trim().toLowerCase();
  const tbody = document.querySelector("#tablaResultado tbody");

  if (!criterio) return;

  tbody.innerHTML = `<tr><td colspan="4">Buscando...</td></tr>`;

  try {
    // Traemos todos los registros (tu API actual)
    const res = await fetch(API_URL);
    const data = await res.json();

    // 🔎 Filtrar por nombre o DNI parcial
    const filtrados = data.filter(r =>
      (r.documento && r.documento.includes(criterio)) ||
      (r.nombre && r.nombre.toLowerCase().includes(criterio))
    );

    if (filtrados.length === 0) {
      personaActual = null;
      tbody.innerHTML = `<tr><td colspan="4">Sin resultados</td></tr>`;
      return;
    }

    // 🧠 Agrupar por DNI
    const agrupados = {};

    filtrados.forEach(reg => {
      if (!agrupados[reg.documento]) {
        agrupados[reg.documento] = [];
      }
      agrupados[reg.documento].push(reg);
    });

    tbody.innerHTML = "";

    // 🎯 Pintar UNA FILA por DNI
    Object.keys(agrupados).forEach(dni => {

      const registros = agrupados[dni];
      const personaBase = registros[0];

      // 🚦 Calcular semáforo por categoría
      let estadoFinal = "VERDE";

      const tieneAntecedente = registros.some(r =>
        r.categoria &&
        r.categoria.toUpperCase().includes("ANTECEDENTE")
      );

      const tieneLaboral = registros.some(r =>
        r.categoria &&
        r.categoria.toUpperCase().includes("LABORAL")
      );

      if (tieneAntecedente) {
        estadoFinal = "ROJO";
      } else if (tieneLaboral) {
        estadoFinal = "AMARILLO";
      }

      // Crear estructura compatible con tu modal actual
      const personaAgrupada = {
        persona: personaBase,
        detalles: registros
      };

      const fila = document.createElement("tr");

      fila.innerHTML = `
        <td>${personaBase.nombre}</td>
        <td>${dni}</td>
        <td>${personaBase.empresa}</td>
        <td>
          <span class="semaforo"
                title="Ver detalle"
                style="background:${colorSemaforo(estadoFinal)}">
          </span>
        </td>
      `;

      // Al hacer click se carga el historial en el modal
      fila.addEventListener("click", () => {
        personaActual = personaAgrupada;
        abrirModalSeguridad();
      });

      tbody.appendChild(fila);
    });

  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="4">Error de conexión</td></tr>`;
  }
}

/* ===============================
   SEMÁFORO
=============================== */
function colorSemaforo(estado) {
  return estado === "ROJO" ? "red" :
         estado === "AMARILLO" ? "orange" :
         "green";
}

/* ===============================
   MODAL SEGURIDAD
=============================== */
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
=============================== */
function mostrarDetalle() {
  const p = personaActual.persona;

  document.getElementById("detNombre").textContent = p.nombre;
  document.getElementById("detDocumento").textContent = p.documento;
  document.getElementById("detEmpresa").textContent = p.empresa;

  let nivelMax = 0;
  let descripcionMax = "VERDE";

  if (personaActual.detalles && personaActual.detalles.length > 0) {
    personaActual.detalles.forEach(det => {
      if (det.nivel > nivelMax) {
        nivelMax = det.nivel;
        descripcionMax = det.tipo_descripcion;
      }
    });
  }

  document.getElementById("detEstadoTexto").textContent = descripcionMax;
  document.getElementById("detEstadoSemaforo").style.background =
    nivelMax === 2 ? "red" :
    nivelMax === 1 ? "orange" :
    "green";

  const cont = document.getElementById("detDescripcion");

  if (!personaActual.detalles || personaActual.detalles.length === 0) {
    cont.textContent = "Sin registros.";
  } else {
    cont.innerHTML = personaActual.detalles
      .map(d => `
        <div class="detalle-item-modal">
          <strong>${d.tipo_descripcion} (${d.tipo_codigo})</strong><br>
          Categoria: <em>${d.categoria || "N/A"}</em><br>
          Catálogo: <em>${d.catalogo || "N/A"}</em><br>
          Detalle: ${d.descripcion || "-"}<br>
          Fecha: ${formatearFecha(d.fecha)}
        </div>
        <hr>
      `)
      .join("");
  }

  document.getElementById("modalDetalle").style.display = "flex";
}

function cerrarModalDetalle() {
  document.getElementById("modalDetalle").style.display = "none";
}

/* ===============================
   MODAL AGREGAR PERSONA
=============================== */
async function abrirModalAgregar() {
  document.getElementById("modalAgregar").style.display = "flex";
  document.getElementById("nuevoNombre").value = "";
  document.getElementById("nuevoDocumento").value = "";
  document.getElementById("nuevaEmpresa").value = "";
  document.getElementById("mensajeErrorAgregar").textContent = "";

  // Cargar categorías
  try {
    const res = await fetch(`${API_URL}?accion=listaCategorias`);
    const data = await res.json();
    const catSelect = document.getElementById("agregarCategoria");
    catSelect.innerHTML = '<option value="">--Seleccione--</option>';
    data.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.nombre;
      catSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Error cargando categorías", err);
  }

  // Reset catálogo
  const catalogoSelect = document.getElementById("agregarCatalogo");
  catalogoSelect.innerHTML = '<option value="">--Seleccione categoría primero--</option>';
}

function cerrarModalAgregar() {
  document.getElementById("modalAgregar").style.display = "none";
}

/* ===============================
   GUARDAR PERSONA (POST JSON)
=============================== */
async function guardarPersona() {
  const nombre = document.getElementById("nuevoNombre").value.trim();
  const documento = document.getElementById("nuevoDocumento").value.trim();
  const empresa = document.getElementById("nuevaEmpresa").value.trim();
  const categoria = document.getElementById("agregarCategoria").value;
  const catalogo = document.getElementById("agregarCatalogo").value;

  if (!nombre || !documento || !empresa || !categoria || !catalogo) {
    document.getElementById("mensajeErrorAgregar").textContent = "Todos los campos son obligatorios";
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "agregar",
        nombre,
        documento,
        empresa,
        categoria,
        catalogo
      })
    });

    const data = await res.json();

    if (data.exito) {
      alert("Persona agregada correctamente");
      cerrarModalAgregar();
      buscar();
    } else {
      document.getElementById("mensajeErrorAgregar").textContent = data.mensaje || "Error al guardar";
    }
  } catch (error) {
    document.getElementById("mensajeErrorAgregar").textContent = "Error de conexión";
  }
}

/* ===============================
   UTIL
=============================== */
function formatearFecha(fecha) {
  if (!fecha) return "";
  const f = new Date(fecha);
  return f.toLocaleDateString("es-PE");
}

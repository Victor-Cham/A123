/* ===============================
   CONFIG
=============================== */
const API_URL = "https://script.google.com/macros/s/AKfycbx8Reu89EN_O6f7NfPlqCRQifClHG74kSCAEJiZKetpd19B09OO9qmey680-26mH5ne/exec";
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

/* ===============================
   BUSCAR PERSONA
=============================== */
async function buscar() {
  const documento = document.getElementById("dni").value.trim();
  const tbody = document.querySelector("#tablaResultado tbody");

  if (!documento) return;

  tbody.innerHTML = `<tr><td colspan="4">Buscando...</td></tr>`;

  try {
    const res = await fetch(`${API_URL}?documento=${encodeURIComponent(documento)}`);
    const data = await res.json();

    if (!data.encontrado) {
      personaActual = null;
      tbody.innerHTML = `<tr><td colspan="4">Persona no encontrada</td></tr>`;
      return;
    }

    personaActual = data;

    tbody.innerHTML = `
      <tr>
        <td>${data.persona.nombre}</td>
        <td>${data.persona.documento}</td>
        <td>${data.persona.empresa}</td>
        <td>
          <span class="semaforo"
                title="Ver detalle"
                style="background:${colorSemaforo(data.estado)}"
                onclick="abrirModalSeguridad()">
          </span>
        </td>
      </tr>
    `;

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
function abrirModalAgregar() {
  document.getElementById("modalAgregar").style.display = "flex";
  // Resetear campos
  document.getElementById("nuevoNombre").value = "";
  document.getElementById("nuevoDocumento").value = "";
  document.getElementById("nuevaEmpresa").value = "";
  document.getElementById("mensajeErrorAgregar").textContent = "";
}

function cerrarModalAgregar() {
  document.getElementById("modalAgregar").style.display = "none";
}

async function guardarPersona() {
  const nombre = document.getElementById("nuevoNombre").value.trim();
  const documento = document.getElementById("nuevoDocumento").value.trim();
  const empresa = document.getElementById("nuevaEmpresa").value.trim();

  if (!nombre || !documento || !empresa) {
    document.getElementById("mensajeErrorAgregar").textContent = "Todos los campos son obligatorios";
    return;
  }

  try {
    const res = await fetch(`${API_URL}?accion=agregar&nombre=${encodeURIComponent(nombre)}&documento=${encodeURIComponent(documento)}&empresa=${encodeURIComponent(empresa)}`);
    const data = await res.json();

    if (data.exito) {
      alert("Persona agregada correctamente");
      cerrarModalAgregar();
      buscar(); // refresca tabla
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

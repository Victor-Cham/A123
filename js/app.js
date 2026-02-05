/* ===============================
   CONFIG
   =============================== */
const API_URL = "https://script.google.com/macros/s/AKfycbx8Reu89EN_O6f7NfPlqCRQifClHG74kSCAEJiZKetpd19B09OO9qmey680-26mH5ne/exec";
const CLAVE_SEGURIDAD = "Security100";

let personaActual = null;

/* ===============================
   EVENTOS
   =============================== */
document.getElementById("btnBuscar").addEventListener("click", buscar);
document.getElementById("dni").addEventListener("keydown", e => {
  if (e.key === "Enter") buscar();
});

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

  // Determinar la descripción más grave
  let nivelMax = 0;
  let descripcionMax = "VERDE"; // default si no hay detalle

  if (personaActual.detalles && personaActual.detalles.length > 0) {
    personaActual.detalles.forEach(det => {
      if (det.nivel > nivelMax) {
        nivelMax = det.nivel;
        descripcionMax = det.tipo_descripcion;
      }
    });
  }

  // Mostrar descripción en el modal
  document.getElementById("detEstadoTexto").textContent = descripcionMax;

  // Colorear el semáforo según el nivel máximo
  document.getElementById("detEstadoSemaforo").style.background =
    nivelMax === 2 ? "red" :
    nivelMax === 1 ? "orange" :
    "green";

  // Detalles
  const cont = document.getElementById("detDescripcion");

  if (!personaActual.detalles || personaActual.detalles.length === 0) {
    cont.textContent = "Sin registros.";
  } else {
    cont.innerHTML = personaActual.detalles
      .map(d => `• ${d.descripcion} (${formatearFecha(d.fecha)})`)
      .join("<br>");
  }

  // Abrir modal de detalle
  document.getElementById("modalDetalle").style.display = "flex";
}

function cerrarModalDetalle() {
  document.getElementById("modalDetalle").style.display = "none";
}

/* ===============================
   UTIL
   =============================== */
function formatearFecha(fecha) {
  if (!fecha) return "";
  const f = new Date(fecha);
  return f.toLocaleDateString("es-PE");
}

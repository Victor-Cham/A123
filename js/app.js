const CLAVE_SEGURIDAD = "A123";
let personaActual = null;

// Datos simulados (luego Google Sheets)
const datos = {
  "12345678": {
    nombre: "Juan Perez",
    empresa: "Empresa X",
    estado: "VERDE",
    detalle: "Sin restricciones ni antecedentes."
  },
  "87654321": {
    nombre: "Maria Lopez",
    empresa: "Empresa Y",
    estado: "ROJO",
    detalle: "Antecedente registrado en 2023."
  }
};

document.getElementById("btnBuscar").addEventListener("click", buscar);
document.getElementById("dni").addEventListener("keydown", e => {
  if (e.key === "Enter") buscar();
});

function buscar() {
  const dni = document.getElementById("dni").value.trim();
  const tbody = document.querySelector("#tablaResultado tbody");
  tbody.innerHTML = "";

  personaActual = datos[dni];

  if (!personaActual) {
    tbody.innerHTML = `<tr><td colspan="4">Persona no encontrada</td></tr>`;
    return;
  }

  tbody.innerHTML = `
    <tr>
      <td>${personaActual.nombre}</td>
      <td>${dni}</td>
      <td>${personaActual.empresa}</td>
      <td>
        <span class="semaforo"
              style="background:${colorSemaforo(personaActual.estado)}"
              onclick="abrirModal()"></span>
      </td>
    </tr>
  `;
}

function colorSemaforo(estado) {
  return estado === "VERDE" ? "green" :
         estado === "AMARILLO" ? "orange" :
         estado === "ROJO" ? "red" : "gray";
}

/* Seguridad */
function abrirModal() {
  document.getElementById("codigoAcceso").value = "";
  document.getElementById("mensajeError").textContent = "";
  document.getElementById("modal").style.display = "flex";
}

function validarCodigo() {
  const codigo = document.getElementById("codigoAcceso").value;
  if (codigo === CLAVE_SEGURIDAD) {
    cerrarModal();
    mostrarDetalle();
  } else {
    document.getElementById("mensajeError").textContent = "Código incorrecto";
  }
}

function cerrarModal() {
  document.getElementById("modal").style.display = "none";
}

/* Detalle */
function mostrarDetalle() {
  document.getElementById("detNombre").textContent = personaActual.nombre;
  document.getElementById("detDocumento").textContent = document.getElementById("dni").value;
  document.getElementById("detEmpresa").textContent = personaActual.empresa;
  document.getElementById("detEstadoTexto").textContent = personaActual.estado;
  document.getElementById("detDescripcion").textContent = personaActual.detalle;
  document.getElementById("detEstadoSemaforo").style.background =
    colorSemaforo(personaActual.estado);

  document.getElementById("modalDetalle").style.display = "flex";
}

function cerrarModalDetalle() {
  document.getElementById("modalDetalle").style.display = "none";
}

const CLAVE_SEGURIDAD = "A123"; // Cambiar luego o mover a backend
let detallePendiente = null;

// Simulación de datos
const datosSimulados = {
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

// Botón buscar
document.getElementById("btnBuscar").addEventListener("click", buscar);

// Buscar con ENTER
document.getElementById("dni").addEventListener("keydown", e => {
  if (e.key === "Enter") buscar();
});

function buscar() {
  const dni = document.getElementById("dni").value.trim();
  const tbody = document.querySelector("#tablaResultado tbody");
  tbody.innerHTML = "";

  const persona = datosSimulados[dni];

  if (!persona) {
    tbody.innerHTML = `<tr><td colspan="4">Persona no encontrada</td></tr>`;
    return;
  }

  // Guardamos el detalle SOLO después de encontrar a la persona
  detallePendiente = persona.detalle;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${persona.nombre}</td>
    <td>${dni}</td>
    <td>${persona.empresa}</td>
    <td>
      <div class="semaforo"
           style="background:${colorSemaforo(persona.estado)}"
           title="Ver detalle"
           onclick="abrirModal()">
      </div>
    </td>
  `;

  tbody.appendChild(tr);
}

function colorSemaforo(estado) {
  return estado === "VERDE" ? "green" :
         estado === "AMARILLO" ? "orange" :
         estado === "ROJO" ? "red" : "gray";
}

/* ===== Seguridad ===== */

function abrirModal() {
  if (!detallePendiente) return; // Seguridad extra
  document.getElementById("codigoAcceso").value = "";
  document.getElementById("mensajeError").textContent = "";
  document.getElementById("modal").style.display = "flex";
}

function validarCodigo() {
  const codigo = document.getElementById("codigoAcceso").value;

  if (codigo === CLAVE_SEGURIDAD) {
    alert("DETALLE:\n\n" + detallePendiente);
    cerrarModal();
  } else {
    document.getElementById("mensajeError").textContent = "Código incorrecto";
  }
}

function cerrarModal() {
  document.getElementById("modal").style.display = "none";
}

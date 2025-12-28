const CLAVE_SEGURIDAD = "A123"; // 👉 cambia esta clave

let detallePendiente = null;

// Datos simulados
const datosSimulados = {
  "12345678": {
    nombre: "Juan Perez",
    empresa: "Empresa X",
    semaforo: "VERDE",
    detalle: "Sin restricciones ni antecedentes."
  },
  "87654321": {
    nombre: "Maria Lopez",
    empresa: "Empresa Y",
    semaforo: "ROJO",
    detalle: "Antecedente registrado en 2023."
  }
};

// Buscar con botón
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

  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${persona.nombre}</td>
    <td>${dni}</td>
    <td>${persona.empresa}</td>
    <td>
      <div class="semaforo" 
           style="background:${colorSemaforo(persona.semaforo)}"
           onclick="solicitarCodigo('${persona.detalle}')">
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

/* ===== Seguridad / Modal ===== */

function solicitarCodigo(detalle) {
  detallePendiente = detalle;
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

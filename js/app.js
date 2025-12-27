// Función para actualizar color del semáforo
function actualizarSemaforoColor(elemento, color) {
  elemento.style.background = color === "VERDE" ? "green" :
                             color === "AMARILLO" ? "orange" :
                             color === "ROJO" ? "red" : "gray";
}

// Función de búsqueda
function buscar() {
  const dni = document.getElementById('dni').value.trim();

  // Datos de ejemplo
  const datosSimulados = {
    "12345678": { nombre: "Juan Perez", empresa: "Empresa X", semaforo: "VERDE" },
    "87654321": { nombre: "Maria Lopez", empresa: "Empresa Y", semaforo: "ROJO" }
  };

  const resultado = datosSimulados[dni];
  const tbody = document.querySelector('#tablaResultado tbody');
  tbody.innerHTML = ""; // Limpiar resultados anteriores

  if (resultado) {
    const tr = document.createElement('tr');

    // Persona
    const tdPersona = document.createElement('td');
    tdPersona.textContent = resultado.nombre;

    // DNI
    const tdDni = document.createElement('td');
    tdDni.textContent = dni;

    // Empresa
    const tdEmpresa = document.createElement('td');
    tdEmpresa.textContent = resultado.empresa;

    // Semáforo
    const tdSemaforo = document.createElement('td');
    const divSemaforo = document.createElement('div');
    divSemaforo.classList.add('semaforo');
    actualizarSemaforoColor(divSemaforo, resultado.semaforo);
    tdSemaforo.appendChild(divSemaforo);

    // Agregar columnas a la fila
    tr.appendChild(tdPersona);
    tr.appendChild(tdDni);
    tr.appendChild(tdEmpresa);
    tr.appendChild(tdSemaforo);

    // Agregar fila al tbody
    tbody.appendChild(tr);
  } else {
    // Persona no encontrada
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = "Persona no encontrada";
    td.style.color = "red";
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
}

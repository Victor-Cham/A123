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
  const contenedor = document.getElementById('resultado');
  contenedor.innerHTML = "";

  if (resultado) {
    const fila = document.createElement('div');
    fila.classList.add('fila');

    // Persona
    const divPersona = document.createElement('div');
    divPersona.textContent = resultado.nombre;

    // DNI
    const divDni = document.createElement('div');
    divDni.textContent = dni;

    // Empresa
    const divEmpresa = document.createElement('div');
    divEmpresa.textContent = resultado.empresa;

    // Semáforo
    const divSemaforo = document.createElement('div');
    divSemaforo.classList.add('semaforo');
    actualizarSemaforoColor(divSemaforo, resultado.semaforo);

    // Agregar columnas a fila
    fila.appendChild(divPersona);
    fila.appendChild(divDni);
    fila.appendChild(divEmpresa);
    fila.appendChild(divSemaforo);

    // Agregar fila al contenedor
    contenedor.appendChild(fila);
  } else {
    contenedor.textContent = "Persona no encontrada";
  }
}

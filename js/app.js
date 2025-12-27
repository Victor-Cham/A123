// Actualiza semáforo
function actualizarSemaforo(color) {
  document.getElementById("verde").style.background = color === "VERDE" ? "green" : "gray";
  document.getElementById("amarillo").style.background = color === "AMARILLO" ? "orange" : "gray";
  document.getElementById("rojo").style.background = color === "ROJO" ? "red" : "gray";
}

// Buscar persona (simulación)
function buscar() {
  const dni = document.getElementById('dni').value.trim();

  // Datos de ejemplo
  const datosSimulados = {
    "12345678": { persona: { nombre: "Juan Perez", empresa: "Empresa X" }, semaforo: "VERDE" },
    "87654321": { persona: { nombre: "Maria Lopez", empresa: "Empresa Y" }, semaforo: "ROJO" }
  };

  const resultado = datosSimulados[dni];

  if (resultado) {
    document.getElementById('resultado').innerHTML = `
      <h3>${resultado.persona.nombre}</h3>
      <p>Empresa: ${resultado.persona.empresa}</p>
    `;
    actualizarSemaforo(resultado.semaforo);
  } else {
    document.getElementById('resultado').innerHTML = `<p>Persona no encontrada</p>`;
    actualizarSemaforo("VERDE");
  }
}

// Animación del Husky: cabeza sigue el cursor
document.addEventListener('mousemove', e => {
  const head = document.querySelector('.dog .head');
  const dog = document.querySelector('.dog');
  const rect = dog.getBoundingClientRect();
  const dx = e.clientX - (rect.left + rect.width/2);
  const dy = e.clientY - (rect.top + rect.height/2);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  head.style.transform = `rotate(${angle}deg)`;
});

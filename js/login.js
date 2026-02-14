// URL de tu Apps Script de login
const URL_LOGIN = "https://script.google.com/macros/s/AKfycbxakXFtA1t_CARxcRIduLZMOG1RqQP7reK59mVUd-HPqZgfq7l3NKjJEjmh2O0RYRs9Zw/exec"; // <- reemplaza con tu URL real

// Capturar formulario
const form = document.getElementById("loginForm");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    login();
  });
}

// Función login
async function login() {
  const usuario = document.getElementById("usuario").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();
  const alertDiv = document.getElementById("alert");

  alertDiv.style.display = "none";
  alertDiv.textContent = "";

  if (!usuario || !contrasena) {
    alertDiv.textContent = "Ingrese usuario y contraseña";
    alertDiv.style.display = "block";
    return;
  }

  try {
    const res = await fetch(`${URL_LOGIN}?action=login&usuario=${encodeURIComponent(usuario)}&contrasena=${encodeURIComponent(contrasena)}`);
    const data = await res.json();

    if (data.success) {
      // Guardar sessionId en localStorage
      localStorage.setItem("sessionId", data.sessionId);
      localStorage.setItem("usuario", data.Usuario);
      localStorage.setItem("tipoUsuario", data.TipoUsuario);

      // Redirigir según tipoUsuario
      if (data.TipoUsuario.toLowerCase() === "admin") {
        window.location.href = "dashboard.html"; // página de admin
      } else {
        window.location.href = "consulta.html"; // página de usuario normal
      }
    } else {
      alertDiv.textContent = data.message || "Error en login";
      alertDiv.style.display = "block";
    }
  } catch (err) {
    alertDiv.textContent = "Error de conexión";
    alertDiv.style.display = "block";
    console.error(err);
  }
}

// Función para validar sesión al cargar cualquier página protegida
function validarSesion() {
  const sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    window.location.href = "login.html";
  }
}

// Función logout
function logout() {
  localStorage.removeItem("sessionId");
  localStorage.removeItem("usuario");
  localStorage.removeItem("tipoUsuario");
  window.location.href = "login.html";
}

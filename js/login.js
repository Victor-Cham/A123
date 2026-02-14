// URL de tu Apps Script de login
const URL_LOGIN = "TU_APPS_SCRIPT_LOGIN_URL"; // <- reemplaza con tu URL real

async function login() {
  const usuario = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorP = document.getElementById("error");

  if (!usuario || !password) {
    errorP.innerText = "Ingrese usuario y contraseña";
    return;
  }

  try {
    const res = await fetch(URL_LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password })
    });

    const data = await res.json();

    if (data.success) {
      // Guardamos sesión única
      localStorage.setItem("usuario", usuario);
      localStorage.setItem("sessionId", data.sessionId);

      // Redirigir a tu sistema principal
      window.location.href = "index.html";
    } else {
      errorP.innerText = data.message || "Usuario o contraseña incorrectos";
    }
  } catch (err) {
    console.error(err);
    errorP.innerText = "Error de conexión con el servidor";
  }
}

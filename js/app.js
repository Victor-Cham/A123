/* ===============================
   CONFIG
   =============================== */
const API_URL = "TU_URL_DE_APPS_SCRIPT";
const USUARIO = "admin";
const PASSWORD = "1234";

let personaActual = null;
let personaRegistro = null;
let loginOk = false;

/* ===============================
   EVENTOS
   =============================== */
document.getElementById("btnBuscar").addEventListener("click", buscar);
document.getElementById("dni").addEventListener("keydown", e => { if(e.key==="Enter") buscar(); });
document.getElementById("loginIcon").addEventListener("click",()=>{ document.getElementById("modalLogin").style.display="flex"; });

/* ===============================
   LOGIN
   =============================== */
function validarLogin(){
  const u = document.getElementById("usuarioLogin").value;
  const p = document.getElementById("passLogin").value;

  if(u===USUARIO && p===PASSWORD){
    loginOk = true;
    cerrarModal('modalLogin');
    document.getElementById("modalRegistro").style.display="flex";
  } else {
    document.getElementById("mensajeErrorLogin").textContent="Usuario o contraseña incorrectos";
  }
}

function cerrarModal(id){ document.getElementById(id).style.display="none"; }

/* ===============================
   BUSCAR PERSONA
   =============================== */
async function buscar() {
  const documento = document.getElementById("dni").value.trim();
  const tbody = document.querySelector("#tablaResultado tbody");
  if(!documento) return;

  tbody.innerHTML = `<tr><td colspan="4">Buscando...</td></tr>`;

  try{
    const res = await fetch(`${API_URL}?documento=${encodeURIComponent(documento)}`);
    const data = await res.json();

    if(!data.encontrado){
      personaActual=null;
      tbody.innerHTML=`<tr><td colspan="4">Persona no encontrada</td></tr>`;
      return;
    }

    personaActual = data;
    tbody.innerHTML=`
      <tr>
        <td>${data.persona.nombre}</td>
        <td>${data.persona.documento}</td>
        <td>${data.persona.empresa}</td>
        <td>
          <span class="semaforo"
                title="Ver detalle"
                style="background:${colorSemaforo(data.estado)}"
                onclick="abrirModalDetalle()"></span>
        </td>
      </tr>
    `;
  }catch(e){
    tbody.innerHTML=`<tr><td colspan="4">Error de conexión</td></tr>`;
  }
}

/* ===============================
   SEMAFORO
   =============================== */
function colorSemaforo(estado){
  return estado==="ROJO"?"red":estado==="AMARILLO"?"orange":"green";
}

/* ===============================
   MODAL DETALLE
   =============================== */
function abrirModalDetalle(){
  if(!personaActual) return;
  document.getElementById("detNombre").textContent=personaActual.persona.nombre;
  document.getElementById("detDocumento").textContent=personaActual.persona.documento;
  document.getElementById("detEmpresa").textContent=personaActual.persona.empresa;

  document.getElementById("detEstadoTexto").textContent=personaActual.estado==="ROJO"?"ANTECEDENTE":personaActual.estado;
  document.getElementById("detEstadoSemaforo").style.background=colorSemaforo(personaActual.estado);

  const cont=document.getElementById("detDescripcion");
  if(!personaActual.detalles || personaActual.detalles.length===0){
    cont.textContent="Sin registros.";
  } else {
    cont.innerHTML=personaActual.detalles.map(d=>`• ${d.descripcion} (${formatearFecha(d.fecha)})`).join("<br>");
  }

  document.getElementById("modalDetalle").style.display="flex";
}

function formatearFecha(fecha){
  if(!fecha) return "";
  const f=new Date(fecha);
  return f.toLocaleDateString("es-PE");
}

/* ===============================
   MODAL REGISTRO
   =============================== */
function buscarPersonaRegistro(){
  const doc=document.getElementById("regDocumento").value.trim();
  if(!doc) return;

  fetch(`${API_URL}?documento=${encodeURIComponent(doc)}`)
    .then(res=>res.json())
    .then(data=>{
      if(data.encontrado){
        personaRegistro=data.persona;
        document.getElementById("personaDatos").style.display="none";
        document.getElementById("mensajeRegistro").textContent="Persona encontrada. Puede agregar A123";
      } else {
        personaRegistro=null;
        document.getElementById("personaDatos").style.display="block";
        document.getElementById("mensajeRegistro").textContent="Persona no encontrada. Complete los datos";
      }
    });
}

function registrar(){
  const doc=document.getElementById("regDocumento").value.trim();
  const nombre=document.getElementById("regNombre").value.trim();
  const empresa=document.getElementById("regEmpresa").value.trim();
  const tipo=document.getElementById("regTipo").value;
  const detalle=document.getElementById("regDetalle").value;

  if(!doc || !tipo) return;

  let payload={};
  if(personaRegistro){ // ya existe persona
    payload={accion:"insertA123", persona_id:personaRegistro.persona_id, tipo_id:tipo, detalle:detalle};
  } else { // nueva persona
    payload={accion:"insertPersonaA123", documento:doc, nombre:nombre, empresa:empresa, tipo_id:tipo, detalle:detalle};
  }

  fetch(API_URL,{
    method:"POST",
    body:JSON.stringify(payload)
  })
  .then(res=>res.json())
  .then(r=>{ document.getElementById("mensajeRegistro").textContent=r.mensaje||"Registrado con éxito"; })
  .catch(err=>{ document.getElementById("mensajeRegistro").textContent="Error al registrar"; });
}

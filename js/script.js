/* =========================
   CONFIGURACIÓN GLOBAL
========================= */
const API_URL = "http://localhost:3000";
const NOVA_URL =
  "https://n8n.comware.com.co/webhook/chat-portalgestionderegistroderequerimientos";

const STORAGE_REQ = "requerimientos";
const STORAGE_MIS_REQ = "misRequerimientos";

const USUARIO_ACTUAL = "usuario_demo"; // 🔴 temporal, luego será login real
const THREAD_ID_KEY = "threadId";

/* =========================
   UTILIDADES
========================= */
function generarThreadId() {
  return "thread_" + Date.now();
}

function scrollToBottom(force = false) {
  const chat = document.getElementById("chatMessages");
  if (!chat) return;

  const nearBottom =
    chat.scrollHeight - chat.scrollTop - chat.clientHeight < 80;

  if (force || nearBottom) {
    requestAnimationFrame(() => {
      chat.scrollTop = chat.scrollHeight;
    });
  }
}

function formatMessage(text) {
  if (!text) return "";

  return text
    .replace(/hola/gi, "👋 Holaaa")
    .replace(/gracias/gi, "🙏 Gracias")
    .replace(/incidente/gi, "⚠️ Incidente")
    .replace(/requerimiento/gi, "📝 Requerimiento")
    .replace(/\n/g, "<br>");
}

function removeFile() {
  const input = document.getElementById("fileInput");
  const preview = document.getElementById("filePreview");
  if (input) input.value = "";
  if (preview) preview.innerHTML = "";
}

/* =========================
   NAVEGACIÓN
========================= */
function irNuevo() {
  localStorage.removeItem("reqTemporal");
  window.location.href = "nuevo.html";
}

function irAgentes() {
  window.location.href = "agente.html";
}

function irNova() {
  window.open("https://nova.comware.com.co/", "_blank");
}

/* =========================
   CHATBOT NOVA
========================= */
async function sendMessage() {
  const input = document.getElementById("userInput");
  const chat = document.getElementById("chatMessages");
  const fileInput = document.getElementById("fileInput");

  if (!input || !chat) return;

  const texto = input.value.trim();
  const file = fileInput?.files[0];
  if (!texto && !file) return;

  if (!localStorage.getItem(THREAD_ID_KEY)) {
    localStorage.setItem(THREAD_ID_KEY, generarThreadId());
  }

  // Mensaje usuario
  const userMsg = document.createElement("div");
  userMsg.className = "message user";
  userMsg.innerHTML = `
        <div class="message-content">
            ${texto}${file ? `<br><small>📎 ${file.name}</small>` : ""}
        </div>
        <div class="message-icon">
            <img src="img/avatar.png">
        </div>
    `;
  chat.appendChild(userMsg);
  scrollToBottom(true);

  input.value = "";
  removeFile();

  // Typing bot
  const typing = document.createElement("div");
  typing.className = "message bot typing";
  typing.innerHTML = `
        <div class="message-icon"><img src="img/bot.png"></div>
        <div class="message-content">NOVA está escribiendo...</div>
    `;
  chat.appendChild(typing);
  scrollToBottom(true);

  try {
    const formData = new FormData();
    formData.append("message", texto);
    formData.append("threadId", localStorage.getItem(THREAD_ID_KEY));
    if (file) formData.append("file", file);

    const res = await fetch(NOVA_URL, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    typing.remove();

    procesarRespuestaNova(data.reply);
  } catch (err) {
    typing.remove();
    console.error(err);
  }
}

function procesarRespuestaNova(respuesta) {
  const chat = document.getElementById("chatMessages");
  if (!chat) return;

  const botMsg = document.createElement("div");
  botMsg.className = "message bot";
  botMsg.innerHTML = `
        <div class="message-icon"><img src="img/bot.png"></div>
        <div class="message-content">${formatMessage(respuesta)}</div>
    `;
  chat.appendChild(botMsg);
  scrollToBottom(true);

  if (
    respuesta &&
    respuesta.toLowerCase().includes("plantilla final generada")
  ) {
    guardarRequerimiento(respuesta);
  }
}

/* =========================
   REQUERIMIENTOS
========================= */
function guardarRequerimiento(texto) {
  const id = "REQ_" + Date.now();
  const fecha = new Date().toLocaleString();
  const html = convertirPlantillaAHTML(texto);

  const req = {
    id,
    titulo: "Requerimiento generado por NOVA",
    autor: USUARIO_ACTUAL,
    fecha,
    contenido: html,
    estado: "Pendiente",
  };

  const misReq = JSON.parse(localStorage.getItem(STORAGE_MIS_REQ)) || [];
  misReq.push(req);
  localStorage.setItem(STORAGE_MIS_REQ, JSON.stringify(misReq));

  const bandeja = JSON.parse(localStorage.getItem(STORAGE_REQ)) || [];
  bandeja.push(req);
  localStorage.setItem(STORAGE_REQ, JSON.stringify(bandeja));

  localStorage.setItem("reqTemporal", html);
}

function convertirPlantillaAHTML(texto) {
  if (!texto) return "";

  const limpio = texto.replace(/^plantilla final generada:?/i, "").trim();
  const lineas = limpio.split("\n");

  let html = `<div class="doc-container">
        <div class="doc-header">REQUERIMIENTO TÉCNICO - COMWARE</div>`;

  lineas.forEach((l) => {
    l = l.trim();
    if (!l) return;

    if (l.includes(":")) {
      const [k, ...v] = l.split(":");
      html += `
                <div class="doc-field">
                    <span class="doc-label">${k}:</span>
                    <span class="doc-value">${v.join(":").trim()}</span>
                </div>`;
    } else {
      html += `<p class="doc-paragraph">${l}</p>`;
    }
  });

  html += `<div class="doc-footer-watermark">Generado por NOVA AI</div></div>`;
  return html;
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem(THREAD_ID_KEY)) {
    localStorage.setItem(THREAD_ID_KEY, generarThreadId());
  }

  const userInput = document.getElementById("userInput");
  if (userInput) {
    userInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  scrollToBottom(true);
});

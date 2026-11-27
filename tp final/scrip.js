const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const chatMessages = document.getElementById("chat-messages");
const emptyState = document.getElementById("empty-state");
const sendButton = document.getElementById("send-button");

// Genera un sessionId por pestaña, similar al que envía el webhook en el flujo
const sessionId =
  crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function appendUserMessage(text) {
  if (emptyState) {
    emptyState.remove();
  }

  const bubble = document.createElement("div");
  bubble.className = "message message-user";
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendBotMessage(text) {
  if (emptyState) {
    emptyState.remove();
  }

  const wrapper = document.createElement("div");
  wrapper.className = "message message-bot";

  const label = document.createElement("span");
  label.className = "bot-label";
  label.textContent = "MAKE";

  const content = document.createElement("div");
  content.textContent = text;

  wrapper.appendChild(label);
  wrapper.appendChild(content);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return content;
}

function parseMakeResponse(rawText) {
  try {
    const parsed = JSON.parse(rawText);
    if (parsed && typeof parsed.response === "string") {
      return parsed.response;
    }
    if (typeof parsed === "string") {
      return parsed;
    }
    return rawText;
  } catch {
    return rawText;
  }
}

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const mensaje = messageInput.value.trim();
  if (!mensaje) return;

  if (!WEBHOOK_URL || WEBHOOK_URL.includes("ACA VA EL CODIGO")) {
    appendUserMessage(mensaje);
    appendBotMessage("Configura primero tu WEBHOOK_URL en config.js.");
    return;
  }

  appendUserMessage(mensaje);
  messageInput.value = "";
  sendButton.disabled = true;

  const botContentElement = appendBotMessage("Escribiendo...");

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        mensaje,
        fecha: new Date().toISOString(),
      }),
    });

    const rawBody = await response.text();

    if (!response.ok) {
      botContentElement.textContent = rawBody || `Error HTTP ${response.status}`;
      return;
    }

    botContentElement.textContent = parseMakeResponse(rawBody) || "Accepted";
  } catch (error) {
    botContentElement.textContent = `Error de conexión: ${error.message}`;
  } finally {
    sendButton.disabled = false;
    messageInput.focus();
  }
});
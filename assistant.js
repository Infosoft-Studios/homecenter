const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const chatMessages = document.querySelector("#chat-messages");
const chatSend = chatForm.querySelector("button[type='submit']");
const assistantStatus = document.querySelector("#assistant-status");
const conversation = [];
let replyPending = false;

async function readJsonResponse(response) {
  const body = await response.text();
  try {
    return JSON.parse(body);
  } catch {
    const snippet = body.trim().slice(0, 160);
    if (/forbidden/i.test(snippet)) {
      throw new Error("The page preview blocked Milo's API request. Start `python server.py` and open http://127.0.0.1:8000/app.html.");
    }
    throw new Error(`The server returned an unreadable response (HTTP ${response.status}). ${snippet || "Please start HomeCenter with python server.py."}`);
  }
}

function addChatMessage(text, kind) {
  const row = document.createElement("div");
  row.className = `chat-message ${kind}-message`;
  if (kind === "assistant") {
    const avatar = document.createElement("span");
    avatar.className = "message-avatar";
    avatar.textContent = "M";
    row.append(avatar);
  }
  const bubble = document.createElement("p");
  bubble.textContent = text;
  row.append(bubble);
  chatMessages.append(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return row;
}

async function updateConnectionStatus() {
  if (!assistantStatus) return;
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    if (!response.ok) throw new Error("Server unavailable");
    const health = await readJsonResponse(response);
    assistantStatus.dataset.state = health.configured ? "connected" : "setup";
    assistantStatus.lastChild.textContent = health.configured ? " LIVE AI" : " SETUP NEEDED";
  } catch {
    assistantStatus.dataset.state = "offline";
    assistantStatus.lastChild.textContent = " SERVER OFFLINE";
  }
}

async function sendToMilo(text) {
  const message = text.trim();
  if (!message || replyPending) return;

  addChatMessage(message, "user");
  chatInput.value = "";
  replyPending = true;
  chatSend.disabled = true;
  const typing = addChatMessage("Milo is thinking...", "assistant");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...conversation, { role: "user", content: message }].slice(-24) }),
    });
    const data = await readJsonResponse(response);
    if (!response.ok) throw new Error(data.error || `The chat server returned ${response.status}.`);
    if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("Milo returned an empty reply. Please try again.");
    conversation.push({ role: "user", content: message }, { role: "assistant", content: data.reply });
    if (conversation.length > 24) conversation.splice(0, conversation.length - 24);
    typing.remove();
    addChatMessage(data.reply, "assistant");
  } catch (error) {
    typing.remove();
    addChatMessage(error.message || "I couldn't connect right now. Please try again.", "assistant");
  } finally {
    replyPending = false;
    chatSend.disabled = false;
    chatInput.focus();
  }
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendToMilo(chatInput.value);
});

document.querySelectorAll(".chat-suggestions [data-prompt]").forEach((button) => {
  button.addEventListener("click", () => sendToMilo(button.dataset.prompt));
});

updateConnectionStatus();

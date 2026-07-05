const DEFAULT_SYSTEM_PROMPT = "You are URVIS Local AI, a local coding assistant focused on Unity C# and practical software development. You cannot read files unless the user pastes code into the chat. Do not invent project files. Work only with the code, errors, and context the user provides. Prefer small safe changes. Do not rename public or [SerializeField] fields unless necessary because Unity Inspector references may break. Do not suggest editing Unity .unity, .prefab, .asset, .meta, .anim, or .controller YAML unless explicitly requested. Be direct, useful, and explain what to test in Unity.";

const DEFAULT_SETTINGS = {
  host: "http://127.0.0.1:11434",
  model: "qwen2.5-coder:7b-instruct",
  manualModel: "",
  temperature: 0.35,
  maxTokens: 2048,
  systemPrompt: DEFAULT_SYSTEM_PROMPT
};

const MODE_PROMPTS = {
  chat: {
    label: "Chat",
    description: "Γενική συνομιλία για Unity C#, debugging και πρακτική ανάπτυξη λογισμικού.",
    prefix: ""
  },
  explain: {
    label: "Code Explain",
    description: "Ανάλυση pasted Unity C# κώδικα με εξαρτήσεις, πιθανά bugs και ασφαλείς βελτιώσεις.",
    prefix: "This is a Unity C# script. Explain what it does, list dependencies, possible bugs, and safe improvements. Do not assume other files exist unless I paste them.\n\n"
  },
  refactor: {
    label: "Refactor",
    description: "Μικρές καθαρές βελτιώσεις χωρίς περιττές αλλαγές συμπεριφοράς.",
    prefix: "Refactor this Unity C# code with minimal behavior changes. Do not rename public or [SerializeField] fields unless necessary. Keep Unity Inspector references safe. Explain what changed.\n\n"
  },
  debug: {
    label: "Debug Errors",
    description: "Ερμηνεία Unity Console errors με αιτία και ασφαλέστερη διόρθωση.",
    prefix: "Help me understand this Unity Console error. I will paste the full error and relevant code. Explain the cause and the safest fix.\n\n"
  },
  script: {
    label: "Script Generator",
    description: "Δημιουργία απλών inspector-friendly Unity 6 MonoBehaviour scripts.",
    prefix: "Generate a Unity 6 C# MonoBehaviour for the following behavior. Keep it simple, inspector-friendly, and avoid unrelated systems.\n\n"
  },
  library: {
    label: "Prompt Library",
    description: "Πρότυπα prompts για pasted code, errors, refactor και brainstorming συστημάτων.",
    prefix: ""
  },
  settings: {
    label: "Settings",
    description: "Ρύθμιση host, μοντέλου, temperature, tokens και system prompt.",
    prefix: ""
  }
};

const TEMPLATE_TEXT = {
  snippet: "This is a Unity C# script. Explain what it does, list dependencies, possible bugs, and safe improvements. Do not assume other files exist unless I paste them.\n\n```csharp\n// Paste script here\n```",
  debug: "Help me understand this Unity Console error. I will paste the full error and relevant code. Explain the cause and the safest fix.\n\nError:\n\nRelevant code:\n",
  unity: "Generate a Unity 6 C# MonoBehaviour for the following behavior. Keep it simple, inspector-friendly, and avoid unrelated systems.\n\nBehavior:\n"
};

const STORAGE_KEYS = {
  settings: "urvis.local-ai.settings",
  messages: "urvis.local-ai.messages"
};

const state = {
  settings: loadSettings(),
  messages: loadMessages(),
  mode: "chat",
  streaming: false,
  abortController: null
};

const els = {
  chatLog: document.getElementById("chat-log"),
  form: document.getElementById("chat-form"),
  input: document.getElementById("message-input"),
  sendButton: document.getElementById("send-button"),
  stopButton: document.getElementById("stop-button"),
  modeList: document.getElementById("mode-list"),
  modeDescription: document.getElementById("mode-description"),
  ollamaStatus: document.getElementById("ollama-status"),
  modelStatus: document.getElementById("model-status"),
  selectedModelLabel: document.getElementById("selected-model-label"),
  messageCount: document.getElementById("message-count"),
  aiCore: document.getElementById("ai-core"),
  settingsModal: document.getElementById("settings-modal"),
  settingsButton: document.getElementById("settings-button"),
  closeSettingsButton: document.getElementById("close-settings-button"),
  settingsForm: document.getElementById("settings-form"),
  hostInput: document.getElementById("host-input"),
  modelSelect: document.getElementById("model-select"),
  manualModelInput: document.getElementById("manual-model-input"),
  temperatureInput: document.getElementById("temperature-input"),
  temperatureValue: document.getElementById("temperature-value"),
  maxTokensInput: document.getElementById("max-tokens-input"),
  systemPromptInput: document.getElementById("system-prompt-input"),
  resetSettingsButton: document.getElementById("reset-settings-button"),
  newChatButton: document.getElementById("new-chat-button"),
  exportButton: document.getElementById("export-button"),
  clearButton: document.getElementById("clear-button"),
  importInput: document.getElementById("import-input"),
  particleCanvas: document.getElementById("particle-canvas")
};

init();

function init() {
  renderMessages();
  bindEvents();
  fillSettingsForm();
  autoResizeInput();
  updateSessionInfo();
  startParticles();
  loadModels();
}

function bindEvents() {
  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
  });

  els.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  els.input.addEventListener("input", autoResizeInput);

  els.modeList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;
    setMode(button.dataset.mode);
  });

  document.addEventListener("click", (event) => {
    const templateButton = event.target.closest("[data-template]");
    if (templateButton) {
      insertTemplate(templateButton.dataset.template);
      return;
    }

    const copyMessageButton = event.target.closest("[data-copy-message]");
    if (copyMessageButton) {
      const index = Number(copyMessageButton.dataset.copyMessage);
      copyText(state.messages[index]?.content || "", "Το μήνυμα αντιγράφηκε.");
      return;
    }

    const copyCodeButton = event.target.closest("[data-copy-code]");
    if (copyCodeButton) {
      copyText(decodeURIComponent(copyCodeButton.dataset.copyCode), "Ο κώδικας αντιγράφηκε.");
    }
  });

  els.stopButton.addEventListener("click", stopStreaming);
  els.settingsButton.addEventListener("click", openSettings);
  els.closeSettingsButton.addEventListener("click", closeSettings);
  els.settingsModal.addEventListener("click", (event) => {
    if (event.target === els.settingsModal) closeSettings();
  });

  els.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveSettingsFromForm();
  });

  els.temperatureInput.addEventListener("input", () => {
    els.temperatureValue.textContent = Number(els.temperatureInput.value).toFixed(2);
  });

  els.resetSettingsButton.addEventListener("click", () => {
    state.settings = { ...DEFAULT_SETTINGS };
    saveSettings();
    fillSettingsForm();
    loadModels();
    showToast("Οι ρυθμίσεις επανήλθαν στις προεπιλογές.");
  });

  els.newChatButton.addEventListener("click", newChat);
  els.clearButton.addEventListener("click", clearChat);
  els.exportButton.addEventListener("click", exportChat);
  els.importInput.addEventListener("change", importChat);
}

async function loadModels() {
  setStatus(els.ollamaStatus, "Έλεγχος Ollama", "waiting");
  setStatus(els.modelStatus, "Model Ready", "waiting");
  els.modelSelect.innerHTML = "";

  try {
    const response = await fetch(`${trimHost(state.settings.host)}/api/tags`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const models = Array.isArray(data.models) ? data.models : [];

    setStatus(els.ollamaStatus, "Ollama Running", "online");
    populateModelSelect(models);

    const availableNames = models.map((model) => model.name);
    if (availableNames.includes(getSelectedModel())) {
      setStatus(els.modelStatus, "Model Ready", "ready");
    } else {
      setStatus(els.modelStatus, "Model Missing", "error");
    }
  } catch (error) {
    setStatus(els.ollamaStatus, "Ollama Offline", "offline");
    setStatus(els.modelStatus, "Model Unknown", "waiting");
    populateModelSelect([]);
    showToast(getFriendlyError(error));
  }
}

function populateModelSelect(models) {
  const selected = getSelectedModel();
  const names = [...new Set(models.map((model) => model.name).filter(Boolean))];

  if (!names.includes(selected)) names.unshift(selected);
  if (!names.length) names.push(DEFAULT_SETTINGS.model);

  for (const name of names) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    option.selected = name === selected;
    els.modelSelect.append(option);
  }
}

async function sendMessage() {
  const rawText = els.input.value.trim();
  if (!rawText || state.streaming) return;

  const modePrompt = MODE_PROMPTS[state.mode]?.prefix || "";
  const userText = modePrompt && !rawText.startsWith(modePrompt) ? `${modePrompt}${rawText}` : rawText;
  els.input.value = "";
  autoResizeInput();

  const userMessage = { role: "user", content: userText };
  state.messages.push(userMessage);
  saveMessages();
  renderMessages();

  const assistantMessage = { role: "assistant", content: "" };
  state.messages.push(assistantMessage);
  startStreamingUi();
  renderMessages();

  try {
    const content = await streamOllamaResponse(assistantMessage);
    assistantMessage.content = content || "Δεν έλαβα περιεχόμενο από το μοντέλο.";
    saveMessages();
  } catch (error) {
    assistantMessage.content = getFriendlyError(error);
    saveMessages();
  } finally {
    stopStreamingUi();
    renderMessages();
    els.input.focus();
  }
}

async function streamOllamaResponse(assistantMessage) {
  state.abortController = new AbortController();
  const response = await fetch(`${trimHost(state.settings.host)}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: getSelectedModel(),
      messages: buildOllamaMessages(),
      stream: true,
      options: {
        temperature: Number(state.settings.temperature),
        num_predict: Number(state.settings.maxTokens)
      }
    }),
    signal: state.abortController.signal
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${response.status} ${text}`);
  }

  if (!response.body) throw new Error("No streaming response body.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const chunkText = line.trim();
      if (!chunkText) continue;
      const chunk = JSON.parse(chunkText);
      const next = chunk.message?.content || "";
      fullContent += next;
      assistantMessage.content = fullContent;
      updateLastAssistantMessage(fullContent);
      if (chunk.done) return fullContent;
    }
  }

  return fullContent;
}

function buildOllamaMessages() {
  const conversation = state.messages.filter((message) => message.content.trim());
  return [
    { role: "system", content: state.settings.systemPrompt || DEFAULT_SYSTEM_PROMPT },
    ...conversation
  ];
}

function updateLastAssistantMessage(content) {
  const lastBubble = els.chatLog.querySelector(".message.assistant:last-child .message-bubble");
  if (!lastBubble) return;
  lastBubble.innerHTML = renderMarkdown(content || "Σκέφτομαι...");
  attachCodeCopyPayloads(lastBubble);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function stopStreaming() {
  if (state.abortController) state.abortController.abort();
}

function startStreamingUi() {
  state.streaming = true;
  els.sendButton.disabled = true;
  els.stopButton.hidden = false;
  els.aiCore.classList.add("is-thinking");
}

function stopStreamingUi() {
  state.streaming = false;
  state.abortController = null;
  els.sendButton.disabled = false;
  els.stopButton.hidden = true;
  els.aiCore.classList.remove("is-thinking");
  updateSessionInfo();
}

function renderMessages() {
  els.chatLog.innerHTML = "";

  if (!state.messages.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-state-inner">
        <h2>URVIS Local AI</h2>
        <p>Επικόλλησε Unity C# κώδικα, Console error ή μια άμεση ερώτηση. Δεν διαβάζω φακέλους ή αρχεία αυτόματα.</p>
      </div>
    `;
    els.chatLog.append(empty);
    updateSessionInfo();
    return;
  }

  state.messages.forEach((message, index) => {
    const article = document.createElement("article");
    article.className = `message ${message.role}`;
    const label = message.role === "user" ? "Εσύ" : "URVIS";
    const copyButton = message.role === "assistant"
      ? `<button class="copy-button" type="button" data-copy-message="${index}">Copy</button>`
      : "";

    article.innerHTML = `
      <div class="message-meta">
        <span>${label}</span>
        ${copyButton}
      </div>
      <div class="message-bubble">${renderMarkdown(message.content || "Σκέφτομαι...")}</div>
    `;
    els.chatLog.append(article);
    attachCodeCopyPayloads(article);
  });

  els.chatLog.scrollTop = els.chatLog.scrollHeight;
  updateSessionInfo();
}

function renderMarkdown(text) {
  const source = String(text || "");
  const blocks = [];
  const withPlaceholders = source.replace(/```([\w#+.-]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const id = blocks.length;
    blocks.push({ lang: lang || "code", code });
    return `\n@@CODE_BLOCK_${id}@@\n`;
  });

  const lines = withPlaceholders.split(/\r?\n/);
  const html = [];
  let listOpen = false;
  let paragraph = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const closeList = () => {
    if (!listOpen) return;
    html.push("</ul>");
    listOpen = false;
  };

  for (const line of lines) {
    const codeMatch = line.match(/^@@CODE_BLOCK_(\d+)@@$/);
    if (codeMatch) {
      flushParagraph();
      closeList();
      const block = blocks[Number(codeMatch[1])];
      html.push(renderCodeBlock(block.lang, block.code));
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);
    if (bulletMatch) {
      flushParagraph();
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${renderInline(bulletMatch[1])}</li>`);
      continue;
    }

    closeList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  return html.join("");
}

function renderInline(text) {
  return escapeHtml(text).replace(/`([^`]+)`/g, "<code>$1</code>");
}

function renderCodeBlock(lang, code) {
  const safeLang = escapeHtml(lang || "code");
  const safeCode = escapeHtml(code.replace(/\n$/, ""));
  return `
    <div class="code-block">
      <div class="code-header">
        <span>${safeLang}</span>
        <button class="copy-button" type="button" data-copy-code="">Copy code</button>
      </div>
      <pre><code>${safeCode}</code></pre>
    </div>
  `;
}

function attachCodeCopyPayloads(root) {
  root.querySelectorAll(".code-block").forEach((block) => {
    const button = block.querySelector("[data-copy-code]");
    const code = block.querySelector("code")?.textContent || "";
    if (button) button.dataset.copyCode = encodeURIComponent(code);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === mode);
  });
  els.modeDescription.textContent = MODE_PROMPTS[mode]?.description || MODE_PROMPTS.chat.description;

  if (mode === "settings") {
    openSettings();
  } else if (mode === "library") {
    els.input.value = [
      "Prompt Library:",
      "",
      TEMPLATE_TEXT.snippet,
      "",
      TEMPLATE_TEXT.debug,
      "",
      TEMPLATE_TEXT.unity
    ].join("\n");
    autoResizeInput();
    els.input.focus();
  }
}

function insertTemplate(name) {
  const template = TEMPLATE_TEXT[name];
  if (!template) return;
  const spacer = els.input.value.trim() ? "\n\n" : "";
  els.input.value = `${els.input.value}${spacer}${template}`;
  autoResizeInput();
  els.input.focus();
}

function autoResizeInput() {
  const input = els.input;
  if (!input) return;

  const styles = window.getComputedStyle(input);
  const maxHeight = Number.parseInt(styles.maxHeight, 10) || 260;

  input.style.height = "auto";
  const nextHeight = Math.min(input.scrollHeight, maxHeight);
  input.style.height = `${nextHeight}px`;
  input.style.overflowY = input.scrollHeight > maxHeight ? "auto" : "hidden";
}

function openSettings() {
  fillSettingsForm();
  els.settingsModal.hidden = false;
  els.hostInput.focus();
}

function closeSettings() {
  els.settingsModal.hidden = true;
}

function fillSettingsForm() {
  els.hostInput.value = state.settings.host;
  els.manualModelInput.value = state.settings.manualModel;
  els.temperatureInput.value = state.settings.temperature;
  els.temperatureValue.textContent = Number(state.settings.temperature).toFixed(2);
  els.maxTokensInput.value = state.settings.maxTokens;
  els.systemPromptInput.value = state.settings.systemPrompt;
  populateModelSelect([{ name: getSelectedModel() }]);
  updateSessionInfo();
}

function saveSettingsFromForm() {
  state.settings = {
    host: els.hostInput.value.trim() || DEFAULT_SETTINGS.host,
    model: els.modelSelect.value || DEFAULT_SETTINGS.model,
    manualModel: els.manualModelInput.value.trim(),
    temperature: Number(els.temperatureInput.value),
    maxTokens: Number(els.maxTokensInput.value),
    systemPrompt: els.systemPromptInput.value.trim() || DEFAULT_SYSTEM_PROMPT
  };
  saveSettings();
  closeSettings();
  loadModels();
  showToast("Οι ρυθμίσεις αποθηκεύτηκαν.");
}

function getSelectedModel() {
  return state.settings.manualModel || state.settings.model || DEFAULT_SETTINGS.model;
}

function setStatus(element, text, status) {
  element.textContent = text;
  element.className = `status-chip is-${status}`;
}

function updateSessionInfo() {
  els.selectedModelLabel.textContent = getSelectedModel();
  els.messageCount.textContent = String(state.messages.length);
}

function newChat() {
  if (state.streaming) stopStreaming();
  state.messages = [];
  saveMessages();
  renderMessages();
}

function clearChat() {
  if (!state.messages.length) return;
  const confirmed = window.confirm("Να καθαριστεί η τρέχουσα συνομιλία;");
  if (!confirmed) return;
  newChat();
}

function exportChat() {
  const payload = {
    exportedAt: new Date().toISOString(),
    settings: {
      host: state.settings.host,
      model: getSelectedModel(),
      temperature: state.settings.temperature,
      maxTokens: state.settings.maxTokens
    },
    messages: state.messages
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `urvis-chat-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importChat(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      if (!Array.isArray(parsed.messages)) throw new Error("Missing messages array.");
      state.messages = parsed.messages
        .filter((message) => ["user", "assistant"].includes(message.role) && typeof message.content === "string")
        .map((message) => ({ role: message.role, content: message.content }));
      saveMessages();
      renderMessages();
      showToast("Η συνομιλία εισήχθη.");
    } catch (error) {
      showToast("Το JSON δεν είναι έγκυρη συνομιλία URVIS.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
}

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || "{}") };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveMessages() {
  localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(state.messages));
}

function loadMessages() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.messages) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((message) => ["user", "assistant"].includes(message.role) && typeof message.content === "string");
  } catch {
    return [];
  }
}

function getFriendlyError(error) {
  const message = String(error?.message || error || "");
  if (message.includes("404") || message.toLowerCase().includes("not found")) {
    return `Model not found. Pull it with: ollama pull ${getSelectedModel()}`;
  }
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return "Ollama is not reachable. Make sure start-ollama.bat is running. If the browser blocked the request, restart Ollama with OLLAMA_ORIGINS including this web app URL.";
  }
  if (message.toLowerCase().includes("cors")) {
    return "Browser blocked the request. Restart Ollama with OLLAMA_ORIGINS including this web app URL.";
  }
  if (error?.name === "AbortError") {
    return "Η δημιουργία σταμάτησε.";
  }
  return `Σφάλμα Ollama: ${message}`;
}

function trimHost(host) {
  return String(host || DEFAULT_SETTINGS.host).replace(/\/+$/, "");
}

async function copyText(text, successMessage) {
  let copied = false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      copied = true;
    }
  } catch {
    copied = false;
  }

  if (!copied) {
    const fallback = document.createElement("textarea");
    fallback.value = text;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.left = "-9999px";
    document.body.append(fallback);
    fallback.select();
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    } finally {
      fallback.remove();
    }
  }

  if (copied) {
    showToast(successMessage);
  } else {
    showToast("Δεν ήταν δυνατή η αντιγραφή.");
  }
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 4600);
}

function startParticles() {
  const canvas = els.particleCanvas;
  const context = canvas.getContext("2d");
  const particles = Array.from({ length: 72 }, () => ({
    x: Math.random(),
    y: Math.random(),
    radius: Math.random() * 1.6 + 0.4,
    speed: Math.random() * 0.00045 + 0.00012,
    drift: Math.random() * 0.0005 - 0.00025
  }));

  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  function draw() {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const particle of particles) {
      particle.y -= particle.speed;
      particle.x += particle.drift;
      if (particle.y < -0.02) particle.y = 1.02;
      if (particle.x < -0.02) particle.x = 1.02;
      if (particle.x > 1.02) particle.x = -0.02;

      const x = particle.x * window.innerWidth;
      const y = particle.y * window.innerHeight;
      const glow = context.createRadialGradient(x, y, 0, x, y, particle.radius * 7);
      glow.addColorStop(0, "rgba(103, 232, 249, 0.7)");
      glow.addColorStop(1, "rgba(103, 232, 249, 0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(x, y, particle.radius * 7, 0, Math.PI * 2);
      context.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();
}

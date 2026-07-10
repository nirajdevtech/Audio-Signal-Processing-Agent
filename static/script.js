/**
 * =============================================================================
 * Audio Signal Processing Assistant – Main JavaScript
 * =============================================================================
 * Handles: dark mode, chat UI, API calls, markdown rendering,
 *          quick questions, auto-resize textarea, copy response.
 * =============================================================================
 */

/* ============================================================
   1. DARK MODE
   ============================================================ */
(function () {
  "use strict";

  const THEME_KEY = "audioai-theme";

  /** Apply a theme to the <html> element and update all toggle buttons. */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);

    document.querySelectorAll("#darkToggle").forEach((btn) => {
      btn.innerHTML =
        theme === "dark"
          ? '<i class="bi bi-sun-fill"></i>'
          : '<i class="bi bi-moon-stars-fill"></i>';
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    });
  }

  /** Toggle between light and dark. */
  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(current === "dark" ? "light" : "dark");
  }

  // Restore saved preference on page load
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    applyTheme(saved);
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    applyTheme("dark");
  }

  // Wire up all toggle buttons once DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("#darkToggle").forEach((btn) => {
      btn.addEventListener("click", toggleTheme);
    });

    // Re-apply so button icon reflects current state
    const theme = document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(theme);
  });
})();


/* ============================================================
   2. NAVBAR SCROLL EFFECT (landing page)
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("mainNav");
  if (!nav) return;

  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
});


/* ============================================================
   3. CHAT ENGINE
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {

  // -- Element references --------------------------------------------------
  const chatForm      = document.getElementById("chatForm");
  const chatInput     = document.getElementById("chatInput");
  const chatWindow    = document.getElementById("chatWindow");
  const sendBtn       = document.getElementById("sendBtn");
  const typingInd     = document.getElementById("typingIndicator");
  const clearChatBtn  = document.getElementById("clearChatBtn");
  const charCounter   = document.getElementById("charCounter");

  // Bail if not on chat page
  if (!chatForm || !chatInput || !chatWindow) return;

  // -- Conversation history (kept in memory for multi-turn context) --------
  let conversationHistory = [];

  // -- Configure marked.js -------------------------------------------------
  if (typeof marked !== "undefined") {
    marked.setOptions({
      breaks: true,
      gfm: true,
      sanitize: false,
    });
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  /** Return current HH:MM time string. */
  function getTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  /** Render markdown to safe HTML. Falls back to plain text if marked unavailable. */
  function renderMarkdown(text) {
    if (typeof marked !== "undefined") {
      return marked.parse(text);
    }
    // Simple fallback: escape HTML and convert newlines
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
  }

  /** Scroll chat window to the bottom. */
  function scrollToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  /** Show / hide the typing indicator. */
  function setTyping(visible) {
    typingInd.classList.toggle("visible", visible);
    if (visible) scrollToBottom();
  }

  /** Enable / disable the send button. */
  function setSending(sending) {
    sendBtn.disabled = sending;
    sendBtn.innerHTML = sending
      ? '<span class="spinner-border spinner-border-sm" role="status"></span>'
      : '<i class="bi bi-send-fill"></i>';
  }

  // =========================================================================
  // Message rendering
  // =========================================================================

  /**
   * Append a message bubble to the chat window.
   * @param {string} role   - "user" | "assistant" | "error"
   * @param {string} text   - Raw text (markdown supported for assistant)
   */
  function appendMessage(role, text) {
    const isUser  = role === "user";
    const isError = role === "error";

    const wrap = document.createElement("div");
    wrap.className = `chat-message ${isUser ? "user-message" : "ai-message"}`;

    // Avatar
    const avatar = document.createElement("div");
    avatar.className = `message-avatar ${isUser ? "user-avatar" : "ai-avatar"}`;
    avatar.innerHTML = isUser
      ? '<i class="bi bi-person-fill"></i>'
      : '<i class="bi bi-cpu-fill"></i>';

    // Bubble
    const bubble = document.createElement("div");
    bubble.className = `message-bubble ${isUser ? "user-bubble" : "ai-bubble"} ${isError ? "error-bubble" : ""}`;

    // Header (for AI messages)
    if (!isUser) {
      const header = document.createElement("div");
      header.className = "message-header";
      header.innerHTML = `
        <span class="message-sender">AudioAI Assistant</span>
        <span class="message-badge">IBM Granite</span>
      `;
      bubble.appendChild(header);
    }

    // Body
    const body = document.createElement("div");
    body.className = "message-body";
    body.innerHTML = isUser
      ? escapeHTML(text).replace(/\n/g, "<br>")
      : renderMarkdown(text);
    bubble.appendChild(body);

    // Timestamp
    const time = document.createElement("div");
    time.className = "message-time";
    time.textContent = getTime();
    bubble.appendChild(time);

    // Action buttons (AI only)
    if (!isUser) {
      const actions = document.createElement("div");
      actions.className = "message-actions";

      const copyBtn = document.createElement("button");
      copyBtn.className = "action-btn";
      copyBtn.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
      copyBtn.title = "Copy response to clipboard";
      copyBtn.addEventListener("click", () => copyToClipboard(text, copyBtn));
      actions.appendChild(copyBtn);

      bubble.appendChild(actions);
    }

    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    chatWindow.appendChild(wrap);
    scrollToBottom();
    return wrap;
  }

  /** Escape HTML special characters. */
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // =========================================================================
  // Copy to clipboard
  // =========================================================================
  function copyToClipboard(text, btn) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        btn.innerHTML = '<i class="bi bi-clipboard-check"></i> Copied!';
        showCopyToast();
        setTimeout(() => {
          btn.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
        }, 2000);
      })
      .catch(() => {
        btn.innerHTML = "Error";
        setTimeout(() => {
          btn.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
        }, 1500);
      });
  }

  function showCopyToast() {
    const toastEl = document.getElementById("copyToast");
    if (!toastEl) return;
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2500 });
    toast.show();
  }

  // =========================================================================
  // Auto-resize textarea
  // =========================================================================
  function autoResize() {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + "px";
  }

  chatInput.addEventListener("input", () => {
    autoResize();
    if (charCounter) {
      charCounter.textContent = `${chatInput.value.length} / 2000`;
    }
  });

  // =========================================================================
  // Send message on Enter (Shift+Enter = new line)
  // =========================================================================
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.requestSubmit();
    }
  });

  // =========================================================================
  // Form submit — send message to backend API
  // =========================================================================
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = chatInput.value.trim();
    if (!message) return;

    // Clear input
    chatInput.value = "";
    autoResize();
    if (charCounter) charCounter.textContent = "0 / 2000";

    // Show user message
    appendMessage("user", message);

    // Add to history
    conversationHistory.push({ role: "user", content: message });

    // Show loading state
    setSending(true);
    setTyping(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          history: conversationHistory.slice(-10), // last 5 exchanges
        }),
      });

      const data = await resp.json();

      setTyping(false);

      if (resp.ok && data.status === "success") {
        appendMessage("assistant", data.response);
        conversationHistory.push({ role: "assistant", content: data.response });
      } else {
        const errMsg =
          data.response ||
          "An error occurred while processing your request. Please try again.";
        appendMessage("error", `⚠️ **Error:** ${errMsg}`);
      }
    } catch (err) {
      setTyping(false);
      appendMessage(
        "error",
        "⚠️ **Connection Error:** Could not reach the server. Please check your connection and try again."
      );
      console.error("Chat API error:", err);
    } finally {
      setSending(false);
      chatInput.focus();
    }
  });

  // =========================================================================
  // Clear chat
  // =========================================================================
  if (clearChatBtn) {
    clearChatBtn.addEventListener("click", () => {
      if (!confirm("Clear the conversation history?")) return;

      // Remove all messages except the welcome message
      const allMessages = chatWindow.querySelectorAll(".chat-message");
      allMessages.forEach((m) => {
        if (m.id !== "welcomeMsg") m.remove();
      });

      conversationHistory = [];
      chatInput.focus();
    });
  }

  // =========================================================================
  // Quick question buttons (sidebar)
  // =========================================================================
  document.querySelectorAll(".quick-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const question = btn.getAttribute("data-q");
      if (!question) return;
      chatInput.value = question;
      autoResize();
      if (charCounter) charCounter.textContent = `${question.length} / 2000`;
      chatInput.focus();
      chatForm.requestSubmit();
    });
  });

  // =========================================================================
  // Focus input on load
  // =========================================================================
  chatInput.focus();
});

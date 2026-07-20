import { useEffect, useRef, useState, useCallback } from "react";
import { sendMessage } from "../services/api";
import VoiceChat from "./VoiceChat";

function ChatBox() {
  const threadId = useRef(crypto.randomUUID());

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your AI Banking Assistant. How can I help you today?",
    },
  ]);

  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);



  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    const query = input;
    setInput("");
    setLoading(true);

    try {
      const response = await sendMessage(threadId.current, query);
      setMessages(prev => [...prev, { sender: "ai", text: response.answer }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { sender: "ai", text: "Something went wrong. Please try again." },
      ]);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "700px",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ═══════════════════════════════ CHAT PANEL ══════════════════════════ */}
      <div
        style={{
          width: voiceOpen ? "580px" : "900px",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
          transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(20px)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Avatar */}
            <div
              style={{
                width: "38px", height: "38px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div>
              <div style={{
                fontSize: "15px", fontWeight: 700,
                color: "rgba(255,255,255,0.95)",
                letterSpacing: "-0.02em",
              }}>
                AI Banking Assistant
              </div>
              <div style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.4)",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                <span style={{
                  display: "inline-block",
                  width: "6px", height: "6px",
                  borderRadius: "50%",
                  background: "#34d399",
                  boxShadow: "0 0 6px #34d399",
                }} />
                Online · Always available
              </div>
            </div>
          </div>

          {/* Voice toggle button */}
          <button
            id="voice-toggle-btn"
            onClick={() => setVoiceOpen(v => !v)}
            title={voiceOpen ? "Close Voice Mode" : "Open Voice Mode"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              borderRadius: "10px",
              border: "1px solid",
              borderColor: voiceOpen
                ? "rgba(99,102,241,0.6)"
                : "rgba(255,255,255,0.12)",
              background: voiceOpen
                ? "rgba(99,102,241,0.2)"
                : "rgba(255,255,255,0.05)",
              color: voiceOpen
                ? "#a5b4fc"
                : "rgba(255,255,255,0.65)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              transition: "all 0.25s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={e => {
              if (!voiceOpen) {
                e.currentTarget.style.background = "rgba(99,102,241,0.15)";
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                e.currentTarget.style.color = "#a5b4fc";
              }
            }}
            onMouseLeave={e => {
              if (!voiceOpen) {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                e.currentTarget.style.color = "rgba(255,255,255,0.65)";
              }
            }}
          >
            {/* Mic icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"
                fill="currentColor"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {voiceOpen ? "Close Voice" : "Voice Mode"}
          </button>
        </div>

        {/* ── Messages ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className="fade-in-anim"
              style={{
                display: "flex",
                justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                gap: "10px",
              }}
            >
              {/* AI avatar */}
              {msg.sender === "ai" && (
                <div style={{
                  width: "28px", height: "28px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
              )}

              <div
                style={{
                  maxWidth: voiceOpen ? "75%" : "68%",
                  padding: "12px 16px",
                  borderRadius: msg.sender === "user"
                    ? "18px 18px 4px 18px"
                    : "18px 18px 18px 4px",
                  background: msg.sender === "user"
                    ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                    : "rgba(255,255,255,0.07)",
                  border: msg.sender === "user"
                    ? "none"
                    : "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.92)",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  boxShadow: msg.sender === "user"
                    ? "0 4px 16px rgba(99,102,241,0.3)"
                    : "none",
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}
              className="fade-in-anim">
              <div style={{
                width: "28px", height: "28px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div style={{
                padding: "12px 18px",
                borderRadius: "18px 18px 18px 4px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", gap: "5px",
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: "6px", height: "6px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.4)",
                    animation: "wave-bar 1s ease-in-out infinite",
                    animationDelay: `${i * 0.15}s`,
                    transformOrigin: "center",
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input area ── */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            backdropFilter: "blur(20px)",
            display: "flex",
            gap: "12px",
            alignItems: "flex-end",
            flexShrink: 0,
          }}
        >
          <div style={{
            flex: 1,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            padding: "12px 16px",
            transition: "border-color 0.2s",
          }}
            onFocus={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
          >
            <input
              id="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask me anything about banking…"
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "rgba(255,255,255,0.9)",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "none",
                lineHeight: "1.5",
              }}
            />
          </div>

          <button
            id="chat-send-btn"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              width: "46px", height: "46px",
              borderRadius: "12px",
              border: "none",
              background: loading || !input.trim()
                ? "rgba(99,102,241,0.3)"
                : "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: "white",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.25s ease",
              flexShrink: 0,
              boxShadow: !loading && input.trim()
                ? "0 4px 16px rgba(99,102,241,0.35)"
                : "none",
            }}
            onMouseEnter={e => {
              if (!loading && input.trim())
                e.currentTarget.style.transform = "translateY(-1px) scale(1.05)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "none";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════ VOICE PANEL ═════════════════════════ */}
      {voiceOpen && (
        <div
          className="slide-up-anim"
          style={{
            width: "320px",
            flexShrink: 0,
            height: "100%",
          }}
        >
          <VoiceChat
            onClose={() => setVoiceOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

export default ChatBox;
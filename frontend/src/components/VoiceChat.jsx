import { useState, useCallback, useEffect, useRef } from "react";
import {
  LiveKitRoom,
  useVoiceAssistant,
  RoomAudioRenderer,
  useLocalParticipant,
  useTranscriptions,
} from "@livekit/components-react";
import { getVoiceToken } from "../services/api";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  disconnected: { label: "Disconnected",    color: "#6b7280", glow: "none"                          },
  connecting:   { label: "Connecting…",     color: "#f59e0b", glow: "0 0 20px rgba(245,158,11,0.4)" },
  initializing: { label: "Initializing…",   color: "#a78bfa", glow: "0 0 20px rgba(167,139,250,0.4)" },
  listening:    { label: "Listening…",      color: "#34d399", glow: "0 0 30px rgba(52,211,153,0.5)"  },
  thinking:     { label: "Thinking…",       color: "#818cf8", glow: "0 0 25px rgba(129,140,248,0.5)" },
  speaking:     { label: "AI is speaking…", color: "#60a5fa", glow: "0 0 30px rgba(96,165,250,0.5)"  },
};

// ─── Wave visualizer (shown when AI is speaking) ──────────────────────────────
function WaveBars({ active, color }) {
  const heights = [30, 55, 75, 90, 75, 55, 30, 55, 75];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        height: "60px",
        opacity: active ? 1 : 0.25,
        transition: "opacity 0.4s ease",
      }}
    >
      {heights.map((h, i) => (
        <div
          key={i}
          className={active ? "wave-bar-anim" : ""}
          style={{
            width: "5px",
            height: `${h}%`,
            background: color,
            borderRadius: "3px",
            transformOrigin: "center",
            animationDelay: active ? `${i * 0.1}s` : "0s",
            transition: "background 0.4s ease",
          }}
        />
      ))}
    </div>
  );
}

// ─── Inner session UI (uses LiveKit hooks) ────────────────────────────────────
function VoiceSession({ onDisconnect, onVoiceMessage }) {
  const { state, agent, agentTranscriptions } = useVoiceAssistant();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const transcriptions = useTranscriptions();
  const muted = !isMicrophoneEnabled;

  const cfg = STATUS[state] || STATUS.connecting;
  const isListening = state === "listening";
  const isSpeaking  = state === "speaking";
  const isThinking  = state === "thinking";

  // Persistent map: LiveKit segment key → our stable bubble UUID.
  // Generated once per unique utterance; reused on every streaming update.
  // Never reset, so historical turns keep their bubbles.
  const segToBubble = useRef(new Map());

  useEffect(() => {
    if (!transcriptions || transcriptions.length === 0) return;

    transcriptions.forEach((item) => {
      const text = item.text?.trim();
      if (!text) return;

      const identity = item.participantInfo?.identity || "unknown";
      const isAgent = agent?.identity
        ? identity === agent.identity
        : identity.toLowerCase().includes("agent");

      // Build a stable key from LiveKit's segment ID, or fall back to
      // firstReceivedTime (unique per utterance even when id is empty).
      const lkKey =
        item.id ||
        `${identity}_${item.firstReceivedTime ?? item.startTime ?? Math.random()}`;

      if (!segToBubble.current.has(lkKey)) {
        segToBubble.current.set(
          lkKey,
          `voice_${isAgent ? "ai" : "user"}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`
        );
      }

      onVoiceMessage?.({
        id: segToBubble.current.get(lkKey),
        sender: isAgent ? "ai" : "user",
        text,
      });
    });
  }, [transcriptions, agent, onVoiceMessage]);



  const toggleMute = useCallback(async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(muted);
    }
  }, [localParticipant, muted]);

  return (
    <div
      className="fade-in-anim"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        padding: "32px 24px",
        height: "100%",
      }}
    >
      {/* ── Animated orb ── */}
      <div style={{ position: "relative", width: "130px", height: "130px" }}>
        {/* Expanding rings when listening */}
        {isListening && (
          <>
            <div
              className="voice-pulse-ring"
              style={{
                position: "absolute", inset: 0,
                borderRadius: "50%",
                border: `2px solid ${cfg.color}`,
              }}
            />
            <div
              className="voice-pulse-ring-2"
              style={{
                position: "absolute", inset: 0,
                borderRadius: "50%",
                border: `2px solid ${cfg.color}`,
              }}
            />
          </>
        )}

        {/* Outer glow ring */}
        <div
          style={{
            position: "absolute", inset: "10px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${cfg.color}22 0%, transparent 70%)`,
            boxShadow: cfg.glow,
            transition: "all 0.5s ease",
          }}
        />

        {/* Slow-spinning gradient border */}
        <div
          className={isListening || isSpeaking ? "spin-slow-anim" : ""}
          style={{
            position: "absolute", inset: "6px",
            borderRadius: "50%",
            background: `conic-gradient(from 0deg, ${cfg.color}, transparent, ${cfg.color})`,
            opacity: isListening || isSpeaking ? 0.6 : 0.15,
            transition: "opacity 0.5s ease",
          }}
        />

        {/* Core circle */}
        <div
          style={{
            position: "absolute", inset: "14px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1e1b4b 0%, #1e293b 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          {/* Mic icon */}
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="12" rx="3"
              fill={muted ? "#ef4444" : cfg.color}
              style={{ transition: "fill 0.3s ease" }}
            />
            <path d="M5 11a7 7 0 0 0 14 0" stroke={muted ? "#ef4444" : cfg.color}
              strokeWidth="1.8" strokeLinecap="round"
              style={{ transition: "stroke 0.3s ease" }}
            />
            <line x1="12" y1="18" x2="12" y2="22"
              stroke={muted ? "#ef4444" : cfg.color}
              strokeWidth="1.8" strokeLinecap="round"
              style={{ transition: "stroke 0.3s ease" }}
            />
            <line x1="9" y1="22" x2="15" y2="22"
              stroke={muted ? "#ef4444" : cfg.color}
              strokeWidth="1.8" strokeLinecap="round"
              style={{ transition: "stroke 0.3s ease" }}
            />
          </svg>
        </div>
      </div>

      {/* ── Wave bars ── */}
      <WaveBars active={isSpeaking} color={cfg.color} />

      {/* ── Status text ── */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "999px",
            background: `${cfg.color}18`,
            border: `1px solid ${cfg.color}40`,
          }}
        >
          {/* Animated dot */}
          <div
            style={{
              width: "7px", height: "7px",
              borderRadius: "50%",
              background: cfg.color,
              boxShadow: `0 0 6px ${cfg.color}`,
              animation: isListening || isSpeaking || isThinking
                ? "voice-pulse 1.2s ease-in-out infinite" : "none",
            }}
          />
          <span
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: cfg.color,
              letterSpacing: "0.02em",
            }}
          >
            {cfg.label}
          </span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ display: "flex", gap: "12px" }}>
        {/* Mute toggle */}
        <button
          id="voice-mute-btn"
          onClick={toggleMute}
          title={muted ? "Unmute" : "Mute"}
          style={{
            width: "48px", height: "48px",
            borderRadius: "50%",
            border: `2px solid ${muted ? "#ef444460" : "rgba(255,255,255,0.15)"}`,
            background: muted
              ? "rgba(239,68,68,0.15)"
              : "rgba(255,255,255,0.06)",
            color: muted ? "#ef4444" : "rgba(255,255,255,0.7)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.25s ease",
            backdropFilter: "blur(8px)",
          }}
          onMouseEnter={e => e.currentTarget.style.background = muted
            ? "rgba(239,68,68,0.28)" : "rgba(255,255,255,0.12)"}
          onMouseLeave={e => e.currentTarget.style.background = muted
            ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)"}
        >
          {muted ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M18.89 13.23A7 7 0 0 0 19 12v-1M6 10v2a6 6 0 0 0 9.13 5.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M15 9.34V5a3 3 0 0 0-5.94-.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="currentColor" strokeWidth="2"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        {/* Disconnect / end call */}
        <button
          id="voice-disconnect-btn"
          onClick={onDisconnect}
          title="End voice call"
          style={{
            width: "48px", height: "48px",
            borderRadius: "50%",
            border: "2px solid rgba(239,68,68,0.5)",
            background: "rgba(239,68,68,0.15)",
            color: "#ef4444",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.25s ease",
            backdropFilter: "blur(8px)",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.32)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
          </svg>
        </button>
      </div>

      {/* ── Hint ── */}
      <p style={{
        fontSize: "11px",
        color: "rgba(255,255,255,0.35)",
        margin: 0,
        textAlign: "center",
        maxWidth: "220px",
        lineHeight: "1.4",
      }}>
        Speak naturally — the AI will respond in real time
      </p>
    </div>
  );
}

// ─── Connect screen (before room join) ───────────────────────────────────────
function ConnectScreen({ onConnect, isConnecting }) {
  return (
    <div
      className="fade-in-anim"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        padding: "40px 32px",
        height: "100%",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "80px", height: "80px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 40px rgba(99,102,241,0.4)",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"
            fill="white"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white"
            strokeWidth="2" strokeLinecap="round"/>
          <line x1="12" y1="18" x2="12" y2="22" stroke="white"
            strokeWidth="2" strokeLinecap="round"/>
          <line x1="9" y1="22" x2="15" y2="22" stroke="white"
            strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Text */}
      <div style={{ textAlign: "center" }}>
        <h3 style={{
          margin: "0 0 8px",
          fontSize: "20px",
          fontWeight: 700,
          color: "white",
          letterSpacing: "-0.02em",
        }}>
          Voice Assistant
        </h3>
        <p style={{
          margin: 0,
          fontSize: "14px",
          color: "rgba(255,255,255,0.5)",
          lineHeight: "1.6",
          maxWidth: "220px",
        }}>
          Talk to your AI Banking Assistant in real time using your microphone.
        </p>
      </div>

      {/* Connect button */}
      <button
        id="voice-connect-btn"
        onClick={onConnect}
        disabled={isConnecting}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 28px",
          borderRadius: "12px",
          border: "none",
          background: isConnecting
            ? "rgba(99,102,241,0.5)"
            : "linear-gradient(135deg, #4f46e5, #7c3aed)",
          color: "white",
          fontSize: "15px",
          fontWeight: 600,
          cursor: isConnecting ? "not-allowed" : "pointer",
          boxShadow: isConnecting ? "none" : "0 4px 20px rgba(99,102,241,0.4)",
          transition: "all 0.25s ease",
          fontFamily: "inherit",
        }}
        onMouseEnter={e => {
          if (!isConnecting) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 28px rgba(99,102,241,0.55)";
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = isConnecting ? "none" : "0 4px 20px rgba(99,102,241,0.4)";
        }}
      >
        {isConnecting ? (
          <>
            <div style={{
              width: "16px", height: "16px",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "white",
              borderRadius: "50%",
              animation: "spin-slow 1s linear infinite",
            }} />
            Connecting…
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" fill="white"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Start Voice Chat
          </>
        )}
      </button>

      {/* Badges */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
        {["🔒 Secure", "⚡ Real-time", "🆓 Free"].map(badge => (
          <span key={badge} style={{
            fontSize: "11px",
            padding: "4px 10px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main VoiceChat component (manages connection state) ──────────────────────
export default function VoiceChat({ onClose, onVoiceMessage }) {
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const { url, token } = await getVoiceToken(
        "banking-assistant",
        "user-" + Date.now()
      );
      setConnectionDetails({ url, token });
    } catch (err) {
      setError("Failed to connect. Please try again.");
      console.error("VoiceChat connect error:", err);
    } finally {
      setConnecting(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setConnectionDetails(null);
    setError(null);
    onClose?.();
  }, [onClose]);

  return (
    <div
      style={{
        width: "320px",
        height: "100%",
        minHeight: "420px",
        background: "linear-gradient(160deg, #0f0c29 0%, #1a1a3e 50%, #0f172a 100%)",
        borderLeft: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(10px)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "8px", height: "8px",
            borderRadius: "50%",
            background: connectionDetails ? "#34d399" : "#6b7280",
            boxShadow: connectionDetails ? "0 0 8px #34d399" : "none",
            transition: "all 0.4s ease",
          }} />
          <span style={{
            fontSize: "14px", fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            letterSpacing: "-0.01em",
          }}>
            Voice Mode
          </span>
        </div>
        <button
          id="voice-close-btn"
          onClick={handleDisconnect}
          style={{
            width: "28px", height: "28px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease",
            fontSize: "14px",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
        >
          ✕
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {error && (
          <div style={{
            margin: "12px", padding: "10px 14px",
            borderRadius: "8px",
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5",
            fontSize: "13px",
          }}>
            {error}
          </div>
        )}

        {!connectionDetails ? (
          <ConnectScreen onConnect={handleConnect} isConnecting={connecting} />
        ) : (
          <LiveKitRoom
            serverUrl={connectionDetails.url}
            token={connectionDetails.token}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={handleDisconnect}
          >
            <RoomAudioRenderer />
            <VoiceSession onDisconnect={handleDisconnect} onVoiceMessage={onVoiceMessage} />
          </LiveKitRoom>
        )}
      </div>

      {/* ── Decorative background orbs ── */}
      <div style={{
        position: "absolute", bottom: "-60px", right: "-60px",
        width: "200px", height: "200px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "-40px", left: "-40px",
        width: "160px", height: "160px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

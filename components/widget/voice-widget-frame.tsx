"use client";

import { Phone, PhoneOff, Mic, MicOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";

type VoiceWidgetFrameProps = {
  publicId: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  vapiAgentId?: string | null;
};

const BUBBLE_COLOR = "#0ea5e9";

export function VoiceWidgetFrame({
  publicId,
  logoUrl,
  primaryColor,
  vapiAgentId,
}: VoiceWidgetFrameProps) {
  const accent = primaryColor || BUBBLE_COLOR;
  const [isOpen, setIsOpen] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "active" | "ended">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [vapiPublicKey, setVapiPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const vapiRef = useRef<Vapi | null>(null);

  // Notify parent window (widget.js) about open/close state
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.parent?.postMessage(
        { type: "ag-widget:state", open: isOpen },
        "*",
      );
    }
  }, [isOpen]);

  // Make iframe background transparent
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.margin = "0";
      document.documentElement.style.padding = "0";
      document.documentElement.style.background = "transparent";
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      document.body.style.background = "transparent";
      document.body.style.overflow = "hidden";
    }
  }, []);

  // Fetch Vapi public key for this widget
  useEffect(() => {
    const fetchVapiKey = async () => {
      try {
        const response = await fetch(`/api/public/widget/${publicId}/vapi-config`);
        if (response.ok) {
          const data = await response.json();
          setVapiPublicKey(data.publicKey);
        } else {
          const errData = await response.json().catch(() => ({}));
          setError(errData.error || "Kunde inte ladda röst-konfiguration");
        }
      } catch (err) {
        console.error("Failed to load Vapi config:", err);
        setError("Kunde inte ladda röst-konfiguration");
      }
    };

    fetchVapiKey();
  }, [publicId]);

  // Initialize Vapi client
  useEffect(() => {
    if (!vapiPublicKey || vapiRef.current) return;

    try {
      const vapi = new Vapi(vapiPublicKey);
      
      vapi.on("call-start", () => {
        setCallStatus("active");
        setError(null);
      });

      vapi.on("call-end", () => {
        setCallStatus("ended");
        setTimeout(() => setCallStatus("idle"), 2000);
      });

      vapi.on("error", (err: any) => {
        console.error("Vapi error:", err);
        setError("Ett fel uppstod under samtalet");
        setCallStatus("ended");
        setTimeout(() => setCallStatus("idle"), 2000);
      });

      vapiRef.current = vapi;
    } catch (err) {
      console.error("Failed to initialize Vapi:", err);
      setError("Kunde inte initiera röst-tjänsten");
    }
  }, [vapiPublicKey]);

  const startCall = async () => {
    if (!vapiRef.current || !vapiAgentId) return;

    try {
      setError(null);
      setCallStatus("connecting");
      await vapiRef.current.start(vapiAgentId);
    } catch (err: any) {
      console.error("Failed to start call:", err);
      setError(err?.message || "Kunde inte starta samtalet");
      setCallStatus("idle");
    }
  };

  const endCall = () => {
    if (!vapiRef.current) return;
    vapiRef.current.stop();
    setCallStatus("ended");
  };

  const toggleMute = () => {
    if (!vapiRef.current) return;
    vapiRef.current.setMuted(!isMuted);
    setIsMuted(!isMuted);
  };

  const toggleWidget = () => {
    if (isOpen && callStatus === "active") {
      endCall();
    }
    setIsOpen(!isOpen);
  };

  const disabled = !vapiAgentId || !vapiPublicKey;

  // When closed: show just the bubble button centered in the 80x80 iframe
  if (!isOpen) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <button
          type="button"
          onClick={toggleWidget}
          aria-label="Öppna röst-widget"
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: accent,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Phone size={28} color="#fff" />
        </button>
      </div>
    );
  }

  // Open state: full voice panel
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "15px",
        color: "#0f172a",
        background: "#fff",
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: "0 25px 60px rgba(15,23,42,0.35)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px",
          background: accent,
          color: "#fff",
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid rgba(255,255,255,0.5)",
            }}
          />
        ) : (
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            AI
          </div>
        )}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>
            Röst-assistent
          </p>
          <p style={{ margin: 0, fontSize: "12px", opacity: 0.8 }}>
            {callStatus === "idle" && "Tryck för att ringa"}
            {callStatus === "connecting" && "Ringer..."}
            {callStatus === "active" && "Samtal pågår"}
            {callStatus === "ended" && "Samtal avslutat"}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleWidget}
          aria-label="Stäng"
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={18} color="#fff" />
        </button>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          padding: "32px",
        }}
      >
        {disabled ? (
          <div style={{ textAlign: "center", color: "#64748b" }}>
            <Phone size={48} style={{ marginBottom: "16px", opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: "14px" }}>Röst-widget inte konfigurerad</p>
            <p style={{ margin: "8px 0 0", fontSize: "12px", opacity: 0.7 }}>
              Kontrollera att Vapi är korrekt inställt
            </p>
          </div>
        ) : (
          <>
            {/* Call status indicator */}
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: callStatus === "active" ? accent : "#e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: callStatus === "active" ? "pulse 2s infinite" : "none",
                transition: "background 0.3s ease",
              }}
            >
              <Phone
                size={48}
                color={callStatus === "active" ? "#fff" : "#64748b"}
              />
            </div>

            {/* Status text */}
            <p style={{ margin: 0, fontSize: "16px", fontWeight: 500, color: "#334155" }}>
              {callStatus === "idle" && "Redo att ringa"}
              {callStatus === "connecting" && "Ansluter..."}
              {callStatus === "active" && "Samtal aktivt"}
              {callStatus === "ended" && "Samtal avslutat"}
            </p>

            {/* Error message */}
            {error && (
              <p style={{ margin: 0, fontSize: "12px", color: "#ef4444", textAlign: "center" }}>
                {error}
              </p>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "16px" }}>
              {callStatus === "idle" && (
                <button
                  type="button"
                  onClick={startCall}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "14px 28px",
                    borderRadius: "50px",
                    border: "none",
                    background: accent,
                    color: "#fff",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    transition: "transform 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <Phone size={20} />
                  Ring
                </button>
              )}

              {callStatus === "connecting" && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b" }}>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "2px solid #e2e8f0",
                      borderTopColor: accent,
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Vänta...
                </div>
              )}

              {callStatus === "active" && (
                <>
                  <button
                    type="button"
                    onClick={toggleMute}
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      border: "none",
                      background: isMuted ? "#fecaca" : "#e2e8f0",
                      color: isMuted ? "#dc2626" : "#475569",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.2s ease",
                    }}
                  >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
                  <button
                    type="button"
                    onClick={endCall}
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      border: "none",
                      background: "#ef4444",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}
                  >
                    <PhoneOff size={24} />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* CSS animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}

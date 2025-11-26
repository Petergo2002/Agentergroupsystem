"use client";

import { Send, X, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type WidgetMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatWidgetFrameProps = {
  publicId: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  textColor?: string | null;
  welcomeMessage?: string | null;
  placeholderText?: string | null;
  buttonText?: string | null;
  vapiAgentId?: string | null;
};

const BUBBLE_COLOR = "#0ea5e9";

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export function ChatWidgetFrame({
  publicId,
  logoUrl,
  primaryColor,
  textColor,
  welcomeMessage,
  placeholderText,
  buttonText,
  vapiAgentId,
}: ChatWidgetFrameProps) {
  const accent = primaryColor || BUBBLE_COLOR;
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>(() =>
    welcomeMessage
      ? [{ id: "welcome", role: "assistant", content: welcomeMessage }]
      : [],
  );
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  // Store Vapi's chatId from the first response to maintain conversation context
  const conversationIdRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!listRef.current) return;
    if (!messages.length) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const disabled = !vapiAgentId;

  const updateAssistantMessage = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, content: content.trimStart() } : msg,
      ),
    );
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isSending || disabled) return;

    const content = input.trim();
    setInput("");
    setError(null);
    setIsSending(true);

    const userMessage: WidgetMessage = {
      id: generateId(),
      role: "user",
      content,
    };
    const assistantId = generateId();
    const assistantMessage: WidgetMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    try {
      // Only include conversationId if we have one from a previous Vapi response
      const payload: Record<string, string> = {
        publicId,
        message: content,
      };
      if (conversationIdRef.current) {
        payload.conversationId = conversationIdRef.current;
      }

      const response = await fetch("/api/widget/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        const fallback = await response.text().catch(() => "");
        throw new Error(fallback || "Kunde inte kontakta AI:n");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        updateAssistantMessage(assistantId, buffer);
      }

      buffer += decoder.decode(new Uint8Array(), { stream: false });
      updateAssistantMessage(
        assistantId,
        buffer || "Jag är här för att hjälpa dig!",
      );
    } catch (err: any) {
      console.error("Widget send failed", err);
      updateAssistantMessage(
        assistantId,
        "Just nu kan jag inte svara. Försök igen om en stund.",
      );
      setError(err?.message || "Det gick inte att kontakta assistenten.");
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, disabled, publicId, updateAssistantMessage]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const toggleWidget = () => setIsOpen((prev) => !prev);

  const headerContent = useMemo(() => {
    if (!disabled) return "AI-assistent";
    return "Offline";
  }, [disabled]);

  const headerTextColor = textColor || "#ffffff";

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
          aria-label={buttonText || "Öppna chatten"}
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
          <MessageCircle size={28} color="#fff" />
        </button>
      </div>
    );
  }

  // Open state: full chat panel
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
          <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: headerTextColor }}>
            {headerContent}
          </p>
          <p style={{ margin: 0, fontSize: "12px", opacity: 0.8, color: headerTextColor }}>
            {disabled ? "Inte konfigurerad" : "Svarar inom några sekunder"}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleWidget}
          aria-label="Stäng chatten"
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

      {/* Messages */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: "flex",
              justifyContent: message.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius: "16px",
                fontSize: "14px",
                lineHeight: 1.4,
                background: message.role === "user" ? "#1e293b" : "#f1f5f9",
                color: message.role === "user" ? "#fff" : "#1e293b",
              }}
            >
              {message.content || "..."}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "16px",
              background: "#f1f5f9",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            {welcomeMessage || "Hej! Ställ en fråga så hjälper jag dig."}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "0 16px", color: "#ef4444", fontSize: "12px" }}>
          {error}
        </div>
      )}

      {/* Input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 16px",
          borderTop: "1px solid #e2e8f0",
          background: "#fff",
        }}
      >
        <input
          type="text"
          placeholder={
            disabled
              ? "Väntar på konfiguration..."
              : placeholderText || "Skriv ett meddelande..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isSending || disabled}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isSending || disabled}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "none",
            background: isSending || disabled ? "#cbd5e1" : accent,
            cursor: isSending || disabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: isSending || disabled ? 0.5 : 1,
          }}
        >
          <Send size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { useMemo, useRef, useState } from "react";
import ScamDetector from "@/components/ScamDetector";
import StockComparison from "@/components/StockComparison";
import { getStockComparison } from "@/lib/api";

type Role = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  time: string;
  comparisonData?: {
    ticker_a: string;
    ticker_b: string;
    left: { ticker: string; price?: { price?: number; change_percent?: number } };
    right: { ticker: string; price?: { price?: number; change_percent?: number } };
    analysis: { winner?: string; confidence?: number; summary?: string; left_reasons?: string[]; right_reasons?: string[] };
  };
};

type Language = "en" | "ur";

type StreamEvent = {
  type: "token" | "thought" | "done" | "error";
  token?: string;
  message?: string;
};

function getNow() {
  return new Date().toLocaleTimeString([], { hour12: false });
}

function resolveApiBase() {
  const rawBase = process.env.NEXT_PUBLIC_ALPHAAI_API_BASE_URL ?? "http://localhost:8001/api/v1";

  if (/^https?:\/\//i.test(rawBase)) {
    return rawBase;
  }

  if (rawBase.startsWith(":")) {
    return `http://localhost${rawBase}`;
  }

  return `http://${rawBase}`;
}

function detectTicker(input: string): string | null {
  const match = input.toUpperCase().match(/\b[A-Z][A-Z0-9.-]{0,11}\b/);
  return match ? match[0] : null;
}

async function* parseSSEStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const rawEvent of events) {
      const lines = rawEvent.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        try {
          const parsed = JSON.parse(payload) as StreamEvent;
          yield parsed;
        } catch {
          // Ignore malformed events.
        }
      }
    }
  }
}

const QUICK_PROMPTS = [
  "What is the outlook for PSX today?",
  "Analyze AAPL for swing trade",
  "ENGRO.KA ka trend batain",
  "Compare NVDA and AMD",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "AlphaAI is online. Ask in natural language: stock outlook, comparison, risk, entry timing, or portfolio ideas.",
      time: getNow(),
    },
  ]);
  const [thoughtLog, setThoughtLog] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "verify">("chat");

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const idCounterRef = useRef(0);
  const apiBase = useMemo(() => resolveApiBase(), []);

  const nextId = (prefix: string) => {
    idCounterRef.current += 1;
    return `${prefix}-${idCounterRef.current}`;
  };

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  };

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
    scrollToBottom();
  };

  const updateAssistantMessage = (id: string, appendText: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              content: `${msg.content}${appendText}`,
            }
          : msg,
      ),
    );
    scrollToBottom();
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setThoughtLog([]);
    setInput("");

    const compareMatch = trimmed.match(/compare\s+([A-Za-z0-9.-]+)\s+(vs\s+)?([A-Za-z0-9.-]+)/i);
    if (compareMatch) {
      const tickerA = compareMatch[1].toUpperCase();
      const tickerB = compareMatch[3].toUpperCase();
      addMessage({ id: nextId("user"), role: "user", content: trimmed, time: getNow() });
      try {
        const comparison = await getStockComparison(tickerA, tickerB, language);
        addMessage({
          id: nextId("assistant"),
          role: "assistant",
          content: comparison.analysis?.summary || `${tickerA} vs ${tickerB} comparison ready.`,
          time: getNow(),
          comparisonData: comparison,
        });
      } catch {
        addMessage({ id: nextId("assistant"), role: "assistant", content: "Comparison failed. Try again.", time: getNow() });
      } finally {
        setLoading(false);
      }
      return;
    }

    addMessage({
      id: nextId("user"),
      role: "user",
      content: trimmed,
      time: getNow(),
    });

    const assistantId = nextId("assistant");
    addMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      time: getNow(),
    });

    try {
      const response = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          ticker: detectTicker(trimmed),
          language,
        }),
      });

      if (!response.ok || !response.body) {
        const fallbackError = `Chat request failed (${response.status})`;
        updateAssistantMessage(assistantId, fallbackError);
        setThoughtLog((prev) => [...prev, fallbackError]);
        setLoading(false);
        return;
      }

      for await (const event of parseSSEStream(response.body)) {
        if (event.type === "thought" && event.message) {
          setThoughtLog((prev) => [...prev, event.message as string]);
        }

        if (event.type === "token" && event.token) {
          updateAssistantMessage(assistantId, event.token);
        }

        if (event.type === "error") {
          const errText = event.message ?? "Streaming error";
          setThoughtLog((prev) => [...prev, errText]);
          if (!messages.find((m) => m.id === assistantId)?.content) {
            updateAssistantMessage(assistantId, errText);
          }
        }

        if (event.type === "done") {
          break;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown chat error";
      setThoughtLog((prev) => [...prev, message]);
      updateAssistantMessage(assistantId, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container page-enter"
      style={{
        paddingTop: "var(--spacing-md)",
        minHeight: "calc(100vh - 160px)",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 320px",
        gap: "var(--spacing-md)",
      }}
    >
      <div
        className="glass"
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "72vh",
          padding: "var(--spacing-md)",
        }}
      >
        <div style={{ marginBottom: "var(--spacing-md)" }}>
          <h1 className="headline-lg">AI Assistant</h1>
          <p className="data-mono" style={{ opacity: 0.6 }}>
            LLM MODE • SSE STREAMING • NATURAL LANGUAGE ENABLED
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button className="btn btn-outline" onClick={() => setActiveTab("chat")} style={{ padding: "8px 12px", borderColor: activeTab === "chat" ? "#0a84ff" : undefined, color: activeTab === "chat" ? "#0a84ff" : undefined }}>
            Chat
          </button>
          <button className="btn btn-outline" onClick={() => setActiveTab("verify")} style={{ padding: "8px 12px", borderColor: activeTab === "verify" ? "#ff3131" : undefined, color: activeTab === "verify" ? "#ff3131" : undefined }}>
            Verify a Tip
          </button>
        </div>

        {activeTab === "verify" ? <ScamDetector /> : null}

        <div style={{ display: activeTab === "chat" ? "flex" : "none", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              className="btn btn-outline"
              onClick={() => void sendMessage(prompt)}
              disabled={loading}
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            paddingBottom: 12,
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div key={msg.id} style={{ maxWidth: "88%", marginLeft: isUser ? "auto" : 0 }}>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: isUser ? "rgba(0,255,65,0.08)" : "rgba(15,22,41,0.9)",
                    border: `1px solid ${isUser ? "rgba(0,255,65,0.35)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <div className="data-mono" style={{ fontSize: 10, opacity: 0.6, marginBottom: 6 }}>
                    {isUser ? "OPERATOR" : "ALPHAAI"} {"//"} {msg.time}
                  </div>
                  <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {msg.content || (loading && !isUser ? "Thinking..." : "")}
                  </p>
                </div>
                {msg.comparisonData ? <div style={{ marginTop: 8 }}><StockComparison data={msg.comparisonData} /></div> : null}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
          style={{
            display: "flex",
            gap: 10,
            borderTop: "1px solid var(--outline-variant)",
            paddingTop: 12,
          }}
        >
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--outline)",
              borderRadius: 10,
              color: "white",
              padding: "0 10px",
            }}
          >
            <option value="en">EN</option>
            <option value="ur">UR</option>
          </select>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about stocks, PSX, crypto, risk, or comparisons"
            style={{
              flex: 1,
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--outline)",
              borderRadius: 10,
              padding: "12px",
              color: "white",
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "0 18px" }}>
            {loading ? "RUNNING" : "SEND"}
          </button>
        </form>
      </div>

      <aside className="glass" style={{ padding: "var(--spacing-md)", minHeight: "72vh" }}>
        <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>Thought Log</h2>
        <p className="data-mono" style={{ opacity: 0.6, marginTop: 0, marginBottom: 12, fontSize: 11 }}>
          DATA FETCH TRACE
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "64vh", overflowY: "auto" }}>
          {thoughtLog.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No reasoning trace yet.</p>
          ) : (
            thoughtLog.map((entry, index) => (
              <div
                key={`${entry}-${index}`}
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.03)",
                  padding: "8px 10px",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {entry}
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

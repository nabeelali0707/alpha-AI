"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  getDashboard,
  getCryptoMarket,
  getForexMarket,
  getPSXStocks,
  getRecommendations,
  type Recommendation,
} from "@/lib/api";

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

const QUICK_COMMANDS = ["Top Picks", "Market Overview", "PSX Stocks", "My Portfolio"];

const QUICK_PROMPTS = [
  "What is the outlook for PSX today?",
  "Analyze AAPL for swing trade",
  "ENGRO.KA ka trend batain",
  "Compare NVDA and AMD",
  "Is now a good time to buy TSLA?",
  "NVDA mein invest karna chahiye?",
];

const INITIAL_ASSISTANT_TIME = "00:00:00";

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
    { role: "assistant", content: "Neural Core ready. Try AAPL, ENGRO.KA, top picks, or ask a question directly below.", time: INITIAL_ASSISTANT_TIME },
  ]);
  const [thoughtLog, setThoughtLog] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat area
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      const lower = q.toLowerCase();
      if (lower === "top picks") {
        const recs = await getRecommendations();
        pushMessage({
          role: "assistant",
          content: "Top AI recommendations extracted from financial models.",
          time: new Date().toLocaleTimeString([], { hour12: false }),
          data: recs[0] ?? null,
        });
        setLoading(false);
      } else if (lower === "market overview") {
        const [crypto, forex] = await Promise.all([getCryptoMarket(), getForexMarket()]);
        pushMessage({
          role: "assistant",
          content: `Markets synchronized successfully. Active Crypto: ${crypto.length} currencies, Forex: ${forex.length} pairs.`,
          time: new Date().toLocaleTimeString([], { hour12: false }),
        });
        setLoading(false);
      } else if (lower === "psx stocks") {
        const psx = await getPSXStocks();
        const top = psx.slice(0, 5).map((item) => `${item.symbol} Rs.${item.price.toFixed(2)} (${item.change_percent.toFixed(2)}%)`).join(" | ");
        pushMessage({
          role: "assistant",
          content: `PSX Ticker Snapshot: ${top}`,
          time: new Date().toLocaleTimeString([], { hour12: false }),
        });
        setLoading(false);
      } else if (lower === "my portfolio") {
        pushMessage({
          role: "assistant",
          content: "Please log in to inspect custom portfolio performance. Navigate to the Portfolio tab.",
          time: new Date().toLocaleTimeString([], { hour12: false }),
        });
        setLoading(false);
      } else if (/^[A-Za-z0-9\.-]{1,12}$/.test(q) && !q.includes(" ")) {
        const ticker = q.toUpperCase();
        const dashboard = await getDashboard(ticker);
        const rec = dashboard.recommendation as any;
        pushMessage({
          role: "assistant",
          content: `${ticker} technical analysis and risk rating generated.`,
          time: new Date().toLocaleTimeString([], { hour12: false }),
          data: rec ?? null,
          urdu: rec?.urdu_explanation ?? null,
        });
        setLoading(false);
      } else {
        // Dynamic SSE Chat Streaming
        const assistantTime = new Date().toLocaleTimeString([], { hour12: false });
        
        // Add placeholder message for streaming content
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "", time: assistantTime }
        ]);

        const response = await fetch(`${process.env.NEXT_PUBLIC_ALPHAAI_API_BASE_URL ?? "http://localhost:8001/api/v1"}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: q,
            language: "en"
          }),
        });

        if (!response.ok || !response.body) {
          const fallbackError = response.status === 500
            ? "⚠️ AI backend not configured. Ask your team to add GROQ_API_KEY to backend/.env and restart the server."
            : `Chat request failed (${response.status})`;
          
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1].content = fallbackError;
            return updated;
          });
          setLoading(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim();
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    lastMsg.content += parsed.text;
                    return updated;
                  });
                } else if (parsed.error) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1].content = `⚠️ Error: ${parsed.error}`;
                    return updated;
                  });
                }
              } catch (e) {
                // Ignore parsing errors for partial stream chunks
              }
            }
          }
        }
        setLoading(false);
      }
    } catch (error) {
      pushMessage({
        role: "assistant",
        content: error instanceof Error ? error.message : "Failed to fetch backend analysis stream.",
        time: new Date().toLocaleTimeString([], { hour12: false }),
      });
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: "var(--spacing-md)", height: "calc(100vh - 180px)", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "var(--spacing-md)" }}>
        <h1 className="headline-lg">AI Assistant</h1>
        <p className="data-mono text-[#00ff41]" style={{ opacity: 0.8, fontSize: "11px", letterSpacing: "0.15em" }}>
          LLM MODE • SSE STREAMING • NATURAL LANGUAGE ENABLED
        </p>
      </div>

      <div className="glass" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "var(--spacing-md)", borderRadius: "var(--radius-lg)" }}>
        
        {/* Navigation Quick Commands */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {QUICK_COMMANDS.map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleCommand(cmd)}
              disabled={loading}
              className="btn btn-outline"
              style={{ padding: "6px 14px", fontSize: 11, borderRadius: "20px" }}
            >
              ⚡ {cmd}
            </button>
          ))}
        </div>

        {/* Scrollable Conversation History */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--spacing-md)", paddingBottom: "var(--spacing-md)", paddingRight: "6px" }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={i}
                style={{
                  maxWidth: "85%",
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  padding: "14px 18px",
                  borderRadius: "16px",
                  background: isUser ? "rgba(0, 255, 65, 0.08)" : "rgba(10, 15, 30, 0.85)",
                  border: `1px solid ${isUser ? "rgba(0, 255, 65, 0.3)" : "rgba(255, 255, 255, 0.08)"}`,
                  boxShadow: isUser ? "0 0 10px rgba(0, 255, 65, 0.05)" : "none",
                }}
              >
                <div className="data-mono" style={{ fontSize: "10px", marginBottom: "8px", opacity: 0.6, color: isUser ? "var(--accent-green)" : "var(--accent-blue)" }}>
                  {isUser ? "OPERATOR" : "NEURAL_CORE"} // {msg.time}
                </div>
                <p style={{ lineHeight: 1.6, fontSize: "13px", whiteSpace: "pre-wrap" }}>{msg.content}</p>
                
                {msg.data && (
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>Analysis Signal</span>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 700,
                        color: msg.data.recommendation === "BUY" ? "var(--accent-green)" : msg.data.recommendation === "SELL" ? "var(--accent-red)" : "var(--accent-blue)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}>
                        {msg.data.recommendation}
                      </span>
                    </div>
                    <div style={{ marginTop: 8, height: 6, background: "rgba(255, 255, 255, 0.08)", borderRadius: 999 }}>
                      <div style={{ height: "100%", width: `${(msg.data.confidence ?? 0) * 100}%`, background: "var(--accent-green)", borderRadius: 999 }} />
                    </div>
                    <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{msg.data.explanation}</p>
                    
                    {msg.urdu && (
                      <button
                        onClick={() => {
                          setMessages((prev) => prev.map((m, idx) => idx === i ? { ...m, showUrdu: !m.showUrdu } : m));
                        }}
                        style={{ marginTop: 8, fontSize: 11, border: "1px solid rgba(255, 255, 255, 0.12)", background: "rgba(255, 255, 255, 0.04)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", color: "var(--text-secondary)" }}
                      >
                        {msg.showUrdu ? "View in English" : "اردو میں دیکھیں"}
                      </button>
                    )}
                    {msg.showUrdu && msg.urdu && (
                      <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-secondary)", direction: "rtl", textAlign: "right", fontFamily: "var(--font-urdu)", lineHeight: 1.6 }}>
                        {msg.urdu}
                      </p>
                    )}
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

        {/* Demo Quick Prompts Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "8px", margin: "12px 0" }}>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleCommand(prompt)}
              disabled={loading}
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#dae2fd",
                fontSize: "11px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 255, 65, 0.05)";
                e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
              }}
            >
              💡 "{prompt}"
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} style={{ display: "flex", gap: "var(--spacing-sm)", paddingTop: "var(--spacing-md)", borderTop: "1px solid var(--outline-variant)" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask neural model a financial question or check scanner anomalies..."
            disabled={loading}
            style={{
              flex: 1,
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid var(--outline)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 16px",
              color: "white",
              fontSize: "13px",
              fontFamily: "var(--font-body)",
            }}
          />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: "0 28px", borderRadius: "var(--radius-sm)" }}>
            {loading ? "STREAMING" : "EXECUTE"}
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

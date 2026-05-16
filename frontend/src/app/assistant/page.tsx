"use client";

import React, { useState } from "react";
import {
  getDashboard,
  getCryptoMarket,
  getForexMarket,
  getPSXStocks,
  getRecommendations,
  type Recommendation,
} from "@/lib/api";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
  time: string;
  data?: Recommendation | null;
  urdu?: string | null;
  showUrdu?: boolean;
};

const QUICK_COMMANDS = ["Top Picks", "Market Overview", "PSX Stocks", "My Portfolio"];
const INITIAL_ASSISTANT_TIME = "00:00:00";

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Neural Core ready. Try AAPL, ENGRO.KA, top picks, or market overview.", time: INITIAL_ASSISTANT_TIME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const pushMessage = (msg: ChatMessage) => setMessages((prev) => [...prev, msg]);

  async function handleCommand(text: string) {
    const q = text.trim();
    if (!q) return;
    const time = new Date().toLocaleTimeString([], { hour12: false });

    pushMessage({ role: "user", content: q, time });
    setLoading(true);

    try {
      const lower = q.toLowerCase();
      if (lower === "top picks") {
        const recs = await getRecommendations();
        pushMessage({
          role: "assistant",
          content: "Top AI Picks",
          time: new Date().toLocaleTimeString([], { hour12: false }),
          data: recs[0] ?? null,
        });
      } else if (lower === "market overview") {
        const [crypto, forex] = await Promise.all([getCryptoMarket(), getForexMarket()]);
        pushMessage({
          role: "assistant",
          content: `Markets loaded: Crypto ${crypto.length}, FX ${forex.length}.`,
          time: new Date().toLocaleTimeString([], { hour12: false }),
        });
      } else if (lower === "psx stocks") {
        const psx = await getPSXStocks();
        const top = psx.slice(0, 5).map((item) => `${item.symbol} ${item.price.toFixed(2)} (${item.change_percent.toFixed(2)}%)`).join(" | ");
        pushMessage({
          role: "assistant",
          content: `PSX snapshot: ${top}`,
          time: new Date().toLocaleTimeString([], { hour12: false }),
        });
      } else if (lower === "my portfolio") {
        pushMessage({
          role: "assistant",
          content: "Log in to view your portfolio. Open the Portfolio tab after authentication.",
          time: new Date().toLocaleTimeString([], { hour12: false }),
        });
      } else if (/^[A-Za-z0-9\.-]{1,12}$/.test(q)) {
        const ticker = q.toUpperCase();
        const dashboard = await getDashboard(ticker);
        const rec = dashboard.recommendation as any;
        pushMessage({
          role: "assistant",
          content: `${ticker} analysis ready.`,
          time: new Date().toLocaleTimeString([], { hour12: false }),
          data: rec ?? null,
          urdu: rec?.urdu_explanation ?? null,
        });
      } else {
        pushMessage({
          role: "assistant",
          content: "Try: AAPL, ENGRO.KA, top picks, market overview, or PSX stocks.",
          time: new Date().toLocaleTimeString([], { hour12: false }),
        });
      }
    } catch (error) {
      pushMessage({
        role: "assistant",
        content: error instanceof Error ? error.message : "Failed to fetch backend analysis.",
        time: new Date().toLocaleTimeString([], { hour12: false }),
      });
    } finally {
      setLoading(false);
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim();
    if (!value || loading) return;
    setInput("");
    await handleCommand(value);
  };

  return (
    <div className="container" style={{ paddingTop: "var(--spacing-md)", height: "calc(100vh - 180px)", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "var(--spacing-md)" }}>
        <h1 className="headline-lg">AI Assistant</h1>
        <p className="data-mono" style={{ opacity: 0.5 }}>CONNECTED TO ALPHA_BRAIN_CLUSTER_01</p>
      </div>

      <div className="glass" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "var(--spacing-md)" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {QUICK_COMMANDS.map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleCommand(cmd)}
              className="btn btn-outline"
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              {cmd}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--spacing-md)", paddingBottom: "var(--spacing-md)" }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={i}
                style={{
                  maxWidth: "80%",
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  padding: "var(--spacing-sm)",
                  borderRadius: "var(--radius-md)",
                  background: isUser ? "rgba(0,255,65,0.08)" : "rgba(15,22,41,0.9)",
                  border: `1px solid ${isUser ? "rgba(0,255,65,0.35)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                <div className="data-mono" style={{ fontSize: "10px", marginBottom: "6px", opacity: 0.6, color: isUser ? "var(--accent-green)" : "var(--text-secondary)" }}>
                  {isUser ? "OPERATOR" : "NEURAL_CORE"} // {msg.time}
                </div>
                <p style={{ lineHeight: 1.5 }}>{msg.content}</p>
                {msg.data && (
                  <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>Recommendation</span>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        color: msg.data.recommendation === "BUY" ? "var(--accent-green)" : msg.data.recommendation === "SELL" ? "var(--accent-red)" : "var(--accent-blue)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}>
                        {msg.data.recommendation}
                      </span>
                    </div>
                    <div style={{ marginTop: 8, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 999 }}>
                      <div style={{ height: "100%", width: `${(msg.data.confidence ?? 0) * 100}%`, background: "var(--accent-green)", borderRadius: 999 }} />
                    </div>
                    <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-secondary)" }}>{msg.data.explanation}</p>
                    {msg.urdu && (
                      <button
                        onClick={() => {
                          setMessages((prev) => prev.map((m, idx) => idx === i ? { ...m, showUrdu: !m.showUrdu } : m));
                        }}
                        style={{ marginTop: 6, fontSize: 11, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: "var(--text-secondary)" }}
                      >
                        {msg.showUrdu ? "View in English" : "اردو میں دیکھیں"}
                      </button>
                    )}
                    {msg.showUrdu && msg.urdu && (
                      <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-secondary)" }}>{msg.urdu}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSend} style={{ display: "flex", gap: "var(--spacing-sm)", paddingTop: "var(--spacing-md)", borderTop: "1px solid var(--outline-variant)" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter ticker or command..."
            style={{
              flex: 1,
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--outline)",
              borderRadius: "var(--radius-sm)",
              padding: "12px",
              color: "white",
              fontFamily: "var(--font-body)",
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: "0 24px" }}>
            {loading ? "RUNNING" : "EXECUTE"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { getStockComparison } from "@/lib/api";

type ComparisonAnalysis = {
  winner?: string;
  confidence?: number;
  summary?: string;
  left_reasons?: string[];
  right_reasons?: string[];
};

type ComparisonPayload = {
  ticker_a: string;
  ticker_b: string;
  left: { ticker: string; price?: { price?: number; change_percent?: number } };
  right: { ticker: string; price?: { price?: number; change_percent?: number } };
  analysis: ComparisonAnalysis;
};

export default function StockComparison({ onClose, data }: { onClose?: () => void; data?: ComparisonPayload | null }) {
  const [tickerA, setTickerA] = useState("");
  const [tickerB, setTickerB] = useState("");
  const [result, setResult] = useState<ComparisonPayload | null>(data ?? null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!tickerA.trim() || !tickerB.trim()) return;
    setLoading(true);
    try {
      const data = await getStockComparison(tickerA.trim().toUpperCase(), tickerB.trim().toUpperCase());
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const winner = result?.analysis?.winner;

  return (
    <div style={{
      padding: 20, borderRadius: 18,
      background: "rgba(15, 22, 41, 0.95)",
      border: "1px solid rgba(10,132,255,0.2)",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 11, letterSpacing: "0.14em", color: "#0a84ff", fontWeight: 700 }}>
          ⚔️ HEAD-TO-HEAD COMPARISON
        </span>
        {onClose && (
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>✕</button>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input
          value={tickerA}
          onChange={(e) => setTickerA(e.target.value)}
          placeholder="Stock A (e.g. AAPL)"
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10,
            background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
            color: "white", fontSize: 13, fontFamily: "inherit",
          }}
        />
        <span style={{ color: "#94a3b8", fontWeight: 700, fontSize: 12 }}>VS</span>
        <input
          value={tickerB}
          onChange={(e) => setTickerB(e.target.value)}
          placeholder="Stock B (e.g. MSFT)"
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10,
            background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
            color: "white", fontSize: 13, fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleCompare}
          disabled={loading || !tickerA.trim() || !tickerB.trim()}
          style={{
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #0a84ff, #6366f1)",
            color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "⟳" : "Compare"}
        </button>
      </div>

      {result && (
        <div style={{
          padding: 16, borderRadius: 14,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[result.left, result.right].map((side) => (
              <div key={side.ticker} style={{ border: `1px solid ${winner === side.ticker ? "rgba(0,255,65,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: 10, background: "rgba(0,0,0,0.2)" }}>
                <div style={{ fontSize: 12, color: "#9ca3af", letterSpacing: "0.08em" }}>{side.ticker}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#dae2fd", marginTop: 6 }}>${(side.price?.price ?? 0).toFixed(2)}</div>
                <div style={{ fontSize: 12, color: (side.price?.change_percent ?? 0) >= 0 ? "#00ff41" : "#ff3131" }}>
                  {(side.price?.change_percent ?? 0).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: "#c7d3ffcc" }}>
            <strong>Winner:</strong> {winner || "N/A"} ({Math.round((result.analysis?.confidence ?? 0) * 100)}% confidence)
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#dae2fd" }}>{result.analysis?.summary}</div>
        </div>
      )}
    </div>
  );
}

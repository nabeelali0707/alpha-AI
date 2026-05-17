"use client";

import React, { useState } from "react";
import { checkScamTip } from "@/lib/api";

export default function ScamDetector({ onClose }: { onClose?: () => void }) {
  const [tipText, setTipText] = useState("");
  const [result, setResult] = useState<{ verdict: string; red_flags: string[]; actual_data: string; ticker?: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!tipText.trim()) return;
    setLoading(true);
    try {
      const data = await checkScamTip(tipText.trim());
      setResult(data);
    } catch {
      setResult({ verdict: "SUSPICIOUS", red_flags: ["Unable to verify this tip right now."], actual_data: "Try again shortly." });
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = (result?.verdict || "").includes("LEGITIMATE")
    ? "#00ff41"
    : (result?.verdict || "").includes("SUSPICIOUS")
    ? "#ffaa00"
    : (result?.verdict || "").includes("SCAM")
    ? "#ff3131"
    : "#dae2fd";

  return (
    <div style={{
      padding: 20, borderRadius: 18,
      background: "rgba(15, 22, 41, 0.95)",
      border: "1px solid rgba(255,49,49,0.15)",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 11, letterSpacing: "0.14em", color: "#ff3131", fontWeight: 700 }}>
          🛡️ SCAM / PUMP-AND-DUMP DETECTOR
        </span>
        {onClose && (
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>✕</button>
        )}
      </div>

      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
        Paste a WhatsApp/social stock tip. AlphaAI extracts ticker mentions, checks live data, and returns a fraud verdict.
      </p>

      <textarea
        value={tipText}
        onChange={(e) => setTipText(e.target.value)}
        placeholder='Paste the tip here, e.g. "Buy XYZ stock now! It will go up 50% tomorrow guaranteed!"'
        rows={3}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 10,
          background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
          color: "white", fontSize: 13, fontFamily: "inherit",
          resize: "vertical", marginBottom: 10,
        }}
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button
          onClick={handleCheck}
          disabled={loading || !tipText.trim()}
          style={{
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #ff3131, #ff6b6b)",
            color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Verifying..." : "🔍 Verify Tip"}
        </button>
      </div>

      {result && (
        <div style={{
          padding: 16, borderRadius: 14,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${verdictColor}30`,
        }}>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: verdictColor }}>
            <strong>VERDICT: {result.verdict}</strong>
          </div>
          {result.ticker ? <div style={{ marginTop: 6, fontSize: 12, color: "#c7d3ffcc" }}>Ticker detected: {result.ticker}</div> : null}
          <div style={{ marginTop: 10, fontSize: 12, color: "#ffb4b4" }}>
            <strong>RED FLAGS:</strong>
            <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
              {(result.red_flags || []).map((flag, idx) => <li key={`${flag}-${idx}`}>{flag}</li>)}
            </ul>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#dae2fd" }}>
            <strong>WHAT DATA ACTUALLY SHOWS:</strong>
            <div style={{ marginTop: 4 }}>{result.actual_data}</div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { getDailyBriefing } from "@/lib/api";

export default function DailyBriefing() {
  const [show, setShow] = useState(false);
  const [briefing, setBriefing] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "ur">("en");

  const fetchBriefing = async () => {
    if (show && briefing) { setShow(false); return; }
    setShow(true);
    setLoading(true);
    try {
      const data = await getDailyBriefing(
        ["AAPL", "MSFT", "NVDA", "ENGRO.KA", "HBL.KA"],
        language
      );
      setBriefing(data.briefing);
    } catch {
      setBriefing("Unable to generate briefing right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToWhatsApp = () => {
    navigator.clipboard.writeText(briefing).then(() => {
      alert("Briefing copied! Paste it in WhatsApp.");
    });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={fetchBriefing}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600,
            boxShadow: "0 0 12px rgba(99,102,241,0.3)",
            transition: "all 0.3s ease",
          }}
        >
          ☀️ {show ? "Hide" : "Morning"} Briefing
        </button>
        <button
          onClick={() => { setLanguage(language === "en" ? "ur" : "en"); setBriefing(""); }}
          style={{
            padding: "4px 10px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "#c7d3ffcc", fontSize: 11, cursor: "pointer", fontWeight: 600,
          }}
        >
          {language === "en" ? "EN" : "اردو"}
        </button>
      </div>

      {show && (
        <div
          style={{
            marginTop: 12, padding: 20, borderRadius: 16,
            background: "rgba(15, 22, 41, 0.95)",
            border: "1px solid rgba(99,102,241,0.2)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.14em", color: "#8b5cf6", fontWeight: 700 }}>
              📋 YOUR PERSONALIZED BRIEFING
            </span>
            {briefing && (
              <button
                onClick={copyToWhatsApp}
                style={{
                  padding: "4px 10px", borderRadius: 8, border: "none",
                  background: "rgba(37,211,102,0.15)", color: "#25d366",
                  cursor: "pointer", fontSize: 11, fontWeight: 600,
                }}
              >
                📱 Copy for WhatsApp
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 13 }}>
              <div style={{ marginBottom: 8, fontSize: 20, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
              <p>Generating your personalized briefing...</p>
            </div>
          ) : (
            <pre style={{
              fontSize: 13, lineHeight: 1.8, color: "#dae2fd", margin: 0,
              whiteSpace: "pre-wrap", fontFamily: "inherit",
            }}>
              {briefing}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

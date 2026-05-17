"use client";

import React, { useState } from "react";
import { getMarketNarration } from "@/lib/api";

export default function MarketNarrator() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "ur">("en");
  const [narrationText, setNarrationText] = useState("");

  const speak = async () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getMarketNarration(language);
      setNarrationText(data.narration);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(data.narration);
        utter.rate = 0.9;
        utter.lang = language === "ur" ? "ur-PK" : "en-US";

        const voices = window.speechSynthesis.getVoices();
        if (language === "ur") {
          const urduVoice = voices.find((v) => v.lang.startsWith("ur"));
          if (urduVoice) utter.voice = urduVoice;
        } else {
          const enVoice = voices.find((v) => v.lang.startsWith("en") && v.name.includes("Female"));
          if (enVoice) utter.voice = enVoice;
        }

        utter.onstart = () => setIsPlaying(true);
        utter.onend = () => setIsPlaying(false);
        utter.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utter);
      }
    } catch {
      setNarrationText("Unable to generate narration right now.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderRadius: 16,
        background: isPlaying
          ? "linear-gradient(135deg, rgba(0,255,65,0.12), rgba(10,132,255,0.08))"
          : "rgba(255,255,255,0.04)",
        border: `1px solid ${isPlaying ? "rgba(0,255,65,0.3)" : "rgba(255,255,255,0.08)"}`,
        transition: "all 0.3s ease",
      }}
    >
      <button
        onClick={() => setLanguage(language === "en" ? "ur" : "en")}
        style={{
          padding: "4px 10px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          color: "#c7d3ffcc",
          fontSize: 11,
          cursor: "pointer",
          fontWeight: 600,
        }}
        title="Toggle language"
      >
        {language === "en" ? "EN" : "اردو"}
      </button>

      <button
        onClick={speak}
        disabled={isLoading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          borderRadius: 12,
          border: "none",
          background: isPlaying
            ? "linear-gradient(135deg, #00ff41, #0a84ff)"
            : "linear-gradient(135deg, #0a84ff, #6366f1)",
          color: "white",
          cursor: isLoading ? "wait" : "pointer",
          fontSize: 13,
          fontWeight: 600,
          transition: "all 0.3s ease",
          boxShadow: isPlaying ? "0 0 20px rgba(0,255,65,0.3)" : "0 0 10px rgba(10,132,255,0.2)",
        }}
      >
        {isLoading ? (
          <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
        ) : isPlaying ? (
          "⏹"
        ) : (
          "🔊"
        )}
        {isLoading ? "Generating..." : isPlaying ? "Stop Narrator" : "Market Mood"}
      </button>

      {isPlaying && (
        <span
          style={{
            fontSize: 11,
            color: "#00ff41",
            letterSpacing: "0.12em",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          ● SPEAKING
        </span>
      )}

      {narrationText && !isPlaying && !isLoading && (
        <span
          style={{
            fontSize: 11,
            color: "rgba(199, 211, 255, 0.6)",
            maxWidth: 300,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={narrationText}
        >
          {narrationText.substring(0, 60)}...
        </span>
      )}
    </div>
  );
}

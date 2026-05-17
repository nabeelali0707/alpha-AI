"use client";

import React, { useState } from "react";

function resolveBaseUrl() {
  const rawBase = process.env.NEXT_PUBLIC_ALPHAAI_API_BASE_URL ?? "http://localhost:8001/api/v1";
  if (/^https?:\/\//i.test(rawBase)) return rawBase;
  if (rawBase.startsWith(":")) return `http://localhost${rawBase}`;
  return `http://${rawBase}`;
}

export default function VoiceButton({ userLanguage = "en" }: { userLanguage?: "en" | "ur" }) {
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const onSpeak = async () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    setLoading(true);
    try {
      const base = resolveBaseUrl();
      const response = await fetch(`${base}/market/briefing?language=${userLanguage}`);
      const data = await response.json();
      const text = (data?.briefing as string) || "Market briefing unavailable.";

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = userLanguage === "ur" ? "ur-PK" : "en-US";
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={() => void onSpeak()}
      disabled={loading}
      className="btn btn-outline"
      style={{ padding: "10px 14px", fontSize: 13 }}
      title="Play market voice briefing"
    >
      {loading ? "Generating..." : speaking ? "Stop Narrator" : "🔊 Play Briefing"}
    </button>
  );
}

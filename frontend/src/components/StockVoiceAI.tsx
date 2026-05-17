"use client";

import React, { useEffect, useRef, useState } from "react";
import type { DashboardResponse, Recommendation } from "@/lib/api";

type VoiceStatus = "idle" | "speaking" | "listening" | "processing";

type Props = {
  ticker: string;
  dashboard?: DashboardResponse | null;
  autoSpeak?: boolean;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  results: Array<Array<{ transcript: string }>>;
};

function hasSpeechSynthesis() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      resolve(voices);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

async function speak(text: string, rate = 0.92, onEnd?: () => void) {
  if (!hasSpeechSynthesis()) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = rate;
  const voices = await getVoices();
  const preferred = voices.find((voice) => voice.lang.startsWith("en") && (voice.name.includes("Natural") || voice.name.includes("Samantha") || voice.name.includes("Karen")));
  if (preferred) utter.voice = preferred;
  if (onEnd) utter.onend = onEnd;
  window.speechSynthesis.speak(utter);
}

function buildOverview(ticker: string, dashboard?: DashboardResponse | null) {
  const rec = dashboard?.recommendation as Recommendation | undefined;
  const price = dashboard?.price?.price != null ? `$${dashboard.price.price.toFixed(2)}` : "unavailable";
  const change = dashboard?.price?.change_percent != null ? `${dashboard.price.change_percent.toFixed(2)}%` : "unknown";
  const action = rec?.recommendation ?? "HOLD";
  const confidence = rec?.confidence != null ? `${Math.round(rec.confidence * 100)} percent` : "unknown";
  const winProbability = rec?.win_probability != null ? `${rec.win_probability} percent win probability` : "no win probability available";
  return `Stock overview for ${ticker}. Current price is ${price} with ${change} change. Recommendation is ${action} with ${confidence} confidence and ${winProbability}.`;
}

function answerQuestion(question: string, ticker: string, dashboard?: DashboardResponse | null) {
  const rec = dashboard?.recommendation as Recommendation | undefined;
  const lower = question.toLowerCase();
  const price = dashboard?.price?.price;
  const change = dashboard?.price?.change_percent;

  if (lower.includes("buy") || lower.includes("should i")) {
    return rec ? `For ${ticker}, the current recommendation is ${rec.recommendation}. ${rec.explanation}` : `I do not have a live recommendation for ${ticker} right now.`;
  }
  if (lower.includes("price") || lower.includes("trading")) {
    return price != null ? `The current price for ${ticker} is ${price.toFixed(2)} dollars with a ${change?.toFixed(2) ?? "0.00"} percent move.` : `I cannot read the latest price for ${ticker}.`;
  }
  if (lower.includes("confidence") || lower.includes("win")) {
    return rec?.win_probability != null ? `The model estimates a ${rec.win_probability} percent win probability for ${ticker}.` : `Win probability is not available for ${ticker}.`;
  }
  if (lower.includes("sentiment") || lower.includes("news")) {
    const sentiment = dashboard?.sentiment as { label?: string; score?: number } | undefined;
    return sentiment ? `Recent sentiment for ${ticker} is ${sentiment.label ?? "neutral"} with score ${sentiment.score ?? 0}.` : `Sentiment data is not available for ${ticker}.`;
  }
  return rec?.explanation ?? `I have the latest analysis for ${ticker}, but I need more context to answer that question.`;
}

export default function StockVoiceAI({ ticker, dashboard, autoSpeak = false }: Props) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const lastSpokenKey = useRef<string>("");

  useEffect(() => {
    if (!autoSpeak || muted || !dashboard?.recommendation) return;
    const key = `${ticker}:${dashboard.recommendation.score ?? 0}:${dashboard.recommendation.recommendation ?? ""}`;
    if (lastSpokenKey.current === key) return;
    lastSpokenKey.current = key;
    setStatus("speaking");
    void speak(buildOverview(ticker, dashboard), 0.92, () => setStatus("idle"));
  }, [autoSpeak, dashboard, muted, ticker]);

  useEffect(() => {
    return () => {
      if (hasSpeechSynthesis()) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.stop();
    };
  }, []);

  const startVoiceQuestion = () => {
    const SpeechRecognitionImpl = (window as Window & typeof globalThis & {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    }).SpeechRecognition ?? (window as Window & typeof globalThis & {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    }).webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      alert("Use Chrome or Edge for voice input.");
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognitionRef.current = recognition;
    setStatus("listening");
    recognition.onresult = async (event: SpeechRecognitionEventLike) => {
      const question = event.results?.[0]?.[0]?.transcript ?? "";
      setTranscript(question);
      setStatus("processing");
      const answer = answerQuestion(question, ticker, dashboard);
      if (!muted) {
        setStatus("speaking");
        await speak(answer, 0.92, () => setStatus("idle"));
      } else {
        setStatus("idle");
      }
    };
    recognition.onerror = () => setStatus("idle");
    recognition.onend = () => {
      if (status === "listening") setStatus("idle");
    };
    recognition.start();
  };

  const isActive = status === "speaking" || status === "listening" || status === "processing";

  return (
    <div style={{ padding: "14px", borderRadius: "16px", background: "rgba(15,22,41,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(148,163,184,0.65)" }}>Voice AI</div>
          <div style={{ fontSize: 13, color: "#e5e7eb", marginTop: 4 }}>Speak analysis for {ticker}</div>
        </div>
        <button
          onClick={() => {
            if (hasSpeechSynthesis()) {
              window.speechSynthesis.cancel();
            }
            setMuted((value) => !value);
          }}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: muted ? "rgba(255,49,49,0.12)" : "rgba(255,255,255,0.04)",
            color: muted ? "#ff7b7b" : "#cbd5e1",
            cursor: "pointer",
          }}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: isActive ? "#00ff41" : "#64748b", boxShadow: isActive ? "0 0 10px #00ff41" : "none" }} />
        <span style={{ fontSize: 12, color: "rgba(199,211,255,0.75)" }}>
          {status === "listening" ? "Listening" : status === "speaking" ? "Speaking" : status === "processing" ? "Processing question" : muted ? "Muted" : "Ready"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "end", height: 32, marginBottom: 12 }}>
        {[12, 18, 10, 22, 14, 20].map((height, index) => (
          <span
            key={index}
            style={{
              width: 6,
              height: isActive ? `${height + 8}px` : `${height}px`,
              borderRadius: 999,
              background: "linear-gradient(180deg, #00ff41, #0a84ff)",
              opacity: 0.8,
              transition: "height 180ms ease",
              animation: isActive ? `wave 1s ease-in-out ${index * 0.08}s infinite alternate` : "none",
            }}
          />
        ))}
      </div>

      <button
        onClick={startVoiceQuestion}
        disabled={muted}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: muted ? "rgba(255,255,255,0.02)" : "rgba(0,255,65,0.08)",
          color: muted ? "#64748b" : "#d1fae5",
          cursor: muted ? "not-allowed" : "pointer",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        🎤 Ask a Question
      </button>

      {transcript && (
        <div style={{ marginTop: 10, fontSize: 12, color: "rgba(199,211,255,0.72)", lineHeight: 1.5 }}>
          Heard: {transcript}
        </div>
      )}

      <style>{`@keyframes wave { from { transform: scaleY(0.8); } to { transform: scaleY(1.35); } }`}</style>
    </div>
  );
}
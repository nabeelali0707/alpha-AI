"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Recommendation {
  recommendation: string;
  confidence: number;
  score: number;
  explanation: string;
  urdu_explanation?: string | null;
  reasons: string[];
  sentiment_summary?: { label?: string; score?: number; total_articles?: number } | null;
}

interface Props {
  data?: Recommendation | null;
  loading?: boolean;
  ticker: string;
}

function CircleProgress({ value, color }: { value: number; color: string }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (value / 100) * circumference;
  const canvasRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.strokeDashoffset = String(circumference);
      requestAnimationFrame(() => {
        if (canvasRef.current) {
          canvasRef.current.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)";
          canvasRef.current.style.strokeDashoffset = String(progress);
        }
      });
    }
  }, [value, progress, circumference]);

  return (
    <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle
        ref={canvasRef}
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
    </svg>
  );
}

function SkeletonLine({ w = "100%", h = "16px" }: { w?: string; h?: string }) {
  return <div style={{ width: w, height: h, borderRadius: "6px", background: "rgba(255,255,255,0.06)", animation: "shimmer 1.5s infinite linear" }} />;
}

export default function AIRecommendationCard({ data, loading = false, ticker }: Props) {
  const rec = data?.recommendation ?? "HOLD";
  const confidence = Math.round((data?.confidence ?? 0.65) * 100);
  const score = data?.score ?? 65;
  const [useUrdu, setUseUrdu] = React.useState(false);

  const colorMap: Record<string, string> = { BUY: "#00ff41", SELL: "#ff3131", HOLD: "#0a84ff" };
  const glowMap: Record<string, string> = {
    BUY: "rgba(0,255,65,0.2)",
    SELL: "rgba(255,49,49,0.2)",
    HOLD: "rgba(10,132,255,0.2)",
  };
  const recColor = colorMap[rec] ?? "#0a84ff";
  const recGlow = glowMap[rec] ?? "rgba(10,132,255,0.2)";

  const sentimentLabel = data?.sentiment_summary?.label ?? "NEUTRAL";
  const sentimentColor = sentimentLabel === "BULLISH" ? "#00ff41" : sentimentLabel === "BEARISH" ? "#ff3131" : "#0a84ff";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      style={{
        background: "rgba(17, 24, 39, 0.85)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${recGlow.replace("0.2", "0.25")}`,
        borderRadius: "1.5rem",
        padding: "28px",
        boxShadow: loading ? "none" : `0 0 40px ${recGlow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: "absolute",
        top: "-40px",
        right: "-40px",
        width: "160px",
        height: "160px",
        borderRadius: "50%",
        background: recGlow,
        filter: "blur(40px)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(148,163,184,0.7)", margin: 0 }}>
          AI Recommendation
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00ff41", animation: "pulse-glow 2s infinite" }} />
          <span style={{ fontSize: "10px", color: "#00ff41", letterSpacing: "0.1em" }}>LIVE AI</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <SkeletonLine w="100px" h="52px" />
          <SkeletonLine h="8px" />
          <SkeletonLine w="80%" h="14px" />
          <SkeletonLine w="60%" h="14px" />
        </div>
      ) : (
        <>
          {/* Main recommendation + circle */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "20px" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <CircleProgress value={confidence} color={recColor} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "var(--font-headline)", fontSize: "20px", fontWeight: 700, color: recColor }}>{confidence}%</span>
              </div>
            </div>
            <div>
              <div style={{
                fontFamily: "var(--font-headline)",
                fontSize: "40px",
                fontWeight: 800,
                color: recColor,
                letterSpacing: "-0.02em",
                textShadow: `0 0 20px ${recGlow}`,
                lineHeight: 1,
              }}>
                {rec}
              </div>
              <p style={{ fontSize: "12px", color: "rgba(148,163,184,0.7)", margin: "4px 0 0" }}>
                Confidence score: {score.toFixed(0)}/100
              </p>
            </div>
          </div>

          {/* Score bar */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
                style={{ height: "100%", background: `linear-gradient(90deg, ${recColor}80, ${recColor})`, borderRadius: "9999px", boxShadow: `0 0 8px ${recColor}60` }}
              />
            </div>
          </div>

          {/* Sentiment badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{ fontSize: "11px", color: "rgba(148,163,184,0.6)" }}>Sentiment:</span>
            <span style={{
              padding: "2px 10px",
              borderRadius: "9999px",
              fontSize: "11px",
              fontWeight: 600,
              background: `${sentimentColor}15`,
              border: `1px solid ${sentimentColor}40`,
              color: sentimentColor,
            }}>
              {sentimentLabel}
            </span>
            {data?.sentiment_summary?.total_articles != null && (
              <span style={{ fontSize: "11px", color: "rgba(148,163,184,0.5)" }}>
                ({data.sentiment_summary.total_articles} articles)
              </span>
            )}
          </div>

          {/* Explanation */}
          {(data?.explanation || data?.urdu_explanation) && (
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "13px", color: "rgba(199,211,255,0.8)", lineHeight: 1.7, marginBottom: "10px", borderLeft: `2px solid ${recColor}40`, paddingLeft: "12px" }}>
                {(useUrdu && data?.urdu_explanation ? data.urdu_explanation : data?.explanation)?.split("\n")[0]}
              </p>
              {data?.urdu_explanation && (
                <button
                  onClick={() => setUseUrdu((s) => !s)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(199,211,255,0.85)",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  {useUrdu ? "View in English" : "اردو میں دیکھیں"}
                </button>
              )}
            </div>
          )}

          {/* Reasons */}
          {data?.reasons && data.reasons.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(148,163,184,0.5)", margin: 0 }}>Key Factors</p>
              {data.reasons.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "10px",
                    borderLeft: `3px solid ${recColor}50`,
                  }}
                >
                  <span style={{ color: recColor, fontSize: "14px", lineHeight: 1.5, flexShrink: 0 }}>•</span>
                  <span style={{ fontSize: "12px", color: "rgba(199,211,255,0.8)", lineHeight: 1.6 }}>{r}</span>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

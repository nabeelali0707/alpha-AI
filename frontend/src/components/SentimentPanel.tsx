"use client";

import React from "react";
import { motion } from "framer-motion";

interface HeadlineSentiment {
  headline: string;
  source: string;
  url: string;
  published_date: string;
  sentiment?: {
    label: string;
    confidence: number;
  };
}

interface SentimentData {
  symbol: string;
  label: string;
  score: number;
  total_articles: number;
  breakdown: { positive: number; negative: number; neutral: number };
  headlines?: HeadlineSentiment[];
  indicators?: string[];
}

interface Props {
  data?: SentimentData | null;
  loading?: boolean;
}

function SkeletonLine({ w = "100%", h = "16px" }: { w?: string; h?: string }) {
  return <div style={{ width: w, height: h, borderRadius: "6px", background: "rgba(255,255,255,0.06)", animation: "shimmer 1.5s infinite linear" }} />;
}

const LABEL_CONFIG: Record<string, { color: string; glow: string; icon: string; description: string }> = {
  BULLISH: { color: "#00ff41", glow: "rgba(0,255,65,0.15)", icon: "▲", description: "Market sentiment is predominantly positive" },
  BEARISH: { color: "#ff3131", glow: "rgba(255,49,49,0.15)", icon: "▼", description: "Market sentiment is predominantly negative" },
  NEUTRAL: { color: "#0a84ff", glow: "rgba(10,132,255,0.15)", icon: "◆", description: "Market sentiment is mixed or neutral" },
};

const HEADLINE_COLORS: Record<string, string> = {
  positive: "#00ff41",
  negative: "#ff3131",
  neutral: "#0a84ff",
};

export default function SentimentPanel({ data, loading = false }: Props) {
  const label = data?.label ?? "NEUTRAL";
  const cfg = LABEL_CONFIG[label] ?? LABEL_CONFIG.NEUTRAL;
  const total = data?.total_articles ?? 0;
  const breakdown = data?.breakdown ?? { positive: 0, negative: 0, neutral: 0 };
  const confidence = total > 0 ? Math.round((Math.max(breakdown.positive, breakdown.negative, breakdown.neutral) / total) * 100) : 0;

  const bars = [
    { key: "positive", label: "Bullish", value: breakdown.positive, color: "#00ff41" },
    { key: "negative", label: "Bearish", value: breakdown.negative, color: "#ff3131" },
    { key: "neutral",  label: "Neutral",  value: breakdown.neutral,  color: "#0a84ff" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      style={{
        background: "rgba(17, 24, 39, 0.85)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "1.5rem",
        padding: "28px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(148,163,184,0.7)", margin: 0 }}>
          AI Sentiment Analysis
        </p>
        {!loading && total > 0 && (
          <span style={{ fontSize: "11px", color: "rgba(148,163,184,0.5)" }}>
            {total} articles
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <SkeletonLine w="160px" h="48px" />
          <SkeletonLine h="8px" />
          <SkeletonLine w="70%" h="8px" />
        </div>
      ) : (
        <>
          {/* Main sentiment */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            padding: "20px",
            background: cfg.glow,
            borderRadius: "1rem",
            border: `1px solid ${cfg.color}25`,
            marginBottom: "24px",
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: `${cfg.color}20`,
              border: `2px solid ${cfg.color}50`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: cfg.color,
              flexShrink: 0,
              boxShadow: `0 0 20px ${cfg.glow}`,
            }}>
              {cfg.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-headline)", fontSize: "28px", fontWeight: 700, color: cfg.color, lineHeight: 1 }}>
                {label}
              </div>
              <p style={{ fontSize: "12px", color: "rgba(148,163,184,0.7)", margin: "4px 0 0" }}>
                {cfg.description}
              </p>
            </div>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontFamily: "var(--font-headline)", fontSize: "24px", fontWeight: 700, color: cfg.color }}>{confidence}%</div>
              <p style={{ fontSize: "10px", color: "rgba(148,163,184,0.5)", margin: "2px 0 0", letterSpacing: "0.1em" }}>CONFIDENCE</p>
            </div>
          </div>

          {/* Breakdown bars */}
          {total > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {bars.map(({ key, label: blabel, value, color }) => (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: "rgba(148,163,184,0.7)" }}>{blabel}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color }}>{value}/{total}</span>
                  </div>
                  <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: total > 0 ? `${(value / total) * 100}%` : "0%" }}
                      transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
                      style={{ height: "100%", background: color, borderRadius: "9999px", boxShadow: `0 0 6px ${color}50` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Indicators */}
          {data?.indicators && data.indicators.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              {data.indicators.map((ind, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ color: cfg.color, fontSize: "12px", flexShrink: 0, marginTop: "2px" }}>◈</span>
                  <span style={{ fontSize: "12px", color: "rgba(148,163,184,0.8)", lineHeight: 1.6 }}>{ind}</span>
                </div>
              ))}
            </div>
          )}

          {/* Recent headlines */}
          {data?.headlines && data.headlines.length > 0 && (
            <div>
              <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(148,163,184,0.5)", margin: "0 0 12px" }}>Recent Headlines</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.headlines.slice(0, 4).map((h, i) => {
                  const sentLabel = h.sentiment?.label ?? "neutral";
                  const sentColor = HEADLINE_COLORS[sentLabel] ?? "#64748b";
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.07 }}
                      style={{
                        padding: "10px 12px",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.05)",
                        cursor: h.url ? "pointer" : "default",
                      }}
                      onClick={() => h.url && window.open(h.url, "_blank")}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                        <p style={{ fontSize: "12px", color: "rgba(199,211,255,0.85)", margin: 0, lineHeight: 1.5, flex: 1 }}>{h.headline}</p>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          fontSize: "9px",
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          background: `${sentColor}15`,
                          border: `1px solid ${sentColor}40`,
                          color: sentColor,
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}>
                          {sentLabel}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                        <span style={{ fontSize: "10px", color: "rgba(148,163,184,0.5)" }}>{h.source}</span>
                        {h.published_date && <span style={{ fontSize: "10px", color: "rgba(148,163,184,0.4)" }}>· {new Date(h.published_date).toLocaleDateString()}</span>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

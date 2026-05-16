"use client";

import React from "react";
import { motion } from "framer-motion";

interface NewsArticle {
  headline: string;
  source: string;
  url: string;
  published_date: string;
  description?: string;
  sentiment?: { label: string; confidence: number };
}

interface Props {
  articles?: NewsArticle[];
  loading?: boolean;
  ticker: string;
}

const SENTIMENT_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  positive: { color: "#00ff41", bg: "rgba(0,255,65,0.08)", label: "BULLISH" },
  negative: { color: "#ff3131", bg: "rgba(255,49,49,0.08)", label: "BEARISH" },
  neutral:  { color: "#0a84ff", bg: "rgba(10,132,255,0.08)", label: "NEUTRAL" },
  bullish:  { color: "#00ff41", bg: "rgba(0,255,65,0.08)", label: "BULLISH" },
  bearish:  { color: "#ff3131", bg: "rgba(255,49,49,0.08)", label: "BEARISH" },
};

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return ""; }
}

function SkeletonCard() {
  return (
    <div style={{ padding: "20px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", gap: "8px" }}>
        <div style={{ flex: 1, height: "16px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", animation: "shimmer 1.5s infinite linear" }} />
        <div style={{ width: "60px", height: "16px", borderRadius: "9999px", background: "rgba(255,255,255,0.06)" }} />
      </div>
      <div style={{ height: "12px", borderRadius: "6px", background: "rgba(255,255,255,0.04)", marginBottom: "8px" }} />
      <div style={{ width: "70%", height: "12px", borderRadius: "6px", background: "rgba(255,255,255,0.04)" }} />
      <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
        <div style={{ width: "80px", height: "10px", borderRadius: "6px", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ width: "60px", height: "10px", borderRadius: "6px", background: "rgba(255,255,255,0.04)" }} />
      </div>
    </div>
  );
}

export default function NewsSection({ articles = [], loading = false, ticker }: Props) {
  return (
    <div style={{
      background: "rgba(17, 24, 39, 0.85)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "1.5rem",
      padding: "28px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(148,163,184,0.7)", margin: 0 }}>
          Market News · {ticker}
        </p>
        {!loading && articles.length > 0 && (
          <span style={{ fontSize: "11px", color: "rgba(148,163,184,0.4)" }}>{articles.length} articles</span>
        )}
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(148,163,184,0.5)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.4 }}>📰</div>
          <p style={{ fontSize: "14px", margin: 0 }}>No recent news available for {ticker}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {articles.map((article, i) => {
            const sentKey = (article.sentiment?.label ?? "neutral").toLowerCase();
            const sent = SENTIMENT_CONFIG[sentKey] ?? SENTIMENT_CONFIG.neutral;
            const hasUrl = !!article.url;

            return (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                onClick={() => hasUrl && window.open(article.url, "_blank", "noreferrer")}
                style={{
                  padding: "20px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: hasUrl ? "pointer" : "default",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  position: "relative",
                  overflow: "hidden",
                }}
                whileHover={hasUrl ? {
                  background: "rgba(255,255,255,0.055)",
                  borderColor: "rgba(255,255,255,0.1)",
                  y: -2,
                } as any : {}}
              >
                {/* Sentiment accent */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: sent.color,
                  opacity: 0.6,
                }} />

                {/* Headline + badge */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                  <h3 style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "rgba(218,226,253,0.9)",
                    lineHeight: 1.55,
                    margin: 0,
                    flex: 1,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  } as React.CSSProperties}>
                    {article.headline}
                  </h3>
                  <span style={{
                    flexShrink: 0,
                    padding: "3px 8px",
                    borderRadius: "9999px",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    background: sent.bg,
                    border: `1px solid ${sent.color}30`,
                    color: sent.color,
                    whiteSpace: "nowrap",
                  }}>
                    {sent.label}
                  </span>
                </div>

                {/* Description */}
                {article.description && (
                  <p style={{
                    fontSize: "11px",
                    color: "rgba(148,163,184,0.6)",
                    lineHeight: 1.6,
                    margin: 0,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  } as React.CSSProperties}>
                    {article.description}
                  </p>
                )}

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: sent.color,
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: "11px", fontWeight: 500, color: "rgba(148,163,184,0.7)" }}>
                      {article.source}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "10px", color: "rgba(148,163,184,0.4)" }}>
                      {timeAgo(article.published_date)}
                    </span>
                    {hasUrl && (
                      <span style={{ fontSize: "11px", color: "#0a84ff" }}>↗</span>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}

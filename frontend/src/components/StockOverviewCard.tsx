"use client";

import React from "react";
import { motion } from "framer-motion";
import type { StockPrice, StockMetadata } from "@/lib/api";

interface Props {
  ticker: string;
  price?: StockPrice | null;
  meta?: StockMetadata | null;
  loading?: boolean;
  onWatchlistToggle?: () => void;
  inWatchlist?: boolean;
}

function formatLargeNumber(n?: number | null): string {
  if (n == null) return "--";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function SkeletonLine({ w = "100%", h = "16px" }: { w?: string; h?: string }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: "6px",
      background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite linear",
    }} />
  );
}

export default function StockOverviewCard({ ticker, price, meta, loading = false, onWatchlistToggle, inWatchlist = false }: Props) {
  const isPositive = (price?.change ?? 0) >= 0;
  const changeColor = isPositive ? "#00ff41" : "#ff3131";
  const changeGlow = isPositive ? "rgba(0,255,65,0.2)" : "rgba(255,49,49,0.2)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        background: "rgba(17, 24, 39, 0.85)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "1.5rem",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Company logo placeholder */}
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, rgba(0,255,65,0.15), rgba(10,132,255,0.15))",
            border: "1px solid rgba(0,255,65,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: "var(--font-headline)", fontWeight: 700, fontSize: "18px", color: "#00ff41" }}>
              {ticker.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            {loading ? (
              <>
                <SkeletonLine w="160px" h="22px" />
                <div style={{ marginTop: "6px" }}><SkeletonLine w="80px" h="14px" /></div>
              </>
            ) : (
              <>
                <h1 style={{ fontFamily: "var(--font-headline)", fontSize: "22px", fontWeight: 700, color: "#ffffff", margin: 0, lineHeight: 1.2 }}>
                  {meta?.name || ticker}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <span style={{ padding: "2px 10px", borderRadius: "9999px", background: "rgba(10,132,255,0.15)", border: "1px solid rgba(10,132,255,0.3)", color: "#0a84ff", fontSize: "12px", fontWeight: 600 }}>
                    {ticker.toUpperCase()}
                  </span>
                  {meta?.sector && (
                    <span style={{ fontSize: "12px", color: "rgba(148,163,184,0.8)" }}>
                      {meta.sector}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Watchlist button */}
        <button
          onClick={onWatchlistToggle}
          title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          style={{
            padding: "8px 16px",
            borderRadius: "9999px",
            border: inWatchlist ? "1px solid rgba(0,255,65,0.5)" : "1px solid rgba(132,150,126,0.3)",
            background: inWatchlist ? "rgba(0,255,65,0.1)" : "transparent",
            color: inWatchlist ? "#00ff41" : "rgba(148,163,184,0.8)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={inWatchlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          {inWatchlist ? "Watching" : "Watchlist"}
        </button>
      </div>

      {/* Price section */}
      <div>
        {loading ? (
          <SkeletonLine w="200px" h="52px" />
        ) : (
          <motion.div
            key={price?.price}
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}
          >
            <span style={{ fontFamily: "var(--font-headline)", fontSize: "48px", fontWeight: 700, color: "#ffffff", lineHeight: 1 }}>
              ${price?.price?.toFixed(2) ?? "--"}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "18px", fontWeight: 600, color: changeColor }}>
                {isPositive ? "+" : ""}{price?.change?.toFixed(2) ?? "0.00"}
              </span>
              <span style={{
                fontSize: "14px",
                fontWeight: 600,
                color: changeColor,
                background: `${changeGlow}`,
                padding: "2px 8px",
                borderRadius: "6px",
              }}>
                {isPositive ? "▲" : "▼"} {Math.abs(price?.change_percent ?? 0).toFixed(2)}%
              </span>
            </div>
          </motion.div>
        )}

        <p style={{ fontSize: "12px", color: "rgba(148,163,184,0.6)", marginTop: "6px" }}>
          {price?.timestamp ? `Updated ${new Date(price.timestamp).toLocaleTimeString()}` : "Real-time data"}
        </p>
      </div>

      {/* Meta row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        {[
          { label: "Market Cap", value: formatLargeNumber(meta?.market_cap) },
          { label: "P/E Ratio",  value: meta?.pe_ratio?.toFixed(2) ?? "--" },
          { label: "Industry",   value: meta?.industry ?? "--" },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "12px" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(148,163,184,0.6)", margin: "0 0 6px" }}>{label}</p>
            {loading ? <SkeletonLine h="18px" /> : <p style={{ fontWeight: 600, fontSize: "14px", color: "#dae2fd", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

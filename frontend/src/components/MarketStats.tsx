"use client";

import React from "react";
import { motion } from "framer-motion";

interface StockPrice {
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

interface StockMetadata {
  market_cap?: number | null;
  pe_ratio?: number | null;
  dividend_yield?: number | null;
  fifty_two_week_high?: number | null;
  fifty_two_week_low?: number | null;
  sector?: string | null;
  industry?: string | null;
  website?: string | null;
  description?: string | null;
}

interface TechnicalIndicators {
  rsi?: { value: number; signal: string };
  macd?: { macd_line: number; signal_line: number; histogram: number; signal: string };
  moving_averages?: { sma_20?: number | null; sma_50?: number | null; trend: string };
  volatility?: { annualized_volatility: number; risk_level: string };
  bollinger_bands?: { upper_band?: number | null; lower_band?: number | null; signal: string };
}

interface Props {
  price?: StockPrice | null;
  meta?: StockMetadata | null;
  technicals?: TechnicalIndicators | null;
  loading?: boolean;
}

function formatLargeNum(n?: number | null): string {
  if (n == null) return "--";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function formatVol(n?: number | null): string {
  if (n == null) return "--";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

function StatCard({ label, value, color, highlight = false, delay = 0 }: {
  label: string; value: string; color?: string; highlight?: boolean; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      style={{
        padding: "16px",
        background: highlight ? "rgba(0,255,65,0.04)" : "rgba(255,255,255,0.03)",
        borderRadius: "12px",
        border: highlight ? "1px solid rgba(0,255,65,0.12)" : "1px solid rgba(255,255,255,0.05)",
        transition: "all 0.2s",
      }}
    >
      <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(148,163,184,0.6)", margin: "0 0 8px" }}>{label}</p>
      <p style={{ fontFamily: "var(--font-body)", fontVariantNumeric: "tabular-nums", fontSize: "18px", fontWeight: 700, color: color ?? "#dae2fd", margin: 0 }}>
        {value}
      </p>
    </motion.div>
  );
}

function SignalBadge({ signal, delay = 0 }: { signal: string; delay?: number }) {
  const isPositive = ["GOLDEN_CROSS", "BULLISH", "OVERSOLD"].includes(signal);
  const isNegative = ["DEATH_CROSS", "BEARISH", "OVERBOUGHT"].includes(signal);
  const color = isPositive ? "#00ff41" : isNegative ? "#ff3131" : "#0a84ff";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      style={{
        padding: "16px",
        background: `${color}08`,
        borderRadius: "12px",
        border: `1px solid ${color}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
      }}
    >
      <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(148,163,184,0.6)", margin: 0 }}>Signal</p>
      <span style={{
        padding: "3px 10px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: 700,
        background: `${color}15`,
        border: `1px solid ${color}40`,
        color,
        whiteSpace: "nowrap",
      }}>
        {signal.replace(/_/g, " ")}
      </span>
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", height: "64px", animation: "shimmer 1.5s infinite linear" }} />
      ))}
    </div>
  );
}

export default function MarketStats({ price, meta, technicals, loading = false }: Props) {
  return (
    <div style={{
      background: "rgba(17, 24, 39, 0.85)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "1.5rem",
      padding: "28px",
    }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(148,163,184,0.7)", margin: "0 0 20px" }}>
        Market Statistics
      </p>

      {loading ? (
        <SkeletonGrid />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
          <StatCard label="Market Cap"   value={formatLargeNum(meta?.market_cap)}           delay={0.0} />
          <StatCard label="P/E Ratio"    value={meta?.pe_ratio?.toFixed(2) ?? "--"}          delay={0.04} />
          <StatCard label="Volume"       value={formatVol((price as any)?.volume)}            delay={0.08} />
          <StatCard label="52W High"     value={`$${meta?.fifty_two_week_high?.toFixed(2) ?? "--"}`} color="#00ff41" delay={0.12} />
          <StatCard label="52W Low"      value={`$${meta?.fifty_two_week_low?.toFixed(2) ?? "--"}`}  color="#ff3131" delay={0.16} />
          <StatCard label="Div. Yield"   value={meta?.dividend_yield != null ? `${(meta.dividend_yield * 100).toFixed(2)}%` : "--"} delay={0.20} />
          <StatCard label="Annl. Volatility" value={technicals?.volatility?.annualized_volatility != null ? `${(technicals.volatility.annualized_volatility * 100).toFixed(1)}%` : "--"} delay={0.24} />
          <StatCard label="Risk Level"   value={technicals?.volatility?.risk_level ?? "--"}  delay={0.28} />

          {/* Technical rows */}
          {technicals?.rsi && (
            <div style={{
              gridColumn: "1 / -1",
              padding: "0",
              marginTop: "8px",
            }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(148,163,184,0.5)", margin: "0 0 12px" }}>Technical Indicators</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
                <div style={{ padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(148,163,184,0.6)", margin: "0 0 6px" }}>RSI (14)</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, fontSize: "18px", color: technicals.rsi.signal === "OVERBOUGHT" ? "#ff3131" : technicals.rsi.signal === "OVERSOLD" ? "#00ff41" : "#dae2fd" }}>
                      {technicals.rsi.value.toFixed(1)}
                    </span>
                    <span style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "9999px", background: "rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.8)" }}>
                      {technicals.rsi.signal}
                    </span>
                  </div>
                </div>

                {technicals.macd && (
                  <div style={{ padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(148,163,184,0.6)", margin: "0 0 6px" }}>MACD</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700, fontSize: "16px", color: technicals.macd.signal === "BULLISH" ? "#00ff41" : "#ff3131" }}>
                        {technicals.macd.macd_line.toFixed(3)}
                      </span>
                      <span style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "9999px", background: technicals.macd.signal === "BULLISH" ? "rgba(0,255,65,0.1)" : "rgba(255,49,49,0.1)", color: technicals.macd.signal === "BULLISH" ? "#00ff41" : "#ff3131" }}>
                        {technicals.macd.signal}
                      </span>
                    </div>
                  </div>
                )}

                {technicals.moving_averages && (
                  <>
                    {technicals.moving_averages.sma_20 && (
                      <StatCard label="SMA-20" value={`$${technicals.moving_averages.sma_20.toFixed(2)}`} delay={0} />
                    )}
                    {technicals.moving_averages.sma_50 && (
                      <StatCard label="SMA-50" value={`$${technicals.moving_averages.sma_50.toFixed(2)}`} delay={0} />
                    )}
                    <div style={{ padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(148,163,184,0.6)", margin: "0 0 6px" }}>MA Trend</p>
                      <span style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: ["GOLDEN_CROSS", "BULLISH"].includes(technicals.moving_averages.trend) ? "#00ff41" : ["DEATH_CROSS", "BEARISH"].includes(technicals.moving_averages.trend) ? "#ff3131" : "#0a84ff",
                      }}>
                        {technicals.moving_averages.trend?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </>
                )}

                {technicals.bollinger_bands && (
                  <>
                    <StatCard label="BB Upper" value={technicals.bollinger_bands.upper_band != null ? `$${technicals.bollinger_bands.upper_band.toFixed(2)}` : "--"} color="#00ff41" delay={0} />
                    <StatCard label="BB Lower" value={technicals.bollinger_bands.lower_band != null ? `$${technicals.bollinger_bands.lower_band.toFixed(2)}` : "--"} color="#ff3131" delay={0} />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Company description */}
      {!loading && meta?.description && (
        <div style={{ marginTop: "24px", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(148,163,184,0.5)", margin: "0 0 10px" }}>About</p>
          <p style={{ fontSize: "13px", color: "rgba(199,211,255,0.75)", lineHeight: 1.7, margin: 0 }}>
            {meta.description.substring(0, 280)}…
          </p>
          {meta.website && (
            <a href={meta.website} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#0a84ff", marginTop: "8px", display: "inline-block", textDecoration: "none" }}>
              {meta.website} ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

interface TechnicalIndicators {
  symbol?: string;
  rsi?: { value: number; signal: string; period?: number };
  macd?: { macd_line: number; signal_line: number; histogram: number; signal: string };
  moving_averages?: {
    sma_20?: number | null;
    sma_50?: number | null;
    sma_200?: number | null;
    ema_12?: number;
    ema_26?: number;
    current_price?: number;
    trend: string;
  };
  volatility?: { daily_volatility: number; annualized_volatility: number; risk_level: string; window?: number };
  bollinger_bands?: {
    upper_band?: number | null;
    middle_band?: number | null;
    lower_band?: number | null;
    bandwidth?: number | null;
    percent_b?: number | null;
    signal: string;
  };
}

interface Props {
  data?: TechnicalIndicators | null;
  loading?: boolean;
}

function SkeletonCard({ h = 80 }: { h?: number }) {
  return (
    <div style={{
      height: h,
      borderRadius: "12px",
      background: "rgba(255,255,255,0.04)",
      animation: "shimmer 1.5s infinite linear",
    }} />
  );
}

function IndicatorCard({
  title, value, signal, detail, color, children, delay = 0,
}: {
  title: string;
  value?: string;
  signal?: string;
  detail?: string;
  color?: string;
  children?: React.ReactNode;
  delay?: number;
}) {
  const signalColor =
    signal === "BULLISH" || signal === "OVERSOLD" || signal === "GOLDEN_CROSS"
      ? "#00ff41"
      : signal === "BEARISH" || signal === "OVERBOUGHT" || signal === "DEATH_CROSS"
      ? "#ff3131"
      : "#0a84ff";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      style={{
        padding: "20px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(148,163,184,0.6)", margin: 0 }}>{title}</p>
        {signal && (
          <span style={{
            padding: "3px 10px",
            borderRadius: "9999px",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            background: `${signalColor}15`,
            border: `1px solid ${signalColor}35`,
            color: signalColor,
            whiteSpace: "nowrap",
          }}>
            {signal.replace(/_/g, " ")}
          </span>
        )}
      </div>
      {value && (
        <p style={{ fontFamily: "var(--font-body)", fontVariantNumeric: "tabular-nums", fontSize: "28px", fontWeight: 700, color: color ?? signalColor ?? "#dae2fd", margin: 0, lineHeight: 1 }}>
          {value}
        </p>
      )}
      {detail && <p style={{ fontSize: "12px", color: "rgba(148,163,184,0.6)", margin: 0 }}>{detail}</p>}
      {children}
    </motion.div>
  );
}

// RSI gauge meter
function RSIGauge({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = value > 70 ? "#ff3131" : value < 30 ? "#00ff41" : "#0a84ff";

  return (
    <div style={{ position: "relative" }}>
      {/* Track */}
      <div style={{ height: "8px", borderRadius: "9999px", background: "rgba(255,255,255,0.06)", overflow: "visible", position: "relative" }}>
        {/* Zones */}
        <div style={{ position: "absolute", left: 0, width: "30%", height: "100%", background: "rgba(0,255,65,0.15)", borderRadius: "9999px 0 0 9999px" }} />
        <div style={{ position: "absolute", left: "70%", width: "30%", height: "100%", background: "rgba(255,49,49,0.15)", borderRadius: "0 9999px 9999px 0" }} />
        {/* Thumb */}
        <motion.div
          initial={{ left: "50%" }}
          animate={{ left: `${pct}%` }}
          transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            position: "absolute",
            top: "-4px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: color,
            border: "2px solid #0b1326",
            transform: "translateX(-50%)",
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "9px", color: "rgba(148,163,184,0.4)", letterSpacing: "0.1em" }}>
        <span>OVERSOLD</span>
        <span>NEUTRAL</span>
        <span>OVERBOUGHT</span>
      </div>
    </div>
  );
}

// MACD histogram mini chart
function MACDHistogram({ histogram }: { histogram: number }) {
  const isPos = histogram >= 0;
  const width = Math.min(100, Math.abs(histogram) * 500);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "10px", color: "rgba(148,163,184,0.5)", whiteSpace: "nowrap" }}>Histogram</span>
      <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden", position: "relative" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, width)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: "absolute",
            height: "100%",
            background: isPos ? "#00ff41" : "#ff3131",
            borderRadius: "9999px",
            [isPos ? "left" : "right"]: 0,
          }}
        />
      </div>
      <span style={{ fontSize: "11px", fontWeight: 600, color: isPos ? "#00ff41" : "#ff3131", whiteSpace: "nowrap" }}>
        {histogram.toFixed(4)}
      </span>
    </div>
  );
}

export default function TechnicalIndicatorsPanel({ data, loading = false }: Props) {
  // Build radar chart data
  const rsiScore = data?.rsi ? (data.rsi.signal === "OVERSOLD" ? 85 : data.rsi.signal === "OVERBOUGHT" ? 15 : 50) : 50;
  const macdScore = data?.macd ? (data.macd.signal === "BULLISH" ? 80 : data.macd.signal === "BEARISH" ? 20 : 50) : 50;
  const maScore = data?.moving_averages ? (
    data.moving_averages.trend === "GOLDEN_CROSS" ? 90 :
    data.moving_averages.trend === "BULLISH" ? 70 :
    data.moving_averages.trend === "BEARISH" ? 30 :
    data.moving_averages.trend === "DEATH_CROSS" ? 10 : 50
  ) : 50;
  const volScore = data?.volatility ? (
    data.volatility.risk_level === "LOW" ? 80 :
    data.volatility.risk_level === "HIGH" ? 20 : 50
  ) : 50;
  const bbScore = data?.bollinger_bands ? (
    data.bollinger_bands.signal === "OVERSOLD" ? 80 :
    data.bollinger_bands.signal === "OVERBOUGHT" ? 20 : 55
  ) : 55;

  const radarData = [
    { subject: "RSI",        A: rsiScore },
    { subject: "MACD",       A: macdScore },
    { subject: "Momentum",   A: maScore },
    { subject: "Stability",  A: volScore },
    { subject: "BB Signal",  A: bbScore },
  ];

  return (
    <div style={{
      background: "rgba(17, 24, 39, 0.85)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "1.5rem",
      padding: "28px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(148,163,184,0.7)", margin: 0 }}>
          Technical Indicators
        </p>
        {!loading && data?.symbol && (
          <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "9999px", background: "rgba(10,132,255,0.1)", border: "1px solid rgba(10,132,255,0.2)", color: "#0a84ff" }}>
            {data.symbol}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} h={120} />)}
        </div>
      ) : !data ? (
        <div style={{ textAlign: "center", padding: "40px", color: "rgba(148,163,184,0.5)", fontSize: "14px" }}>
          Technical data unavailable
        </div>
      ) : (
        <>
          {/* Radar chart */}
          <div style={{ marginBottom: "24px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(148,163,184,0.7)", fontSize: 11 }} />
                <Radar
                  name="Signals"
                  dataKey="A"
                  stroke="#00ff41"
                  fill="#00ff41"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Indicator cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* RSI */}
            {data.rsi && (
              <IndicatorCard
                title="RSI"
                value={data.rsi.value.toFixed(1)}
                signal={data.rsi.signal}
                detail={`${data.rsi.period ?? 14}-period Relative Strength Index`}
                delay={0}
              >
                <RSIGauge value={data.rsi.value} />
              </IndicatorCard>
            )}

            {/* MACD */}
            {data.macd && (
              <IndicatorCard
                title="MACD"
                value={data.macd.macd_line.toFixed(3)}
                signal={data.macd.signal}
                detail={`Signal line: ${data.macd.signal_line.toFixed(3)}`}
                delay={0.06}
              >
                <MACDHistogram histogram={data.macd.histogram} />
              </IndicatorCard>
            )}

            {/* Moving Averages */}
            {data.moving_averages && (
              <IndicatorCard
                title="Moving Averages"
                signal={data.moving_averages.trend}
                delay={0.12}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    { label: "SMA-20",  val: data.moving_averages.sma_20 },
                    { label: "SMA-50",  val: data.moving_averages.sma_50 },
                    { label: "SMA-200", val: data.moving_averages.sma_200 },
                    { label: "EMA-12",  val: data.moving_averages.ema_12 },
                    { label: "EMA-26",  val: data.moving_averages.ema_26 },
                  ].filter((r) => r.val != null).map(({ label, val }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "rgba(148,163,184,0.6)" }}>{label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#dae2fd", fontVariantNumeric: "tabular-nums" }}>
                        ${(val as number).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </IndicatorCard>
            )}

            {/* Volatility */}
            {data.volatility && (
              <IndicatorCard
                title="Volatility"
                value={`${(data.volatility.annualized_volatility * 100).toFixed(1)}%`}
                signal={data.volatility.risk_level === "LOW" ? "BULLISH" : data.volatility.risk_level === "HIGH" ? "BEARISH" : "NEUTRAL"}
                detail={`Daily: ${(data.volatility.daily_volatility * 100).toFixed(3)}% · Annualised`}
                delay={0.18}
              >
                <div style={{ height: "6px", borderRadius: "9999px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, data.volatility.annualized_volatility * 250)}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    style={{
                      height: "100%",
                      background: data.volatility.risk_level === "HIGH" ? "#ff3131" : data.volatility.risk_level === "LOW" ? "#00ff41" : "#0a84ff",
                      borderRadius: "9999px",
                    }}
                  />
                </div>
                <p style={{ fontSize: "11px", color: "rgba(148,163,184,0.6)", margin: 0 }}>
                  Risk Level: <span style={{ fontWeight: 600, color: data.volatility.risk_level === "HIGH" ? "#ff3131" : data.volatility.risk_level === "LOW" ? "#00ff41" : "#0a84ff" }}>
                    {data.volatility.risk_level}
                  </span>
                </p>
              </IndicatorCard>
            )}

            {/* Bollinger Bands */}
            {data.bollinger_bands && (
              <IndicatorCard
                title="Bollinger Bands"
                signal={data.bollinger_bands.signal}
                delay={0.24}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    { label: "Upper Band",  val: data.bollinger_bands.upper_band,  color: "#00ff41" },
                    { label: "Middle Band", val: data.bollinger_bands.middle_band,  color: "#0a84ff" },
                    { label: "Lower Band",  val: data.bollinger_bands.lower_band,   color: "#ff3131" },
                  ].filter((r) => r.val != null).map(({ label, val, color }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", color: "rgba(148,163,184,0.6)" }}>{label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>
                        ${(val as number).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {data.bollinger_bands.percent_b != null && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "10px", color: "rgba(148,163,184,0.5)" }}>%B Position</span>
                        <span style={{ fontSize: "11px", color: "#dae2fd" }}>{(data.bollinger_bands.percent_b * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: "4px", borderRadius: "9999px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, Math.max(0, (data.bollinger_bands.percent_b ?? 0.5) * 100))}%` }}
                          transition={{ duration: 0.9 }}
                          style={{ height: "100%", background: "#0a84ff", borderRadius: "9999px" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </IndicatorCard>
            )}
          </div>
        </>
      )}
    </div>
  );
}

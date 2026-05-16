"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Props {
  data: OHLCV[];
  loading?: boolean;
  onTimeframeChange?: (tf: string) => void;
  currentTimeframe?: string;
}

const TIMEFRAMES = [
  { label: "1D", period: "1d", interval: "1m" },
  { label: "1W", period: "5d", interval: "15m" },
  { label: "1M", period: "1mo", interval: "1d" },
  { label: "1Y", period: "1y", interval: "1wk" },
];

function formatDate(dateStr: string, timeframe: string): string {
  try {
    const d = new Date(dateStr);
    if (timeframe === "1D") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (timeframe === "1W") return `${d.toLocaleDateString([], { weekday: "short" })} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (timeframe === "1Y") return d.toLocaleDateString([], { month: "short", year: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return dateStr.slice(0, 10);
  }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload || !payload[0]) return null;
  const row = payload[0].payload as OHLCV;
  return (
    <div style={{
      background: "rgba(17,24,39,0.97)",
      border: "1px solid rgba(0,255,65,0.3)",
      borderRadius: "12px",
      padding: "12px 16px",
      fontSize: "12px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      backdropFilter: "blur(10px)",
    }}>
      <p style={{ color: "rgba(148,163,184,0.8)", marginBottom: "8px", fontWeight: 500 }}>{row.date?.slice(0, 19).replace("T", " ")}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
        <span style={{ color: "rgba(148,163,184,0.7)" }}>Open</span>
        <span style={{ color: "#0a84ff", fontWeight: 600 }}>${row.open?.toFixed(2)}</span>
        <span style={{ color: "rgba(148,163,184,0.7)" }}>High</span>
        <span style={{ color: "#00ff41", fontWeight: 600 }}>${row.high?.toFixed(2)}</span>
        <span style={{ color: "rgba(148,163,184,0.7)" }}>Low</span>
        <span style={{ color: "#ff3131", fontWeight: 600 }}>${row.low?.toFixed(2)}</span>
        <span style={{ color: "rgba(148,163,184,0.7)" }}>Close</span>
        <span style={{ color: "#ffffff", fontWeight: 600 }}>${row.close?.toFixed(2)}</span>
        <span style={{ color: "rgba(148,163,184,0.7)" }}>Volume</span>
        <span style={{ color: "rgba(148,163,184,0.9)" }}>{(row.volume / 1e6).toFixed(2)}M</span>
      </div>
    </div>
  );
}

function CandlestickBar(props: any) {
  const { x, y, width, height, payload } = props;
  if (!payload || payload.open == null) return null;
  const isGreen = payload.close >= payload.open;
  const color = isGreen ? "#00ff41" : "#ff3131";
  const bodyTop = Math.min(payload.open, payload.close);
  const bodyBottom = Math.max(payload.open, payload.close);
  const scale = height / (payload.high - payload.low || 1);
  const bodyH = Math.max(1, (bodyBottom - bodyTop) * scale);
  const bodyY = y + (payload.high - bodyBottom) * scale;
  const wickTop = y;
  const wickBottom = y + height;
  const centerX = x + width / 2;
  const candleW = Math.max(2, width * 0.7);

  return (
    <g>
      {/* Upper wick */}
      <line x1={centerX} y1={wickTop} x2={centerX} y2={bodyY} stroke={color} strokeWidth={1} opacity={0.8} />
      {/* Body */}
      <rect x={x + (width - candleW) / 2} y={bodyY} width={candleW} height={Math.max(1, bodyH)} fill={color} rx={1} opacity={0.9} />
      {/* Lower wick */}
      <line x1={centerX} y1={bodyY + bodyH} x2={centerX} y2={wickBottom} stroke={color} strokeWidth={1} opacity={0.8} />
    </g>
  );
}

function SkeletonBar({ height = 360 }: { height?: number }) {
  return (
    <div style={{ width: "100%", height, borderRadius: "12px", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(0,255,65,0.2)", borderTop: "3px solid #00ff41", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "rgba(148,163,184,0.6)", fontSize: "13px" }}>Loading chart data…</p>
      </div>
    </div>
  );
}

export default function StockChart({ data, loading = false, onTimeframeChange, currentTimeframe = "1M" }: Props) {
  const [activeFrame, setActiveFrame] = useState(currentTimeframe);

  const changeFrame = (tf: { label: string; period: string; interval: string }) => {
    setActiveFrame(tf.label);
    onTimeframeChange?.(tf.label);
  };

  const chartData = data.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date, activeFrame),
    range: [d.low, d.high] as [number, number],
    bullish: d.close >= d.open ? d.close - d.open : 0,
    bearish: d.close < d.open ? d.open - d.close : 0,
  }));

  const prices = data.flatMap((d) => [d.high, d.low]).filter(Boolean);
  const minPrice = Math.min(...prices) * 0.998;
  const maxPrice = Math.max(...prices) * 1.002;
  const maxVolume = Math.max(...data.map((d) => d.volume || 0));
  const firstClose = data[0]?.close ?? 0;
  const lastClose = data[data.length - 1]?.close ?? 0;
  const isUp = lastClose >= firstClose;

  return (
    <div style={{
      background: "rgba(17, 24, 39, 0.85)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "1.5rem",
      padding: "24px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(148,163,184,0.7)", margin: 0 }}>Price Chart</p>
          {!loading && data.length > 0 && (
            <span style={{
              fontSize: "12px", fontWeight: 600,
              color: isUp ? "#00ff41" : "#ff3131",
              background: isUp ? "rgba(0,255,65,0.1)" : "rgba(255,49,49,0.1)",
              padding: "2px 8px", borderRadius: "9999px",
              border: `1px solid ${isUp ? "rgba(0,255,65,0.3)" : "rgba(255,49,49,0.3)"}`,
            }}>
              {isUp ? "▲" : "▼"} {Math.abs(((lastClose - firstClose) / (firstClose || 1)) * 100).toFixed(2)}%
            </span>
          )}
        </div>

        {/* Timeframe selector */}
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "4px" }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.label}
              onClick={() => changeFrame(tf)}
              style={{
                padding: "6px 14px",
                borderRadius: "7px",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                background: activeFrame === tf.label ? "rgba(0,255,65,0.15)" : "transparent",
                color: activeFrame === tf.label ? "#00ff41" : "rgba(148,163,184,0.7)",
                transition: "all 0.2s",
                outline: activeFrame === tf.label ? "1px solid rgba(0,255,65,0.3)" : "none",
              }}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <AnimatePresence mode="wait">
        {loading ? (
          <SkeletonBar height={340} />
        ) : data.length === 0 ? (
          <div style={{ height: 340, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(148,163,184,0.5)", fontSize: "14px" }}>
            No chart data available for this timeframe.
          </div>
        ) : (
          <motion.div
            key={activeFrame}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Price chart */}
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isUp ? "#00ff41" : "#ff3131"} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={isUp ? "#00ff41" : "#ff3131"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  stroke="transparent"
                  tick={{ fill: "rgba(148,163,184,0.6)", fontSize: 11 }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[minPrice, maxPrice]}
                  stroke="transparent"
                  tick={{ fill: "rgba(148,163,184,0.6)", fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={(v) => `$${v.toFixed(0)}`}
                  width={56}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={firstClose} stroke="rgba(148,163,184,0.15)" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke={isUp ? "#00ff41" : "#ff3131"}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: isUp ? "#00ff41" : "#ff3131", stroke: "none" }}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Volume chart */}
            <ResponsiveContainer width="100%" height={70} style={{ marginTop: "4px" }}>
              <ComposedChart data={chartData} margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="dateLabel" hide />
                <YAxis hide domain={[0, maxVolume * 1.2]} />
                <Bar
                  dataKey="volume"
                  fill="rgba(10,132,255,0.4)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={16}
                />
              </ComposedChart>
            </ResponsiveContainer>
            <p style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(148,163,184,0.4)", textAlign: "right", margin: "4px 8px 0" }}>Volume</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

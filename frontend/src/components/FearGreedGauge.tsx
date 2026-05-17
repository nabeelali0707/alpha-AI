"use client";

import React, { useMemo } from "react";

type Props = {
  value: number;
  classification: string;
  explanation: string;
  loading?: boolean;
};

function bandColor(value: number) {
  if (value <= 25) return "#ff3131";
  if (value <= 45) return "#f59e0b";
  if (value <= 55) return "#facc15";
  if (value <= 75) return "#86efac";
  return "#00ff41";
}

export default function FearGreedGauge({ value, classification, explanation, loading = false }: Props) {
  const safeValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 50));
  const color = bandColor(safeValue);
  const angle = useMemo(() => -90 + (safeValue / 100) * 180, [safeValue]);

  return (
    <div
      style={{
        background: "rgba(17, 24, 39, 0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "1.5rem",
        padding: "24px",
      }}
    >
      <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(148,163,184,0.7)", margin: 0 }}>
        Fear & Greed
      </p>

      <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
        <svg width="280" height="150" viewBox="0 0 280 150" role="img" aria-label="Fear and Greed gauge">
          <path d="M 30 130 A 110 110 0 0 1 250 130" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="18" strokeLinecap="round" />
          <path
            d="M 30 130 A 110 110 0 0 1 250 130"
            fill="none"
            stroke={color}
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={`${(safeValue / 100) * 346} 346`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
          <g transform={`translate(140 130) rotate(${angle})`} style={{ transition: "transform 0.8s ease" }}>
            <line x1="0" y1="0" x2="0" y2="-95" stroke={color} strokeWidth="4" strokeLinecap="round" />
            <circle cx="0" cy="0" r="8" fill={color} />
          </g>
          <text x="20" y="146" fill="#ff3131" fontSize="11">Extreme Fear</text>
          <text x="215" y="146" fill="#00ff41" fontSize="11">Extreme Greed</text>
        </svg>
      </div>

      <div style={{ textAlign: "center", marginTop: -8 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: loading ? "#9ca3af" : color }}>{loading ? "--" : safeValue}</div>
        <div style={{ fontSize: 13, color: "#c7d3ffcc", marginTop: 2 }}>{classification || "Neutral"}</div>
      </div>

      <p style={{ marginTop: 14, fontSize: 13, color: "#c7d3ffcc", lineHeight: 1.6 }}>
        {loading ? "Loading sentiment gauge..." : explanation}
      </p>
    </div>
  );
}

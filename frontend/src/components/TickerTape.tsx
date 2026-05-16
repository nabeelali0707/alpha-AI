"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getMarketOverview, type MarketItem } from "../lib/api";

export default function TickerTape() {
  const [items, setItems] = useState<MarketItem[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await getMarketOverview();
        if (!mounted) return;

        const combined = [
          ...data.PSX.slice(0, 6),
          ...data.US.slice(0, 6),
          ...data.CRYPTO.slice(0, 2),
          ...data.COMMODITIES.slice(0, 2),
          ...data.FOREX.slice(0, 2),
        ];

        setItems(combined);
      } catch {
        if (mounted) setItems([]);
      }
    }

    load();
    const id = setInterval(load, 60000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const renderItems = useMemo(() => {
    return items.map((item, idx) => {
      const positive = (item.change ?? 0) >= 0;
      return (
        <div
          key={`${item.symbol}-${idx}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 18px",
            color: positive ? "var(--accent-green)" : "var(--accent-red)",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{item.symbol}</span>
          <span>${item.price?.toFixed(2)}</span>
          <span>{positive ? "▲" : "▼"} {item.change_percent?.toFixed(2)}%</span>
        </div>
      );
    });
  }, [items]);

  return (
    <div
      className="ticker-wrap"
      style={{
        width: "100%",
        overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(15,22,41,0.95)",
      }}
    >
      <div
        className="ticker-track"
        style={{
          display: "flex",
          width: "max-content",
          animation: "ticker-scroll 24s linear infinite",
        }}
      >
        {renderItems}
        {renderItems}
      </div>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-wrap:hover .ticker-track {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

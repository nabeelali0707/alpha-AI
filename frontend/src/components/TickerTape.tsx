"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getMarketOverview, type MarketItem } from "../lib/api";
import { useMarketWebSocket } from "../hooks/useMarketWebSocket";

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
    const id = setInterval(load, 120000); // every 2min to reduce Yahoo load
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // Map out combined active symbols to subscribe via WebSockets
  const symbols = useMemo(() => items.map(item => item.symbol), [items]);
  const { tickerData, connected } = useMarketWebSocket(symbols);

  const renderItems = useMemo(() => {
    return items.map((item, idx) => {
      const liveData = tickerData[item.symbol.toUpperCase()];
      const price = liveData ? liveData.price : item.price;
      const changePercent = liveData ? liveData.change_percent : item.change_percent;
      const positive = (liveData ? liveData.change : (item.change ?? 0)) >= 0;
      
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
          <span>${price?.toFixed(2)}</span>
          <span>{positive ? "▲" : "▼"} {changePercent?.toFixed(2)}%</span>
        </div>
      );
    });
  }, [items, tickerData]);

  return (
    <div
      className="ticker-wrap"
      style={{
        width: "100%",
        overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(15,22,41,0.95)",
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Dynamic WS Feed Status indicator */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
          background: "rgba(15,22,41,0.98)",
          padding: "0 12px",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 9,
          fontFamily: "monospace",
          color: connected ? "var(--accent-green)" : "rgba(255,255,255,0.4)",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: connected ? "var(--accent-green)" : "#ff4d4d",
            boxShadow: connected ? "0 0 8px var(--accent-green)" : "none",
            display: "inline-block",
            animation: connected ? "ws-blink 1.5s infinite" : "none",
          }}
        />
        {connected ? "LIVE WS" : "POLLING"}
      </div>

      <div
        className="ticker-track"
        style={{
          display: "flex",
          width: "max-content",
          animation: "ticker-scroll 24s linear infinite",
          paddingLeft: 85, // Offset to clear absolute status label
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
        @keyframes ws-blink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .ticker-wrap:hover .ticker-track {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}


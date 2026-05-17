"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

/**
 * Shape of a single ticker update received via WebSocket.
 */
interface TickerData {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  timestamp: string;
}

function resolveWsUrl(): string {
  const explicitWsUrl = process.env.NEXT_PUBLIC_ALPHAAI_WS_URL;
  if (explicitWsUrl) {
    return explicitWsUrl;
  }

  const apiBase = process.env.NEXT_PUBLIC_ALPHAAI_API_BASE_URL;
  if (apiBase) {
    try {
      const normalized = /^https?:\/\//i.test(apiBase)
        ? apiBase
        : apiBase.startsWith(":")
          ? `http://localhost${apiBase}`
          : `http://${apiBase}`;
      const url = new URL(normalized);
      const protocol = url.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${url.host}/api/v1/ws/prices`;
    } catch {
      // Fall back below
    }
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    return `${protocol}//${host}:8001/api/v1/ws/prices`;
  }

  return "ws://localhost:8001/api/v1/ws/prices";
}

const RECONNECT_DELAY_MS = 3000;

/**
 * LiveTicker — Real-time WebSocket price ticker tape.
 *
 * Connects to the AlphaAI backend WebSocket, receives PRICE_UPDATE
 * messages, and renders a sleek horizontally scrolling ticker tape.
 */
export default function LiveTicker() {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let unmounted = false;
    const wsUrl = resolveWsUrl();

    function connect() {
      if (unmounted) return;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmounted) return;
        setConnected(true);
        setError(false);
      };

      ws.onmessage = (event) => {
        if (unmounted) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "PRICE_UPDATE" && Array.isArray(msg.data)) {
            setTickers(msg.data);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onerror = () => {
        if (unmounted) return;
        setError(true);
        setConnected(false);
      };

      ws.onclose = () => {
        if (unmounted) return;
        setConnected(false);
        // Auto-reconnect
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, []);

  /* ── Render items ──────────────────────────────────────────────────── */
  const tickerItems = useMemo(() => {
    if (tickers.length === 0) return null;

    return tickers.map((t, idx) => {
      const positive = t.change >= 0;
      return (
        <div
          key={`${t.symbol}-${idx}`}
          className="live-ticker-item"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 22px",
            whiteSpace: "nowrap",
          }}
        >
          {/* Pulsing live dot */}
          <span
            className="live-dot"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: positive ? "#00ff41" : "#ff3131",
              boxShadow: positive
                ? "0 0 6px #00ff41, 0 0 12px #00ff4160"
                : "0 0 6px #ff3131, 0 0 12px #ff313160",
              animation: "live-pulse 1.6s ease-in-out infinite",
            }}
          />

          {/* Symbol */}
          <span
            style={{
              color: "#e2e8f0",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.06em",
            }}
          >
            {t.symbol}
          </span>

          {/* Price */}
          <span
            style={{
              color: positive ? "#00ff41" : "#ff3131",
              fontWeight: 600,
              fontSize: 12,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ${t.price.toFixed(2)}
          </span>

          {/* Change % */}
          <span
            style={{
              color: positive ? "#00ff41cc" : "#ff3131cc",
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {positive ? "▲" : "▼"} {Math.abs(t.change_percent).toFixed(2)}%
          </span>
        </div>
      );
    });
  }, [tickers]);

  /* ── Skeleton / error states ───────────────────────────────────────── */
  if (error && tickers.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          padding: "8px 16px",
          background: "rgba(15,22,41,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11,
          color: "#ff3131aa",
          textAlign: "center",
          letterSpacing: "0.06em",
        }}
      >
        ⚠ Live feed disconnected — reconnecting…
      </div>
    );
  }

  if (tickers.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          padding: "8px 16px",
          background: "rgba(15,22,41,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11,
          color: "#94a3b8",
          textAlign: "center",
          letterSpacing: "0.06em",
        }}
      >
        <span className="live-shimmer">Connecting to live feed…</span>
      </div>
    );
  }

  return (
    <div
      className="live-ticker-wrap"
      style={{
        width: "100%",
        overflow: "hidden",
        background:
          "linear-gradient(90deg, rgba(15,22,41,0.98) 0%, rgba(10,16,34,0.96) 50%, rgba(15,22,41,0.98) 100%)",
        borderBottom: "1px solid rgba(0,255,65,0.08)",
        borderTop: "1px solid rgba(0,255,65,0.05)",
        position: "relative",
      }}
    >
      {/* Live badge */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          background:
            "linear-gradient(90deg, rgba(15,22,41,1) 70%, transparent 100%)",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: connected ? "#00ff41" : "#ff3131",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: connected ? "#00ff41" : "#ff3131",
              animation: "live-pulse 1.4s ease-in-out infinite",
              boxShadow: connected
                ? "0 0 8px #00ff41"
                : "0 0 8px #ff3131",
            }}
          />
          LIVE
        </span>
      </div>

      {/* Scrolling track */}
      <div
        className="live-ticker-track"
        style={{
          display: "flex",
          width: "max-content",
          animation: "live-ticker-scroll 30s linear infinite",
          paddingLeft: 60,
        }}
      >
        {tickerItems}
        {tickerItems}
      </div>

      {/* Right fade */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 48,
          background:
            "linear-gradient(270deg, rgba(15,22,41,1) 30%, transparent 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      <style>{`
        @keyframes live-ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes live-shimmer {
          0%   { opacity: 0.4; }
          50%  { opacity: 1; }
          100% { opacity: 0.4; }
        }
        .live-shimmer {
          animation: live-shimmer 1.5s ease-in-out infinite;
        }
        .live-ticker-wrap:hover .live-ticker-track {
          animation-play-state: paused;
        }
        .live-ticker-item {
          transition: opacity 0.3s ease;
        }
        .live-ticker-item:hover {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}

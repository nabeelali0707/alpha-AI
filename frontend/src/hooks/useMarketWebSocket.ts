"use client";

import { useEffect, useRef, useState } from "react";

export interface RealtimeTickerData {
  type: string;
  price: number;
  change: number;
  change_percent: number;
}

export function useMarketWebSocket(symbols: string[]) {
  const [tickerData, setTickerData] = useState<Record<string, RealtimeTickerData>>({});
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (symbols.length === 0) return;

    let active = true;

    function connect() {
      const baseApiUrl = process.env.NEXT_PUBLIC_ALPHAAI_API_BASE_URL ?? "http://localhost:8001/api/v1";
      // Construct WebSocket URL: replace http:// with ws:// and https:// with wss://
      const wsUrl = baseApiUrl.replace(/^http/, "ws") + "/live/ws";

      console.log(`Connecting to Market WebSocket: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!active) {
          ws.close();
          return;
        }
        console.log("WebSocket secure connection open.");
        setConnected(true);
        
        // Subscribe to requested symbols
        ws.send(JSON.stringify({
          action: "subscribe",
          symbols: symbols
        }));
      };

      ws.onmessage = (event) => {
        if (!active) return;
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event === "market_update") {
            setTickerData(prev => ({
              ...prev,
              ...parsed.data
            }));
          }
        } catch (err) {
          console.error("Failed to parse market websocket frame payload:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket connection channel error:", err);
      };

      ws.onclose = () => {
        if (!active) return;
        console.log("WebSocket connection channel closed. Reconnecting in 5 seconds...");
        setConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [JSON.stringify(symbols)]);

  return { tickerData, connected };
}

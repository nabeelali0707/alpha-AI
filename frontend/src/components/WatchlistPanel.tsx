"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const WATCHLIST_KEY = "alphaai_watchlist";

export function getWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]"); }
  catch { return []; }
}

export function addToWatchlist(symbol: string) {
  const prev = getWatchlist().filter((s) => s !== symbol);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify([symbol, ...prev].slice(0, 20)));
  window.dispatchEvent(new Event("watchlist-update"));
}

export function removeFromWatchlist(symbol: string) {
  const prev = getWatchlist().filter((s) => s !== symbol);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(prev));
  window.dispatchEvent(new Event("watchlist-update"));
}

export function isInWatchlist(symbol: string): boolean {
  return getWatchlist().includes(symbol);
}

// ── Mini ticker that shows price for each watchlist item ──────────────────────
function WatchlistItem({ symbol, onRemove, isActive }: { symbol: string; onRemove: () => void; isActive: boolean }) {
  const router = useRouter();
  const [price, setPrice] = useState<{ price: number; change_percent: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { alphaaiApi } = await import("@/lib/api");
        const res = await alphaaiApi.get(`/stocks/${symbol}`);
        if (!cancelled) setPrice(res.data);
      } catch { /* silent */ }
    }
    load();
    return () => { cancelled = true; };
  }, [symbol]);

  const isPositive = (price?.change_percent ?? 0) >= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderRadius: "10px",
        background: isActive ? "rgba(0,255,65,0.07)" : "rgba(255,255,255,0.03)",
        border: isActive ? "1px solid rgba(0,255,65,0.2)" : "1px solid transparent",
        cursor: "pointer",
        gap: "8px",
        transition: "all 0.2s",
      }}
    >
      <div onClick={() => router.push(`/stocks/${symbol}`)} style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          background: "rgba(10,132,255,0.15)",
          border: "1px solid rgba(10,132,255,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: "9px", fontWeight: 700, color: "#0a84ff" }}>{symbol.slice(0, 3)}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: "13px", color: "#dae2fd", margin: 0 }}>{symbol}</p>
          {price ? (
            <p style={{ fontSize: "11px", color: isPositive ? "#00ff41" : "#ff3131", margin: 0, fontWeight: 500 }}>
              ${price.price.toFixed(2)} {isPositive ? "▲" : "▼"} {Math.abs(price.change_percent).toFixed(2)}%
            </p>
          ) : (
            <div style={{ width: "60px", height: "10px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", marginTop: "4px", animation: "shimmer 1.5s infinite linear" }} />
          )}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(148,163,184,0.4)", padding: "2px", lineHeight: 1, fontSize: "14px", flexShrink: 0 }}
        title="Remove from watchlist"
      >
        ✕
      </button>
    </motion.div>
  );
}

interface Props {
  activeTicker?: string;
  collapsed?: boolean;
}

export default function WatchlistPanel({ activeTicker, collapsed = false }: Props) {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const refresh = () => setWatchlist(getWatchlist());

  useEffect(() => {
    refresh();
    window.addEventListener("watchlist-update", refresh);
    return () => window.removeEventListener("watchlist-update", refresh);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: "rgba(17, 24, 39, 0.85)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "1.5rem",
        padding: "24px",
        height: "fit-content",
        position: "sticky",
        top: "80px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(148,163,184,0.7)", margin: 0 }}>Watchlist</p>
        <span style={{ fontSize: "11px", color: "rgba(148,163,184,0.5)" }}>{watchlist.length}/20</span>
      </div>

      {watchlist.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 12px" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px", opacity: 0.3 }}>★</div>
          <p style={{ fontSize: "12px", color: "rgba(148,163,184,0.5)", margin: 0 }}>
            No stocks saved yet.
          </p>
          <p style={{ fontSize: "11px", color: "rgba(148,163,184,0.35)", margin: "4px 0 0" }}>
            Click "Watchlist" on any stock page.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {watchlist.map((symbol) => (
            <WatchlistItem
              key={symbol}
              symbol={symbol}
              isActive={symbol === activeTicker}
              onRemove={() => removeFromWatchlist(symbol)}
            />
          ))}
        </div>
      )}

      {/* Quick-add popular */}
      {watchlist.length === 0 && (
        <div style={{ marginTop: "16px" }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(148,163,184,0.4)", margin: "0 0 8px" }}>Quick add</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {["AAPL", "NVDA", "TSLA", "MSFT"].map((s) => (
              <button
                key={s}
                onClick={() => { addToWatchlist(s); }}
                style={{ padding: "4px 10px", borderRadius: "9999px", border: "1px solid rgba(10,132,255,0.3)", background: "rgba(10,132,255,0.06)", color: "#0a84ff", fontSize: "11px", cursor: "pointer" }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

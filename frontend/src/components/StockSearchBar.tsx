"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { searchStocks, type SearchResult } from "@/lib/api";

const RECENT_KEY = "alphaai_recent_searches";
const POPULAR = ["NVDA", "AAPL", "TSLA", "MSFT", "AMZN", "META", "GOOGL"];

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecent(symbol: string) {
  const prev = getRecent().filter((s) => s !== symbol);
  localStorage.setItem(RECENT_KEY, JSON.stringify([symbol, ...prev].slice(0, 6)));
}

interface Props {
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export default function StockSearchBar({ placeholder = "Search ticker or company…", className = "", compact = false }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchStocks(q.trim(), 8);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchResults]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigate = (symbol: string) => {
    saveRecent(symbol);
    setRecent(getRecent());
    setOpen(false);
    setQuery("");
    router.push(`/stocks/${symbol}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const list = query.trim() ? results : [];
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, list.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") {
      if (activeIdx >= 0 && list[activeIdx]) navigate(list[activeIdx].symbol);
      else if (query.trim()) navigate(query.trim().toUpperCase());
    }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  };

  const showDropdown = open && (query.trim() ? true : recent.length > 0 || true);
  const sectorColor: Record<string, string> = {
    Technology: "#0a84ff",
    Healthcare: "#00ff41",
    "Financial Services": "#f59e0b",
    Energy: "#ff6b35",
    "Consumer Cyclical": "#a855f7",
    "Consumer Defensive": "#06b6d4",
    Industrials: "#78716c",
    "Communication Services": "#ec4899",
    "Real Estate": "#14b8a6",
    Utilities: "#84cc16",
    ETF: "#64748b",
    Cryptocurrency: "#f97316",
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ width: compact ? "280px" : "100%", maxWidth: "640px" }}>
      {/* Input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(23, 31, 51, 0.85)",
          backdropFilter: "blur(20px)",
          border: open ? "1px solid rgba(0,255,65,0.5)" : "1px solid rgba(132,150,126,0.3)",
          borderRadius: open && showDropdown ? "1rem 1rem 0 0" : "1rem",
          transition: "all 0.2s ease",
          boxShadow: open ? "0 0 20px rgba(0,255,65,0.1)" : "none",
          padding: compact ? "8px 14px" : "12px 18px",
          gap: "10px",
        }}
      >
        {/* Search icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(132,150,126,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#dae2fd",
            fontSize: compact ? "14px" : "15px",
            fontFamily: "var(--font-body)",
          }}
          autoComplete="off"
          spellCheck={false}
          id="stock-search-input"
        />
        {loading && (
          <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(0,255,65,0.3)" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#00ff41" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        )}
        {query && !loading && (
          <button onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(132,150,126,0.8)", flexShrink: 0, padding: 0, lineHeight: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "rgba(17, 24, 39, 0.97)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0,255,65,0.2)",
          borderTop: "none",
          borderRadius: "0 0 1rem 1rem",
          zIndex: 1000,
          overflow: "hidden",
          boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
          maxHeight: "380px",
          overflowY: "auto",
        }}>
          {/* No query: show recent + popular */}
          {!query.trim() && (
            <>
              {recent.length > 0 && (
                <div style={{ padding: "10px 16px 6px" }}>
                  <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(148,163,184,0.7)", marginBottom: "6px" }}>Recent</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {recent.map((s) => (
                      <button key={s} onClick={() => navigate(s)} style={{ padding: "4px 10px", borderRadius: "9999px", border: "1px solid rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.05)", color: "#00ff41", fontSize: "12px", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ padding: "10px 16px" }}>
                <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(148,163,184,0.7)", marginBottom: "6px" }}>Popular</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {POPULAR.map((s) => (
                    <button key={s} onClick={() => navigate(s)} style={{ padding: "4px 10px", borderRadius: "9999px", border: "1px solid rgba(10,132,255,0.3)", background: "rgba(10,132,255,0.05)", color: "#0a84ff", fontSize: "12px", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Query results */}
          {query.trim() && results.length === 0 && !loading && (
            <div style={{ padding: "20px", textAlign: "center", color: "rgba(148,163,184,0.7)", fontSize: "13px" }}>
              No results for "{query}". Press Enter to search anyway.
            </div>
          )}

          {query.trim() && results.map((r, i) => (
            <button
              key={r.symbol}
              onClick={() => navigate(r.symbol)}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                padding: "10px 16px",
                background: i === activeIdx ? "rgba(0,255,65,0.07)" : "transparent",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                cursor: "pointer",
                transition: "background 0.15s",
                textAlign: "left",
                gap: "12px",
              }}
            >
              <div style={{ width: "44px", height: "36px", borderRadius: "8px", background: "rgba(23,31,51,0.8)", border: "1px solid rgba(132,150,126,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "11px", color: "#dae2fd" }}>{r.symbol.slice(0, 4)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: "14px", color: "#dae2fd", margin: 0, fontFamily: "var(--font-body)" }}>{r.symbol}</p>
                <p style={{ fontSize: "12px", color: "rgba(148,163,184,0.8)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</p>
              </div>
              <span style={{ padding: "2px 8px", borderRadius: "9999px", fontSize: "10px", background: `${sectorColor[r.sector] || "#64748b"}20`, color: sectorColor[r.sector] || "#64748b", border: `1px solid ${sectorColor[r.sector] || "#64748b"}40`, flexShrink: 0, whiteSpace: "nowrap" }}>
                {r.sector}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

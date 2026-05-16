"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  getDashboard,
  getStockNews,
  type DashboardResponse,
  type NewsArticle,
} from "@/lib/api";

import StockSearchBar         from "@/components/StockSearchBar";
import StockOverviewCard      from "@/components/StockOverviewCard";
import StockChart             from "@/components/StockChart";
import AIRecommendationCard   from "@/components/AIRecommendationCard";
import SentimentPanel         from "@/components/SentimentPanel";
import MarketStats            from "@/components/MarketStats";
import TechnicalIndicatorsPanel from "@/components/TechnicalIndicatorsPanel";
import NewsSection            from "@/components/NewsSection";
import WatchlistPanel, {
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
} from "@/components/WatchlistPanel";

// ── Timeframe → yfinance params mapping ──────────────────────────────────────
const TF_BUTTONS = ["1m", "5m", "15m", "1H", "4H", "1D", "1W", "1M"] as const;

// ── Loading skeleton strips ──────────────────────────────────────────────────
function Skeleton({ h = 200, rounded = "1.5rem" }: { h?: number; rounded?: string }) {
  return (
    <div style={{
      height: h,
      borderRadius: rounded,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      animation: "shimmer 1.5s infinite linear",
    }} />
  );
}

// ── Error banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "16px 20px",
        borderRadius: "14px",
        background: "rgba(255,49,49,0.07)",
        border: "1px solid rgba(255,49,49,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ color: "#ff3131", fontSize: "16px" }}>⚠</span>
        <p style={{ fontSize: "13px", color: "rgba(255,100,100,0.9)", margin: 0 }}>{message}</p>
      </div>
      <button
        onClick={onRetry}
        style={{
          padding: "6px 16px",
          borderRadius: "8px",
          border: "1px solid rgba(255,49,49,0.4)",
          background: "rgba(255,49,49,0.1)",
          color: "#ff3131",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        Retry
      </button>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = ((params?.ticker as string) ?? "AAPL").toUpperCase();

  // Data state
  const [dashboard, setDashboard]     = useState<DashboardResponse | null>(null);
  const [news, setNews]               = useState<NewsArticle[]>([]);
  const [timeframe, setTimeframe]     = useState("1D");
  const [tab, setTab] = useState("technical");
  const [indicatorVisibility, setIndicatorVisibility] = useState({ rsi: true, macd: true, sma20: true, sma50: true, bb: false });

  // Loading states
  const [loadingDash, setLoadingDash]   = useState(true);
  const [loadingNews, setLoadingNews]   = useState(true);

  // Error state
  const [error, setError] = useState("");

  // Watchlist
  const [watched, setWatched] = useState(false);
  useEffect(() => { setWatched(isInWatchlist(ticker)); }, [ticker]);

  const toggleWatchlist = () => {
    if (watched) { removeFromWatchlist(ticker); setWatched(false); }
    else         { addToWatchlist(ticker);       setWatched(true);  }
  };

  // ── Load dashboard (price + meta + technicals + recommendation + sentiment) ──
  const loadDashboard = useCallback(async () => {
    setLoadingDash(true);
    setError("");
    try {
      const data = await getDashboard(ticker);
      setDashboard(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? "Failed to load stock data");
    } finally {
      setLoadingDash(false);
    }
  }, [ticker]);

  // ── Load news ────────────────────────────────────────────────────────────
  const loadNews = useCallback(async () => {
    setLoadingNews(true);
    try {
      const data = await getStockNews(ticker);
      setNews(data);
    } catch {
      setNews([]);
    } finally {
      setLoadingNews(false);
    }
  }, [ticker]);

  // Initial loads
  useEffect(() => {
    loadDashboard();
    loadNews();
  }, [loadDashboard, loadNews]);

  // Cast sentiment for SentimentPanel
  const sentiment = dashboard?.sentiment as any;
  const technicals = dashboard?.technical_indicators as any;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* ── Background ambient glow ────────────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20%", left: "10%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,255,65,0.04) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "5%",  width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(10,132,255,0.04) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "28px 24px", position: "relative", zIndex: 1 }}>

        {/* ── Top bar: search + breadcrumb ───────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "rgba(148,163,184,0.6)", flexShrink: 0 }}>
            <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(148,163,184,0.6)", padding: 0, fontSize: "13px" }}>Dashboard</button>
            <span>/</span>
            <span style={{ color: "#00ff41", fontWeight: 600 }}>{ticker}</span>
          </div>

          {/* Search bar */}
          <div style={{ flex: 1, maxWidth: "520px" }}>
            <StockSearchBar placeholder="Search another stock…" compact />
          </div>

          {/* Page indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto", flexShrink: 0 }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#00ff41", animation: "pulse-glow 2s infinite" }} />
            <span style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(0,255,65,0.8)" }}>Live Analysis</span>
          </div>
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} onRetry={loadDashboard} />}

        {/* ── Main layout: [content] + [watchlist sidebar] ─────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gridTemplateAreas: `"chart sidebar" "tabs tabs"`,
            gap: "20px",
            alignItems: "start",
          }}
        >
          <div style={{ gridArea: "chart", minWidth: 0 }}>
            <div style={{
              background: "#0f1629",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h2 style={{ color: "#e5e7eb", fontSize: 20, margin: 0 }}>{ticker}</h2>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>{dashboard?.metadata?.name ?? ""}</span>
                  <span style={{ color: (dashboard?.price?.change ?? 0) >= 0 ? "#00ff41" : "#ff3131", fontWeight: 700 }}>
                    ${dashboard?.price?.price?.toFixed(2) ?? "--"} ({dashboard?.price?.change_percent?.toFixed(2) ?? "0"}%)
                  </span>
                  <button onClick={toggleWatchlist} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: watched ? "#00ff41" : "#9ca3af", borderRadius: 8, padding: "4px 8px", cursor: "pointer" }}>
                    ★
                  </button>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TF_BUTTONS.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: timeframe === tf ? "rgba(0,255,65,0.12)" : "transparent",
                        color: timeframe === tf ? "#00ff41" : "#9ca3af",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { label: "TL", name: "Trend Line" },
                    { label: "H", name: "Horizontal Line" },
                    { label: "F", name: "Fibonacci" },
                    { label: "R", name: "Rectangle" },
                  ].map((tool) => (
                    <button
                      key={tool.label}
                      onClick={() => alert(`Coming soon: ${tool.name}`)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "transparent",
                        color: "#9ca3af",
                        cursor: "pointer",
                        fontSize: 11,
                      }}
                    >
                      {tool.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["rsi", "macd", "sma20", "sma50", "bb"] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => setIndicatorVisibility((s) => ({ ...s, [key]: !s[key] }))}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: indicatorVisibility[key] ? "rgba(59,130,246,0.15)" : "transparent",
                        color: indicatorVisibility[key] ? "#3b82f6" : "#9ca3af",
                        cursor: "pointer",
                        fontSize: 11,
                      }}
                    >
                      {key.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <StockChart
                ticker={ticker}
                currentTimeframe={timeframe}
                onTimeframeChange={setTimeframe}
                showControls={false}
                indicatorVisibility={indicatorVisibility}
                onIndicatorToggle={(name, value) => setIndicatorVisibility((s) => ({ ...s, [name]: value }))}
              />
            </div>
          </div>

          <div style={{ gridArea: "sidebar", display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 90 }}>
            {loadingDash ? (
              <Skeleton h={220} />
            ) : (
              <StockOverviewCard
                ticker={ticker}
                price={dashboard?.price ?? null}
                meta={dashboard?.metadata ?? null}
                loading={false}
                inWatchlist={watched}
                onWatchlistToggle={toggleWatchlist}
              />
            )}
            <AIRecommendationCard ticker={ticker} data={dashboard?.recommendation as any ?? null} loading={loadingDash} />
            <SentimentPanel data={sentiment} loading={loadingDash} />
          </div>

          <div style={{ gridArea: "tabs" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[
                { key: "technical", label: "Technical Indicators" },
                { key: "news", label: "News" },
                { key: "fundamentals", label: "Fundamentals" },
                { key: "portfolio", label: "Portfolio" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: tab === item.key ? "rgba(0,255,65,0.12)" : "rgba(255,255,255,0.04)",
                    color: tab === item.key ? "#00ff41" : "#9ca3af",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {tab === "technical" && (
              <div style={{ display: "grid", gap: 16 }}>
                <MarketStats price={dashboard?.price as any ?? null} meta={dashboard?.metadata ?? null} technicals={technicals} loading={loadingDash} />
                <TechnicalIndicatorsPanel data={technicals} loading={loadingDash} />
              </div>
            )}
            {tab === "news" && (
              <NewsSection ticker={ticker} articles={news as any[]} loading={loadingNews} />
            )}
            {tab === "fundamentals" && (
              <div style={{ padding: 20, borderRadius: 16, background: "#0f1629", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}>
                Fundamentals panel coming soon. Use the Company Overview for key metrics.
              </div>
            )}
            {tab === "portfolio" && (
              <div style={{ padding: 20, borderRadius: 16, background: "#0f1629", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}>
                Portfolio integration coming soon. Add this symbol from the Portfolio page.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 1024px) {
          div[style*="gridTemplateAreas: \"chart sidebar\" \"tabs tabs\""] {
            grid-template-columns: 1fr !important;
            grid-template-areas: "chart" "sidebar" "tabs" !important;
          }
        }
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns: repeat(auto-fill, minmax(140px, 1fr))"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @keyframes shimmer {
          0%   { background-position: -1000px 0; }
          100% { background-position:  1000px 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

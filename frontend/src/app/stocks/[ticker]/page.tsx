"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  getDashboard,
  getStockHistory,
  getStockNews,
  type DashboardResponse,
  type StockHistoryEntry,
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
const TF_MAP: Record<string, { period: string; interval: string }> = {
  "1D": { period: "1d",  interval: "5m" },
  "1W": { period: "5d",  interval: "15m" },
  "1M": { period: "1mo", interval: "1d" },
  "1Y": { period: "1y",  interval: "1wk" },
};

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
  const [chartData, setChartData]     = useState<StockHistoryEntry[]>([]);
  const [news, setNews]               = useState<NewsArticle[]>([]);
  const [timeframe, setTimeframe]     = useState("1M");

  // Loading states
  const [loadingDash, setLoadingDash]   = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
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

  // ── Load chart data based on timeframe ───────────────────────────────────
  const loadChart = useCallback(async (tf: string) => {
    setLoadingChart(true);
    try {
      const { period, interval } = TF_MAP[tf] ?? TF_MAP["1M"];
      const data = await getStockHistory(ticker, period, interval);
      setChartData(data);
    } catch {
      setChartData([]);
    } finally {
      setLoadingChart(false);
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
    loadChart("1M");
    loadNews();
  }, [loadDashboard, loadChart, loadNews]);

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    loadChart(tf);
  };

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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", alignItems: "start" }}>

          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>

            {/* Company Overview */}
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

            {/* Chart */}
            <StockChart
              data={chartData}
              loading={loadingChart}
              onTimeframeChange={handleTimeframeChange}
              currentTimeframe={timeframe}
            />

            {/* 2-column row: AI Recommendation + Sentiment */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <AIRecommendationCard
                ticker={ticker}
                data={dashboard?.recommendation as any ?? null}
                loading={loadingDash}
              />
              <SentimentPanel
                data={sentiment}
                loading={loadingDash}
              />
            </div>

            {/* Market Stats + Technical Indicators */}
            <MarketStats
              price={dashboard?.price as any ?? null}
              meta={dashboard?.metadata ?? null}
              technicals={technicals}
              loading={loadingDash}
            />

            <TechnicalIndicatorsPanel
              data={technicals}
              loading={loadingDash}
            />

            {/* News */}
            <NewsSection
              ticker={ticker}
              articles={news as any[]}
              loading={loadingNews}
            />

          </div>

          {/* ── RIGHT SIDEBAR: Watchlist ─────────────────────────────────── */}
          <div style={{ position: "sticky", top: "90px" }}>
            <WatchlistPanel activeTicker={ticker} />

            {/* Quick actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                marginTop: "16px",
                background: "rgba(17, 24, 39, 0.85)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "1.5rem",
                padding: "20px",
              }}
            >
              <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(148,163,184,0.5)", margin: "0 0 14px" }}>
                Quick Links
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {["NVDA", "AAPL", "TSLA", "MSFT", "AMZN"].filter((s) => s !== ticker).slice(0, 4).map((s) => (
                  <button
                    key={s}
                    onClick={() => router.push(`/stocks/${s}`)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.03)",
                      color: "rgba(199,211,255,0.8)",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 500,
                      textAlign: "left",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(10,132,255,0.12)", border: "1px solid rgba(10,132,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#0a84ff", flexShrink: 0 }}>
                      {s.slice(0, 2)}
                    </span>
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 1024px) {
          div[style*="gridTemplateColumns: 1fr 280px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="gridTemplateColumns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
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

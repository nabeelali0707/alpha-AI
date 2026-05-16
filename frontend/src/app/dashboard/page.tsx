"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getDashboard, type DashboardResponse } from '@/lib/api';
import TickerTape from '@/components/TickerTape';
import LiveTicker from '@/components/LiveTicker';
import CandlestickChart from '@/components/CandlestickChart';
import SectorHeatmap from '@/components/SectorHeatmap';

const watchlist = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'AMZN'];

interface ChartData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const [ticker, setTicker] = useState('AAPL');
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const response = await getDashboard(ticker);
        if (active) {
          setData(response);
          if (response.history && Array.isArray(response.history)) {
            setChartData(response.history as ChartData[]);
          }
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load dashboard');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [ticker]);

  const price = data?.price;
  const technicals = data?.technical_indicators;
  const recommendation = data?.recommendation;
  const finalRecommendation = recommendation;
  const recommendationLabel = finalRecommendation?.recommendation ?? 'WAITING';
  const recommendationConfidence = finalRecommendation?.confidence ?? 0;
  const recommendationExplanation = finalRecommendation?.explanation ?? 'Live recommendation will appear once technical analysis completes.';
  const recommendationReasons = finalRecommendation?.reasons ?? [];
  const recommendationColor =
    recommendationLabel === 'BUY'
      ? '#00ff41'
      : recommendationLabel === 'SELL'
      ? '#ff3131'
      : '#0a84ff';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const row = payload[0].payload;
      return (
        <div className="rounded-2xl border border-[#00ff4130] bg-[#171f33dd] p-3 text-xs text-[#dae2fd] shadow-glow">
          <p className="font-semibold">{row.date}</p>
          <p className="text-[#00ff41]">O: ${row.open?.toFixed(2)}</p>
          <p className="text-[#0a84ff]">H: ${row.high?.toFixed(2)}</p>
          <p className="text-[#ff3131]">L: ${row.low?.toFixed(2)}</p>
          <p>C: ${row.close?.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 sm:px-8">
      <div style={{ marginBottom: 4 }}>
        <LiveTicker />
      </div>
      <div style={{ marginBottom: 16 }}>
        <TickerTape />
      </div>
      <motion.section
        className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.28em] text-[#84b2ff]">AlphaAI Premium</p>
          <h1 className="max-w-3xl text-4xl font-semibold text-white sm:text-5xl">
            {ticker} Market Intelligence
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[#c7d3ffcc] sm:text-base">
            Real-time stock signals, sector heatmaps, sentiment insights, and AI-driven trade recommendations for elite investors.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="btn btn-outline rounded-full px-5 py-3 text-sm font-semibold transition hover:bg-white/5">
            Export Report
          </button>
          <button className="btn btn-primary rounded-full px-5 py-3 text-sm font-semibold transition hover:shadow-glow">
            Launch Live View
          </button>
        </div>
      </motion.section>

      <motion.div
        className="mb-8 flex flex-wrap gap-3"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        {watchlist.map((symbol) => (
          <button
            key={symbol}
            onClick={() => setTicker(symbol)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition duration-200 ${
              ticker === symbol
                ? 'border-[#00ff41] bg-[#00ff41]/10 text-[#00ff41]'
                : 'border-[#4c5d7c] bg-[#15203d] text-[#c7d3ffb3] hover:border-[#0a84ff] hover:text-white'
            }`}
          >
            {symbol}
          </button>
        ))}
      </motion.div>

      {error && (
        <motion.div
          className="glass-card mb-8 rounded-[1.25rem] border border-[#ff313140] bg-[#11182780] p-6"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <p className="mb-2 text-xs uppercase tracking-[0.28em] text-[#ff3131cc]">API Error</p>
          <p className="text-sm text-[#e5e7eb]">{error}</p>
        </motion.div>
      )}

      <motion.section
        className="grid gap-6 lg:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <div className="glass-card rounded-[1.5rem] border border-white/10 bg-[#11182780] p-6 shadow-glow">
          <p className="text-xs uppercase tracking-[0.28em] text-[#94a3b8]">Current Price</p>
          <p className="mt-4 text-5xl font-semibold text-white">${price?.price ?? '--'}</p>
          <p className="mt-3 text-sm text-[#94a3b8]">{new Date(price?.timestamp || '').toLocaleTimeString()}</p>
          <div className="mt-6 flex items-center gap-4 rounded-3xl bg-white/5 p-4">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
              (price?.change ?? 0) >= 0 ? 'bg-[#003907]/80 text-[#00ff41]' : 'bg-[#4c121f]/80 text-[#ff3131]'
            }`}>
              {((price?.change ?? 0) >= 0 ? '+' : '') + (price?.change ?? 0).toFixed(2)}
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#94a3b8]">24H change</p>
              <p className="text-base font-semibold text-white">{price?.change_percent?.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-[1.5rem] border border-[#00ff4130] bg-[#11182780] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[#94a3b8]">AI Recommendation</p>
          <p className="mt-4 text-4xl font-semibold" style={{ color: recommendationColor }}>
            {recommendationLabel}
          </p>
          <p className="mt-2 text-sm text-[#c7d3ffcc]">Confidence {(recommendationConfidence * 100).toFixed(0)}%</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${recommendationConfidence * 100}%`, background: recommendationColor }} />
          </div>
          <p className="mt-5 text-sm leading-6 text-[#c7d3ffcc]">{recommendationExplanation}</p>
        </div>

        <div className="glass-card rounded-[1.5rem] border border-white/10 bg-[#11182780] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[#94a3b8]">Technical Indicators</p>
          <div className="mt-6 grid gap-4">
            <div className="rounded-3xl bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm text-[#c7d3ffcc]">
                <span>RSI</span>
                <span className={technicals?.rsi.signal === 'OVERBOUGHT' ? 'text-[#ff3131]' : technicals?.rsi.signal === 'OVERSOLD' ? 'text-[#00ff41]' : 'text-[#0a84ff]'}>
                  {technicals?.rsi.value.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="rounded-3xl bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm text-[#c7d3ffcc]">
                <span>MACD</span>
                <span className={technicals?.macd.signal === 'BULLISH' ? 'text-[#00ff41]' : 'text-[#ff3131]'}>
                  {technicals?.macd.signal}
                </span>
              </div>
            </div>
            <div className="rounded-3xl bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm text-[#c7d3ffcc]">
                <span>Trend</span>
                <span className={technicals?.moving_averages.trend?.includes('BULLISH') || technicals?.moving_averages.trend === 'GOLDEN_CROSS' ? 'text-[#00ff41]' : 'text-[#ff3131]'}>
                  {technicals?.moving_averages.trend}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {loading ? (
        <motion.div
          className="glass-card rounded-[1.5rem] border border-white/10 bg-[#11182780] p-10 text-center"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-sm text-[#c7d3ffcc]">Synchronizing live market feeds...</p>
        </motion.div>
      ) : chartData.length > 0 ? (
        <motion.div className="grid gap-6" initial="hidden" animate="visible" variants={sectionVariants}>
          <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="glass-card rounded-[1.5rem] border border-white/10 bg-[#11182780] p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold uppercase tracking-[0.28em] text-[#94a3b8]">Price Chart</p>
                <span className="rounded-full bg-[#0a84ff]/10 px-3 py-1 text-xs text-[#c7d3ffcc]">30 days</span>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="close" stroke="#00ff41" dot={false} strokeWidth={2} name="Close" />
                  <Line type="monotone" dataKey="open" stroke="#0a84ff" dot={false} strokeWidth={1} opacity={0.8} name="Open" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-6">
              <div className="glass-card rounded-[1.5rem] border border-white/10 bg-[#11182780] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-semibold uppercase tracking-[0.28em] text-[#94a3b8]">Volume</p>
                  <span className="rounded-full bg-[#00ff41]/10 px-3 py-1 text-xs text-[#c7d3ffcc]">High liquidity</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="volume" fill="rgba(10, 132, 255, 0.7)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <CandlestickChart data={chartData} height={260} />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <SectorHeatmap />
            <div className="grid gap-6">
              <div className="glass-card rounded-[1.5rem] border border-white/10 bg-[#11182780] p-6">
                <p className="mb-4 font-semibold uppercase tracking-[0.28em] text-[#94a3b8]">Price Range Analysis</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#94a3b8]">52-Week High</p>
                    <p className="mt-3 text-xl font-semibold text-[#00ff41]">${data?.metadata?.fifty_two_week_high?.toFixed(2) ?? '--'}</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#94a3b8]">52-Week Low</p>
                    <p className="mt-3 text-xl font-semibold text-[#ff3131]">${data?.metadata?.fifty_two_week_low?.toFixed(2) ?? '--'}</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#94a3b8]">Market Cap</p>
                    <p className="mt-3 text-xl font-semibold text-[#dae2fd]">${data?.metadata?.market_cap ? (Number(data.metadata.market_cap) / 1e12).toFixed(2) + 'T' : '--'}</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#94a3b8]">P/E Ratio</p>
                    <p className="mt-3 text-xl font-semibold text-[#dae2fd]">{data?.metadata?.pe_ratio?.toFixed(2) ?? '--'}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-[1.5rem] border border-white/10 bg-[#11182780] p-6">
                <p className="mb-4 font-semibold uppercase tracking-[0.28em] text-[#94a3b8]">Recommendation Reasons</p>
                <div className="space-y-3">
                    {recommendationReasons.map((reason, idx) => (
                    <div key={idx} className="rounded-3xl border-l-4 border-[#00ff41] bg-white/5 p-4 text-sm text-[#d1d5db]">
                      {reason}
                    </div>
                  ))}
                </div>
              </div>

              {data?.metadata && (
                <div className="glass-card rounded-[1.5rem] border border-white/10 bg-[#11182780] p-6">
                  <p className="mb-4 font-semibold uppercase tracking-[0.28em] text-[#94a3b8]">Company Info</p>
                  <div className="grid gap-4 text-sm text-[#d1d5db]">
                    <div className="rounded-3xl bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#94a3b8]">Name</p>
                      <p className="mt-2 font-medium text-white">{data.metadata.name || 'N/A'}</p>
                    </div>
                    <div className="rounded-3xl bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#94a3b8]">Sector / Industry</p>
                      <p className="mt-2 font-medium text-white">{data.metadata.sector} / {data.metadata.industry}</p>
                    </div>
                    <div className="rounded-3xl bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#94a3b8]">Description</p>
                      <p className="mt-2 leading-6 text-[#c7d3ffcc]">{data.metadata.description?.substring(0, 200)}...</p>
                    </div>
                    {data.metadata.website && (
                      <div className="rounded-3xl bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#94a3b8]">Website</p>
                        <a className="mt-2 inline-block text-sm font-medium text-[#0a84ff] underline" href={data.metadata.website} target="_blank" rel="noreferrer">
                          {data.metadata.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </motion.div>
      ) : null}
    </main>
  );
}

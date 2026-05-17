"use client";

import React, { useState } from "react";
import TradingViewChart from "@/components/TradingViewChart";
import { usePolling } from "@/hooks/usePolling";
import FearGreedGauge from "@/components/FearGreedGauge";
import { motion } from "framer-motion";

type MarketItem = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  volume?: number | null;
};

type FearGreedData = {
  value: number;
  classification: string;
  explanation: string;
};

const pageVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState<"chart" | "crypto" | "forex" | "feargreed">("chart");

  // Staggered polling to prevent 429 rate limit errors
  const { data: fearGreed, loading: fgLoading } = usePolling<FearGreedData>(
    "/market/fear-greed",
    300000, // 5 min
    0       // immediately
  );

  // We fetch through live endpoints
  const { data: cryptoRaw, loading: cryptoLoading } = usePolling<any[]>(
    "/live/crypto/all",
    60000,  // 60s
    1000    // stagger by 1s
  );

  const { data: forexRaw, loading: forexLoading } = usePolling<any[]>(
    "/live/forex/all",
    120000, // 120s
    2500    // stagger by 2.5s
  );

  // Map crypto data to consistent MarketItem schema
  const cryptoData: MarketItem[] = (cryptoRaw ?? []).map((coin) => ({
    symbol: coin.symbol?.toUpperCase() || "",
    name: coin.name || "",
    price: coin.price || 0,
    change: Number(((coin.price ?? 0) * ((coin.change_24h ?? 0) / 100)).toFixed(2)),
    change_percent: coin.change_24h ?? 0,
    volume: coin.volume_24h || 0,
  }));

  // Map forex data to consistent MarketItem schema
  const forexData: MarketItem[] = (forexRaw ?? []).map((item) => ({
    symbol: item.pair || "",
    name: item.pair || "",
    price: item.rate || 0,
    change: 0,
    change_percent: 0,
    volume: null,
  }));

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 sm:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">Live Market Terminals</h1>
        <p className="mt-2 text-sm text-[#8a99ad]">
          Cross-market asset analysis. Access live crypto lists, international forex rates, and real-time sentiments.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-white/10">
        {(["chart", "crypto", "forex", "feargreed"] as const).map((tab) => {
          const labels = {
            chart: "📊 Interactive Chart",
            crypto: "🪙 Cryptocurrencies",
            forex: "💵 Forex Currency Pairs",
            feargreed: "🧭 Fear & Greed Index",
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-6 py-3 text-sm font-semibold tracking-wide transition duration-200 ${
                activeTab === tab
                  ? "border-[#00ff41] text-[#00ff41]"
                  : "border-transparent text-text-secondary hover:text-white"
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      <motion.div initial="hidden" animate="visible" variants={pageVariants} className="min-h-[500px]">
        {activeTab === "chart" && (
          <div className="rounded-[1rem] overflow-hidden border border-white/10 bg-[#070b1980] p-4 shadow-glow h-[600px]">
            <TradingViewChart />
          </div>
        )}

        {activeTab === "crypto" && (
          <div className="glass-card rounded-[1rem] border border-white/10 bg-[#070b19b0] p-6 shadow-glow">
            <h2 className="text-xl font-bold text-white mb-4">Cryptocurrency Assets</h2>
            {cryptoLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-green" />
              </div>
            ) : cryptoData.length === 0 ? (
              <p className="text-sm text-[#8a99ad] text-center py-10">No crypto data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#c7d3ffcc]">
                  <thead>
                    <tr className="border-b border-white/10 pb-4 text-xs font-semibold uppercase tracking-wider text-text-secondary text-[#94a3b8]">
                      <th className="py-3">Asset</th>
                      <th className="py-3">Price</th>
                      <th className="py-3">24H Change</th>
                      <th className="py-3 text-right">24H Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cryptoData.map((coin, index) => {
                      const isUp = coin.change_percent >= 0;
                      return (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition duration-150">
                          <td className="py-4 font-semibold text-white">
                            <span className="mr-2 text-text-secondary text-xs text-[#94a3b8]">{coin.symbol}</span>
                            {coin.name}
                          </td>
                          <td className="py-4 font-mono font-medium text-white">
                            ${coin.price >= 1 ? coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : coin.price.toFixed(6)}
                          </td>
                          <td className={`py-4 font-semibold ${isUp ? "text-[#00ff41]" : "text-[#ff3131]"}`}>
                            {isUp ? "+" : ""}
                            {coin.change_percent.toFixed(2)}%
                          </td>
                          <td className="py-4 text-right font-mono text-xs text-[#94a3b8]">
                            ${coin.volume ? coin.volume.toLocaleString() : "--"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "forex" && (
          <div className="glass-card rounded-[1rem] border border-white/10 bg-[#070b19b0] p-6 shadow-glow">
            <h2 className="text-xl font-bold text-white mb-4">Forex Exchange Rates</h2>
            {forexLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-green" />
              </div>
            ) : forexData.length === 0 ? (
              <p className="text-sm text-[#8a99ad] text-center py-10">No forex data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#c7d3ffcc]">
                  <thead>
                    <tr className="border-b border-white/10 pb-4 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                      <th className="py-3">Currency Pair</th>
                      <th className="py-3">Exchange Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forexData.map((item, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition duration-150">
                        <td className="py-4 font-semibold text-white tracking-widest">{item.symbol}</td>
                        <td className="py-4 font-mono font-medium text-white">{item.price.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "feargreed" && (
          <div className="max-w-[450px] mx-auto">
            {fgLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-green" />
              </div>
            ) : fearGreed ? (
              <FearGreedGauge
                value={fearGreed.value}
                classification={fearGreed.classification}
                explanation={fearGreed.explanation}
                loading={fgLoading}
              />
            ) : (
              <p className="text-sm text-[#8a99ad] text-center py-10">Fear & Greed Index currently unavailable.</p>
            )}
          </div>
        )}
      </motion.div>
    </main>
  );
}
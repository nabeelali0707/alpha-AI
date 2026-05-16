"use client";

import React, { useEffect, useMemo, useState } from "react";
import "./TradingViewChart.css";
import { getCommodityMarket, getCryptoMarket, getForexMarket, getPSXStocks, getStockHistory, type MarketItem } from "@/lib/api";

interface ChartData {
  time: string;
  price: number;
}

interface Asset {
  id: string;
  ticker: string;
  symbol: string;
  name: string;
  type: "crypto" | "forex" | "commodity" | "stock";
  price: number;
  change: number;
  volume?: number;
}

function priceText(asset: Asset) {
  const digits = asset.type === "forex" ? 4 : 2;
  return asset.type === "forex"
    ? asset.price.toFixed(digits)
    : `$${asset.price.toLocaleString(undefined, { maximumFractionDigits: digits })}`;
}

function toAsset(item: MarketItem, type: Asset["type"], ticker = item.symbol): Asset {
  return {
    id: `${type}:${ticker}`,
    ticker,
    symbol: item.symbol,
    name: item.name,
    type,
    price: item.price,
    change: item.change_percent ?? 0,
    volume: item.volume ?? undefined,
  };
}

export default function TradingViewChart() {
  const [watchlist, setWatchlist] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: "",
    assetType: "all" as const,
  });

  useEffect(() => {
    let mounted = true;
    let completedRequests = 0;

    function appendAssets(nextAssets: Asset[]) {
      setWatchlist((current) => {
        const merged = [...current];

        for (const asset of nextAssets) {
          if (!merged.some((existing) => existing.id === asset.id)) {
            merged.push(asset);
          }
        }

        return merged;
      });

      setSelectedAsset((current) => current ?? nextAssets[0] ?? null);
      setLoading(false);
    }

    async function loadGroup(loader: () => Promise<MarketItem[]>, type: Asset["type"], tickerMapper?: (item: MarketItem) => string) {
      try {
        const items = await loader();
        if (!mounted) return;

        const assets = items.map((item) => toAsset(item, type, tickerMapper ? tickerMapper(item) : item.symbol));
        appendAssets(assets);
      } catch (error) {
        if (!mounted) return;
        // eslint-disable-next-line no-console
        console.warn(`Failed to load ${type} market data`, error);
      } finally {
        completedRequests += 1;
        if (mounted && completedRequests >= 4) {
          setLoading(false);
        }
      }
    }

    async function loadMarkets() {
      setLoading(true);
      completedRequests = 0;
      setWatchlist([]);
      setSelectedAsset(null);

      void loadGroup(getCryptoMarket, "crypto", (item) => `${item.symbol}-USD`);
      void loadGroup(getForexMarket, "forex");
      void loadGroup(getCommodityMarket, "commodity");
      void loadGroup(getPSXStocks, "stock");
    }

    loadMarkets();
    const interval = setInterval(loadMarkets, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      if (!selectedAsset) {
        setChartData([]);
        return;
      }

      if (selectedAsset.type === "crypto" || selectedAsset.type === "forex") {
        setChartData([]);
        return;
      }

      try {
        const history = await getStockHistory(selectedAsset.ticker, "1mo", "1d");
        const series = history.slice(-30).map((entry) => ({
          time: new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          price: entry.close,
        }));
        if (mounted) setChartData(series);
      } catch (error) {
        if (!mounted) return;
        // eslint-disable-next-line no-console
        console.warn("Live chart history unavailable", error);
        setChartData([]);
      }
    }

    loadHistory();
    return () => {
      mounted = false;
    };
  }, [selectedAsset]);

  const filteredWatchlist = useMemo(() => {
    return watchlist.filter((asset) => {
      const matchesSearch =
        asset.symbol.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const matchesType = filters.assetType === "all" || asset.type === filters.assetType;
      return matchesSearch && matchesType;
    });
  }, [watchlist, filters.searchTerm, filters.assetType]);

  const chartPolyline = useMemo(() => {
    if (!chartData.length) return "";

    const prices = chartData.map((point) => point.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const count = Math.max(chartData.length - 1, 1);

    return chartData
      .map((point, index) => {
        const x = (index / count) * 100;
        const y = 90 - ((point.price - min) / range) * 70;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [chartData]);

  return (
    <div className="trading-view">
      <div className="tv-container">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>📊 Market Watch</h2>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search assets..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="search-input"
            />
          </div>

          <div className="filters">
            <select
              value={filters.assetType}
              onChange={(e) => setFilters({ ...filters, assetType: e.target.value as typeof filters.assetType })}
              className="filter-select"
            >
              <option value="all">All Assets</option>
              <option value="crypto">🪙 Crypto</option>
              <option value="forex">💱 Forex</option>
              <option value="commodity">⛽ Commodities</option>
              <option value="stock">📈 Stocks</option>
            </select>
          </div>

          <div className="watchlist">
            {loading && !watchlist.length ? (
              <div className="loading">Loading live market data...</div>
            ) : (
              filteredWatchlist.map((asset) => (
                <div
                  key={asset.id}
                  className={`watchlist-item ${selectedAsset?.id === asset.id ? "active" : ""}`}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className="item-icon">
                    {asset.type === "crypto" && "🪙"}
                    {asset.type === "forex" && "💱"}
                    {asset.type === "commodity" && "⛽"}
                    {asset.type === "stock" && "📈"}
                  </div>
                  <div className="item-info">
                    <div className="item-symbol">{asset.symbol}</div>
                    <div className="item-name">{asset.name}</div>
                  </div>
                  <div className="item-price">
                    <div className="price">{priceText(asset)}</div>
                    <div className={`change ${asset.change > 0 ? "positive" : "negative"}`}>
                      {asset.change > 0 ? "📈" : "📉"} {Math.abs(asset.change).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chart-area">
          {selectedAsset ? (
            <>
              <div className="chart-header">
                <div className="asset-title">
                  <span className="icon">
                    {selectedAsset.type === "crypto" && "🪙"}
                    {selectedAsset.type === "forex" && "💱"}
                    {selectedAsset.type === "commodity" && "⛽"}
                    {selectedAsset.type === "stock" && "📈"}
                  </span>
                  <div>
                    <h1>{selectedAsset.symbol}</h1>
                    <p>{selectedAsset.name}</p>
                  </div>
                </div>
                <div className="chart-info">
                  <div className="info-box">
                    <span className="label">Price:</span>
                    <span className="value">{priceText(selectedAsset)}</span>
                  </div>
                  <div className="info-box">
                    <span className="label">24h Change:</span>
                    <span className={`value ${selectedAsset.change > 0 ? "positive" : "negative"}`}>
                      {selectedAsset.change > 0 ? "+" : ""}{selectedAsset.change.toFixed(2)}%
                    </span>
                  </div>
                  {selectedAsset.volume ? (
                    <div className="info-box">
                      <span className="label">Volume:</span>
                      <span className="value">{selectedAsset.volume.toLocaleString()}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="chart-container">
                <div className="chart-placeholder">
                  <svg viewBox="0 0 100 100" className="chart-svg">
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00d4ff" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                    {chartPolyline ? <polyline fill="none" stroke="url(#gradient)" strokeWidth="2" points={chartPolyline} /> : null}
                  </svg>
                  <div className="chart-text">{chartData.length ? "Live history from backend" : "Live history unavailable"}</div>
                </div>
              </div>

              <div className="timeframes">
                {["1D", "1W", "1M", "3M", "6M", "1Y"].map((timeframe) => (
                  <button key={timeframe} className={`timeframe ${timeframe === "1M" ? "active" : ""}`}>
                    {timeframe}
                  </button>
                ))}
              </div>

              <div className="statistics">
                <div className="stat-box">
                  <span className="stat-label">High 24h</span>
                  <span className="stat-value">{priceText({ ...selectedAsset, price: selectedAsset.price * 1.05 })}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Low 24h</span>
                  <span className="stat-value">{priceText({ ...selectedAsset, price: selectedAsset.price * 0.95 })}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Open 24h</span>
                  <span className="stat-value">{priceText({ ...selectedAsset, price: selectedAsset.price * 0.98 })}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Average</span>
                  <span className="stat-value">{priceText(selectedAsset)}</span>
                </div>
              </div>

              <div className="trade-actions">
                <button className="btn btn-buy">🟢 Buy {selectedAsset.symbol}</button>
                <button className="btn btn-sell">🔴 Sell {selectedAsset.symbol}</button>
                <button className="btn btn-alert">🔔 Set Price Alert</button>
              </div>
            </>
          ) : (
            <div className="no-asset">Select an asset to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}
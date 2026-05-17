"use client";

import React, { useEffect, useMemo, useState } from "react";
import "./TradingViewChart.css";
import StockChart from "@/components/StockChart";
import { getCommodityMarket, getCryptoHistory, getCryptoMarket, getForexHistory, getForexMarket, getPSXStocks, getStockHistory, type MarketItem, type StockHistoryEntry } from "@/lib/api";

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
  const [chartHistory, setChartHistory] = useState<StockHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: "",
    assetType: "all" as const,
  });

  useEffect(() => {
    let mounted = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];

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
      }
    }

    // Staggered market loading to avoid flooding Yahoo Finance
    // Crypto:    starts immediately,    repeats every 60s
    // Forex:     starts after 15s,      repeats every 120s
    // Commodity: starts after 30s,      repeats every 120s
    // PSX:       starts after 45s,      repeats every 90s

    setLoading(true);

    // Crypto — immediate
    void loadGroup(getCryptoMarket, "crypto", (item) => `${item.symbol}-USD`);
    intervals.push(setInterval(() => void loadGroup(getCryptoMarket, "crypto", (item) => `${item.symbol}-USD`), 60000));

    // Forex — delayed 15s
    timers.push(setTimeout(() => {
      void loadGroup(getForexMarket, "forex");
      intervals.push(setInterval(() => void loadGroup(getForexMarket, "forex"), 120000));
    }, 15000));

    // Commodity — delayed 30s
    timers.push(setTimeout(() => {
      void loadGroup(getCommodityMarket, "commodity");
      intervals.push(setInterval(() => void loadGroup(getCommodityMarket, "commodity"), 120000));
    }, 30000));

    // PSX — delayed 45s
    timers.push(setTimeout(() => {
      void loadGroup(getPSXStocks, "stock");
      intervals.push(setInterval(() => void loadGroup(getPSXStocks, "stock"), 90000));
    }, 45000));

    return () => {
      mounted = false;
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      if (!selectedAsset) {
        setChartHistory([]);
        return;
      }

      try {
        setHistoryLoading(true);
        const history = selectedAsset.type === "crypto"
          ? await getCryptoHistory(selectedAsset.symbol, 30)
          : selectedAsset.type === "forex"
            ? await getForexHistory(selectedAsset.symbol, 30)
            : await getStockHistory(selectedAsset.ticker, "1mo", "1d");
        if (mounted) setChartHistory(history);
      } catch (error) {
        if (!mounted) return;
        // eslint-disable-next-line no-console
        console.warn("Live chart history unavailable", error);
        setChartHistory([]);
      } finally {
        if (mounted) setHistoryLoading(false);
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

  return (
    <div className="trading-view page-enter">
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
                  className={`watchlist-item hover-scale ${selectedAsset?.id === asset.id ? "active" : ""}`}
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

        <div className="chart-area animate-fadeInLeft delay-200">
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
                {historyLoading ? (
                  <div className="chart-placeholder">
                    <div className="chart-text">Loading chart data...</div>
                  </div>
                ) : chartHistory.length ? (
                  <StockChart
                    ticker={selectedAsset.type === "stock" ? selectedAsset.ticker : undefined}
                    data={chartHistory}
                    height={420}
                    showControls={selectedAsset.type === "stock"}
                  />
                ) : (
                  <div className="chart-placeholder">
                    <div className="chart-text" style={{ color: "#ff3131", marginBottom: 8 }}>API Rate Limit Reached</div>
                    <div style={{ fontSize: 13, color: "#9ca3af", maxWidth: 300, textAlign: "center" }}>
                      Market data provider is currently rate limiting our requests. Chart history will resume automatically.
                    </div>
                  </div>
                )}
              </div>

              <div className="timeframes">
                {["1D", "1W", "1M", "3M", "6M", "1Y"].map((timeframe) => (
                  <button key={timeframe} className={`timeframe ${timeframe === "1M" ? "active" : ""}`}>
                    {timeframe}
                  </button>
                ))}
              </div>

              <div className="statistics animate-slideUp delay-300">
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

              <div className="trade-actions animate-slideUp delay-400">
                <button className="btn btn-buy hover-scale hover-glow">🟢 Buy {selectedAsset.symbol}</button>
                <button className="btn btn-sell hover-scale hover-glow">🔴 Sell {selectedAsset.symbol}</button>
                <button className="btn btn-alert hover-scale hover-glow">🔔 Set Price Alert</button>
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
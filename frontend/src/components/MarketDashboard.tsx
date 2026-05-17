import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './MarketDashboard.css';

const API_BASE = process.env.NEXT_PUBLIC_ALPHAAI_API_BASE_URL || 'http://localhost:8001/api/v1';

interface CryptoData {
  symbol: string;
  price: number;
  change_24h: number;
  volume_24h: number;
  market_cap: number;
}

interface ForexData {
  pair: string;
  rate: number;
  timestamp: string;
}

interface CommodityData {
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
}

export default function MarketDashboard() {
  const [activeTab, setActiveTab] = useState<'crypto' | 'forex' | 'commodities'>('crypto');
  const [crypto, setCrypto] = useState<CryptoData[]>([]);
  const [forex, setForex] = useState<ForexData[]>([]);
  const [commodities, setCommodities] = useState<CommodityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // ── Staggered polling to avoid flooding Yahoo with simultaneous requests ──
  useEffect(() => {
    let mounted = true;
    const fetchCrypto = async () => {
      try {
        const res = await axios.get(`${API_BASE}/live/crypto/all?limit=10`);
        if (mounted) { setCrypto(res.data || []); setLoading(false); }
      } catch (e) { console.error('Crypto fetch error:', e); }
    };
    fetchCrypto(); // immediate
    const id = setInterval(fetchCrypto, 60000); // every 60s
    return () => { mounted = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchForex = async () => {
      try {
        const res = await axios.get(`${API_BASE}/live/forex/all`);
        if (mounted) setForex(res.data || []);
      } catch (e) { console.error('Forex fetch error:', e); }
    };
    const timeout = setTimeout(() => {
      fetchForex();
      const id = setInterval(fetchForex, 120000); // every 120s
      return () => clearInterval(id);
    }, 15000); // start after 15s
    return () => { mounted = false; clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchCommodity = async () => {
      try {
        const res = await axios.get(`${API_BASE}/live/commodity/all`);
        if (mounted) setCommodities(res.data || []);
      } catch (e) { console.error('Commodity fetch error:', e); }
    };
    const timeout = setTimeout(() => {
      fetchCommodity();
      const id = setInterval(fetchCommodity, 120000); // every 120s
      return () => clearInterval(id);
    }, 30000); // start after 30s
    return () => { mounted = false; clearTimeout(timeout); };
  }, []);

  const renderCryptoTable = () => (
    <div className="market-table">
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Price</th>
            <th>24h Change</th>
            <th>Volume 24h</th>
            <th>Market Cap</th>
          </tr>
        </thead>
        <tbody>
          {crypto.map((coin) => (
            <tr 
              key={coin.symbol} 
              className={coin.change_24h > 0 ? 'positive' : 'negative'}
              onClick={() => setSelectedAsset(coin)}
            >
              <td className="symbol">{coin.symbol}</td>
              <td className="price">${coin.price.toFixed(2)}</td>
              <td className={`change ${coin.change_24h > 0 ? 'green' : 'red'}`}>
                {coin.change_24h > 0 ? '+' : ''}{coin.change_24h.toFixed(2)}%
              </td>
              <td>${(coin.volume_24h / 1e9).toFixed(2)}B</td>
              <td>${(coin.market_cap / 1e9).toFixed(2)}B</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderForexTable = () => (
    <div className="market-table">
      <table>
        <thead>
          <tr>
            <th>Pair</th>
            <th>Rate</th>
            <th>Status</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {forex.map((pair) => (
            <tr 
              key={pair.pair}
              onClick={() => setSelectedAsset(pair)}
            >
              <td className="symbol">{pair.pair}</td>
              <td className="price">{pair.rate.toFixed(4)}</td>
              <td className="live">🔴 Live</td>
              <td>{new Date(pair.timestamp).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCommoditiesTable = () => (
    <div className="market-table">
      <table>
        <thead>
          <tr>
            <th>Commodity</th>
            <th>Symbol</th>
            <th>Price</th>
            <th>Change %</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          {commodities.map((commodity) => (
            <tr 
              key={commodity.symbol}
              className={commodity.change_pct > 0 ? 'positive' : 'negative'}
              onClick={() => setSelectedAsset(commodity)}
            >
              <td className="name">{commodity.name}</td>
              <td className="symbol">{commodity.symbol}</td>
              <td className="price">${commodity.price.toFixed(2)}</td>
              <td className={`change ${commodity.change_pct > 0 ? 'green' : 'red'}`}>
                {commodity.change_pct > 0 ? '+' : ''}{commodity.change_pct.toFixed(2)}%
              </td>
              <td>USD/unit</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="market-dashboard">
      <div className="dashboard-header">
        <h1>🐉 AlphaAI TradingView</h1>
        <p>Real-time Markets: Crypto • Forex • Commodities</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'crypto' ? 'active' : ''}`}
          onClick={() => setActiveTab('crypto')}
        >
          💰 Cryptocurrency ({crypto.length})
        </button>
        <button 
          className={`tab ${activeTab === 'forex' ? 'active' : ''}`}
          onClick={() => setActiveTab('forex')}
        >
          💱 Forex ({forex.length})
        </button>
        <button 
          className={`tab ${activeTab === 'commodities' ? 'active' : ''}`}
          onClick={() => setActiveTab('commodities')}
        >
          ⛽ Commodities ({commodities.length})
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {loading ? (
          <div className="loading">Loading live market data...</div>
        ) : (
          <>
            {activeTab === 'crypto' && renderCryptoTable()}
            {activeTab === 'forex' && renderForexTable()}
            {activeTab === 'commodities' && renderCommoditiesTable()}
          </>
        )}
      </div>

      {/* Detail Panel */}
      {selectedAsset && (
        <div className="detail-panel">
          <div className="detail-header">
            <h2>{selectedAsset.symbol || selectedAsset.name}</h2>
            <button onClick={() => setSelectedAsset(null)}>✕</button>
          </div>
          <div className="detail-info">
            <div className="info-item">
              <span>Price:</span>
              <strong>${selectedAsset.price?.toFixed(4) || selectedAsset.rate?.toFixed(4)}</strong>
            </div>
            {selectedAsset.change_24h && (
              <div className="info-item">
                <span>24h Change:</span>
                <strong className={selectedAsset.change_24h > 0 ? 'green' : 'red'}>
                  {selectedAsset.change_24h > 0 ? '+' : ''}{selectedAsset.change_24h.toFixed(2)}%
                </strong>
              </div>
            )}
            {selectedAsset.market_cap && (
              <div className="info-item">
                <span>Market Cap:</span>
                <strong>${(selectedAsset.market_cap / 1e9).toFixed(2)}B</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

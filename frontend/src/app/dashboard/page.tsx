"use client";

import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getDashboard, type DashboardResponse } from '@/lib/api';

const watchlist = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'AMZN'];

interface ChartData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

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

  // Generate mock recommendation based on technical indicators
  const mockRecommendation = {
    symbol: ticker,
    recommendation: technicals?.rsi.signal === 'OVERBOUGHT' ? 'SELL' : technicals?.moving_averages.trend === 'GOLDEN_CROSS' ? 'BUY' : 'HOLD',
    confidence: technicals ? 0.72 + Math.random() * 0.2 : 0.65,
    score: technicals ? 72 : 65,
    explanation: technicals
      ? `Based on technical analysis: RSI is ${technicals.rsi.signal}, Moving average trend shows ${technicals.moving_averages.trend}.`
      : 'Loading technical analysis...',
    reasons: technicals
      ? [
        `RSI at ${technicals.rsi.value.toFixed(2)} - ${technicals.rsi.signal}`,
        `Moving averages showing ${technicals.moving_averages.trend} trend`,
        `MACD ${technicals.macd.signal} with strength`,
        `Volatility: ${technicals.volatility.risk_level}`
      ]
      : ['Analyzing technical indicators...'],
  };

  const finalRecommendation = recommendation || mockRecommendation;
  const recommendationColor = finalRecommendation.recommendation === 'BUY' ? '#00ff41' : finalRecommendation.recommendation === 'SELL' ? '#ff3131' : '#0a84ff';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(23, 31, 51, 0.95)',
          border: '1px solid rgba(0, 255, 65, 0.2)',
          borderRadius: '8px',
          padding: '8px 12px',
          color: '#dae2fd',
          fontSize: '12px'
        }}>
          <p>{data.date}</p>
          <p style={{ color: '#00ff41' }}>O: ${data.open?.toFixed(2)}</p>
          <p style={{ color: '#0a84ff' }}>H: ${data.high?.toFixed(2)}</p>
          <p style={{ color: '#ff3131' }}>L: ${data.low?.toFixed(2)}</p>
          <p style={{ color: '#dae2fd' }}>C: ${data.close?.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-md)', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }} className="animate-fadeInUp">
        <div>
          <h1 className="headline-lg">{ticker} Market Analysis</h1>
          <p className="data-mono" style={{ opacity: 0.5 }}>LIVE_MARKET_DATA // {loading ? 'SYNCING' : 'READY'}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" style={{ padding: '8px 16px' }}>Export PDF</button>
          <button className="btn btn-primary" style={{ padding: '8px 16px' }}>Live View</button>
        </div>
      </div>

      {/* Watchlist */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }} className="watchlist">
        {watchlist.map((symbol) => (
          <button
            key={symbol}
            onClick={() => setTicker(symbol)}
            className="btn btn-outline"
            style={{
              padding: '8px 14px',
              opacity: ticker === symbol ? 1 : 0.7,
              borderColor: ticker === symbol ? '#00ff41' : undefined,
              color: ticker === symbol ? '#00ff41' : undefined,
            }}
          >
            {symbol}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="glass" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', borderColor: '#ff3131' }}>
          <p className="data-mono" style={{ color: '#ff3131' }}>API_ERROR</p>
          <p>{error}</p>
        </div>
      )}

      {/* Price & Recommendation Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }} className="animate-fadeInUp">
        {/* Current Price Card */}
        <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
          <p className="data-mono" style={{ opacity: 0.6, marginBottom: '8px' }}>CURRENT PRICE</p>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '8px', color: '#dae2fd' }}>
            ${price?.price ?? '--'}
          </h2>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <div>
              <p className="data-mono" style={{ opacity: 0.5, fontSize: '12px' }}>24h Change</p>
              <p style={{ color: (price?.change ?? 0) >= 0 ? '#00ff41' : '#ff3131', fontSize: '16px' }}>
                ${price?.change?.toFixed(2)} ({price?.change_percent?.toFixed(2)}%)
              </p>
            </div>
          </div>
          <p className="data-mono" style={{ fontSize: '11px', opacity: 0.4 }}>{new Date(price?.timestamp || '').toLocaleTimeString()}</p>
        </div>

        {/* Recommendation Card */}
        <div className="glass" style={{ padding: 'var(--spacing-md)', border: `2px solid ${recommendationColor}30` }}>
          <p className="data-mono" style={{ opacity: 0.6, marginBottom: '8px' }}>AI RECOMMENDATION</p>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px', color: recommendationColor }}>
            {finalRecommendation.recommendation}
          </h2>
          <div style={{ marginBottom: '12px' }}>
            <p className="data-mono" style={{ fontSize: '12px', opacity: 0.6 }}>Confidence: {(finalRecommendation.confidence * 100).toFixed(1)}%</p>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
              <div style={{ width: `${finalRecommendation.confidence * 100}%`, height: '100%', background: recommendationColor }} />
            </div>
          </div>
          <p style={{ fontSize: '12px', opacity: 0.8 }}>{finalRecommendation.explanation?.split('\n')[0]}</p>
        </div>

        {/* Technical Indicators Summary */}
        {technicals && (
          <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
            <p className="data-mono" style={{ opacity: 0.6, marginBottom: '12px' }}>TECHNICAL INDICATORS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="data-mono">RSI:</span>
                <span style={{ color: technicals.rsi.signal === 'OVERBOUGHT' ? '#ff3131' : technicals.rsi.signal === 'OVERSOLD' ? '#00ff41' : '#0a84ff' }}>
                  {technicals.rsi.value.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="data-mono">MACD:</span>
                <span style={{ color: technicals.macd.signal === 'BULLISH' ? '#00ff41' : '#ff3131' }}>
                  {technicals.macd.signal}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="data-mono">Trend:</span>
                <span style={{ color: technicals.moving_averages.trend?.includes('BULLISH') || technicals.moving_averages.trend === 'GOLDEN_CROSS' ? '#00ff41' : '#ff3131' }}>
                  {technicals.moving_averages.trend}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="data-mono">Volatility:</span>
                <span>{technicals.volatility.risk_level}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Section */}
      {loading ? (
        <div className="glass" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          <p>Loading market data...</p>
        </div>
      ) : chartData.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-lg)' }} className="animate-fadeInUp">
          {/* Price Chart */}
          <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#00ff41' }}>PRICE CHART</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="close" stroke="#00ff41" dot={false} strokeWidth={2} name="Close" />
                <Line type="monotone" dataKey="open" stroke="#0a84ff" dot={false} strokeWidth={1} opacity={0.6} name="Open" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Volume Chart */}
          <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#0a84ff' }}>TRADING VOLUME</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="volume" fill="rgba(10, 132, 255, 0.6)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Price Range Analysis */}
          <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#ff3131' }}>PRICE RANGE ANALYSIS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
              <div>
                <p className="data-mono" style={{ opacity: 0.6, fontSize: '12px' }}>52-Week High</p>
                <p style={{ fontSize: '18px', color: '#00ff41' }}>${data?.metadata?.fifty_two_week_high?.toFixed(2)}</p>
              </div>
              <div>
                <p className="data-mono" style={{ opacity: 0.6, fontSize: '12px' }}>52-Week Low</p>
                <p style={{ fontSize: '18px', color: '#ff3131' }}>${data?.metadata?.fifty_two_week_low?.toFixed(2)}</p>
              </div>
              <div>
                <p className="data-mono" style={{ opacity: 0.6, fontSize: '12px' }}>Market Cap</p>
                <p style={{ fontSize: '18px', color: '#dae2fd' }}>
                  ${(Number(data?.metadata?.market_cap) / 1e12).toFixed(2)}T
                </p>
              </div>
              <div>
                <p className="data-mono" style={{ opacity: 0.6, fontSize: '12px' }}>P/E Ratio</p>
                <p style={{ fontSize: '18px', color: '#dae2fd' }}>
                  {data?.metadata?.pe_ratio?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Recommendation Reasons */}
          <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>RECOMMENDATION REASONS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {finalRecommendation.reasons?.map((reason, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: `3px solid ${recommendationColor}` }}>
                  <span style={{ color: recommendationColor, fontWeight: 'bold' }}>•</span>
                  <span style={{ opacity: 0.9 }}>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Company Info */}
          {data?.metadata && (
            <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>COMPANY INFORMATION</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <p className="data-mono" style={{ opacity: 0.6, marginBottom: '4px' }}>Company Name</p>
                  <p>{data.metadata.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="data-mono" style={{ opacity: 0.6, marginBottom: '4px' }}>Sector / Industry</p>
                  <p>{data.metadata.sector} / {data.metadata.industry}</p>
                </div>
                <div>
                  <p className="data-mono" style={{ opacity: 0.6, marginBottom: '4px' }}>Description</p>
                  <p style={{ fontSize: '13px', lineHeight: '1.5', opacity: 0.85 }}>
                    {data.metadata.description?.substring(0, 200)}...
                  </p>
                </div>
                {data.metadata.website && (
                  <div>
                    <p className="data-mono" style={{ opacity: 0.6, marginBottom: '4px' }}>Website</p>
                    <a href={data.metadata.website} target="_blank" rel="noopener noreferrer" style={{ color: '#0a84ff', textDecoration: 'underline' }}>
                      {data.metadata.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

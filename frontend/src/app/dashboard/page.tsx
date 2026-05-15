"use client";

import React, { useEffect, useState } from 'react';

import { getDashboard, type DashboardResponse } from '@/lib/api';

const watchlist = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'AMZN'];

export default function Dashboard() {
  const [ticker, setTicker] = useState('AAPL');
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const response = await getDashboard(ticker);
        if (active) {
          setData(response);
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
  const recommendation = data?.recommendation;

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }} className="animate-fadeInUp">
        <div>
          <h1 className="headline-lg">Market Terminal</h1>
          <p className="data-mono" style={{ opacity: 0.5 }}>LIVE_API_CONNECTED // {loading ? 'SYNCING' : 'READY'}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" style={{ padding: '8px 16px' }}>Export PDF</button>
          <button className="btn btn-primary" style={{ padding: '8px 16px' }}>Live View</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }} className="watchlist">
        {watchlist.map((symbol) => (
          <button
            key={symbol}
            onClick={() => setTicker(symbol)}
            className="btn btn-outline"
            style={{ padding: '8px 14px', opacity: ticker === symbol ? 1 : 0.7 }}
          >
            {symbol}
          </button>
        ))}
      </div>

      {error ? (
        <div className="glass" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', borderColor: 'var(--secondary)' }}>
          <p className="data-mono" style={{ color: 'var(--secondary)' }}>API_ERROR</p>
          <p>{error}</p>
        </div>
      ) : null}

      <div className="grid-dashboard animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
        <div className="glass" style={{ gridColumn: 'span 8', minHeight: '400px', padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
            <h2 className="label-md" style={{ color: 'var(--primary)' }}>{ticker} DASHBOARD</h2>
            <div className="data-mono">LIVE DATA</div>
          </div>
          <div style={{ flex: 1, border: '1px dashed var(--outline-variant)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', padding: 'var(--spacing-md)' }}>
            {loading ? (
              <div style={{ textAlign: 'center' }}>
                <div className="loading-spinner" />
                <p style={{ opacity: 0.6 }}>LOADING_API_RESPONSE</p>
              </div>
            ) : (
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                  <div>
                    <p className="data-mono" style={{ opacity: 0.6 }}>Current Price</p>
                    <h3 style={{ fontSize: '2rem' }}>${price?.price ?? '--'}</h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="data-mono" style={{ opacity: 0.6 }}>Recommendation</p>
                    <h3 style={{ color: recommendation?.recommendation === 'BUY' ? 'var(--primary)' : recommendation?.recommendation === 'SELL' ? 'var(--secondary)' : 'var(--tertiary)' }}>
                      {recommendation?.recommendation ?? '--'}
                    </h3>
                  </div>
                </div>
                <div className="glass-card" style={{ padding: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                  <p className="data-mono">Confidence: {recommendation?.confidence ?? '--'}</p>
                  <p>{recommendation?.explanation ?? 'Select a ticker to fetch backend-powered data.'}</p>
                </div>
                <div className="glass-card" style={{ padding: 'var(--spacing-sm)' }}>
                  <p className="data-mono">Sentiment</p>
                  <p>{data?.sentiment ? JSON.stringify(data.sentiment) : 'No sentiment loaded yet.'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="glass" style={{ gridColumn: 'span 4', padding: 'var(--spacing-md)' }}>
          <h2 className="label-md" style={{ marginBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--outline-variant)', paddingBottom: 'var(--spacing-xs)' }}>WATCHLIST_ALPHA</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', maxHeight: '400px', overflowY: 'auto' }}>
            {watchlist.map((symbol) => (
              <button
                key={symbol}
                onClick={() => setTicker(symbol)}
                className="glass-card"
                style={{ padding: 'var(--spacing-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: ticker === symbol ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{symbol}</div>
                  <div className="data-mono" style={{ fontSize: '12px', opacity: 0.5 }}>Backend linked</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="data-mono">{symbol === ticker && price ? `$${price.price}` : '...'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass" style={{ gridColumn: 'span 12', padding: 'var(--spacing-md)' }}>
          <h2 className="label-md" style={{ marginBottom: 'var(--spacing-md)' }}>NEURAL_INTELLIGENCE_STREAM</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
            <div style={{ borderLeft: '2px solid var(--primary)', paddingLeft: 'var(--spacing-sm)' }}>
              <p className="data-mono" style={{ fontSize: '12px', color: 'var(--primary)' }}>[API] PRICE</p>
              <p style={{ fontSize: '14px' }}>{price ? `${price.symbol} ${price.price} (${price.change_percent}%)` : 'Waiting for backend price data.'}</p>
            </div>
            <div style={{ borderLeft: '2px solid var(--tertiary)', paddingLeft: 'var(--spacing-sm)' }}>
              <p className="data-mono" style={{ fontSize: '12px', color: 'var(--tertiary)' }}>[API] SENTIMENT</p>
              <p style={{ fontSize: '14px' }}>{data?.sentiment ? 'Sentiment payload received from FastAPI.' : 'No sentiment payload yet.'}</p>
            </div>
            <div style={{ borderLeft: '2px solid var(--secondary)', paddingLeft: 'var(--spacing-sm)' }}>
              <p className="data-mono" style={{ fontSize: '12px', color: 'var(--secondary)' }}>[API] RECOMMENDATION</p>
              <p style={{ fontSize: '14px' }}>{recommendation?.recommendation ?? 'No recommendation yet.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

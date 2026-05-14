import React from 'react';

export default function Dashboard() {
  const stocks = [
    { symbol: 'NVDA', price: '924.79', change: '+2.4%', trend: 'up' },
    { symbol: 'AAPL', price: '189.45', change: '-0.8%', trend: 'down' },
    { symbol: 'TSLA', price: '175.22', change: '+1.2%', trend: 'up' },
    { symbol: 'MSFT', price: '420.55', change: '+0.5%', trend: 'up' },
    { symbol: 'AMZN', price: '183.15', change: '-1.4%', trend: 'down' },
  ];

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1 className="headline-lg">Market Terminal</h1>
          <p className="data-mono" style={{ opacity: 0.5 }}>CORE_SYSTEM_READY // LATENCY: 14ms</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button className="btn btn-outline" style={{ padding: '8px 16px' }}>Export PDF</button>
          <button className="btn btn-primary" style={{ padding: '8px 16px' }}>Live View</button>
        </div>
      </div>

      <div className="grid-dashboard">
        {/* Main Chart Area */}
        <div className="glass" style={{ gridColumn: 'span 8', minHeight: '400px', padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
            <h2 className="label-md" style={{ color: 'var(--primary)' }}>BTC/USD INDEXED</h2>
            <div className="data-mono">1H | 4H | 1D | 1W</div>
          </div>
          <div style={{ flex: 1, border: '1px dashed var(--outline-variant)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
             {/* Simulated Chart Placeholder */}
             <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '48px', color: 'var(--primary)', opacity: 0.3 }}>📈</div>
               <p style={{ opacity: 0.3 }}>ADVANCED_CHART_ENGINE_LOADING</p>
             </div>
          </div>
        </div>

        {/* Watchlist */}
        <div className="glass" style={{ gridColumn: 'span 4', padding: 'var(--spacing-md)' }}>
          <h2 className="label-md" style={{ marginBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--outline-variant)', paddingBottom: 'var(--spacing-xs)' }}>WATCHLIST_ALPHA</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {stocks.map(stock => (
              <div key={stock.symbol} className="glass-card" style={{ padding: 'var(--spacing-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{stock.symbol}</div>
                  <div className="data-mono" style={{ fontSize: '12px', opacity: 0.5 }}>NASDAQ</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="data-mono">${stock.price}</div>
                  <div className="data-mono" style={{ color: stock.trend === 'up' ? 'var(--primary)' : 'var(--secondary)', fontSize: '12px' }}>
                    {stock.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence Feed */}
        <div className="glass" style={{ gridColumn: 'span 12', padding: 'var(--spacing-md)' }}>
          <h2 className="label-md" style={{ marginBottom: 'var(--spacing-md)' }}>NEURAL_INTELLIGENCE_STREAM</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
             <div style={{ borderLeft: '2px solid var(--primary)', paddingLeft: 'var(--spacing-sm)' }}>
                <p className="data-mono" style={{ fontSize: '12px', color: 'var(--primary)' }}>[08:42:01] ALERT</p>
                <p style={{ fontSize: '14px' }}>Whale activity detected on $NVDA options. Institutional accumulation likely.</p>
             </div>
             <div style={{ borderLeft: '2px solid var(--tertiary)', paddingLeft: 'var(--spacing-sm)' }}>
                <p className="data-mono" style={{ fontSize: '12px', color: 'var(--tertiary)' }}>[08:45:15] SENTIMENT</p>
                <p style={{ fontSize: '14px' }}>Fed Chair speech scheduled for 10:00 AM. Market pricing in hawkish tone.</p>
             </div>
             <div style={{ borderLeft: '2px solid var(--secondary)', paddingLeft: 'var(--spacing-sm)' }}>
                <p className="data-mono" style={{ fontSize: '12px', color: 'var(--secondary)' }}>[08:51:30] RISK</p>
                <p style={{ fontSize: '14px' }}>Global tech sector correlation increasing. Diversification score dropping.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

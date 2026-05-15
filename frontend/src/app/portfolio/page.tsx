import React from 'react';

export default function Portfolio() {
  const mockHoldings = [
    { symbol: 'AAPL', quantity: 10, entry_price: 150, current_price: 298.21, pnl: 1482.1, pnl_percent: 98.8 },
    { symbol: 'MSFT', quantity: 5, entry_price: 300, current_price: 420, pnl: 600, pnl_percent: 40 },
    { symbol: 'TSLA', quantity: 8, entry_price: 200, current_price: 443.3, pnl: 1946.4, pnl_percent: 121.6 },
  ];

  const mockWatchlist = ['NVDA', 'AMZN', 'GOOGL'];

  const totalInvested = mockHoldings.reduce((sum, h) => sum + h.quantity * h.entry_price, 0);
  const totalValue = mockHoldings.reduce((sum, h) => sum + h.quantity * h.current_price, 0);
  const totalPnL = totalValue - totalInvested;
  const totalPnLPercent = (totalPnL / totalInvested) * 100;

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-md)', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }} className="animate-fadeInUp">
        <h1 className="headline-lg">Portfolio Management</h1>
        <p className="data-mono" style={{ opacity: 0.5 }}>Track and manage your investments</p>
      </div>

      {/* Portfolio Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
        }}
        className="animate-fadeInUp"
      >
        <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
          <p className="data-mono" style={{ opacity: 0.6, marginBottom: '8px' }}>TOTAL INVESTED</p>
          <h2 style={{ fontSize: '2rem', color: '#dae2fd' }}>${totalInvested.toFixed(0)}</h2>
          <p style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>3 holdings</p>
        </div>
        <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
          <p className="data-mono" style={{ opacity: 0.6, marginBottom: '8px' }}>CURRENT VALUE</p>
          <h2 style={{ fontSize: '2rem', color: '#0a84ff' }}>${totalValue.toFixed(0)}</h2>
          <p style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>Real-time update</p>
        </div>
        <div className="glass" style={{ padding: 'var(--spacing-md)', border: `2px solid ${totalPnL >= 0 ? '#00ff41' : '#ff3131'}30` }}>
          <p className="data-mono" style={{ opacity: 0.6, marginBottom: '8px' }}>TOTAL P&L</p>
          <h2 style={{ fontSize: '2rem', color: totalPnL >= 0 ? '#00ff41' : '#ff3131' }}>
            ${totalPnL.toFixed(0)} ({totalPnLPercent.toFixed(2)}%)
          </h2>
          <p style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>
            {totalPnL >= 0 ? '✓ Gains' : '✗ Losses'}
          </p>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="glass" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#00ff41' }}>ACTIVE HOLDINGS</h3>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(0,255,65,0.3)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#00ff41', fontWeight: 'bold' }}>Symbol</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#00ff41', fontWeight: 'bold' }}>Qty</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#00ff41', fontWeight: 'bold' }}>Entry Price</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#00ff41', fontWeight: 'bold' }}>Current</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#00ff41', fontWeight: 'bold' }}>Value</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#00ff41', fontWeight: 'bold' }}>P&L</th>
              </tr>
            </thead>
            <tbody>
              {mockHoldings.map((holding) => (
                <tr key={holding.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#dae2fd' }}>{holding.symbol}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#dae2fd' }}>{holding.quantity}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#dae2fd' }}>
                    ${holding.entry_price.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#0a84ff' }}>
                    ${holding.current_price.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#dae2fd' }}>
                    ${(holding.quantity * holding.current_price).toFixed(0)}
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      color: holding.pnl >= 0 ? '#00ff41' : '#ff3131',
                      fontWeight: 'bold',
                    }}
                  >
                    {holding.pnl >= 0 ? '+' : ''}${holding.pnl.toFixed(0)} ({holding.pnl_percent.toFixed(1)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Watchlist & Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
        <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#00ff41' }}>WATCHLIST</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {mockWatchlist.map((symbol) => (
              <button
                key={symbol}
                className="glass"
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid rgba(0,255,65,0.3)',
                  cursor: 'pointer',
                  color: '#dae2fd',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  transition: 'all 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00ff41';
                  e.currentTarget.style.color = '#00ff41';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,255,65,0.3)';
                  e.currentTarget.style.color = '#dae2fd';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>

        <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#00ff41' }}>PORTFOLIO METRICS</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="data-mono" style={{ opacity: 0.6 }}>Return on Investment</span>
              <span style={{ color: '#00ff41', fontWeight: 'bold' }}>{totalPnLPercent.toFixed(2)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="data-mono" style={{ opacity: 0.6 }}>Diversification</span>
              <span style={{ color: '#0a84ff', fontWeight: 'bold' }}>3 Sectors</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="data-mono" style={{ opacity: 0.6 }}>Risk Level</span>
              <span style={{ color: '#ff3131', fontWeight: 'bold' }}>Medium-High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import MainLayout from '@/components/MainLayout';

export default function MarketMapPage() {
  return (
    <MainLayout>
      <div className="p-margin-desktop space-y-md w-full">
        {/* Header */}
        <div className="mb-lg">
          <h1 className="font-headline-lg text-headline-lg text-primary-fixed mb-xs">
            Market Map
          </h1>
          <p className="text-on-surface-variant font-body-md">
            Sector and market overview with correlation analysis.
          </p>
        </div>

        {/* Market Sectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {[
            { name: 'Technology', change: '+2.34%', stocks: 'NVDA, AAPL, MSFT' },
            { name: 'Healthcare', change: '+1.12%', stocks: 'JNJ, UNH, PFE' },
            { name: 'Financials', change: '-0.45%', stocks: 'JPM, BLK, GS' },
            { name: 'Energy', change: '+1.89%', stocks: 'XOM, CVX, COP' },
            { name: 'Consumer', change: '+0.78%', stocks: 'AMZN, WMT, MCD' },
            { name: 'Industrials', change: '+1.23%', stocks: 'BA, CAT, DE' },
          ].map((sector) => (
            <div
              key={sector.name}
              className="glass p-md rounded-xl border-l-4 border-primary-fixed hover:border-primary-fixed-dim transition-colors"
            >
              <div className="flex justify-between items-start mb-md">
                <h3 className="font-label-md text-on-surface uppercase">{sector.name}</h3>
                <span
                  className={`font-data-mono text-headline-lg-mobile font-label-md ${
                    sector.change.startsWith('+')
                      ? 'text-primary-fixed'
                      : 'text-secondary'
                  }`}
                >
                  {sector.change}
                </span>
              </div>
              <p className="text-label-sm text-on-surface-variant">{sector.stocks}</p>
            </div>
          ))}
        </div>

        {/* Correlation Heatmap */}
        <div className="glass p-md rounded-xl">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md">
            Market Correlations
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-md py-sm text-left font-label-md text-on-surface-variant">Pair</th>
                  <th className="px-md py-sm text-center font-label-md text-on-surface-variant">Correlation</th>
                  <th className="px-md py-sm text-left font-label-md text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { pair: 'SPY / QQQ', corr: 0.92, status: 'High Positive' },
                  { pair: 'TLT / SPY', corr: -0.68, status: 'Negative' },
                  { pair: 'GLD / SPY', corr: -0.15, status: 'Low Negative' },
                  { pair: 'DXY / SPY', corr: -0.45, status: 'Moderate Negative' },
                  { pair: 'VIX / SPY', corr: -0.89, status: 'High Negative' },
                ].map((row) => (
                  <tr
                    key={row.pair}
                    className="border-b border-outline-variant/10 hover:bg-surface-variant/20"
                  >
                    <td className="px-md py-sm font-label-md text-on-surface">
                      {row.pair}
                    </td>
                    <td className="px-md py-sm text-center">
                      <div className="inline-flex items-center gap-sm">
                        <div className="w-24 h-2 bg-surface-container-low rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              row.corr > 0
                                ? 'bg-primary-fixed-dim'
                                : 'bg-secondary'
                            }`}
                            style={{
                              width: `${Math.abs(row.corr) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="font-data-mono text-on-surface text-sm">
                          {row.corr.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-md py-sm text-label-sm text-on-surface-variant">
                      {row.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Breadth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="glass p-md rounded-xl">
            <h3 className="font-headline-lg text-headline-lg text-on-surface mb-md">
              Breadth Indicators
            </h3>
            <div className="space-y-md">
              <div>
                <div className="flex justify-between mb-sm">
                  <span className="font-label-md text-on-surface-variant">Advances / Declines</span>
                  <span className="font-data-mono text-on-surface">3.2:1</span>
                </div>
                <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-primary-fixed-dim rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-sm">
                  <span className="font-label-md text-on-surface-variant">New 52W Highs</span>
                  <span className="font-data-mono text-on-surface">248</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-sm">
                  <span className="font-label-md text-on-surface-variant">New 52W Lows</span>
                  <span className="font-data-mono text-secondary">32</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-md rounded-xl">
            <h3 className="font-headline-lg text-headline-lg text-on-surface mb-md">
              Market Health
            </h3>
            <div className="space-y-md">
              <div className="flex items-center justify-between p-sm bg-surface-container/30 rounded">
                <span className="font-label-md text-on-surface">Overall Trend</span>
                <span className="px-sm py-1 bg-on-primary-container/20 text-on-primary-container text-label-sm rounded font-label-md">
                  BULLISH
                </span>
              </div>
              <div className="flex items-center justify-between p-sm bg-surface-container/30 rounded">
                <span className="font-label-md text-on-surface">Market Volatility</span>
                <span className="px-sm py-1 bg-tertiary-container/20 text-tertiary-fixed-dim text-label-sm rounded font-label-md">
                  MODERATE
                </span>
              </div>
              <div className="flex items-center justify-between p-sm bg-surface-container/30 rounded">
                <span className="font-label-md text-on-surface">Sentiment</span>
                <span className="px-sm py-1 bg-primary-container/20 text-primary-fixed text-label-sm rounded font-label-md">
                  78% Bullish
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

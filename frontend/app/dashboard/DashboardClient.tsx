'use client';

import MainLayout from '@/components/MainLayout';
import GlassCard from '@/components/GlassCard';
import AISignalCard from '@/components/AISignalCard';
import { useState } from 'react';

export default function DashboardClient({ initialSignals, initialWatchlist, initialHoldings }: { 
  initialSignals: any[], 
  initialWatchlist: any[], 
  initialHoldings: any[] 
}) {
  const [watchlist, setWatchlist] = useState(initialWatchlist);

  return (
    <div className="p-margin-desktop space-y-md w-full">
      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-gutter">
        <GlassCard label="S&P 500" value="5,248.40" change="1.24%" changeColor="positive">
          <svg className="w-full h-full stroke-primary-fixed-dim fill-none stroke-2" viewBox="0 0 100 30">
            <path d="M0,25 Q10,20 20,22 T40,15 T60,18 T80,5 T100,10"></path>
          </svg>
        </GlassCard>

        <GlassCard label="NASDAQ" value="16,428.82" change="0.85%" changeColor="positive">
          <svg className="w-full h-full stroke-primary-fixed-dim fill-none stroke-2" viewBox="0 0 100 30">
            <path d="M0,20 Q15,25 30,15 T60,10 T80,12 T100,2"></path>
          </svg>
        </GlassCard>

        <GlassCard label="BTC / USD" value="$68,241.10" change="2.10%" changeColor="negative">
          <svg className="w-full h-full stroke-secondary fill-none stroke-2" viewBox="0 0 100 30">
            <path d="M0,5 Q20,10 40,25 T60,20 T80,28 T100,22"></path>
          </svg>
        </GlassCard>

        <GlassCard label="TSLA" value="$175.40" change="4.32%" changeColor="positive" highlight={true}>
          <svg className="w-full h-full stroke-primary-fixed-dim fill-none stroke-2" viewBox="0 0 100 30">
            <path d="M0,28 L10,25 L20,18 L30,22 L40,12 L50,15 L60,8 L70,10 L80,2 L100,5"></path>
          </svg>
        </GlassCard>

        <GlassCard label="NVDA" value="$912.45" change="2.15%" changeColor="positive">
          <svg className="w-full h-full stroke-primary-fixed-dim fill-none stroke-2" viewBox="0 0 100 30">
            <path d="M0,15 Q25,5 50,10 T100,2"></path>
          </svg>
        </GlassCard>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-md h-full pb-xl">
        {/* Chart & Sentiment Section */}
        <div className="col-span-12 xl:col-span-8 space-y-md">
          {/* Trading Chart */}
          <div className="glass rounded-xl overflow-hidden trading-chart-bg relative min-h-[450px] flex flex-col p-md">
            <div className="flex justify-between items-center mb-md z-10">
              <div className="flex items-center gap-md">
                <div className="flex flex-col">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">Tesla Inc. (TSLA)</h2>
                  <span className="font-label-sm text-on-surface-variant">NASDAQ • Real-time</span>
                </div>
                <div className="flex gap-xs bg-surface-container-high p-xs rounded-lg">
                  <button className="px-sm py-1 font-label-sm text-on-surface-variant hover:text-on-surface rounded transition-colors">1M</button>
                  <button className="px-sm py-1 font-label-sm text-on-surface-variant hover:text-on-surface rounded transition-colors">1H</button>
                  <button className="px-sm py-1 font-label-sm bg-primary-container text-on-primary-container rounded">4H</button>
                  <button className="px-sm py-1 font-label-sm text-on-surface-variant hover:text-on-surface rounded transition-colors">1D</button>
                </div>
              </div>
              <div className="flex gap-sm">
                <button className="material-symbols-outlined p-xs glass rounded-lg text-on-surface-variant hover:text-primary-fixed">add_chart</button>
                <button className="material-symbols-outlined p-xs glass rounded-lg text-on-surface-variant hover:text-primary-fixed">auto_graph</button>
              </div>
            </div>

            {/* Candlesticks Visualization */}
            <div className="flex-1 w-full relative flex items-end gap-1">
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-[2px] h-32 bg-secondary opacity-30"></div>
                <div className="w-2 md:w-3 h-20 bg-secondary-container rounded-sm shadow-[0_0_8px_rgba(211,0,23,0.3)]"></div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-[2px] h-40 bg-primary-fixed-dim opacity-30"></div>
                <div className="w-2 md:w-3 h-24 bg-on-primary-container rounded-sm shadow-[0_0_8px_rgba(0,230,57,0.3)]"></div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-[2px] h-24 bg-primary-fixed-dim opacity-30"></div>
                <div className="w-2 md:w-3 h-32 bg-on-primary-container rounded-sm shadow-[0_0_8px_rgba(0,230,57,0.3)]"></div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-[2px] h-20 bg-secondary opacity-30"></div>
                <div className="w-2 md:w-3 h-12 bg-secondary-container rounded-sm shadow-[0_0_8px_rgba(211,0,23,0.3)]"></div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-[2px] h-44 bg-primary-fixed-dim opacity-30"></div>
                <div className="w-2 md:w-3 h-36 bg-on-primary-container rounded-sm shadow-[0_0_8px_rgba(0,230,57,0.3)]"></div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-[2px] h-48 bg-primary-fixed-dim opacity-30"></div>
                <div className="w-2 md:w-3 h-40 bg-on-primary-container rounded-sm shadow-[0_0_8px_rgba(0,230,57,0.3)]"></div>
              </div>

              <div className="absolute bottom-md right-md flex flex-col items-end">
                <span className="text-primary-fixed-dim font-headline-lg">175.40</span>
                <div className="h-[1px] w-48 bg-primary-fixed-dim/20 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-fixed-dim shadow-[0_0_10px_rgba(0,230,57,0.8)]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment and Watchlist Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {/* News Sentiment */}
            <div className="glass p-md rounded-xl space-y-md">
              <div className="flex justify-between items-center">
                <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-widest">Sentiment Stream</h3>
                <span className="material-symbols-outlined text-primary-fixed-dim">analytics</span>
              </div>
              <div className="space-y-sm">
                <div className="p-sm bg-surface-container rounded-lg border-l-2 border-primary-fixed-dim">
                  <div className="flex justify-between items-center mb-xs">
                    <span className="font-label-sm text-primary-fixed-dim uppercase">Bullish</span>
                    <span className="font-data-mono text-xs text-on-surface-variant">2m ago</span>
                  </div>
                  <p className="text-body-md text-on-surface leading-tight">
                    Institutional buy volume for TSLA spikes after FSD V12 rollout enthusiasm...
                  </p>
                </div>
                <div className="p-sm bg-surface-container rounded-lg border-l-2 border-secondary">
                  <div className="flex justify-between items-center mb-xs">
                    <span className="font-label-sm text-secondary uppercase">Bearish</span>
                    <span className="font-data-mono text-xs text-on-surface-variant">15m ago</span>
                  </div>
                  <p className="text-body-md text-on-surface leading-tight">
                    Macro concerns regarding EV demand in China weigh on immediate outlook...
                  </p>
                </div>
              </div>
            </div>

            {/* Watchlist */}
            <div className="glass p-md rounded-xl space-y-md">
              <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-widest">Watchlist Active</h3>
              <div className="space-y-xs">
                {watchlist.length > 0 ? watchlist.map((item) => (
                  <div key={item.symbol} className="flex items-center justify-between p-xs hover:bg-surface-variant/30 rounded transition-colors cursor-pointer">
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center font-bold text-xs text-on-surface">
                        {item.symbol}
                      </div>
                      <span className="font-label-md">{item.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-data-mono text-label-md">--</div>
                      <div className="text-primary-fixed-dim text-xs">0.00%</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-md text-on-surface-variant font-label-sm">
                    No items in watchlist.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="col-span-12 xl:col-span-4 space-y-md">
          {initialSignals.map((signal, idx) => (
            <AISignalCard
              key={signal.id}
              symbol={signal.symbol}
              signal={signal.signal}
              confidence={signal.confidence}
              description={`Target price set at ${signal.priceTarget || 'N/A'}`}
              highlight={idx === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

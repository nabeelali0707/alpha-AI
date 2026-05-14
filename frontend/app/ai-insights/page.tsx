'use client';

import MainLayout from '@/components/MainLayout';
import AISignalCard from '@/components/AISignalCard';

export default function AIInsightsPage() {
  return (
    <MainLayout>
      <div className="p-margin-desktop space-y-md w-full">
        {/* Header */}
        <div className="mb-lg">
          <h1 className="font-headline-lg text-headline-lg text-primary-fixed mb-xs">
            AI Insights Terminal
          </h1>
          <p className="text-on-surface-variant font-body-md">
            Real-time intelligence feeds powered by neural core analysis.
          </p>
        </div>

        {/* Active Signals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          <AISignalCard
            symbol="NVIDIA"
            signal="BUY"
            confidence={89}
            description="Trend continuation probability high. Developer forum mentions surge detected."
          />

          <AISignalCard
            symbol="APPLE"
            signal="HOLD"
            confidence={72}
            description="Supply chain delays detected. Waiting for Q3 earnings catalyst."
          />

          <AISignalCard
            symbol="TESLA"
            signal="SELL"
            confidence={65}
            description="Macro headwinds intensifying. Technical support breakdown likely."
          />

          <AISignalCard
            symbol="AMAZON"
            signal="BUY"
            confidence={85}
            description="Cloud revenue growth trajectory strong. Institutional accumulation detected."
          />

          <AISignalCard
            symbol="META"
            signal="BUY"
            confidence={78}
            description="AI infrastructure spending narrative positive. Analyst upgrades incoming."
          />

          <AISignalCard
            symbol="BERKSHIRE"
            signal="HOLD"
            confidence={68}
            description="Dividend discount model fair value reached. Consolidation phase ongoing."
          />
        </div>

        {/* Analysis Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md mt-lg">
          <div className="lg:col-span-2 glass p-md rounded-xl">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md">
              Market Analysis
            </h2>
            <div className="space-y-md">
              <div className="border-l-4 border-primary-fixed pl-md">
                <h3 className="font-label-md text-primary-fixed mb-xs uppercase">Bullish Signals</h3>
                <p className="text-body-md text-on-surface-variant">
                  Tech sector showing renewed strength with large institutional accumulation detected across mega-cap names. Sentiment indicators remain elevated at 78% bullish.
                </p>
              </div>
              <div className="border-l-4 border-secondary pl-md">
                <h3 className="font-label-md text-secondary mb-xs uppercase">Risk Factors</h3>
                <p className="text-body-md text-on-surface-variant">
                  Macroeconomic uncertainty persists. Fed rate decision timeline remains key catalyst. VIX elevated at 16.2, suggesting market caution.
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="glass p-md rounded-xl">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md">
              Model Stats
            </h2>
            <div className="space-y-md text-center">
              <div>
                <span className="text-data-mono font-data-mono text-primary-fixed text-headline-lg block">
                  94.2%
                </span>
                <span className="font-label-sm text-on-surface-variant">Win Rate</span>
              </div>
              <div className="border-y border-outline-variant/20 py-md">
                <span className="text-data-mono font-data-mono text-on-surface text-headline-lg block">
                  2.3:1
                </span>
                <span className="font-label-sm text-on-surface-variant">Risk/Reward Ratio</span>
              </div>
              <div>
                <span className="text-data-mono font-data-mono text-primary-fixed text-headline-lg block">
                  +28.7%
                </span>
                <span className="font-label-sm text-on-surface-variant">YTD Return</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

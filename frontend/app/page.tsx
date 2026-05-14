'use client';

import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';

export default function Home() {
  return (
    <>
      <TopNavBar />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-[921px] flex items-center justify-center overflow-hidden px-margin-mobile md:px-margin-desktop pt-[72px]">
          <div className="absolute inset-0 z-0 trading-chart-bg" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background z-10"></div>

          <div className="relative z-20 max-w-4xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-xs bg-primary-container/10 border border-primary-fixed/20 px-md py-xs rounded-full mb-lg backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></span>
              <span className="text-primary-fixed font-label-md text-label-md uppercase tracking-widest">
                v2.4 Neural Core Active
              </span>
            </div>

            <h1 className="font-headline-xl text-headline-xl md:text-[80px] leading-tight mb-md text-on-surface drop-shadow-2xl">
              AI-Powered <span className="text-primary-fixed">Stock Market</span> Insights
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant mb-xl max-w-2xl mx-auto">
              Decode complex market patterns with AlphaAI's neural engine. Real-time sentiment analysis and predictive trends at the speed of institutional trading.
            </p>

            <div className="flex flex-col md:flex-row gap-md w-full md:w-auto">
              <Link
                href="/dashboard"
                className="bg-primary-container text-on-primary-container px-xl py-md rounded-lg font-label-md text-label-md font-bold flex items-center justify-center gap-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary-container/20"
              >
                Get Started <span className="material-symbols-outlined">rocket_launch</span>
              </Link>
              <Link
                href="/dashboard"
                className="bg-surface-container/40 backdrop-blur-xl border border-outline-variant/30 text-primary-fixed-dim px-xl py-md rounded-lg font-label-md text-label-md font-bold hover:bg-surface-variant/30 active:scale-95 transition-all"
              >
                View Dashboard
              </Link>
            </div>
          </div>

          {/* Floating Widgets */}
          <div className="hidden lg:block absolute left-margin-desktop top-1/2 -translate-y-1/2 glass-card p-md rounded-xl neon-glow-green w-64 animate-bounce-slow">
            <div className="flex justify-between items-center mb-base">
              <span className="text-label-sm font-label-sm text-on-surface-variant">BTC/USD</span>
              <span className="text-primary-fixed-dim text-data-mono font-data-mono">+4.2%</span>
            </div>
            <div className="h-16 w-full bg-surface-container-highest/30 rounded flex items-end gap-1 px-xs overflow-hidden">
              <div className="w-full bg-primary-fixed-dim/40 h-[20%]"></div>
              <div className="w-full bg-primary-fixed-dim/60 h-[40%]"></div>
              <div className="w-full bg-primary-fixed-dim/80 h-[35%]"></div>
              <div className="w-full bg-primary-fixed-dim h-[70%]"></div>
              <div className="w-full bg-primary-fixed-dim h-[90%]"></div>
            </div>
          </div>

          <div className="hidden lg:block absolute right-margin-desktop top-1/3 glass-card p-md rounded-xl border-l-4 border-secondary-fixed w-72">
            <div className="flex items-center gap-sm mb-base">
              <span className="material-symbols-outlined text-secondary filled" style={{fontVariationSettings: "'FILL' 1"}}>warning</span>
              <span className="text-label-md font-label-md text-secondary">Sell Signal Detected</span>
            </div>
            <p className="text-label-sm font-label-sm text-on-surface-variant">
              Neural core suggests volatility increase in Tech sector over next 14h.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-xl px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
          <h2 className="font-headline-lg text-headline-lg md:text-headline-xl text-center mb-xl">
            Institutional Grade <span className="text-primary-fixed">Intelligence</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {/* Sentiment Analysis Card */}
            <div className="md:col-span-8 glass-card p-lg rounded-xl flex flex-col justify-end min-h-[320px] group hover:border-primary-fixed/40 transition-colors">
              <div className="mb-auto flex items-start justify-between">
                <div className="p-base bg-primary-container/10 rounded-lg text-primary-fixed">
                  <span className="material-symbols-outlined text-[40px]">psychology</span>
                </div>
                <div className="text-right">
                  <span className="text-data-mono font-data-mono text-primary-fixed-dim text-[32px]">
                    98.2%
                  </span>
                  <p className="text-label-sm font-label-sm text-on-surface-variant">Model Accuracy</p>
                </div>
              </div>
              <div>
                <h3 className="font-headline-lg text-headline-lg mb-base">Sentiment Analysis</h3>
                <p className="text-on-surface-variant font-body-md text-body-md max-w-lg">
                  Our NLP engine processes millions of data points from news, social media, and earnings calls to gauge true market sentiment before the tape moves.
                </p>
              </div>
            </div>

            {/* Predictive Trends Card */}
            <div className="md:col-span-4 glass-card p-lg rounded-xl flex flex-col justify-between hover:border-primary-fixed/40 transition-colors">
              <div className="p-base bg-secondary-container/10 rounded-lg text-secondary w-fit">
                <span className="material-symbols-outlined text-[40px]">show_chart</span>
              </div>
              <div>
                <h3 className="font-headline-lg text-headline-lg mb-base">Predictive Trends</h3>
                <p className="text-on-surface-variant font-body-md text-body-md">
                  Identify momentum shifts using deep-learning time series forecasting models.
                </p>
              </div>
            </div>

            {/* Risk Guard Card */}
            <div className="md:col-span-4 glass-card p-lg rounded-xl flex flex-col justify-between hover:border-primary-fixed/40 transition-colors">
              <div className="p-base bg-primary-container/10 rounded-lg text-primary-fixed w-fit">
                <span className="material-symbols-outlined text-[40px]">shield</span>
              </div>
              <div>
                <h3 className="font-headline-lg text-headline-lg mb-base">Risk Guard</h3>
                <p className="text-on-surface-variant font-body-md text-body-md">
                  Automated exposure monitoring and volatility-adjusted position sizing suggestions.
                </p>
              </div>
            </div>

            {/* Real-time Analytics Card */}
            <div className="md:col-span-8 glass-card p-lg rounded-xl flex flex-col md:flex-row gap-lg items-center hover:border-primary-fixed/40 transition-colors overflow-hidden">
              <div className="flex-1">
                <h3 className="font-headline-lg text-headline-lg mb-base">Real-time Analytics</h3>
                <p className="text-on-surface-variant font-body-md text-body-md mb-md">
                  Low-latency data pipelines ensure you see market movements as they happen, not after.
                </p>
                <ul className="space-y-xs">
                  <li className="flex items-center gap-xs text-label-md font-label-md text-primary-fixed">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    50ms Data Refresh
                  </li>
                  <li className="flex items-center gap-xs text-label-md font-label-md text-primary-fixed">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Multi-Exchange API
                  </li>
                </ul>
              </div>
              <div className="flex-1 w-full h-48 bg-surface-container-highest/20 rounded-lg relative border border-outline-variant/30">
                <div className="absolute inset-0 p-md flex items-center justify-center">
                  <img
                    className="w-full h-full object-cover rounded opacity-40 mix-blend-screen"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMStDcjwSdVJTznvSkTtR_3ZnVwCt18szeLUeom3k9HtkdwE_DaxJS54NNhWsfC83t2cVcpPAJItGfPRAqKClpTL6zV1CueHEmpm0AYadaxOEzLAWCfN7Avu_8p0cEyZfOiM1iA4cvVY4TmU-NZafiknkKTk14gDf0VgpKNybIT_-Mafrb6x64bJbM30XCU6f-9ylKf4FrQLWVmBojjbmjNmjitt5PJ6YvRepBSVkSRMpa0sTpc95q3UAriJ4na26SELl_Luo_upE"
                    alt="Dashboard"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Insights Showcase */}
        <section className="py-xl bg-surface-container-lowest/50 relative overflow-hidden">
          <div className="absolute -top-48 -right-48 w-96 h-96 bg-primary-container/5 rounded-full blur-[100px]"></div>
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="flex flex-col md:flex-row justify-between items-end mb-xl gap-md">
              <div>
                <h2 className="font-headline-lg text-headline-lg md:text-headline-xl mb-sm">
                  AI Insights <span className="text-primary-fixed">Terminal</span>
                </h2>
                <p className="text-on-surface-variant font-body-lg text-body-lg">
                  AlphaAI's core intelligence feeds, updated in real-time.
                </p>
              </div>
              <Link
                href="/ai-insights"
                className="flex items-center gap-xs text-primary-fixed hover:underline font-label-md text-label-md"
              >
                Enter Neural Terminal <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

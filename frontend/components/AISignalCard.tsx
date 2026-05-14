interface AISignalCardProps {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  description?: string;
}

export default function AISignalCard({
  symbol,
  signal,
  confidence,
  description,
}: AISignalCardProps) {
  const signalColors = {
    BUY: 'bg-on-primary-container text-primary',
    SELL: 'bg-secondary text-on-surface',
    HOLD: 'bg-surface-container-high text-on-surface-variant',
  };

  return (
    <div className="bg-surface-container-high rounded-xl p-md border border-primary-fixed/30 shadow-[0_0_30px_rgba(0,230,57,0.15)] space-y-lg relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-fixed/10 blur-3xl rounded-full"></div>

      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-xs">
          <div className="flex items-center gap-xs">
            <span
              className="material-symbols-outlined text-primary-fixed-dim animate-pulse filled"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
            <span className="font-label-sm text-primary-fixed-dim uppercase tracking-[0.2em]">
              Live Alpha Signal
            </span>
          </div>
          <h3 className="font-headline-lg text-headline-lg text-on-surface">{symbol}</h3>
        </div>
        <div
          className={`${signalColors[signal]} px-md py-sm rounded-lg font-bold text-headline-lg-mobile shadow-[0_0_20px_rgba(0,230,57,0.4)]`}
        >
          {signal}
        </div>
      </div>

      <div className="space-y-sm relative z-10">
        <div className="flex justify-between items-center">
          <span className="font-label-sm text-on-surface-variant">Alpha Confidence</span>
          <span className="font-headline-lg text-primary-fixed">{confidence}%</span>
        </div>

        {description && (
          <p className="text-body-md text-on-surface-variant font-body-md">
            {description}
          </p>
        )}

        <div className="w-full bg-surface-container-low rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary-fixed-dim h-full transition-all duration-300"
            style={{ width: `${confidence}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

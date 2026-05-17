import React from "react";

interface FearGreedGaugeProps {
  value: number; // 0 to 100
  classification: string;
  explanation: string;
  loading?: boolean;
}

const FearGreedGauge: React.FC<FearGreedGaugeProps> = ({
  value,
  classification,
  explanation,
  loading = false,
}) => {
  // Map value (0-100) to rotation angle (-90deg to +90deg)
  const angle = (value / 100) * 180 - 90;

  // Determine sentiment color
  const getColor = (cls: string) => {
    const c = cls.toLowerCase();
    if (c.includes("extreme fear")) return "#ff3131"; // Crimson Red
    if (c.includes("fear")) return "#ff8a00"; // Orange
    if (c.includes("extreme greed")) return "#00ff41"; // Neon Green
    if (c.includes("greed")) return "#99ff33"; // Lime Green
    return "#ffea00"; // Electric Yellow (Neutral)
  };

  const color = getColor(classification);

  return (
    <div className="glass-card flex flex-col items-center justify-center rounded-[1rem] border border-white/10 bg-[#070b19b0] p-6 shadow-glow relative overflow-hidden">
      {loading ? (
        <div className="flex h-[220px] flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-green mb-4" />
          <p className="data-mono text-[10px] text-text-secondary tracking-widest uppercase">
            CALCULATING MARKET HEAT...
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 data-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-text-secondary">
            FEAR & GREED INDEX
          </p>
          
          <div className="relative flex h-[120px] w-[220px] items-end justify-center overflow-hidden">
            <svg width="200" height="100" className="overflow-visible">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff3131" />
                  <stop offset="25%" stopColor="#ff8a00" />
                  <stop offset="50%" stopColor="#ffea00" />
                  <stop offset="75%" stopColor="#99ff33" />
                  <stop offset="100%" stopColor="#00ff41" />
                </linearGradient>
              </defs>
              
              {/* Background Track */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              
              {/* Filled Spectrum */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.8"
              />
              
              {/* Central Pin */}
              <circle cx="100" cy="100" r="7" fill="#ffffff" />
            </svg>
            
            {/* Index Needle */}
            <div
              className="absolute bottom-0 left-1/2 h-[75px] w-[3px] origin-bottom -translate-x-1/2 transition-transform duration-1000 ease-out"
              style={{
                transform: `translateX(-50%) rotate(${angle}deg)`,
                backgroundColor: "#ffffff",
                borderTopLeftRadius: "3px",
                borderTopRightRadius: "3px",
                boxShadow: "0 0 12px rgba(255, 255, 255, 0.7)",
              }}
            />
          </div>

          <div className="mt-4 text-center">
            <span className="text-4xl font-extrabold text-white tracking-tight">{value}</span>
            <div
              className="mt-1 text-sm font-bold uppercase tracking-wider transition-colors duration-500"
              style={{ color }}
            >
              {classification}
            </div>
            {explanation && (
              <p className="mt-3 text-xs leading-relaxed text-[#8a99ad] max-w-[260px] mx-auto border-t border-white/5 pt-3">
                {explanation}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FearGreedGauge;

import Image from "next/image";
import Link from "next/link";

const features = [
  {
    icon: "◈",
    title: "Neural Sentiment",
    copy: "Real-time analysis of global news, social threads, and earnings calls using proprietary LLMs.",
    color: "var(--primary)",
  },
  {
    icon: "⌬",
    title: "Predictive Telemetry",
    copy: "Quantitative models that identify alpha before it hits the mainstream tape.",
    color: "var(--tertiary)",
  },
  {
    icon: "⧖",
    title: "Risk Shield",
    copy: "Advanced volatility hedging and exposure management to protect your capital.",
    color: "var(--secondary)",
  },
];

const aiFeatures = [
  { icon: "🔊", title: "Voice Narrator", desc: "Listen to market briefings in English or Urdu", color: "#0a84ff" },
  { icon: "🕯️", title: "Pattern Explainer", desc: "AI explains candle patterns like Doji and Hammer", color: "#00ff41" },
  { icon: "📊", title: "Event Detection", desc: "Auto-alerts when stocks move more than 3%", color: "#ff3131" },
  { icon: "⚔️", title: "Stock Comparison", desc: "Head-to-head battle between any two stocks", color: "#6366f1" },
  { icon: "🛡️", title: "Scam Detector", desc: "Verify WhatsApp tips against real market data", color: "#f59e0b" },
  { icon: "⏱️", title: "Entry Timing", desc: "Is NOW the right time to buy? AI tells you", color: "#0a84ff" },
];

export default function Home() {
  return (
    <div className="container page-enter">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[80vh] relative py-12 lg:py-24">
        <div className="animate-fadeInLeft">
          <span className="data-mono animate-glow-pulse" style={{ color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: 'var(--spacing-sm)' }}>
            Neural Core v2.4 Active
          </span>
          <h1 className="headline-xl" style={{ marginBottom: 'var(--spacing-md)' }}>
            The Future of <span style={{ color: 'var(--primary)', textShadow: '0 0 20px var(--primary-glow)' }}>Intelligent</span> Investing
          </h1>
          <p className="body-lg animate-fadeInUp delay-200" style={{ marginBottom: 'var(--spacing-lg)', opacity: 0.8 }}>
            AlphaAI combines deep neural networks with real-time market telemetry to give you an institutional-grade edge. Predict trends, analyze sentiment, and execute with precision.
          </p>
          <div className="animate-fadeInUp delay-400 flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard" className="btn btn-primary hover-bright text-center px-8 py-4 text-lg">
              Launch Terminal
            </Link>
            <Link href="/assistant" className="btn btn-outline hover-glow text-center px-8 py-4 text-lg">
              Consult AI
            </Link>
          </div>
        </div>
        <div className="glass animate-float-slow animate-scaleIn delay-300" style={{ padding: 'var(--spacing-xs)', overflow: 'hidden', position: 'relative' }}>
          <span className="hero-orb one animate-breathe" />
          <span className="hero-orb two animate-breathe delay-500" />
          <span className="hero-orb three animate-breathe delay-300" />
          <Image
            src="/hero.png"
            alt="AlphaAI Dashboard"
            width={800}
            height={600}
            loading="eager"
            style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-lg)' }}
          />
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.5)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--primary)'
          }}>
            <span className="data-mono animate-pulse" style={{ color: 'var(--primary)' }}>● LIVE DATA STREAM</span>
          </div>
        </div>
      </section>

      <section style={{ padding: 'var(--spacing-xl) 0' }}>
        <h2 className="headline-lg animate-fadeInUp" style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>Institutional Power. Personal Access.</h2>
        <div className="grid-dashboard">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`glass-card hover-lift animate-slideUp delay-${(i + 1) * 200}`}
              style={{ gridColumn: 'span 4', padding: 'var(--spacing-md)' }}
            >
              <div style={{ color: feature.color, fontSize: '32px', marginBottom: 'var(--spacing-sm)' }}>{feature.icon}</div>
              <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>{feature.title}</h3>
              <p style={{ opacity: 0.7 }}>{feature.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* New: AI Features showcase */}
      <section style={{ padding: 'var(--spacing-xl) 0' }}>
        <h2 className="headline-lg animate-fadeInUp" style={{ textAlign: 'center', marginBottom: 'var(--spacing-sm)' }}>
          10 AI Features. <span style={{ color: 'var(--primary)' }}>Zero Cost.</span>
        </h2>
        <p className="body-lg animate-fadeInUp delay-200" style={{ textAlign: 'center', opacity: 0.6, marginBottom: 'var(--spacing-lg)', maxWidth: 600, margin: '0 auto var(--spacing-lg)' }}>
          Built for Pakistani retail investors. Voice narration, scam detection, smart timing, and more.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {aiFeatures.map((f, i) => (
            <div
              key={f.title}
              className={`glass-card hover-lift animate-fadeInUp delay-${(i + 1) * 100}`}
              style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>{f.icon}</div>
              <h4 style={{ marginBottom: 6, color: f.color }}>{f.title}</h4>
              <p style={{ fontSize: 14, opacity: 0.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

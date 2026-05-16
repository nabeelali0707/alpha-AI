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

export default function Home() {
  return (
    <div className="container">
      <section style={{
        padding: 'var(--spacing-xl) 0',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--spacing-xl)',
        alignItems: 'center',
        minHeight: '80vh',
        position: 'relative',
      }}>
        <div>
          <span className="data-mono animate-glow-pulse" style={{ color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: 'var(--spacing-sm)' }}>
            Neural Core v2.4 Active
          </span>
          <h1 className="headline-xl" style={{ marginBottom: 'var(--spacing-md)' }}>
            The Future of <span style={{ color: 'var(--primary)', textShadow: '0 0 20px var(--primary-glow)' }}>Intelligent</span> Investing
          </h1>
          <p className="body-lg" style={{ marginBottom: 'var(--spacing-lg)', opacity: 0.8 }}>
            AlphaAI combines deep neural networks with real-time market telemetry to give you an institutional-grade edge. Predict trends, analyze sentiment, and execute with precision.
          </p>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '18px' }}>
              Launch Terminal
            </Link>
            <Link href="/assistant" className="btn btn-outline" style={{ padding: '16px 32px', fontSize: '18px' }}>
              Consult AI
            </Link>
          </div>
        </div>
        <div className="glass animate-float-slow" style={{ padding: 'var(--spacing-xs)', overflow: 'hidden', position: 'relative' }}>
          <span className="hero-orb one" />
          <span className="hero-orb two" />
          <span className="hero-orb three" />
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
            <span className="data-mono" style={{ color: 'var(--primary)' }}>• LIVE DATA STREAM</span>
          </div>
        </div>
      </section>

      <section style={{ padding: 'var(--spacing-xl) 0' }}>
        <h2 className="headline-lg" style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>Institutional Power. Personal Access.</h2>
        <div className="grid-dashboard">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-card animate-float-slow"
              style={{ gridColumn: 'span 4', padding: 'var(--spacing-md)' }}
            >
              <div style={{ color: feature.color, fontSize: '32px', marginBottom: 'var(--spacing-sm)' }}>{feature.icon}</div>
              <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>{feature.title}</h3>
              <p style={{ opacity: 0.7 }}>{feature.copy}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

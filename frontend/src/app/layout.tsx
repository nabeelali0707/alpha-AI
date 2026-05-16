import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AuthProvider } from "../context/AuthProvider";
import StockSearchBar from "../components/StockSearchBar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "AlphaAI | Intelligent Investing",
  description: "High-performance financial analysis and AI-driven market insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <header className="glass" style={{ margin: 'var(--spacing-sm)', padding: 'var(--spacing-sm) var(--spacing-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 'var(--spacing-sm)', zIndex: 100, gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/" className="headline-lg" style={{ color: 'var(--primary)', fontSize: '24px', textDecoration: 'none', flexShrink: 0 }}>
            ALPHA<span style={{ color: 'var(--foreground)' }}>AI</span>
          </Link>
          <div style={{ flex: 1, maxWidth: '420px', minWidth: '180px' }}>
            <StockSearchBar placeholder="Search stocks…" compact />
          </div>
          <nav style={{ display: 'flex', gap: 'var(--spacing-md)', flexShrink: 0 }}>
            <Link href="/dashboard" style={{ fontWeight: 500 }}>Dashboard</Link>
            <Link href="/portfolio" style={{ fontWeight: 500 }}>Portfolio</Link>
            <Link href="/assistant" style={{ fontWeight: 500 }}>AI Assistant</Link>
          </nav>
          <Link href="/auth/login" className="btn btn-primary" style={{ padding: '8px 16px', flexShrink: 0 }}>Terminal Login</Link>
        </header>
        <main style={{ flex: 1 }}>
          <AuthProvider>{children}</AuthProvider>
        </main>
        <footer style={{ padding: 'var(--spacing-xl) 0', textAlign: 'center', opacity: 0.5, fontSize: '14px' }}>
          <p>&copy; 2026 AlphaAI Neural Systems. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}

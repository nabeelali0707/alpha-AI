import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Link from "next/link";

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
        <header className="glass" style={{ margin: 'var(--spacing-sm)', padding: 'var(--spacing-sm) var(--spacing-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 'var(--spacing-sm)', zIndex: 100 }}>
          <Link href="/" className="headline-lg" style={{ color: 'var(--primary)', fontSize: '24px', textDecoration: 'none' }}>
            ALPHA<span style={{ color: 'var(--foreground)' }}>AI</span>
          </Link>
          <nav style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <Link href="/dashboard" style={{ fontWeight: 500 }}>Dashboard</Link>
            <Link href="/portfolio" style={{ fontWeight: 500 }}>Portfolio</Link>
            <Link href="/assistant" style={{ fontWeight: 500 }}>AI Assistant</Link>
          </nav>
          <Link href="/auth/login" className="btn btn-primary" style={{ padding: '8px 16px' }}>Terminal Login</Link>
        </header>
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <footer style={{ padding: 'var(--spacing-xl) 0', textAlign: 'center', opacity: 0.5, fontSize: '14px' }}>
          <p>&copy; 2026 AlphaAI Neural Systems. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}

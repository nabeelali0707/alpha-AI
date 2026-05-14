import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlphaAI Terminal - AI-Powered Stock Market Analyzer",
  description: "Real-time AI-driven stock market analysis, sentiment tracking, and trading signals. Institutional-grade intelligence at your fingertips.",
  keywords: "stock market, AI analysis, trading signals, market intelligence, fintech",
  viewport: "width=device-width, initial-scale=1.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-full flex flex-col overflow-hidden">
        {children}
      </body>
    </html>
  );
}

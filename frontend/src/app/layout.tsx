import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthProvider";
import { ToastProvider } from "../components/Toast";
import Navbar from "../components/Navbar";

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
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main style={{ flex: 1 }}>
              {children}
            </main>
            <footer style={{ padding: 'var(--spacing-xl) 0', textAlign: 'center', opacity: 0.5, fontSize: '14px' }}>
              <p>&copy; 2026 AlphaAI Neural Systems. All rights reserved.</p>
            </footer>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

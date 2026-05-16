"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import StockSearchBar from "./StockSearchBar";

function getMarketStatus() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const nyseOpen = totalMinutes >= 9 * 60 + 30 && totalMinutes <= 16 * 60;
  const psxOpen = totalMinutes >= 9 * 60 + 15 && totalMinutes <= 15 * 60 + 30;

  if (nyseOpen) return "NYSE OPEN";
  if (psxOpen) return "PSX OPEN";
  return "MARKETS CLOSED";
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const status = useMemo(() => getMarketStatus(), []);

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 200,
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,14,26,0.92)",
      backdropFilter: "blur(16px)",
    }}>
      <div style={{
        maxWidth: 1440,
        margin: "0 auto",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}>
        <Link href="/dashboard" style={{
          fontWeight: 800,
          letterSpacing: "0.08em",
          color: "var(--accent-green)",
          textDecoration: "none",
          fontSize: 18,
        }}>
          ALPHA<span style={{ color: "var(--text-primary)" }}>AI</span>
        </Link>

        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ width: "min(520px, 100%)" }}>
            <StockSearchBar placeholder="Search stocks, crypto, forex..." compact />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 11,
            color: "var(--text-secondary)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            {status}
          </div>
          <Link href="/auth/login" className="btn btn-primary" style={{ padding: "8px 14px" }}>
            Login
          </Link>
          <button
            onClick={() => setOpen((s) => !s)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(10,14,26,0.96)",
        }}>
          <div style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "12px 24px 16px",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
          }}>
            <Link href="/dashboard" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/markets" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Markets</Link>
            <Link href="/portfolio" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Portfolio</Link>
            <Link href="/assistant" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Assistant</Link>
          </div>
        </nav>
      )}
    </header>
  );
}

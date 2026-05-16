"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, LineChart, Line, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabase";
import {
  addPortfolioHolding,
  getPortfolioHoldings,
  getPortfolioSummary,
  removePortfolioHolding,
  type PortfolioHolding,
  type PortfolioSummary,
} from "@/lib/api";

const COLORS = ["#00ff41", "#3b82f6", "#f59e0b", "#ff3131"];

export default function Portfolio() {
  const [token, setToken] = useState<string | null>(null);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ symbol: "", market: "US", quantity: "", entry_price: "", entry_date: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, []);

  async function loadData(accessToken: string) {
    setLoading(true);
    try {
      const [sum, hold] = await Promise.all([
        getPortfolioSummary(accessToken),
        getPortfolioHoldings(accessToken),
      ]);
      setSummary(sum);
      setHoldings(hold);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadData(token);
  }, [token]);

  const allocation = useMemo(() => {
    const map: Record<string, number> = {};
    holdings.forEach((h) => {
      const key = h.market || "US";
      map[key] = (map[key] ?? 0) + (h.current_price || 0) * h.quantity;
    });
    return Object.entries(map).map(([market, value]) => ({ name: market, value }));
  }, [holdings]);

  const series = useMemo(() => {
    const sorted = [...holdings].sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
    let running = 0;
    return sorted.map((h) => {
      running += (h.current_price || h.entry_price) * h.quantity;
      return { date: new Date(h.entry_date).toLocaleDateString(), value: Number(running.toFixed(2)) };
    });
  }, [holdings]);

  const handleAdd = async () => {
    if (!token) return;
    await addPortfolioHolding(token, {
      symbol: form.symbol,
      market: form.market,
      quantity: Number(form.quantity),
      entry_price: Number(form.entry_price),
      entry_date: form.entry_date,
    } as any);
    setShowModal(false);
    setForm({ symbol: "", market: "US", quantity: "", entry_price: "", entry_date: "" });
    await loadData(token);
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    await removePortfolioHolding(token, id);
    await loadData(token);
  };

  if (!token) {
    return (
      <div className="container" style={{ paddingTop: "var(--spacing-md)", paddingBottom: "40px" }}>
        <h1 className="headline-lg">Portfolio Management</h1>
        <p className="data-mono" style={{ opacity: 0.6, marginTop: 8 }}>Login required to view holdings.</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: "var(--spacing-md)", paddingBottom: "40px" }}>
      <div style={{ marginBottom: "var(--spacing-lg)" }}>
        <h1 className="headline-lg">Portfolio Management</h1>
        <p className="data-mono" style={{ opacity: 0.5 }}>Track and manage your investments</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Position</button>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>{loading ? "Syncing..." : "Live P&L"}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--spacing-md)", marginBottom: "var(--spacing-lg)" }}>
        <div className="glass" style={{ padding: "var(--spacing-md)" }}>
          <p className="data-mono" style={{ opacity: 0.6, marginBottom: 8 }}>TOTAL INVESTED</p>
          <h2 style={{ fontSize: "2rem", color: "#dae2fd" }}>${summary?.total_invested.toFixed(0) ?? "0"}</h2>
        </div>
        <div className="glass" style={{ padding: "var(--spacing-md)" }}>
          <p className="data-mono" style={{ opacity: 0.6, marginBottom: 8 }}>CURRENT VALUE</p>
          <h2 style={{ fontSize: "2rem", color: "#0a84ff" }}>${summary?.total_value.toFixed(0) ?? "0"}</h2>
        </div>
        <div className="glass" style={{ padding: "var(--spacing-md)", border: `2px solid ${(summary?.total_pnl ?? 0) >= 0 ? '#00ff41' : '#ff3131'}30` }}>
          <p className="data-mono" style={{ opacity: 0.6, marginBottom: 8 }}>TOTAL P&L</p>
          <h2 style={{ fontSize: "2rem", color: (summary?.total_pnl ?? 0) >= 0 ? "#00ff41" : "#ff3131" }}>
            ${summary?.total_pnl.toFixed(0) ?? "0"} ({summary?.total_pnl_percent.toFixed(2) ?? "0"}%)
          </h2>
        </div>
      </div>

      <div className="glass" style={{ padding: "var(--spacing-md)", marginBottom: "var(--spacing-lg)" }}>
        <h3 style={{ marginBottom: "var(--spacing-md)", color: "#00ff41" }}>ACTIVE HOLDINGS</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid rgba(0,255,65,0.3)" }}>
                <th style={{ padding: 12, textAlign: "left", color: "#00ff41" }}>Symbol</th>
                <th style={{ padding: 12, textAlign: "left", color: "#00ff41" }}>Market</th>
                <th style={{ padding: 12, textAlign: "right", color: "#00ff41" }}>Qty</th>
                <th style={{ padding: 12, textAlign: "right", color: "#00ff41" }}>Entry</th>
                <th style={{ padding: 12, textAlign: "right", color: "#00ff41" }}>Current</th>
                <th style={{ padding: 12, textAlign: "right", color: "#00ff41" }}>P&L</th>
                <th style={{ padding: 12, textAlign: "right", color: "#00ff41" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => (
                <tr key={holding.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: 12, fontWeight: 700, color: "#dae2fd" }}>{holding.symbol}</td>
                  <td style={{ padding: 12, color: "#9ca3af" }}>{holding.market ?? "US"}</td>
                  <td style={{ padding: 12, textAlign: "right", color: "#dae2fd" }}>{holding.quantity}</td>
                  <td style={{ padding: 12, textAlign: "right", color: "#dae2fd" }}>${holding.entry_price.toFixed(2)}</td>
                  <td style={{ padding: 12, textAlign: "right", color: "#0a84ff" }}>${holding.current_price?.toFixed(2) ?? "--"}</td>
                  <td style={{ padding: 12, textAlign: "right", color: (holding.pnl ?? 0) >= 0 ? "#00ff41" : "#ff3131", fontWeight: 700 }}>
                    {(holding.pnl ?? 0) >= 0 ? "+" : ""}${holding.pnl?.toFixed(2) ?? "0"} ({holding.pnl_percent?.toFixed(2) ?? "0"}%)
                  </td>
                  <td style={{ padding: 12, textAlign: "right" }}>
                    <button className="btn btn-outline" onClick={() => handleDelete(holding.id)} style={{ padding: "4px 10px", fontSize: 11 }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-md)" }}>
        <div className="glass" style={{ padding: "var(--spacing-md)" }}>
          <h3 style={{ marginBottom: "var(--spacing-md)", color: "#00ff41" }}>Allocation by Market</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={allocation} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40}>
                {allocation.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass" style={{ padding: "var(--spacing-md)" }}>
          <h3 style={{ marginBottom: "var(--spacing-md)", color: "#00ff41" }}>Portfolio Value Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={series}>
              <Line type="monotone" dataKey="value" stroke="#00ff41" strokeWidth={2} dot={false} />
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 420, background: "var(--bg-secondary)", borderRadius: 16, border: "1px solid var(--border-color)", padding: 20 }}>
            <h3 style={{ color: "var(--text-primary)", marginBottom: 12 }}>Add Position</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <input placeholder="Symbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "white" }} />
              <select value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "white" }}>
                <option value="US">US</option>
                <option value="PSX">PSX</option>
                <option value="CRYPTO">CRYPTO</option>
                <option value="FOREX">FOREX</option>
              </select>
              <input placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "white" }} />
              <input placeholder="Entry Price" value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "white" }} />
              <input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "white" }} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

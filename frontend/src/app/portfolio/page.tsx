"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  getPortfolioSummary,
  getPortfolioHistory,
  addPortfolioHolding,
  removePortfolioHolding,
  updatePortfolioHolding,
  type PortfolioHolding,
  type PortfolioSummary,
  type PortfolioHistoryEntry,
} from "@/lib/api";

// Components
import OverviewCards from "@/components/portfolio/OverviewCards";
import HoldingsTable from "@/components/portfolio/HoldingsTable";
import GrowthChart from "@/components/portfolio/GrowthChart";
import AllocationChart from "@/components/portfolio/AllocationChart";
import AddHoldingModal from "@/components/portfolio/AddHoldingModal";

export default function PortfolioPage() {
  const [token, setToken] = useState<string | null>(null);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [history, setHistory] = useState<PortfolioHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<PortfolioHolding | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, []);

  const loadData = async (accessToken: string, period = "1M") => {
    setLoading(true);
    try {
      const [sumData, histData] = await Promise.all([
        getPortfolioSummary(accessToken),
        getPortfolioHistory(accessToken, period),
      ]);
      setSummary(sumData);
      setHistory(histData);
    } catch (error) {
      console.error("Error loading portfolio data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData(token);
  }, [token]);

  const handleSaveHolding = async (payload: Partial<PortfolioHolding>) => {
    if (!token) return;
    try {
      if (editingHolding) {
        await updatePortfolioHolding(token, editingHolding.id, payload);
      } else {
        await addPortfolioHolding(token, payload);
      }
      setIsModalOpen(false);
      setEditingHolding(null);
      loadData(token);
    } catch (error) {
      console.error("Error saving holding:", error);
    }
  };

  const handleDeleteHolding = async (id: string) => {
    if (!token || !confirm("Are you sure you want to remove this position?")) return;
    try {
      await removePortfolioHolding(token, id);
      loadData(token);
    } catch (error) {
      console.error("Error deleting holding:", error);
    }
  };

  const handleEditHolding = (holding: PortfolioHolding) => {
    setEditingHolding(holding);
    setIsModalOpen(true);
  };

  const handlePeriodChange = (period: string) => {
    if (token) loadData(token, period);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060709] p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-100 glass-card p-12 text-center rounded-3xl border border-white/5"
        >
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Portfolio Locked</h1>
          <p className="text-white/40 mb-8">Please sign in to access your investment portfolio and real-time analytics.</p>
          <button className="w-100 py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all">
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060709] text-white p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-bold tracking-tighter mb-2">
            Portfolio <span className="text-emerald-500">Intelligence</span>
          </h1>
          <div className="flex items-center space-x-3">
            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-white/50 uppercase tracking-widest">
              Live Terminal
            </span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-white/30 font-medium">Real-time market sync active</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-4"
        >
          <button 
            onClick={() => {
              setEditingHolding(null);
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center space-x-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <span>+</span>
            <span>Add Asset</span>
          </button>
        </motion.div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        {/* Metric Cards */}
        <OverviewCards summary={summary} loading={loading} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <GrowthChart data={history} loading={loading} onPeriodChange={handlePeriodChange} />
          </div>
          <div className="lg:col-span-1">
            <AllocationChart data={summary?.allocation || []} loading={loading} />
          </div>
        </div>

        {/* Holdings Table */}
        <HoldingsTable 
          holdings={summary?.holdings || []} 
          loading={loading} 
          onDelete={handleDeleteHolding}
          onEdit={handleEditHolding}
        />
        
        {/* Footer/Meta */}
        <footer className="pt-12 pb-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-white/20 text-[10px] font-mono uppercase tracking-widest gap-4">
          <div>AlphaAI Portfolio Engine v2.0.1</div>
          <div className="flex space-x-6">
            <span>Market Data: yfinance</span>
            <span>Analysis: AI Sentient</span>
          </div>
        </footer>
      </main>

      <AddHoldingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveHolding}
        editingHolding={editingHolding}
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortfolioHolding } from "@/lib/api";

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (holding: Partial<PortfolioHolding>) => void;
  editingHolding?: PortfolioHolding | null;
}

const AddHoldingModal: React.FC<AddHoldingModalProps> = ({ isOpen, onClose, onSave, editingHolding }) => {
  const [form, setForm] = useState<Partial<PortfolioHolding>>({
    symbol: "",
    quantity: 0,
    entry_price: 0,
    market: "US",
    notes: "",
  });

  useEffect(() => {
    if (editingHolding) {
      setForm(editingHolding);
    } else {
      setForm({
        symbol: "",
        quantity: 0,
        entry_price: 0,
        market: "US",
        notes: "",
      });
    }
  }, [editingHolding, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#0d0e12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">
                {editingHolding ? "Edit Position" : "Add New Position"}
              </h3>
              <p className="text-xs text-white/40 mt-1">
                Enter asset details to track in your portfolio.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Ticker Symbol</label>
                  <input
                    required
                    disabled={!!editingHolding}
                    placeholder="e.g. BTC-USD"
                    className="w-100 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 transition-all outline-none disabled:opacity-50"
                    value={form.symbol}
                    onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Market Type</label>
                  <select
                    className="w-100 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 transition-all outline-none"
                    value={form.market || "US"}
                    onChange={(e) => setForm({ ...form, market: e.target.value })}
                  >
                    <option value="US">US Stocks</option>
                    <option value="CRYPTO">Crypto</option>
                    <option value="PSX">PSX</option>
                    <option value="FOREX">Forex</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Quantity</label>
                  <input
                    required
                    type="number"
                    step="any"
                    placeholder="0.00"
                    className="w-100 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 transition-all outline-none"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Avg Buy Price</label>
                  <input
                    required
                    type="number"
                    step="any"
                    placeholder="0.00"
                    className="w-100 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 transition-all outline-none"
                    value={form.entry_price}
                    onChange={(e) => setForm({ ...form, entry_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Notes (Optional)</label>
                <textarea
                  placeholder="Strategy or entry reason..."
                  rows={2}
                  className="w-100 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 transition-all outline-none resize-none"
                  value={form.notes || ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white/60 font-bold hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  {editingHolding ? "Update Position" : "Add Position"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddHoldingModal;

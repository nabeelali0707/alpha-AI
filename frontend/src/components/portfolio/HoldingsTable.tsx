"use client";

import React from "react";
import { motion } from "framer-motion";
import { PortfolioHolding } from "@/lib/api";

interface HoldingsTableProps {
  holdings: PortfolioHolding[];
  loading: boolean;
  onDelete: (id: string) => void;
  onEdit: (holding: PortfolioHolding) => void;
}

const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings, loading, onDelete, onEdit }) => {
  return (
    <div className="glass-card rounded-2xl border border-white/5 bg-white/5 overflow-hidden">
      <div className="p-6 border-bottom border-white/5 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Your Assets</h3>
        <span className="text-xs font-mono text-white/30 uppercase">{holdings.length} Positions</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-100 text-left border-collapse">
          <thead>
            <tr className="border-y border-white/5 bg-white/[0.02]">
              <th className="px-6 py-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">Asset</th>
              <th className="px-6 py-4 text-[10px] font-mono text-white/40 uppercase tracking-widest text-right">Holdings</th>
              <th className="px-6 py-4 text-[10px] font-mono text-white/40 uppercase tracking-widest text-right">Avg Price</th>
              <th className="px-6 py-4 text-[10px] font-mono text-white/40 uppercase tracking-widest text-right">Current</th>
              <th className="px-6 py-4 text-[10px] font-mono text-white/40 uppercase tracking-widest text-right">Market Value</th>
              <th className="px-6 py-4 text-[10px] font-mono text-white/40 uppercase tracking-widest text-right">P&L</th>
              <th className="px-6 py-4 text-[10px] font-mono text-white/40 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="px-6 py-4 h-16 bg-white/5" />
                </tr>
              ))
            ) : holdings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-white/30 italic">
                  No holdings found. Start by adding your first position.
                </td>
              </tr>
            ) : (
              holdings.map((h, idx) => (
                <motion.tr
                  key={h.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-white/[0.03] transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">{h.symbol}</span>
                      <span className="text-[10px] text-white/30 uppercase">{h.market}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{h.quantity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-white/70">${h.entry_price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sky-400 font-medium">${h.current_price?.toFixed(2) || "0.00"}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-white font-semibold">
                    ${h.market_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`font-bold ${h.gain_loss! >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {h.gain_loss! >= 0 ? "+" : ""}{h.gain_loss?.toFixed(2)}
                      </span>
                      <span className={`text-[10px] font-semibold ${h.gain_loss_percentage! >= 0 ? "text-emerald-500/60" : "text-rose-500/60"}`}>
                        {h.gain_loss_percentage?.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(h)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => onDelete(h.id)}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500/50 hover:text-rose-500 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HoldingsTable;

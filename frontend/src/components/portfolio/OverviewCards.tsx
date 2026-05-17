"use client";

import React from "react";
import { motion } from "framer-motion";
import { PortfolioSummary } from "@/lib/api";

interface OverviewCardsProps {
  summary: PortfolioSummary | null;
  loading: boolean;
}

const OverviewCards: React.FC<OverviewCardsProps> = ({ summary, loading }) => {
  const cards = [
    {
      title: "Total Portfolio Value",
      value: summary ? `$${summary.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00",
      change: summary?.daily_gain_loss ?? 0,
      changePercent: summary?.daily_gain_loss_percentage ?? 0,
      label: "Daily Change",
    },
    {
      title: "Total Profit/Loss",
      value: summary ? `$${summary.total_gain_loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00",
      change: summary?.total_gain_loss ?? 0,
      changePercent: summary?.total_gain_loss_percentage ?? 0,
      label: "Overall Return",
    },
    {
      title: "Best Performing Asset",
      value: summary?.best_performing_asset || "None",
      isText: true,
      change: 0,
      changePercent: 0,
      label: "Top Performer",
    },
    {
      title: "Worst Performing Asset",
      value: summary?.worst_performing_asset || "None",
      isText: true,
      change: 0,
      changePercent: 0,
      label: "Underperformer",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => {
        const hasChange = typeof card.change === "number" && typeof card.changePercent === "number";
        const isPositive = !hasChange || card.change >= 0;

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card relative p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group"
          >
            <p className="text-xs font-mono text-white/50 uppercase tracking-wider mb-2">{card.title}</p>
            <div className="flex flex-col">
              <h2 className={`text-2xl font-bold tracking-tight ${loading ? "animate-pulse bg-white/10 rounded h-8 w-32" : "text-white"}`}>
                {!loading && card.value}
              </h2>

              {card.label && hasChange && (
                <div className="flex items-center mt-2 space-x-2">
                  <span className={`text-sm font-semibold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                    {isPositive ? "+" : ""}{card.change.toFixed(2)} ({card.changePercent.toFixed(2)}%)
                  </span>
                  <span className="text-[10px] text-white/30 uppercase">{card.label}</span>
                </div>
              )}

              {card.isText && (
                <p className="text-xs text-white/40 mt-2 italic">{card.label}</p>
              )}
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className={`w-2 h-2 rounded-full ${isPositive ? "bg-emerald-500/50" : "bg-rose-500/50"} blur-sm`} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default OverviewCards;

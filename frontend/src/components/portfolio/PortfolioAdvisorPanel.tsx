"use client";

import React, { useMemo, useState } from "react";
import type { PortfolioSummary } from "@/lib/api";
import { getPortfolioAdvice } from "@/lib/api";

type Props = {
  summary: PortfolioSummary | null;
};

function hasUrduCharacters(text: string) {
  return /[\u0600-\u06ff]/.test(text);
}

export default function PortfolioAdvisorPanel({ summary }: Props) {
  const [question, setQuestion] = useState("How risky is my portfolio?");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");

  const holdingsJson = useMemo(() => JSON.stringify(summary?.holdings ?? [], null, 2), [summary]);

  const askAdvisor = async () => {
    if (!summary) return;
    setLoading(true);
    setAnswer("");
    try {
      const response = await getPortfolioAdvice({
        holdings_json: holdingsJson,
        total_value: String(summary.total_value ?? 0),
        total_pnl: String(summary.total_gain_loss ?? 0),
        pnl_percent: String(summary.total_gain_loss_percentage ?? 0),
        top_sector: summary.best_performing_asset ?? "unknown",
        question,
        language: hasUrduCharacters(question) ? "ur" : "en",
      });
      setAnswer(response.response);
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : "Failed to get portfolio advice.");
    } finally {
      setLoading(false);
    }
  };

  const overConcentrated = (summary?.allocation ?? []).some((item) => item.percentage > 35);

  return (
    <section className="glass-card rounded-2xl border border-white/5 bg-white/5 p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">AI Portfolio Advisor</h3>
        <p className="text-xs text-white/40 uppercase tracking-wider font-mono">Context-aware portfolio analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl bg-white/5 p-3 border border-white/5">
          <div className="text-white/40 text-[10px] uppercase tracking-widest">Risk Flag</div>
          <div className="mt-1 text-white font-semibold">{overConcentrated ? "Concentrated" : "Balanced"}</div>
        </div>
        <div className="rounded-xl bg-white/5 p-3 border border-white/5">
          <div className="text-white/40 text-[10px] uppercase tracking-widest">Total Value</div>
          <div className="mt-1 text-white font-semibold">{summary ? summary.total_value.toFixed(2) : "--"}</div>
        </div>
        <div className="rounded-xl bg-white/5 p-3 border border-white/5">
          <div className="text-white/40 text-[10px] uppercase tracking-widest">P&L</div>
          <div className="mt-1 text-white font-semibold">{summary ? summary.total_gain_loss.toFixed(2) : "--"}</div>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="Ask about risk, trimming, concentration, or diversification..."
          className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/40"
        />
        <button
          onClick={askAdvisor}
          disabled={loading || !summary}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-sm disabled:opacity-50"
        >
          {loading ? "ANALYZING" : "Ask AI"}
        </button>
      </div>

      {answer && (
        <div className="rounded-xl bg-black/30 border border-white/10 p-4 text-sm leading-6 text-white/80 whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </section>
  );
}
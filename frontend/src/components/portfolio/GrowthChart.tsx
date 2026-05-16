"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PortfolioHistoryEntry } from "@/lib/api";

interface GrowthChartProps {
  data: PortfolioHistoryEntry[];
  loading: boolean;
  onPeriodChange: (period: string) => void;
}

const GrowthChart: React.FC<GrowthChartProps> = ({ data, loading, onPeriodChange }) => {
  const [activePeriod, setActivePeriod] = useState("1M");
  const periods = ["1W", "1M", "3M", "1Y", "ALL"];

  const handlePeriodChange = (p: string) => {
    setActivePeriod(p);
    onPeriodChange(p);
  };

  return (
    <div className="glass-card rounded-2xl border border-white/5 bg-white/5 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Portfolio Performance</h3>
          <p className="text-xs text-white/40 uppercase tracking-wider font-mono">Value Growth Over Time</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                activePeriod === p
                  ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  : "text-white/40 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-100">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="recorded_at"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: "short", day: "numeric" })}
              minTickGap={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              tickFormatter={(val) => `$${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}`}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(13, 14, 18, 0.9)",
                borderColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#fff",
                backdropFilter: "blur(8px)",
              }}
              itemStyle={{ color: "#10b981" }}
              formatter={(value: any) => [`$${parseFloat(value).toLocaleString()}`, "Value"]}
              labelFormatter={(label) => new Date(label).toLocaleDateString([], { dateStyle: "medium" })}
            />
            <Area
              type="monotone"
              dataKey="portfolio_value"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GrowthChart;

"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PortfolioAllocation } from "@/lib/api";

interface AllocationChartProps {
  data: PortfolioAllocation[];
  loading: boolean;
}

const COLORS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#06b6d4", // Cyan
];

const AllocationChart: React.FC<AllocationChartProps> = ({ data, loading }) => {
  return (
    <div className="glass-card rounded-2xl border border-white/5 bg-white/5 p-6 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Asset Allocation</h3>
        <p className="text-xs text-white/40 uppercase tracking-wider font-mono">Portfolio Distribution</p>
      </div>

      <div className="flex-1 min-h-[300px] w-100 relative">
        {data.length === 0 && !loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 italic text-sm">
            No data to display
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="percentage"
                nameKey="symbol"
                animationDuration={1500}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(13, 14, 18, 0.9)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#fff",
                  backdropFilter: "blur(8px)",
                }}
                formatter={(value: any) => [`${parseFloat(value).toFixed(2)}%`, "Allocation"]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                formatter={(value) => <span className="text-white/60 text-[10px] font-mono uppercase">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AllocationChart;

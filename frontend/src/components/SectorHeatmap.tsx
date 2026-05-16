"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface SectorData {
  sector: string;
  performance: number;
  gainers: number;
  losers: number;
  average_change: number;
  market_cap: string;
}

interface SectorHeatmapProps {
  data?: SectorData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload[0]) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: 'rgba(23, 31, 51, 0.95)',
          border: '1px solid rgba(0, 255, 65, 0.2)',
          borderRadius: '8px',
          padding: '12px',
          color: '#dae2fd',
          fontSize: '12px',
        }}
      >
        <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>{data.sector}</p>
        <p style={{ color: data.performance >= 0 ? '#00ff41' : '#ff3131' }}>
          Performance: {data.performance.toFixed(2)}%
        </p>
        <p>Gainers: {data.gainers} | Losers: {data.losers}</p>
        <p>Avg Change: {data.average_change.toFixed(2)}%</p>
        <p style={{ opacity: 0.7 }}>Market Cap: {data.market_cap}</p>
      </div>
    );
  }
  return null;
};

export default function SectorHeatmap({ data = [] }: SectorHeatmapProps) {
  if (!data.length) {
    return (
      <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#00ff41' }}>
          SECTOR PERFORMANCE HEATMAP
        </h3>
        <p style={{ fontSize: '14px', opacity: 0.75 }}>
          Live sector data is not currently provided by the backend. This panel will populate once a live sector feed is connected.
        </p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.performance - a.performance);

  return (
    <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
      <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#00ff41' }}>
        SECTOR PERFORMANCE HEATMAP
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sortedData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis type="number" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
          <YAxis dataKey="sector" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} width={100} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="performance" radius={[0, 8, 8, 0]}>
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.performance >= 0 ? 'rgba(0, 255, 65, 0.6)' : 'rgba(255, 49, 49, 0.6)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 'var(--spacing-md)' }}>
        <h4 style={{ marginBottom: 'var(--spacing-sm)', color: '#0a84ff' }}>Sector Details</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)' }}>
          {sortedData.map((sector) => (
            <div
              key={sector.sector}
              style={{
                padding: 'var(--spacing-sm)',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                borderLeft: `3px solid ${sector.performance >= 0 ? '#00ff41' : '#ff3131'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <p className="data-mono" style={{ fontWeight: 'bold' }}>{sector.sector}</p>
                <p style={{ color: sector.performance >= 0 ? '#00ff41' : '#ff3131', fontWeight: 'bold' }}>
                  {sector.performance >= 0 ? '+' : ''}{sector.performance.toFixed(2)}%
                </p>
              </div>
              <p style={{ fontSize: '12px', opacity: 0.7 }}>
                Market Cap: {sector.market_cap}
              </p>
              <p style={{ fontSize: '12px', opacity: 0.7 }}>
                {sector.gainers} gainers | {sector.losers} losers
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 'var(--spacing-md)', fontSize: '12px', opacity: 0.6 }}>
        <p>💡 Green sectors showing positive performance | Red sectors showing negative performance</p>
      </div>
    </div>
  );
}

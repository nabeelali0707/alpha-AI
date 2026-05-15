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

// Mock sector data for demonstration
const mockSectorData: SectorData[] = [
  { sector: 'Technology', performance: 15.2, gainers: 45, losers: 12, average_change: 2.1, market_cap: '$12.5T' },
  { sector: 'Healthcare', performance: 8.7, gainers: 38, losers: 18, average_change: 1.4, market_cap: '$4.2T' },
  { sector: 'Financials', performance: 12.4, gainers: 42, losers: 15, average_change: 1.9, market_cap: '$8.1T' },
  { sector: 'Consumer', performance: 5.3, gainers: 30, losers: 25, average_change: 0.8, market_cap: '$3.7T' },
  { sector: 'Energy', performance: 18.9, gainers: 22, losers: 8, average_change: 3.2, market_cap: '$1.9T' },
  { sector: 'Industrials', performance: 6.4, gainers: 28, losers: 22, average_change: 1.0, market_cap: '$3.2T' },
  { sector: 'Real Estate', performance: 3.2, gainers: 15, losers: 20, average_change: 0.4, market_cap: '$1.5T' },
  { sector: 'Utilities', performance: -2.1, gainers: 8, losers: 18, average_change: -0.5, market_cap: '$0.9T' },
];

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
        <p opacity={0.7}>Market Cap: {data.market_cap}</p>
      </div>
    );
  }
  return null;
};

export default function SectorHeatmap({ data = mockSectorData }: SectorHeatmapProps) {
  // Sort by performance
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

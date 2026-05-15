"use client";

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  data: CandleData[];
  width?: number;
  height?: number;
}

// Custom candlestick shape component
const CandleStick = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;

  const { open, high, low, close } = payload;
  const range = high - low;
  if (range === 0) return null;

  // Calculate positions
  const chartHeight = height;
  const highY = y + (1 - (high - low) / range) * chartHeight;
  const lowY = y + chartHeight;
  const openY = y + (1 - (Math.max(open, close) - low) / range) * chartHeight;
  const closeY = y + (1 - (Math.min(open, close) - low) / range) * chartHeight;
  const bodyHeight = Math.abs(closeY - openY);

  const isGain = close >= open;
  const wickColor = isGain ? '#00ff41' : '#ff3131';
  const bodyColor = isGain ? 'rgba(0, 255, 65, 0.7)' : 'rgba(255, 49, 49, 0.7)';
  const bodyStroke = isGain ? '#00ff41' : '#ff3131';

  return (
    <g>
      {/* Wick */}
      <line
        x1={x + width / 2}
        y1={highY}
        x2={x + width / 2}
        y2={lowY}
        stroke={wickColor}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={x + width * 0.2}
        y={Math.min(openY, closeY)}
        width={width * 0.6}
        height={Math.max(bodyHeight, 1)}
        fill={bodyColor}
        stroke={bodyStroke}
        strokeWidth={1}
      />
    </g>
  );
};

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
          zIndex: 1000,
        }}
      >
        <p style={{ marginBottom: '4px', fontWeight: 'bold' }}>{data.date}</p>
        <p style={{ color: '#00ff41' }}>O: ${data.open.toFixed(2)}</p>
        <p style={{ color: '#0a84ff' }}>H: ${data.high.toFixed(2)}</p>
        <p style={{ color: '#ff3131' }}>L: ${data.low.toFixed(2)}</p>
        <p style={{ color: '#dae2fd' }}>C: ${data.close.toFixed(2)}</p>
        <p style={{ opacity: 0.7 }}>V: {(data.volume / 1e6).toFixed(1)}M</p>
      </div>
    );
  }
  return null;
};

export default function CandlestickChart({
  data,
  width,
  height = 400,
}: CandlestickChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="glass" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
        <p>No data available for candlestick chart</p>
      </div>
    );
  }

  return (
    <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
      <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#00ff41' }}>
        CANDLESTICK CHART
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.3)"
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {/* Candlestick as a Bar with custom shape */}
          <Bar
            dataKey="close"
            shape={<CandleStick />}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '11px', opacity: 0.5, marginTop: 'var(--spacing-sm)' }}>
        Green = Gain (Close ≥ Open) | Red = Loss (Close &lt; Open)
      </p>
    </div>
  );
}

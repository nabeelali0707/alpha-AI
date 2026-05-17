"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, CrosshairMode, IChartApi, CandlestickData, HistogramData, LineData, LineStyle } from "lightweight-charts";
import { getStockHistory, getTechnicalIndicators } from "../lib/api";

type Props = {
  ticker?: string;
  data?: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  height?: number;
  currentTimeframe?: string;
  onTimeframeChange?: (label: string) => void;
  showControls?: boolean;
  indicatorVisibility?: {
    rsi: boolean;
    macd: boolean;
    sma20: boolean;
    sma50: boolean;
    bb: boolean;
  };
  onIndicatorToggle?: (name: "rsi" | "macd" | "sma20" | "sma50" | "bb", value: boolean) => void;
};

const TIMEFRAME_MAP: { label: string; period: string; interval: string }[] = [
  { label: "1m", period: "1d", interval: "1m" },
  { label: "5m", period: "5d", interval: "5m" },
  { label: "15m", period: "5d", interval: "15m" },
  { label: "1H", period: "1mo", interval: "1h" },
  { label: "4H", period: "3mo", interval: "4h" },
  { label: "1D", period: "1y", interval: "1d" },
  { label: "1W", period: "5y", interval: "1wk" },
  { label: "1M", period: "max", interval: "1mo" },
];

export default function StockChart({
  ticker,
  data: initialData = [],
  height = 520,
  currentTimeframe,
  onTimeframeChange,
  showControls = true,
  indicatorVisibility,
  onIndicatorToggle,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<any>(null);
  const volumeRef = useRef<any>(null);
  const rsiRef = useRef<any>(null);
  const macdRef = useRef<any>(null);
  const sma20Ref = useRef<any>(null);
  const sma50Ref = useRef<any>(null);
  const bbUpperRef = useRef<any>(null);
  const bbMiddleRef = useRef<any>(null);
  const bbLowerRef = useRef<any>(null);

  const [timeframe, setTimeframe] = useState(() => {
    const match = TIMEFRAME_MAP.find((tf) => tf.label === currentTimeframe);
    return match ?? TIMEFRAME_MAP[5];
  });
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [volumeData, setVolumeData] = useState<HistogramData[]>([]);
  const [rsiSeries, setRsiSeries] = useState<LineData[]>([]);
  const [macdSeries, setMacdSeries] = useState<HistogramData[]>([]);
  const [sma20Series, setSma20Series] = useState<LineData[]>([]);
  const [sma50Series, setSma50Series] = useState<LineData[]>([]);
  const [bbSeries, setBbSeries] = useState<{ upper: LineData[]; middle: LineData[]; lower: LineData[] }>({ upper: [], middle: [], lower: [] });
  const [localIndicators, setLocalIndicators] = useState({ rsi: true, macd: true, sma20: true, sma50: true, bb: false });
  const indicators = indicatorVisibility ?? localIndicators;

  // fetch history & technicals
  useEffect(() => {
    if (currentTimeframe) {
      const match = TIMEFRAME_MAP.find((tf) => tf.label === currentTimeframe);
      if (match) setTimeframe(match);
    }
  }, [currentTimeframe]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        let history = initialData;
        if (ticker) {
          history = await getStockHistory(ticker, timeframe.period, timeframe.interval);
          if (timeframe.label === "4H" && history.length === 0) {
            history = await getStockHistory(ticker, timeframe.period, "60m");
          }
        }

        const candleSeries: CandlestickData[] = history.map((d: any) => ({
          time: Math.floor(new Date(d.date).getTime() / 1000) as any,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));

        const histVol: HistogramData[] = history.map((d: any) => ({
          time: Math.floor(new Date(d.date).getTime() / 1000) as any,
          value: d.volume,
          color: d.close >= d.open ? "rgba(0,255,65,0.4)" : "rgba(255,49,49,0.4)",
        }));

        if (!mounted) return;
        setChartData(candleSeries);
        setVolumeData(histVol);

        if (ticker) {
          try {
            const tech = await getTechnicalIndicators(ticker);
            if (!mounted || !tech) return;

            setRsiSeries((tech.rsi_series || []).map((p: any) => ({ time: Math.floor(new Date(p.date).getTime() / 1000) as any, value: p.value })));
            setMacdSeries((tech.macd_series || []).map((p: any) => ({ time: Math.floor(new Date(p.date).getTime() / 1000) as any, value: p.value, color: p.value >= 0 ? "rgba(0,255,65,0.6)" : "rgba(255,49,49,0.6)" })));
            setSma20Series((tech.sma_20_series || []).map((p: any) => ({ time: Math.floor(new Date(p.date).getTime() / 1000) as any, value: p.value })));
            setSma50Series((tech.sma_50_series || []).map((p: any) => ({ time: Math.floor(new Date(p.date).getTime() / 1000) as any, value: p.value })));
            setBbSeries({
              upper: (tech.bollinger_series?.upper || []).map((p: any) => ({ time: Math.floor(new Date(p.date).getTime() / 1000) as any, value: p.value })),
              middle: (tech.bollinger_series?.middle || []).map((p: any) => ({ time: Math.floor(new Date(p.date).getTime() / 1000) as any, value: p.value })),
              lower: (tech.bollinger_series?.lower || []).map((p: any) => ({ time: Math.floor(new Date(p.date).getTime() / 1000) as any, value: p.value })),
            });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("Failed to fetch technical indicators", e);
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load history", err);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [ticker, timeframe, initialData]);

  // create chart
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { color: "#0a0e1a" },
        textColor: "#9ca3af",
      },
      grid: { vertLines: { color: "rgba(255,255,255,0.05)" }, horzLines: { color: "rgba(255,255,255,0.05)" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { visible: true, borderColor: "rgba(255,255,255,0.08)" },
      watermark: { visible: false },
    });

    chartRef.current = chart;

    // price series
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#00ff41",
      downColor: "#ff3131",
      borderVisible: true,
      wickUpColor: "#00ff41",
      wickDownColor: "#ff3131",
    });
    candleRef.current = candleSeries;

    // volume scale (separate price scale id)
    const volumeSeries = chart.addHistogramSeries({
      priceScaleId: "volume",
      priceFormat: { type: "volume" },
    });
    volumeRef.current = volumeSeries;

    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 }, borderColor: "rgba(255,255,255,0.08)" });

    // overlays
    rsiRef.current = chart.addLineSeries({ color: "#f59e0b", lineWidth: 1 });
    macdRef.current = chart.addHistogramSeries({ priceFormat: { type: "volume" } });
    sma20Ref.current = chart.addLineSeries({ color: "#00ff41", lineWidth: 1 });
    sma50Ref.current = chart.addLineSeries({ color: "#0a84ff", lineWidth: 1 });
    bbUpperRef.current = chart.addLineSeries({ color: "#9ca3af", lineWidth: 1, lineStyle: LineStyle.Dashed });
    bbMiddleRef.current = chart.addLineSeries({ color: "#9ca3af", lineWidth: 1, lineStyle: LineStyle.Dashed });
    bbLowerRef.current = chart.addLineSeries({ color: "#9ca3af", lineWidth: 1, lineStyle: LineStyle.Dashed });

    // crosshair tooltip
    const tooltip = document.createElement("div");
    tooltip.style.cssText = `position: absolute; display: none; pointer-events: none; background: #0f1629; color: #e5e7eb; padding:8px 10px; border-radius:8px; border:1px solid rgba(255,255,255,0.06); font-size:12px; box-shadow:0 8px 24px rgba(0,0,0,0.6)`;
    container.appendChild(tooltip);

    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.point || !param.seriesData) {
        tooltip.style.display = "none";
        return;
      }
      const series = param.seriesData.get(candleSeries);
      if (!series) {
        tooltip.style.display = "none";
        return;
      }

      const { open, high, low, close } = series as any;
      const changeColor = close >= open ? "#00ff41" : "#ff3131";
      const vol = volumeRef.current && param.seriesData.get(volumeSeries) ? (param.seriesData.get(volumeSeries) as any).value : undefined;

      tooltip.innerHTML = `
        <div style="font-weight:600;margin-bottom:6px;color:#9ca3af">${new Date((param.time as any) * 1000).toLocaleString()}</div>
        <div>Open: <span style="color:#9ca3af">${open?.toFixed(2) ?? "-"}</span></div>
        <div>High: <span style="color:#00ff41">${high?.toFixed(2) ?? "-"}</span></div>
        <div>Low: <span style="color:#ff3131">${low?.toFixed(2) ?? "-"}</span></div>
        <div>Close: <span style="font-weight:700;color:${changeColor}">${close?.toFixed(2) ?? "-"}</span></div>
        <div>Volume: <span>${vol ?? "-"}</span></div>
      `;

      tooltip.style.left = `${param.point.x + 12}px`;
      tooltip.style.top = `${param.point.y + 12}px`;
      tooltip.style.display = "block";
    });

    // resize observer
    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth });
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      if (tooltip && tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update series data when chartData/volumeData changes
  useEffect(() => {
    if (candleRef.current) candleRef.current.setData(chartData as any);
    if (volumeRef.current) volumeRef.current.setData(volumeData as any);

    if (rsiRef.current) rsiRef.current.setData(indicators.rsi ? rsiSeries : []);
    if (macdRef.current) macdRef.current.setData(indicators.macd ? macdSeries : []);
    if (sma20Ref.current) sma20Ref.current.setData(indicators.sma20 ? sma20Series : []);
    if (sma50Ref.current) sma50Ref.current.setData(indicators.sma50 ? sma50Series : []);
    if (bbUpperRef.current && bbMiddleRef.current && bbLowerRef.current) {
      bbUpperRef.current.setData(indicators.bb ? bbSeries.upper : []);
      bbMiddleRef.current.setData(indicators.bb ? bbSeries.middle : []);
      bbLowerRef.current.setData(indicators.bb ? bbSeries.lower : []);
    }
  }, [chartData, volumeData, indicators, rsiSeries, macdSeries, sma20Series, sma50Series, bbSeries]);

  function toggleIndicator(name: keyof typeof indicators) {
    const next = { ...indicators, [name]: !indicators[name] };
    if (indicatorVisibility && onIndicatorToggle) {
      onIndicatorToggle(name as any, next[name]);
    } else {
      setLocalIndicators(next as any);
    }
  }

  return (
    <div style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "#0f1629", padding: 12 }}>
      {showControls && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ color: "#9ca3af", fontSize: 12, fontWeight: 600 }}>Price Chart</div>
          <div style={{ display: "flex", gap: 8 }}>
            {TIMEFRAME_MAP.map((tf) => (
              <button
                key={tf.label}
                onClick={() => {
                  setTimeframe(tf);
                  onTimeframeChange?.(tf.label);
                }}
                style={{ background: timeframe.label === tf.label ? "rgba(0,255,65,0.12)" : "transparent", color: timeframe.label === tf.label ? "#00ff41" : "#9ca3af", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1, position: "relative" }}>
          {chartData.length === 0 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15, 22, 41, 0.8)", zIndex: 10, borderRadius: 8, flexDirection: "column" }}>
              <div style={{ color: "#ff3131", fontWeight: 600, marginBottom: 8 }}>Chart Data Unavailable</div>
              <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", maxWidth: 300 }}>
                Data provider is rate-limiting requests. The chart will update automatically when the rate limit resets.
              </div>
            </div>
          )}
          <div ref={containerRef} style={{ width: "100%", height }} />
        </div>

        {showControls && (
          <div style={{ width: 56, display: "flex", flexDirection: "column", gap: 8 }}>
            <button title="Trend Line" onClick={() => alert("Coming soon: Trend Line tool") } style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.04)", color: "#9ca3af", height: 40, borderRadius: 8 }}>
              TL
            </button>
            <button title="Horizontal Line" onClick={() => alert("Coming soon: Horizontal Line tool") } style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.04)", color: "#9ca3af", height: 40, borderRadius: 8 }}>
              H
            </button>
            <button title="Fibonacci" onClick={() => alert("Coming soon: Fibonacci tool") } style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.04)", color: "#9ca3af", height: 40, borderRadius: 8 }}>
              F
            </button>
            <button title="Rectangle" onClick={() => alert("Coming soon: Rectangle tool") } style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.04)", color: "#9ca3af", height: 40, borderRadius: 8 }}>
              R
            </button>
          </div>
        )}
      </div>

      {showControls && (
        <div style={{ display: "flex", gap: 12, marginTop: 10, alignItems: "center" }}>
          <label style={{ color: "#9ca3af", fontSize: 13 }}><input type="checkbox" checked={indicators.rsi} onChange={() => toggleIndicator("rsi") } /> RSI</label>
          <label style={{ color: "#9ca3af", fontSize: 13 }}><input type="checkbox" checked={indicators.macd} onChange={() => toggleIndicator("macd") } /> MACD</label>
          <label style={{ color: "#9ca3af", fontSize: 13 }}><input type="checkbox" checked={indicators.sma20} onChange={() => toggleIndicator("sma20") } /> SMA-20</label>
          <label style={{ color: "#9ca3af", fontSize: 13 }}><input type="checkbox" checked={indicators.sma50} onChange={() => toggleIndicator("sma50") } /> SMA-50</label>
          <label style={{ color: "#9ca3af", fontSize: 13 }}><input type="checkbox" checked={indicators.bb} onChange={() => toggleIndicator("bb") } /> Bollinger Bands</label>
        </div>
      )}
    </div>
  );
}

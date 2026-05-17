"use client";

import React, { useEffect, useState } from "react";
import { dismissPriceEvent, getPriceEvents } from "@/lib/api";

type EventItem = {
  id: string;
  ticker: string;
  change_pct: number;
  direction: string;
  price: number;
  explanation: string;
};

export default function EventAlert() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchEvents() {
      setLoading(true);
      try {
        const data = await getPriceEvents(6);
        if (active) setEvents(data);
      } catch {
        // silently fail
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchEvents();
    const interval = setInterval(fetchEvents, 300000); // refresh every 5 min
    return () => { active = false; clearInterval(interval); };
  }, []);

  if (loading && events.length === 0) return null;
  if (events.length === 0) return null;

  const dismiss = async (eventId: string) => {
    await dismissPriceEvent(eventId);
    setEvents((prev) => prev.filter((event) => event.id !== eventId));
    if (activeEvent?.id === eventId) {
      setActiveEvent(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
      {events.map((ev) => (
        <div
          key={ev.id}
          style={{
            padding: "12px 16px",
            borderRadius: 14,
            background: ev.direction === "up"
              ? "linear-gradient(135deg, rgba(0,255,65,0.06), rgba(0,255,65,0.02))"
              : "linear-gradient(135deg, rgba(255,49,49,0.06), rgba(255,49,49,0.02))",
            border: `1px solid ${ev.direction === "up" ? "rgba(0,255,65,0.2)" : "rgba(255,49,49,0.2)"}`,
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                padding: "3px 8px", borderRadius: 6,
                background: ev.direction === "up" ? "rgba(0,255,65,0.15)" : "rgba(255,49,49,0.15)",
                color: ev.direction === "up" ? "#00ff41" : "#ff3131",
              }}>
                {Math.abs(ev.change_pct) > 5 ? "⚠️" : "📊"} {ev.ticker}
              </span>
              <span style={{ fontSize: 13, color: "#dae2fd" }}>
                {ev.ticker} moved <span style={{ fontWeight: 700, color: ev.direction === "up" ? "#00ff41" : "#ff3131" }}>{ev.direction === "up" ? "+" : ""}{ev.change_pct}%</span> today - <button onClick={() => setActiveEvent(ev)} style={{ background: "none", border: "none", color: "#0a84ff", cursor: "pointer", fontSize: 13 }}>See why</button>
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>${ev.price.toFixed(2)}</span>
              <button onClick={() => void dismiss(ev.id)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#c7d3ff", borderRadius: 8, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}

      {activeEvent ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ maxWidth: 640, width: "100%", background: "#0f1629", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, color: "#e5e7eb" }}>{activeEvent.ticker} event analysis</h3>
              <button onClick={() => setActiveEvent(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer" }}>x</button>
            </div>
            <p style={{ marginTop: 10, fontSize: 13, color: "#c7d3ffcc", lineHeight: 1.7 }}>{activeEvent.explanation}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

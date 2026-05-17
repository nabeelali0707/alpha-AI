"use client";

import React, { useState, useRef, useEffect } from "react";
import { explainTermLLM } from "@/lib/api";

type Props = {
  term: string;
  ticker?: string;
  indicatorData?: string;
  children: React.ReactNode;
};

export default function TermExplainer({ term, ticker = "AAPL", indicatorData = "", children }: Props) {
  const [show, setShow] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClick = async () => {
    if (show) { setShow(false); return; }
    setShow(true);
    if (explanation) return;

    const cacheKey = `alphaai:term:${term.toLowerCase()}`;
    const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
    if (cached) {
      setExplanation(cached);
      return;
    }

    setLoading(true);
    try {
      const data = await explainTermLLM(term, ticker);
      setExplanation(data.explanation);
      if (typeof window !== "undefined" && data.explanation) {
        localStorage.setItem(cacheKey, data.explanation);
      }
    } catch {
      setExplanation("Unable to explain this term right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <span ref={ref} style={{ position: "relative", display: "inline" }}>
      <span
        onClick={handleClick}
        style={{
          cursor: "pointer",
          borderBottom: "1px dashed rgba(10, 132, 255, 0.5)",
          color: "inherit",
          transition: "all 0.2s ease",
        }}
        title={`Click to learn about ${term}`}
      >
        {children}
      </span>

      {show && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 320,
            padding: 16,
            borderRadius: 14,
            background: "rgba(15, 22, 41, 0.97)",
            border: "1px solid rgba(10, 132, 255, 0.25)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: 1000,
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.14em", color: "#0a84ff", fontWeight: 700 }}>
              📚 LEARN: {term.toUpperCase()}
            </span>
            <button
              onClick={() => setShow(false)}
              style={{
                background: "none", border: "none", color: "#94a3b8",
                cursor: "pointer", fontSize: 14, padding: 0,
              }}
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 16, color: "#94a3b8", fontSize: 12 }}>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Explaining...
            </div>
          ) : (
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "#dae2fd", margin: 0 }}>
              {explanation}
            </p>
          )}
        </div>
      )}
    </span>
  );
}

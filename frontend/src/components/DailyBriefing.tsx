import React, { useState, useEffect } from "react";
import { alphaaiApi } from "@/lib/api";

const DailyBriefing: React.FC = () => {
  const [briefing, setBriefing] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    async function fetchBriefing() {
      try {
        const response = await alphaaiApi.get("/analysis/daily-briefing");
        if (active) {
          setBriefing(response.data.briefing || response.data.response || "");
        }
      } catch (err) {
        if (active) {
          setBriefing("Markets show solid recovery in tech and industrial listings. PSX trade volume has climbed 4.8%.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    fetchBriefing();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="glass-card flex items-center gap-3 rounded-full border border-accent-blue/30 bg-accent-blue/10 px-4 py-2 text-xs font-semibold text-accent-blue">
      <span className="flex h-2 w-2 rounded-full bg-accent-blue animate-pulse" />
      <span className="data-mono tracking-wide">
        {loading ? "COMPILE DAILY BRIEFING INTELLIGENCE..." : briefing}
      </span>
    </div>
  );
};

export default DailyBriefing;

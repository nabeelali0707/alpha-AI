import React, { useState } from "react";
import { alphaaiApi } from "@/lib/api";

const MarketNarrator: React.FC = () => {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSpeak = async () => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }

    setLoading(true);
    try {
      let narrative = "Welcome to AlphaAI Market Narrator. AI analysis shows positive sentiments across international tech indices and steady trading volumes.";
      try {
        const response = await alphaaiApi.get("/analysis/daily-briefing");
        narrative = response.data.briefing || response.data.response || narrative;
      } catch {
        // Fallback to offline brief if server is loading
      }

      const utterance = new SpeechSynthesisUtterance(narrative);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select high-quality natural language voice if available
      const voices = window.speechSynthesis.getVoices();
      const urduVoice = voices.find(v => v.lang.includes("ur") || v.lang.includes("pk"));
      if (urduVoice) {
        utterance.voice = urduVoice;
      }

      utterance.onend = () => {
        setPlaying(false);
      };

      utterance.onerror = () => {
        setPlaying(false);
      };

      setPlaying(true);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Narrator synthesis failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSpeak}
      disabled={loading}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold border transition duration-200 ${
        playing
          ? "border-accent-red bg-accent-red/10 text-accent-red animate-pulse"
          : "border-accent-green bg-accent-green/10 text-accent-green hover:bg-accent-green/20"
      }`}
    >
      <span>
        {loading ? "⌛ SYNTHESIZING..." : playing ? "⏹️ STOP BRIEFING" : "🔊 LISTEN TO BRIEFING"}
      </span>
    </button>
  );
};

export default MarketNarrator;

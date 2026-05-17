import { useState, useEffect, useRef } from "react";
import { alphaaiApi } from "@/lib/api";

export function usePolling<T>(url: string, intervalMs: number, delayMs = 0) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const urlRef = useRef(url);
  urlRef.current = url;

  useEffect(() => {
    let active = true;
    let delayTimer: NodeJS.Timeout | null = null;
    let intervalTimer: NodeJS.Timeout | null = null;

    async function fetchData() {
      try {
        const response = await alphaaiApi.get<T>(urlRef.current);
        if (active) {
          setData(response.data);
          setError(null);
        }
      } catch (err: any) {
        if (active) {
          setError(err.response?.data?.detail || err.message || "Error polling data");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    // Delayed start
    delayTimer = setTimeout(() => {
      fetchData();
      
      // Setup interval after the first fetch completes
      intervalTimer = setInterval(fetchData, intervalMs);
    }, delayMs);

    return () => {
      active = false;
      if (delayTimer) clearTimeout(delayTimer);
      if (intervalTimer) clearInterval(intervalTimer);
    };
  }, [intervalMs, delayMs]);

  const refetch = async () => {
    setLoading(true);
    try {
      const response = await alphaaiApi.get<T>(urlRef.current);
      setData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Error refetching data");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}

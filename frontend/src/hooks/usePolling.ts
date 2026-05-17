"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PollingState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

function resolveBaseUrl() {
  const rawBase = process.env.NEXT_PUBLIC_ALPHAAI_API_BASE_URL ?? "http://localhost:8001/api/v1";

  if (/^https?:\/\//i.test(rawBase)) {
    return rawBase;
  }

  if (rawBase.startsWith(":")) {
    return `http://localhost${rawBase}`;
  }

  return `http://${rawBase}`;
}

/**
 * Generic polling hook with stagger support.
 *
 * @param url        API path (appended to base URL)
 * @param intervalMs Time between each poll cycle
 * @param delayMs    Initial delay before the first fetch (use this to stagger
 *                   multiple polling hooks so they don't all fire at once)
 * @param options    Optional RequestInit for the fetch call
 */
export function usePolling<T>(
  url: string | null,
  intervalMs: number,
  delayMs: number = 0,
  options?: RequestInit,
): PollingState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(url));
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const base = resolveBaseUrl();
      const finalUrl = url.startsWith("http") ? url : `${base}${url.startsWith("/") ? "" : "/"}${url}`;
      const response = await fetch(finalUrl, options);
      if (!response.ok) {
        throw new Error(`Polling request failed (${response.status})`);
      }
      const json = (await response.json()) as T;
      if (mountedRef.current) {
        setData(json);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Polling failed");
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [url, options]);

  useEffect(() => {
    mountedRef.current = true;
    if (!url) {
      setLoading(false);
      setData(null);
      setError(null);
      return () => {
        mountedRef.current = false;
      };
    }

    // Staggered start: wait `delayMs` before the first fetch + interval
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const timeoutId = setTimeout(() => {
      // Initial fetch after delay
      void refetch();
      // Then repeat at the configured interval
      intervalId = setInterval(() => {
        void refetch();
      }, intervalMs);
    }, delayMs);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [url, intervalMs, delayMs, refetch]);

  return { data, error, loading, refetch };
}

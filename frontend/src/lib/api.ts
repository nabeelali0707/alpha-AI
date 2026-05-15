import axios from "axios";

const rawBase = process.env.NEXT_PUBLIC_ALPHAAI_API_BASE_URL ?? "http://localhost:8001/api/v1";

let baseURL = rawBase;
if (!/^https?:\/\//i.test(baseURL)) {
  if (baseURL.startsWith(':')) {
    baseURL = `http://localhost${baseURL}`;
  } else {
    baseURL = `http://${baseURL}`;
  }
  // Helpful warning for misconfigured environments during development
  // eslint-disable-next-line no-console
  console.warn(`Normalized NEXT_PUBLIC_ALPHAAI_API_BASE_URL to ${baseURL}`);
}

export const alphaaiApi = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export type StockPrice = {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  timestamp: string;
};

export type StockHistoryEntry = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type StockMetadata = {
  symbol: string;
  name?: string | null;
  sector?: string | null;
  industry?: string | null;
  market_cap?: number | null;
  pe_ratio?: number | null;
  dividend_yield?: number | null;
  fifty_two_week_high?: number | null;
  fifty_two_week_low?: number | null;
  description?: string | null;
  website?: string | null;
};

export type SentimentSummary = {
  label: string;
  score: number;
  total_articles: number;
  breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
};

export type TechnicalIndicators = {
  rsi: {
    value: number;
    signal: string;
  };
  moving_averages: {
    trend: string;
  };
  macd: {
    signal: string;
  };
  volatility: {
    risk_level: string;
  };
};

export type Recommendation = {
  symbol: string;
  recommendation: "BUY" | "SELL" | "HOLD" | string;
  confidence: number;
  score: number;
  explanation: string;
  reasons: string[];
  technical_indicators?: TechnicalIndicators | null;
  sentiment_summary?: SentimentSummary | null;
  price_data?: StockPrice | null;
};

export type NewsArticle = {
  headline: string;
  source: string;
  url: string;
  published_date: string;
  description?: string;
};

export type DashboardResponse = {
  symbol: string;
  price: StockPrice;
  history: StockHistoryEntry[];
  metadata?: StockMetadata | null;
  sentiment?: Record<string, unknown> | null;
  recommendation?: Recommendation | null;
  technical_indicators?: TechnicalIndicators | null;
};

export async function getStockPrice(ticker: string) {
  const response = await alphaaiApi.get<StockPrice>(`/stocks/${ticker}`);
  return response.data;
}

export async function getStockHistory(ticker: string, period = "1mo", interval = "1d") {
  const response = await alphaaiApi.get<StockHistoryEntry[]>(`/stocks/${ticker}/history`, {
    params: { period, interval },
  });
  return response.data;
}

export async function getStockInfo(ticker: string) {
  const response = await alphaaiApi.get<StockMetadata>(`/stocks/${ticker}/info`);
  return response.data;
}

export async function getStockNews(ticker: string) {
  const response = await alphaaiApi.get<NewsArticle[]>(`/analysis/news/${ticker}`);
  return response.data;
}

export async function getSentiment(ticker: string) {
  const response = await alphaaiApi.get(`/analysis/sentiment/${ticker}`);
  return response.data;
}

export async function getRecommendation(ticker: string) {
  const response = await alphaaiApi.get<Recommendation>(`/analysis/recommend/${ticker}`);
  return response.data;
}

export async function getTechnicalIndicators(ticker: string) {
  const response = await alphaaiApi.get(`/analysis/technical/${ticker}`);
  return response.data;
}

export async function getDashboard(ticker: string) {
  const response = await alphaaiApi.get<DashboardResponse>(`/analysis/dashboard/${ticker}`);
  return response.data;
}

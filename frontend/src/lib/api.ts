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

export type SearchResult = {
  symbol: string;
  name: string;
  sector?: string;
  market?: string;
};

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
  bollinger_bands?: Record<string, unknown> | null;
  rsi_series?: { date: string; value: number }[];
  macd_series?: { date: string; value: number }[];
  sma_20_series?: { date: string; value: number }[];
  sma_50_series?: { date: string; value: number }[];
  bollinger_series?: {
    upper: { date: string; value: number }[];
    middle: { date: string; value: number }[];
    lower: { date: string; value: number }[];
  };
};

export type Recommendation = {
  symbol: string;
  recommendation: "BUY" | "SELL" | "HOLD" | string;
  confidence: number;
  score: number;
  explanation: string;
  urdu_explanation?: string | null;
  reasons: string[];
  technical_indicators?: TechnicalIndicators | null;
  sentiment_summary?: SentimentSummary | null;
  price_data?: StockPrice | null;
  win_probability?: number | null;
};

export type MarketItem = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  volume?: number | null;
};

export type LiveCryptoMarketItem = {
  symbol: string;
  name: string;
  price: number;
  market_cap: number;
  market_cap_rank?: number | null;
  volume_24h: number;
  change_24h: number;
  image?: string;
  timestamp: string;
};

export type LiveForexMarketItem = {
  pair: string;
  base: string;
  quote: string;
  rate: number;
  timestamp: string;
  source?: string;
};

export type LiveCommodityMarketItem = {
  symbol: string;
  name: string;
  unit: string;
  price: number;
  high: number;
  low: number;
  volume: number;
  change: number;
  change_pct: number;
  timestamp: string;
  source?: string;
};

export type MarketOverview = {
  PSX: MarketItem[];
  US: MarketItem[];
  CRYPTO: MarketItem[];
  FOREX: MarketItem[];
  COMMODITIES: MarketItem[];
  INDICES: MarketItem[];
};

export type PortfolioHolding = {
  id: string;
  symbol: string;
  quantity: number;
  entry_price: number;
  entry_date: string;
  notes?: string | null;
  market?: string | null;
  company_name?: string | null;
  current_price?: number;
  market_value?: number;
  gain_loss?: number;
  gain_loss_percentage?: number;
  daily_change_percentage?: number;
};

export type PortfolioAllocation = {
  symbol: string;
  percentage: number;
};

export type PortfolioSummary = {
  total_value: number;
  total_cost: number;
  total_gain_loss: number;
  total_gain_loss_percentage: number;
  daily_gain_loss: number;
  daily_gain_loss_percentage: number;
  best_performing_asset?: string | null;
  worst_performing_asset?: string | null;
  allocation: PortfolioAllocation[];
  holdings: PortfolioHolding[];
};

export type PortfolioHistoryEntry = {
  portfolio_value: number;
  recorded_at: string;
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

export async function getRecommendations() {
  const response = await alphaaiApi.get<Recommendation[]>("/analysis/recommendations");
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
export async function searchStocks(query: string, limit = 8) {
  try {
    const response = await alphaaiApi.get<any[]>(`/stocks/search/${encodeURIComponent(query)}`);
    return response.data.map((item) => ({
      symbol: item.symbol,
      name: item.description || item.name || item.symbol,
      sector: item.type || "Common Stock",
      market: "US"
    }));
  } catch (err) {
    const response = await alphaaiApi.get<SearchResult[]>(`/stocks/search/autocomplete`, {
      params: { q: query, limit },
    });
    return response.data;
  }
}

function mapLiveCryptoToMarketItem(coin: LiveCryptoMarketItem): MarketItem {
  const changePercent = coin.change_24h ?? 0;
  const change = coin.price && changePercent ? (coin.price * changePercent) / 100 : 0;
  return {
    symbol: coin.symbol,
    name: coin.name,
    price: coin.price,
    change,
    change_percent: changePercent,
    volume: coin.volume_24h ?? null,
  };
}

function mapLiveForexToMarketItem(pair: LiveForexMarketItem): MarketItem {
  return {
    symbol: pair.pair,
    name: `${pair.base}/${pair.quote}`,
    price: pair.rate,
    change: 0,
    change_percent: 0,
    volume: null,
  };
}

function mapLiveCommodityToMarketItem(commodity: LiveCommodityMarketItem): MarketItem {
  return {
    symbol: commodity.symbol,
    name: commodity.name,
    price: commodity.price,
    change: commodity.change,
    change_percent: commodity.change_pct,
    volume: commodity.volume,
  };
}

export async function getMarketOverview(): Promise<MarketOverview> {
  const response = await alphaaiApi.get<MarketOverview>("/stocks/market/overview");
  return response.data;
}

export async function getPSXStocks(): Promise<MarketItem[]> {
  const response = await alphaaiApi.get<MarketItem[]>("/stocks/market/psx");
  return response.data;
}

export async function getCryptoMarket(): Promise<MarketItem[]> {
  const response = await alphaaiApi.get<LiveCryptoMarketItem[]>("/live/crypto/all", {
    params: { currency: "usd", limit: 12 },
  });
  return (response.data ?? []).map((coin) => ({
    symbol: coin.symbol,
    name: coin.name,
    price: coin.price,
    change: Number(((coin.price ?? 0) * ((coin.change_24h ?? 0) / 100)).toFixed(2)),
    change_percent: coin.change_24h ?? 0,
    volume: coin.volume_24h ?? 0,
  }));
}

export async function getForexMarket(): Promise<MarketItem[]> {
  const response = await alphaaiApi.get<Array<{ pair: string; base: string; quote: string; rate: number }>>("/live/forex/all");
  return (response.data ?? []).map((item) => ({
    symbol: item.pair,
    name: item.pair,
    price: item.rate,
    change: 0,
    change_percent: 0,
    volume: null,
  }));
}

export async function getCommodityMarket(): Promise<MarketItem[]> {
  const response = await alphaaiApi.get<LiveCommodityMarketItem[]>("/live/commodity/all");
  return (response.data ?? []).map(mapLiveCommodityToMarketItem);
}

export async function getPortfolioHoldings(token: string): Promise<PortfolioHolding[]> {
  const response = await alphaaiApi.get<PortfolioHolding[]>("/portfolio/holdings", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function addPortfolioHolding(token: string, payload: Partial<PortfolioHolding>) {
  const response = await alphaaiApi.post("/portfolio/holdings", {
    symbol: payload.symbol,
    quantity: payload.quantity,
    average_buy_price: payload.entry_price,
    market: payload.market,
    company_name: payload.company_name,
    notes: payload.notes
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function updatePortfolioHolding(token: string, id: string, payload: Partial<PortfolioHolding>) {
  const response = await alphaaiApi.put(`/portfolio/holdings/${id}`, {
    quantity: payload.quantity,
    average_buy_price: payload.entry_price,
    notes: payload.notes
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function removePortfolioHolding(token: string, id: string) {
  const response = await alphaaiApi.delete(`/portfolio/holdings/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getPortfolioSummary(token: string): Promise<PortfolioSummary> {
  const response = await alphaaiApi.get<PortfolioSummary>("/portfolio/summary", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getPortfolioHistory(token: string, period = "1M"): Promise<PortfolioHistoryEntry[]> {
  const response = await alphaaiApi.get<PortfolioHistoryEntry[]>("/portfolio/history", {
    params: { period },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getPortfolioAnalytics(token: string) {
  const response = await alphaaiApi.get("/portfolio/analytics", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export type PortfolioAdvisorRequest = {
  holdings_json: string;
  total_value?: string;
  total_pnl?: string;
  pnl_percent?: string;
  top_sector?: string;
  question?: string;
  language?: string;
};

export type AIEndpointResponse = {
  response: string;
};

export async function getFearGreed() {
  const response = await alphaaiApi.get<{
    value: number;
    classification: string;
    explanation: string;
  }>("/market/fear-greed");
  return response.data;
}

export async function getPortfolioAdvice(payload: PortfolioAdvisorRequest) {
  const response = await alphaaiApi.post<AIEndpointResponse>("/analysis/portfolio-advisor", payload);
  return response.data;
}

export type TermExplainerResponse = {
  explanation: string;
};

export async function explainTermLLM(
  term: string,
  ticker = "AAPL",
  experience_level = "beginner",
  indicator_data = "",
  language = "en",
): Promise<TermExplainerResponse> {
  const response = await alphaaiApi.post<TermExplainerResponse>("/ai/explain-term", {
    term,
    ticker,
    experience_level,
    indicator_data,
    language,
  });
  return response.data;
}

export type ScamCheckResult = {
  verdict: string;
  red_flags: string[];
  actual_data: string;
  ticker?: string | null;
};

export async function checkScamTip(tipText: string, ticker = ""): Promise<ScamCheckResult> {
  const response = await alphaaiApi.post<ScamCheckResult>("/ai/scam-check", {
    tip_text: tipText,
    ticker,
    language: "en",
  });
  return response.data;
}

export async function getCryptoHistory(symbol: string, days = 30) {
  const response = await alphaaiApi.get(`/live/crypto/history/${symbol}`, { params: { days } });
  return response.data;
}

export async function getForexHistory(pair: string, days = 30) {
  const response = await alphaaiApi.get(`/live/forex/history/${pair}`, { params: { days } });
  return response.data;
}

export async function getStockComparison(tickerA: string, tickerB: string, language = "en") {
  const response = await alphaaiApi.post(`/analysis/compare`, {
    ticker_a: tickerA,
    ticker_b: tickerB,
    language
  });
  return response.data;
}

export const getStockPriceHistory = getStockHistory;

export type PriceEvent = {
  id: string;
  ticker: string;
  change_pct: number;
  direction: string;
  price: number;
  explanation: string;
};

export async function getPriceEvents(limit = 6): Promise<PriceEvent[]> {
  const response = await alphaaiApi.get<PriceEvent[]>("/events/price-events", {
    params: { limit },
  });
  return response.data;
}

export async function dismissPriceEvent(eventId: string) {
  const response = await alphaaiApi.delete(`/events/price-events/${eventId}`);
  return response.data;
}


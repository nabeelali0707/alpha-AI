import axios from "axios";

const rawBase = process.env.NEXT_PUBLIC_ALPHAAI_API_BASE_URL ?? "http://localhost:8001/api/v1";

let baseURL = rawBase;
if (!/^https?:\/\//i.test(baseURL)) {
  if (baseURL.startsWith(':')) {
    baseURL = `http://localhost${baseURL}`;
  } else {
    baseURL = `http://${baseURL}`;
  }
  console.warn(`Normalized NEXT_PUBLIC_ALPHAAI_API_BASE_URL to ${baseURL}`);
}

export const alphaaiApi = axios.create({
  baseURL,
  timeout: 45000,
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
  win_probability?: number | null;
  disclaimer?: string | null;
  technical_indicators?: TechnicalIndicators | null;
  sentiment_summary?: SentimentSummary | null;
  price_data?: StockPrice | null;
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

export type AIEndpointResponse = {
  prompt: string;
  response: string;
};

export type ChatRequest = {
  ticker: string;
  question: string;
  price?: string;
  rsi?: string;
  rsi_signal?: string;
  macd_signal?: string;
  ma_trend?: string;
  sentiment_label?: string;
  sentiment_score?: string;
  total_articles?: string;
  recommendation?: string;
  confidence?: string;
  reasons?: string[];
  language?: string;
};

export type PortfolioAdvisorRequest = {
  holdings_json: string;
  total_value: string;
  total_pnl: string;
  pnl_percent: string;
  top_sector: string;
  question: string;
  language?: string;
};

export type NewsSummaryRequest = {
  ticker: string;
  headlines: string[];
};

export type UrduExplanationRequest = {
  ticker: string;
  signal: string;
  confidence: string;
  rsi_value: string;
  rsi_signal: string;
  sentiment_label: string;
  ma_trend: string;
  top_reason: string;
};

export type SectorHeatmapRequest = {
  sector: string;
  stock_sentiment_list: string;
};

export type EarningsRequest = {
  ticker: string;
  days_until: string;
  beat_1?: string;
  move_1?: string;
  beat_miss_2?: string;
  beat_2?: string;
  move_2?: string;
  beat_miss_3?: string;
  beat_3?: string;
  move_3?: string;
  beat_miss_4?: string;
  beat_4?: string;
  move_4?: string;
  sentiment_label?: string;
  recommendation?: string;
};

export type MacroRequest = {
  ticker: string;
  sector: string;
  sbp_rate: string;
  usd_pkr: string;
  inflation: string;
  kse100: string;
  kse_change: string;
  language?: string;
};

export type RiskAnalyzerRequest = {
  holdings_json: string;
  max_weight: string;
  max_stock: string;
  top_sector: string;
  sector_weight: string;
  most_volatile: string;
  beta: string;
  pnl: string;
  language?: string;
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

export async function chatWithAlphaAI(payload: ChatRequest) {
  const response = await alphaaiApi.post<AIEndpointResponse>("/analysis/chat", payload);
  return response.data;
}

export async function getPortfolioAdvice(payload: PortfolioAdvisorRequest) {
  const response = await alphaaiApi.post<AIEndpointResponse>("/analysis/portfolio-advisor", payload);
  return response.data;
}

export async function summarizeNewsWithAlphaAI(payload: NewsSummaryRequest) {
  const response = await alphaaiApi.post<AIEndpointResponse>("/analysis/news-summary", payload);
  return response.data;
}

export async function explainInUrdu(payload: UrduExplanationRequest) {
  const response = await alphaaiApi.post<AIEndpointResponse>("/analysis/urdu-explanation", payload);
  return response.data;
}

export async function analyzeSectorHeatmap(payload: SectorHeatmapRequest) {
  const response = await alphaaiApi.post<AIEndpointResponse>("/analysis/sector-heatmap", payload);
  return response.data;
}

export async function getEarningsPreview(payload: EarningsRequest) {
  const response = await alphaaiApi.post<AIEndpointResponse>("/analysis/earnings", payload);
  return response.data;
}

export async function getMacroContext(payload: MacroRequest) {
  const response = await alphaaiApi.post<AIEndpointResponse>("/analysis/macro-context", payload);
  return response.data;
}

export async function analyzeRisk(payload: RiskAnalyzerRequest) {
  const response = await alphaaiApi.post<AIEndpointResponse>("/analysis/risk-analyzer", payload);
  return response.data;
}
export async function searchStocks(query: string, limit = 8) {
  const response = await alphaaiApi.get<SearchResult[]>(`/stocks/search/autocomplete`, {
    params: { q: query, limit },
  });
  return response.data;
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

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  ADA: "cardano",
  XRP: "ripple",
  DOGE: "dogecoin",
  MATIC: "matic-network",
  LINK: "chainlink",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  XLM: "stellar",
  USDC: "usd-coin",
  USDT: "tether",
  AVAX: "avalanche-2",
  ATOM: "cosmos",
  NEAR: "near",
  ALGO: "algorand",
};

export async function getCryptoHistory(symbol: string, days = 30): Promise<StockHistoryEntry[]> {
  const coinId = COINGECKO_IDS[symbol.toUpperCase()];
  if (!coinId) {
    return [];
  }

  const response = await axios.get<{ prices: [number, number][] }>(
    `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
    {
      params: {
        vs_currency: "usd",
        days,
        interval: "daily",
      },
      timeout: 20000,
    },
  );

  const prices = response.data?.prices ?? [];

  return prices.map(([timestamp, close], index) => {
    const previousClose = index > 0 ? prices[index - 1][1] : close;
    const open = Number(previousClose);
    const price = Number(close);
    const high = Math.max(open, price);
    const low = Math.min(open, price);

    return {
      date: new Date(timestamp).toISOString(),
      open,
      high,
      low,
      close: price,
      volume: 0,
    };
  });
}

function formatDateYYYYMMDD(date: Date): string {
  return date.toISOString().split("T")[0];
}

export async function getForexHistory(pair: string, days = 30): Promise<StockHistoryEntry[]> {
  const normalizedPair = pair.replace("-", "/").toUpperCase();
  const [base, quote] = normalizedPair.split("/");

  if (!base || !quote) {
    return [];
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const response = await axios.get<{ rates: Record<string, Record<string, number>> }>(
    `https://api.frankfurter.app/${formatDateYYYYMMDD(startDate)}..${formatDateYYYYMMDD(endDate)}`,
    {
      params: {
        from: base,
        to: quote,
      },
      timeout: 20000,
    },
  );

  const rates = response.data?.rates ?? {};
  const sortedDates = Object.keys(rates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return sortedDates.map((date, index) => {
    const close = Number(rates[date]?.[quote] ?? 0);
    const previousDate = index > 0 ? sortedDates[index - 1] : null;
    const previousClose = previousDate ? Number(rates[previousDate]?.[quote] ?? close) : close;
    const open = previousClose;

    return {
      date: `${date}T00:00:00Z`,
      open,
      high: Math.max(open, close),
      low: Math.min(open, close),
      close,
      volume: 0,
    };
  });
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

// ── AI Features (10 new endpoints) ─────────────────────────────────────────

export async function getMarketNarration(language = "en") {
  const response = await alphaaiApi.post("/ai/narrator", { language });
  return response.data as { narration: string; language: string };
}

export async function getMarketBriefing(language = "en") {
  const response = await alphaaiApi.get("/market/briefing", { params: { language } });
  return response.data as { briefing: string; language: string; snapshot: unknown[] };
}

export async function getFearGreed(holdings?: string) {
  const response = await alphaaiApi.get("/market/fear-greed", { params: { holdings } });
  return response.data as { value: number; classification: string; timestamp?: string; explanation: string };
}

export async function getCandlePattern(ticker: string, timeframe = "1d", language = "en") {
  const response = await alphaaiApi.post("/ai/candle-pattern", { ticker, timeframe, language });
  return response.data as { ticker: string; pattern: string; explanation: string; candles: unknown[] };
}

export async function getEventDetection(language = "en") {
  const response = await alphaaiApi.get("/ai/events", { params: { language } });
  return response.data as Array<{ ticker: string; change_pct: number; direction: string; price: number; explanation: string }>;
}

export async function getDailyBriefing(watchlist: string[], language = "en") {
  const response = await alphaaiApi.post("/ai/daily-briefing", { watchlist, language });
  return response.data as { briefing: string; date: string };
}

export async function explainTerm(term: string, ticker = "AAPL", experienceLevel = "beginner", indicatorData = "", language = "en") {
  const response = await alphaaiApi.post("/ai/explain-term", {
    term, ticker, experience_level: experienceLevel, indicator_data: indicatorData, language,
  });
  return response.data as { term: string; ticker: string; explanation: string };
}

export async function explainTermLLM(term: string, ticker = "AAPL", language = "en") {
  const response = await alphaaiApi.post("/chat/term", { term, ticker, language });
  return response.data as { term: string; ticker?: string; explanation: string };
}

export async function compareStocks(tickerA: string, tickerB: string, language = "en") {
  const response = await alphaaiApi.post("/ai/compare", { ticker_a: tickerA, ticker_b: tickerB, language });
  return response.data as { ticker_a: string; ticker_b: string; comparison: string };
}

export async function getStockComparison(tickerA: string, tickerB: string, language = "en") {
  const response = await alphaaiApi.post("/chat/compare", { ticker_a: tickerA, ticker_b: tickerB, language });
  return response.data as {
    ticker_a: string;
    ticker_b: string;
    left: { ticker: string; price?: { price?: number; change_percent?: number } };
    right: { ticker: string; price?: { price?: number; change_percent?: number } };
    analysis: { winner?: string; confidence?: number; summary?: string; left_reasons?: string[]; right_reasons?: string[] };
  };
}

export async function getBacktestStory(ticker: string, amount = 50000, months = 6, currency = "PKR", language = "en") {
  const response = await alphaaiApi.post("/ai/backtest", { ticker, amount, months, currency, language });
  return response.data as { ticker: string; story: string; start_price: number; current_price: number; return_pct: number; current_value: number };
}

export async function getEntryTiming(ticker: string, language = "en") {
  const response = await alphaaiApi.post("/ai/entry-timing", { ticker, language });
  return response.data as { ticker: string; analysis: string; current_price: number };
}

export async function checkScam(tipText: string, ticker: string, language = "en") {
  const response = await alphaaiApi.post("/ai/scam-check", { tip_text: tipText, ticker, language });
  return response.data as { ticker: string; tip: string; verdict: string };
}

export async function checkScamTip(tipText: string, language = "en") {
  const response = await alphaaiApi.post("/chat/scam-check", { tip_text: tipText, language });
  return response.data as { ticker?: string | null; tip: string; verdict: string; red_flags: string[]; actual_data: string };
}

export async function getPriceEvents(limit = 10) {
  const response = await alphaaiApi.get("/events/latest", { params: { limit } });
  return response.data as Array<{ id: string; ticker: string; change_pct: number; direction: string; price: number; explanation: string; created_at?: string }>;
}

export async function dismissPriceEvent(eventId: string) {
  const response = await alphaaiApi.post(`/events/${eventId}/dismiss`);
  return response.data as { ok: boolean; event_id: string };
}

export async function getTradeReview(ticker: string, buyPrice: number, buyDate: string, sellPrice: number, sellDate: string, language = "en") {
  const response = await alphaaiApi.post("/ai/trade-review", {
    ticker, buy_price: buyPrice, buy_date: buyDate, sell_price: sellPrice, sell_date: sellDate, language,
  });
  return response.data as { ticker: string; review: string; pnl: number; pnl_pct: number; days_held: number };
}

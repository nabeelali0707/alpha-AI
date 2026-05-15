# 🐉 DRAGON1 — Phase 2: Expanded Financial Data API

## Overview

This update extends the AlphaAI backend with **deeper financial data capabilities** and **broader AI recommendation coverage**. Two new API endpoints expose fundamental financial statements and corporate action history, while the recommendation engine now tracks a wider universe of market-leading equities.

---

## New Endpoints

### `GET /api/v1/stocks/{symbol}/financials`

Returns the company's core financial statements sourced from yfinance:

| Field              | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| `income_statement` | Revenue, expenses, net income, and other P&L line items    |
| `balance_sheet`    | Assets, liabilities, and shareholders' equity              |
| `cash_flow`        | Operating, investing, and financing cash flow activities   |

Each statement is keyed by **reporting date** (YYYY-MM-DD) with individual line-item breakdowns. Missing or unavailable values are returned as `null`.

**Example request:**
```
GET /api/v1/stocks/AAPL/financials
```

---

### `GET /api/v1/stocks/{symbol}/actions`

Returns historical **dividends** and **stock splits** for a given ticker:

| Field       | Description                                      |
| ----------- | ------------------------------------------------ |
| `dividends` | Historical dividend payments keyed by ex-date     |
| `splits`    | Historical stock split ratios keyed by split date |

Dates are returned as string keys in **YYYY-MM-DD** format. Values are floats (dividend amount in USD, split ratio).

**Example request:**
```
GET /api/v1/stocks/MSFT/actions
```

---

## Expanded AI Recommender Tracking List

The `get_top_picks` method in the recommendation engine now defaults to a broader set of **9 tickers** covering mega-cap tech and market leaders:

| Previous (5)                     | Updated (9)                                              |
| -------------------------------- | -------------------------------------------------------- |
| NVDA, AAPL, MSFT, TSLA, AMD     | NVDA, AAPL, MSFT, TSLA, AMD, **META, GOOGL, AMZN, PLTR** |

This provides more diversified AI-powered recommendations across the technology sector and broader market.

---

## Files Modified

| File                              | Change                                           |
| --------------------------------- | ------------------------------------------------ |
| `services/stock_service.py`       | Added `get_financials()` and `get_corporate_actions()` methods |
| `routes/stocks.py`                | Added `/{symbol}/financials` and `/{symbol}/actions` endpoints |
| `services/recommender.py`         | Expanded default tickers list from 5 → 9         |
| `DRAGON1.md`                      | This documentation file (new)                    |

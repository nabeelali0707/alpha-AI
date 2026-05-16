import sys
import traceback

# Put backend path first so imports resolve when running from the tests folder.
sys.path.insert(0, r"c:\Users\ALVI TECH\OneDrive - FAST National University\Desktop\alpha ai\backend")

try:
    import yfinance as yf
    import pandas as pd

    ticker = "TSLA"
    print(f"Fetching data for {ticker}...\n")

    stock = yf.Ticker(ticker)
    info = {}
    price = None
    company_name = None
    market_cap = None
    volume = None

    fast_info = getattr(stock, "fast_info", None)
    if fast_info:
        try:
            price = fast_info.get("last_price") or fast_info.get("last")
            volume = fast_info.get("volume") or volume
        except Exception:
            pass

    if price is None:
        try:
            info = stock.info or {}
        except Exception as exc:
            info = {}
            print(f"Warning: failed to fetch stock.info - {exc}")

        price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("previousClose")
        company_name = info.get("longName") or info.get("shortName")
        market_cap = info.get("marketCap")
        volume = info.get("volume") or info.get("regularMarketVolume")

    try:
        hist = stock.history(period="5d", interval="1d")
    except Exception as exc:
        hist = None
        print(f"Warning: failed to fetch historical data - {exc}")

    if price is None and (hist is None or hist.empty):
        raise RuntimeError("Unable to fetch TSLA data from yfinance. This may be due to Yahoo rate limiting or network restrictions.")

    print("Current stock price:", price)
    print("Company name:", company_name)
    print("Market cap:", market_cap)
    print("Volume:", volume)

    print("\nHistorical data (last 5 days):")
    if hist is None or hist.empty:
        print("No historical data returned.")
    else:
        print(hist[["Open", "High", "Low", "Close", "Volume"]].tail(5).to_string())

    print("\nSuccess: yfinance is installed and returned TSLA data.")
except Exception:
    traceback.print_exc()
    sys.exit(1)

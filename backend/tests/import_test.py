import sys
import traceback
import asyncio

# Ensure backend package path is first
sys.path.insert(0, r"c:\Users\ALVI TECH\OneDrive - FAST National University\Desktop\alpha ai\backend")

try:
    import torch
    import transformers
    import fastapi
    print("torch", getattr(torch, '__version__', 'unknown'))
    print("transformers", getattr(transformers, '__version__', 'unknown'))
    print("fastapi", getattr(fastapi, '__version__', 'unknown'))

    from services.sentiment_ai import SentimentService
    svc = SentimentService()
    # run the async analyze method
    res = asyncio.run(svc.analyze('AAPL'))
    print('SentimentService result:', res)
except Exception as e:
    traceback.print_exc()
    sys.exit(1)

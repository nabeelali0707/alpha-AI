import httpx
from models.stock import StockPrice, StockMetadata

class StockApiService:
    def __init__(self):
        self.api_key = "DEMO_KEY"  # Load from env in production

    async def fetch_price(self, symbol: str) -> StockPrice:
        # Simulated API call
        return StockPrice(
            symbol=symbol,
            price=924.79,
            change_percent=2.4,
            volume=45000000,
            timestamp="2026-05-14T14:30:00Z"
        )

    async def fetch_metadata(self, symbol: str) -> StockMetadata:
        # Simulated API call
        return StockMetadata(
            symbol=symbol,
            name="NVIDIA Corporation",
            sector="Technology",
            industry="Semiconductors",
            market_cap=2000000000000,
            description="AI compute and graphics leader."
        )

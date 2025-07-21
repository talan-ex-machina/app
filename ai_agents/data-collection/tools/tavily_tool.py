from core.base_tool import BaseTool
from config import TAVILY_API_KEY
from tavily import TavilyClient

class TavilySearchTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="tavily_search",
            description="Searches for top products in an industry using Tavily API."
        )
        self.client = TavilyClient(api_key=TAVILY_API_KEY)

    def run(self, input: dict, context: dict) -> dict:
        industry = input.get("industry")
        country = input.get("country")
        if not industry:
            return {"error": "Industry is required."}
        # Compose search query for Tavily
        query = f"Top products in {industry}" + (f" in {country}" if country else "")
        try:
            response = self.client.search(query)
            # You may need to parse response to extract product names
            # For now, return the raw response
            return {"top_products": response.get("results", response)}
        except Exception as e:
            return {"error": str(e)}

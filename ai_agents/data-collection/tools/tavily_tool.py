from core.base_tool import BaseTool
from config import TAVILY_API_KEY
from tavily import TavilyClient

class TavilySearchTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="tavily_search",
            description="Searches for top products in an industry using Tavily API."
        )
        if not TAVILY_API_KEY:
            raise ValueError("TAVILY_API_KEY is required but not found in configuration.")
        self.client = TavilyClient(api_key=TAVILY_API_KEY)

    def run(self, input: dict, context: dict) -> dict:
        industry = input.get("industry")
        country = input.get("country")
        if not industry:
            return {"error": "Industry is required."}
        
        # Compose search query for Tavily to find SOFTWARE PRODUCTS, not companies
        # This is critical - we want products that would be listed on G2, not consulting companies
        if "consulting" in industry.lower():
            # For consulting industries, look for software tools they use
            query = f"best software tools for {industry} services" + (f" in {country}" if country else "")
        elif "software" in industry.lower() or "technology" in industry.lower():
            # For software industries, look for products directly
            query = f"top software products in {industry}" + (f" in {country}" if country else "")
        else:
            # For other industries, look for software solutions
            query = f"best software solutions for {industry} industry" + (f" in {country}" if country else "")
            
        try:
            response = self.client.search(query)
            # You may need to parse response to extract product names
            # For now, return the raw response
            return {"top_products": response.get("results", response)}
        except Exception as e:
            return {"error": str(e)}

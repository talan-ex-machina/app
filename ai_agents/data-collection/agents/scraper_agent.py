from tools.scraper_tool import ScraperTool
from langgraph.graph import StateGraph, END

class ScraperAgent:
    def __init__(self):
        self.scraper_tool = ScraperTool()

    def run(self, input: dict, context: dict = None):
        # Only use the G2 tool for scraping
        return self.scraper_tool.run(input, context or {})

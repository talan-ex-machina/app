from tools.g2_tool import G2ScraperTool
from core.base_tool import BaseTool
from core.structurer import DataStructurer
from config import GOOGLE_API_KEY

class ScraperTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="scrape_and_structure",
            description="Scrapes and structures data from G2 only."
        )
        self.g2_tool = G2ScraperTool()
        self.structurer = DataStructurer(api_key=GOOGLE_API_KEY)
        self.retry_feedback = None  # Store last feedback if needed

    def run(self, input: dict, context: dict) -> dict:
        # Use feedback to adjust scraping if provided
        if self.retry_feedback:
            # Implement logic to modify scraping based on feedback
            pass
        # Only use G2ScraperTool for now
        g2_result = self.g2_tool.run(input, context)
        return {"structured_data": g2_result}

class FeedbackTool(BaseTool):
    def __init__(self, scraper_tool: ScraperTool):
        super().__init__(
            name="receive_feedback",
            description="Receive judge feedback to improve scraping"
        )
        self.scraper_tool = scraper_tool

    def run(self, input: dict, context: dict) -> dict:
        feedback = input.get("feedback", "")
        if feedback:
            # Save feedback for the next scrape call
            self.scraper_tool.retry_feedback = feedback
            return {"status": "Feedback received"}
        else:
            return {"error": "No feedback provided"}

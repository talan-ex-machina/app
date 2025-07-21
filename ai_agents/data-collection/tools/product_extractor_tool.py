from core.base_tool import BaseTool
from core.llm_interface import GeminiJudge
from config import GOOGLE_API_KEY

class ProductExtractorTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="product_extractor",
            description="Uses LLM to extract product names from Tavily search results."
        )
        self.llm = GeminiJudge(api_key=GOOGLE_API_KEY)

    def run(self, input: dict, context: dict = None) -> dict:
        tavily_results = input.get("top_products", [])
        # Compose prompt for LLM
        prompt = (
            "Extract a list of actual product or company names from the following search results. "
            "Return only the names as a Python list. Ignore links, descriptions, and irrelevant text.\n\n"
            f"Search results:\n{tavily_results}"
        )
        response = self.llm.judge(facts=[], prompt=prompt)
        return {"product_names": response}

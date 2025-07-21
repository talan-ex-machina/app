import logging
from core.base_tool import BaseTool
from core.llm_interface import GeminiJudge
from config import GOOGLE_API_KEY
import re

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMQueryTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="llm_query",
            description="Uses Gemini 2.0 Flash to generate refined queries and summarize/filter/rank Tavily results."
        )
        self.llm = GeminiJudge(api_key=GOOGLE_API_KEY)

    def run(self, input: dict, context: dict = None) -> dict:
        tavily_results = input.get("top_products", [])
        industry = input.get("industry", "")
        country = input.get("country", "")
        
        # Compose a stricter prompt to ensure only a Python list is returned
        prompt = (
            f"You are given search results for top products in the industry '{industry}'"
            f"{f' in {country}' if country else ''}. Follow these steps exactly:\n"
            "1. Analyze the search results to identify real, valid product or company names.\n"
            "2. Ignore any entries that are empty, punctuation, or not actual product names.\n"
            "3. Summarize, filter, and rank the results to produce a Python list containing *only* the best product names.\n"
            "4. Return *only* a valid Python list (e.g., ['Product1', 'Product2']) with no additional text, explanations, or formatting.\n\n"
            f"Search results:\n{tavily_results}"
        )
        
        # Get LLM response and log it
        response = self.llm.judge(facts=[], prompt=prompt)
        logger.info(f"Raw LLM response: {response}")
        
        # Attempt to validate and clean the response
        try:
            # Ensure the response is a valid Python list
            if isinstance(response, str):
                import ast
                cleaned_response = response.strip()
                # Remove code block markers if present
                if cleaned_response.startswith('```'):
                    cleaned_response = cleaned_response.split('```')[-2] if len(cleaned_response.split('```')) > 1 else cleaned_response
                    cleaned_response = cleaned_response.replace('python', '').strip()
                cleaned_response = cleaned_response.replace('```', '').strip()
                try:
                    parsed_response = ast.literal_eval(cleaned_response)
                except Exception as e:
                    logger.error(f"Failed to parse cleaned LLM response: {e}")
                    # Fallback: extract all strings between single quotes
                    products = []
                    in_quotes = False
                    current = ''
                    for char in cleaned_response:
                        if char == "'":
                            if in_quotes:
                                products.append(current)
                                current = ''
                                in_quotes = False
                            else:
                                in_quotes = True
                        elif in_quotes:
                            current += char
                    cleaned = self._filter_valid_names(products)
                    return {"refined_query_and_products": cleaned}
                if not isinstance(parsed_response, list):
                    logger.error("LLM response is not a list")
                    return {"refined_query_and_products": []}
                cleaned = self._filter_valid_names(parsed_response)
                return {"refined_query_and_products": cleaned}
            elif isinstance(response, list):
                cleaned = self._filter_valid_names(response)
                return {"refined_query_and_products": cleaned}
            else:
                logger.error(f"Unexpected LLM response type: {type(response)}")
                return {"refined_query_and_products": []}
        except (ValueError, SyntaxError) as e:
            logger.error(f"Failed to parse LLM response: {e}")
            return {"refined_query_and_products": []}

    def _filter_valid_names(self, names):
        cleaned = []
        for name in names:
            if not isinstance(name, str):
                continue
            stripped = name.strip()
            # Remove empty, whitespace, or single punctuation
            if not stripped or re.fullmatch(r'[`~!@#$%^&*()_\-+=\[\]{};:\'",.<>/?\\|]+', stripped):
                continue
            # Optionally, filter out very short names (1-2 chars)
            if len(stripped) < 3:
                continue
            cleaned.append(stripped)
        logger.info(f"Filtered product names: {cleaned}")
        return cleaned
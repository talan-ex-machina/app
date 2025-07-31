import logging
from core.base_tool import BaseTool
from core.llm_interface import GeminiLLM
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
        self.llm = GeminiLLM(api_key=GOOGLE_API_KEY)

    def run(self, input: dict, context: dict = None) -> dict:
        tavily_results = input.get("top_products", [])
        industry = input.get("industry", "")
        country = input.get("country", "")
        target_count = input.get("target_products", 3)  # Changed default from 4 to 3
        
        # Compose a stricter prompt to ensure only software products are returned
        prompt = (
            f"You are analyzing search results to find SOFTWARE PRODUCTS (not companies) "
            f"for the '{industry}' industry{f' in {country}' if country else ''}.\n\n"
            "IMPORTANT: Look for software tools, platforms, applications, and SaaS solutions - NOT consulting companies or service providers.\n\n"
            "Examples of what to INCLUDE:\n"
            "- Software applications (e.g., Salesforce, ServiceNow, Jira)\n"
            "- SaaS platforms (e.g., HubSpot, Workday, Tableau)\n"
            "- Development tools (e.g., GitHub, Jenkins, Docker)\n"
            "- Business software (e.g., SAP, Oracle, Microsoft Office)\n\n"
            "Examples of what to EXCLUDE:\n"
            "- Consulting companies (e.g., Accenture, Deloitte, McKinsey)\n"
            "- Service providers (e.g., IBM Global Services, Capgemini)\n"
            "- Hardware manufacturers (unless they make software)\n\n"
            "Instructions:\n"
            "1. Analyze the search results to identify real SOFTWARE PRODUCT names only.\n"
            "2. Ignore consulting companies, service providers, and non-software entities.\n"
            "3. Focus on products that would likely be reviewed on G2.com (software marketplace).\n"
            f"4. Return EXACTLY {target_count} products maximum.\n"
            "5. Return *only* a valid Python list (e.g., ['Product1', 'Product2']) with no additional text.\n\n"
            f"Search results:\n{tavily_results}"
        )
        
        # Get LLM response and log it
        response = self.llm.generate_response(facts=[], prompt=prompt)
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
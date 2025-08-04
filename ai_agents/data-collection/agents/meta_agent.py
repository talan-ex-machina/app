from core.base_tool import BaseTool
from tools.tavily_tool import TavilySearchTool
from tools.llm_query_tool import LLMQueryTool
from tools.product_extractor_tool import ProductExtractorTool
from tools.g2_tool import G2ScraperTool

class MetaAgent(BaseTool):
    def __init__(self):
        super().__init__(
            name="meta_agent",
            description="Finds top products for an industry/country and collects G2 reviews."
        )
        self.tavily_tool = TavilySearchTool()
        self.llm_query_tool = LLMQueryTool()
        self.product_extractor = ProductExtractorTool()
        self.g2_tool = G2ScraperTool()

    def run(self, input: dict, context: dict = None) -> dict:
        # Tavily search
        tavily_result = self.tavily_tool.run(input, context or {})
        top_products_raw = tavily_result.get("top_products", [])
        if not top_products_raw:
            return {"error": "No products found.", "details": tavily_result}

        # LLM query refinement
        llm_result = self.llm_query_tool.run({
            "top_products": top_products_raw, 
            "industry": input.get("industry"), 
            "country": input.get("country"),
            "target_products": input.get("target_products", 3)
        }, context or {})
        refined_products = llm_result.get("refined_query_and_products", [])
        if not refined_products:
            return {"error": "LLM could not refine products.", "details": llm_result}

        # LLM product name extraction
        extractor_result = self.product_extractor.run({"top_products": refined_products}, context or {})
        product_names = extractor_result.get("product_names", [])
        # Ensure product_names is a clean list
        if isinstance(product_names, str):
            import ast
            cleaned = product_names.strip().replace('```', '').replace('python', '').strip()
            start = cleaned.find('[')
            end = cleaned.rfind(']')
            if start != -1 and end != -1:
                cleaned = cleaned[start:end+1]
            try:
                product_names = ast.literal_eval(cleaned)
            except Exception:
                # Fallback: extract all strings between single quotes
                products = []
                in_quotes = False
                current = ''
                for char in cleaned:
                    if char == "'":
                        if in_quotes:
                            products.append(current)
                            current = ''
                            in_quotes = False
                        else:
                            in_quotes = True
                    elif in_quotes:
                        current += char
                product_names = products
        if not product_names or not isinstance(product_names, list):
            return {"error": "LLM could not extract product names.", "details": extractor_result}

        # Collect G2 reviews for each product name (limited by target_products)
        target_products = input.get("target_products", 3)  # Changed default from 4 to 3
        products_to_analyze = product_names[:target_products]  # Limit to target number
        
        reviews = []
        for product in products_to_analyze:
            g2_result = self.g2_tool.run({"product_name": product}, context or {})
            reviews.append({
                "product": product,
                "g2_data": g2_result
            })

        return {
            "industry": input.get("industry"),
            "country": input.get("country"),
            "product_names": products_to_analyze,  # Return only analyzed products
            "all_discovered_products": product_names,  # Keep full list for reference
            "reviews": reviews
        }

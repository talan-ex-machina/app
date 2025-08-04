from core.base_tool import BaseTool
from core.llm_interface import GeminiLLM
from config import GOOGLE_API_KEY
from agents.meta_agent import MetaAgent
from agents.comprehensive_analysis_agent import ComprehensiveCompanyAnalysisAgent
from tools.tavily_tool import TavilySearchTool
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class IndustryComprehensiveAnalysisAgent(BaseTool):
    def __init__(self):
        super().__init__(
            name="industry_comprehensive_analysis",
            description="Master agent that performs complete industry analysis: finds top products, runs G2 analysis, selects top companies, and performs comprehensive analysis."
        )
        self.llm = GeminiLLM(api_key=GOOGLE_API_KEY)
        self.meta_agent = MetaAgent()
        self.comprehensive_analysis_agent = ComprehensiveCompanyAnalysisAgent()
        self.tavily_tool = TavilySearchTool()

    def _find_top_companies_for_industry(self, industry: str, country: str, target_count: int = 3) -> List[str]:
        """
        Find top companies in the industry independently from the product analysis.
        This searches for actual companies (like Accenture, IBM, etc.) not software products.
        """
        # Create a separate search specifically for companies
        companies_search_input = {
            "industry": industry,  # Keep original industry for company search  
            "country": country
        }
        
        # Override the Tavily tool behavior for company search
        company_query = f"top companies in {industry}" + (f" in {country}" if country else "")
        
        try:
            # Use Tavily directly for company search
            companies_result = self.tavily_tool.client.search(company_query)
            companies_raw = companies_result.get("results", [])
            
            if not companies_raw:
                logger.warning(f"No company search results found for: {company_query}")
                return []
            
            # Use LLM to extract company names from search results
            company_extraction_prompt = f"""
            You are analyzing search results to find the TOP COMPANIES (not software products) in the {industry} industry.
            
            Extract the names of actual companies/corporations from these search results.
            For IT consulting, look for companies like: Accenture, IBM, Deloitte, McKinsey, Capgemini, etc.
            For other industries, find the leading companies in that sector.
            
            Search results: {companies_raw}
            
            Return ONLY a Python list of company names, maximum {target_count} companies.
            Example: ['Accenture', 'IBM', 'Deloitte']
            """
            
            company_response = self.llm.generate_response([], company_extraction_prompt)
            
            # Parse the company list
            import ast
            if isinstance(company_response, str):
                cleaned = company_response.strip().replace('```', '').replace('python', '').strip()
                try:
                    companies = ast.literal_eval(cleaned)
                    if isinstance(companies, list):
                        companies = [str(c).strip() for c in companies if str(c).strip()][:target_count]
                    else:
                        companies = []
                except:
                    # Fallback extraction
                    companies = []
                    import re
                    matches = re.findall(r"'([^']+)'", cleaned)
                    companies = [m.strip() for m in matches if m.strip()][:target_count]
            else:
                companies = []
            
            logger.info(f"Found top companies for {industry}: {companies}")
            return companies
            
        except Exception as e:
            logger.error(f"Error finding companies for industry: {e}")
            return []

    def _create_industry_summary_prompt(self, industry: str, country: str, product_analysis: Dict, company_analyses: List[Dict]) -> str:
        """Create a prompt for generating comprehensive industry summary."""
        return f"""
        You are a senior industry analyst creating a comprehensive market intelligence report.

        INDUSTRY: {industry}
        REGION: {country if country else "Global"}

        You have analyzed the top products in this industry and performed deep-dive analysis on the leading companies.

        PRODUCT ANALYSIS SUMMARY:
        - Total products analyzed: {len(product_analysis.get('reviews', []))}
        - Top products identified: {', '.join(product_analysis.get('product_names', []))}

        COMPANY DEEP-DIVE ANALYSES:
        {len(company_analyses)} companies received comprehensive analysis combining competitive intelligence and historical evolution.

        Create a COMPREHENSIVE INDUSTRY INTELLIGENCE REPORT structured as follows:

        # {industry} Industry Intelligence Report
        {f"## Region: {country}" if country else "## Global Market"}

        ## Executive Summary
        Synthesize the most critical market insights, competitive dynamics, and strategic patterns.

        ## Market Landscape Overview
        - Key players and their positions
        - Market structure and dynamics
        - Competitive intensity assessment

        ## Product & Service Analysis
        - Leading products/services identified
        - Innovation patterns and trends
        - Customer satisfaction insights from G2 data

        ## Strategic Evolution Patterns
        - How companies in this industry have evolved historically
        - Common strategic trajectories
        - Technology adoption patterns

        ## Competitive Intelligence Synthesis
        - Cross-company competitive advantages
        - Market positioning strategies
        - Differentiation approaches

        ## Industry Trends & Future Outlook
        - Emerging patterns and disruptions
        - Technology evolution trends
        - Market opportunities and threats

        ## Investment & Strategic Recommendations
        - For investors: Which companies show strongest potential
        - For competitors: Market entry strategies and positioning
        - For partners: Collaboration opportunities

        ## Key Performance Indicators
        - Market size and growth indicators
        - Customer satisfaction benchmarks
        - Innovation metrics

        ## Regional/Geographic Insights
        {f"Specific insights for {country} market" if country else "Global market patterns"}

        ## Risk Assessment
        - Industry-wide risks and challenges
        - Regulatory considerations
        - Competitive threats

        ## Conclusion & Strategic Implications
        Key takeaways for stakeholders in this industry.

        Use specific data points, company names, and quantitative insights from the analyses provided.
        """

    def run(self, input: dict, context: dict = None) -> dict:
        industry = input.get("industry", "")
        country = input.get("country", "")
        target_products = input.get("target_products", 3)  # Changed default from 4 to 3
        target_companies = input.get("target_companies", 3)
        
        if not industry:
            return {"error": "Industry is required."}

        logger.info(f"Starting comprehensive industry analysis for: {industry} in {country if country else 'Global'}")

        # Step 1: Find top products and run G2 analysis
        logger.info("Step 1: Finding top products and running G2 analysis...")
        meta_input = {
            "industry": industry,
            "country": country,
            "target_products": target_products
        }
        
        meta_result = self.meta_agent.run(meta_input, context or {})
        if "error" in meta_result:
            return {"error": f"Product discovery failed: {meta_result['error']}", "details": meta_result}

        # Step 2: Find top companies independently (separate from products)
        logger.info("Step 2: Finding top companies in the industry...")
        top_companies = self._find_top_companies_for_industry(industry, country, target_companies)
        
        if not top_companies:
            return {"error": "No suitable companies found for comprehensive analysis.", "details": meta_result}

        # Step 3: Run comprehensive analysis on top companies
        logger.info(f"Step 3: Running comprehensive analysis on top {len(top_companies)} companies...")
        company_analyses = []
        
        for company_name in top_companies:
            logger.info(f"Analyzing company: {company_name}")
            try:
                comp_input = {
                    "company_name": company_name,
                    "start_year": input.get("start_year", 2020),
                    "end_year": input.get("end_year", 2025),
                    "max_pages": input.get("max_pages", 3)
                }
                
                comp_result = self.comprehensive_analysis_agent.run(comp_input, context or {})
                
                if "error" not in comp_result:
                    company_analyses.append({
                        "company_name": company_name,
                        "analysis": comp_result
                    })
                else:
                    logger.warning(f"Comprehensive analysis failed for {company_name}: {comp_result['error']}")
                    
            except Exception as e:
                logger.error(f"Error analyzing {company_name}: {e}")

        # Step 4: Create industry-wide synthesis
        logger.info("Step 4: Creating industry-wide analysis synthesis...")
        synthesis_prompt = self._create_industry_summary_prompt(industry, country, meta_result, company_analyses)
        
        try:
            industry_summary = self.llm.generate_response([], synthesis_prompt)
        except Exception as e:
            logger.error(f"Industry synthesis error: {e}")
            industry_summary = f"Error in industry synthesis: {e}"

        # Step 5: Structure final output
        reviews_data = meta_result.get("reviews", [])
        return {
            "industry": industry,
            "country": country,
            "analysis_metadata": {
                "total_products_found": len(reviews_data),
                "target_products": target_products,
                "companies_analyzed": len(company_analyses),
                "target_companies": target_companies,
                "analysis_timestamp": input.get("timestamp", "Not provided")
            },
            "product_analysis": {
                "methodology": "Tavily search → LLM refinement → G2 analysis",
                "products_discovered": meta_result.get("product_names", []),
                "g2_reviews_summary": reviews_data
            },
            "company_selection": {
                "methodology": "Independent Tavily search for top companies in industry",
                "selected_companies": top_companies,
                "selection_details": "Companies selected independently from product analysis"
            },
            "comprehensive_company_analyses": company_analyses,
            "industry_intelligence_report": industry_summary,
            "raw_data": {
                "meta_agent_result": meta_result,
                "individual_company_analyses": [item["analysis"] for item in company_analyses]
            }
        }

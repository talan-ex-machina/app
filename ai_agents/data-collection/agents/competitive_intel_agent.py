from core.base_tool import BaseTool
from core.llm_interface import GeminiLLM
from config import GOOGLE_API_KEY
from tools.competitive_intel_tool import NovadaSearchTool, LinkedInLookupTool, TwitterLookupTool, FacebookPageTool
from tools.tavily_tool import TavilySearchTool
from tools.serper_tool import SerperTool
import logging
import re

logger = logging.getLogger(__name__)

class CompetitiveIntelAgent(BaseTool):
    def __init__(self):
        super().__init__(
            name="competitive_intel_agent",
            description="Competitive intelligence agent that performs comprehensive company research."
        )
        self.llm = GeminiLLM(api_key=GOOGLE_API_KEY)
        self.novada_tool = NovadaSearchTool()
        self.linkedin_tool = LinkedInLookupTool()
        self.twitter_tool = TwitterLookupTool()
        self.facebook_tool = FacebookPageTool()
        self.tavily_tool = TavilySearchTool()
        self.serper_tool = SerperTool()

    def _make_system_prompt(self) -> str:
        return (
            "You are a **competitive-intelligence AI analyst** working in tandem with "
            "other specialised agents. Your single input is a **company name**; your "
            "output is an *exhaustive* research dossier intended for that company's competitors.\n\n"

            "Your dossier **must** cover every angle that could influence competitive "
            "strategy, including but not limited to:\n"
            "• Corporate strategy and long-term roadmap (public statements, investor calls)\n"
            "• Detailed product / service portfolio (features, pricing, roadmaps)\n"
            "• Major projects, recent launches and roll-outs\n"
            "• Customer / client base and flagship case-studies\n"
            "• Partnerships, alliances, M&A activity, venture investments\n"
            "• Hiring trends (roles, geographies, skill sets), org-chart insights\n"
            "• Financials (revenue, margins, growth rates, funding rounds, stock performance)\n"
            "• Intellectual-property landscape: patents, trademarks, proprietary tech\n"
            "• Marketing & positioning: brand messaging, channels, ad spend estimates\n"
            "• Regulatory or legal issues (litigation, compliance warnings, data-privacy)\n"
            "• Market share, competitive positioning, SWOT, Porter's 5 Forces factors\n"
            "• Public sentiment: Glassdoor scores, social-media sentiment, Trustpilot reviews\n"
            "• Technology stack and vendor dependencies (cloud, SaaS, open-source adoption)\n"
            "• ESG / sustainability metrics\n"
            "• Notable risks, weaknesses, and unanswered questions that warrant follow-up\n\n"

            "Structure your notes in **Markdown** sections (#, ##, ###) so the reporter agent can\n"
            "turn them into a polished report.\n"
            "• Prefer bullet-points for dense facts; tables or code-blocks for numeric data when useful.\n"
            "• Target **5-10 pages** of Markdown (≈1 500-3 000 words) before summarisation.\n"
            "• If a fact cannot be found, write **Gap - needs follow-up** so a later agent knows.\n"
            "• Do **NOT** fabricate numbers, quotes, or dates; unknown is better than guessed.\n\n"
        )

    def _extract_domain_from_company(self, company_name: str) -> str:
        """Extract likely domain from company name for LinkedIn lookup."""
        # Simple heuristic to convert company name to domain
        clean_name = re.sub(r'\b(inc|corp|corporation|ltd|limited|llc|consulting|group)\b', '', company_name.lower())
        clean_name = re.sub(r'[^a-z0-9]', '', clean_name)
        return f"{clean_name}.com"

    def _perform_research_phase(self, company_name: str) -> dict:
        """Perform comprehensive research using all available tools."""
        research_data = {
            "company_name": company_name,
            "general_search": {},
            "linkedin_data": {},
            "social_media": {},
            "news_and_articles": {},
            "errors": []
        }

        # 1. General web search via Novada
        try:
            general_query = f"{company_name} company overview business model"
            novada_result = self.novada_tool.run({"query": general_query}, {})
            research_data["general_search"]["overview"] = novada_result
        except Exception as e:
            research_data["errors"].append(f"Novada general search error: {e}")

        # 2. Financial and business search
        try:
            financial_query = f"{company_name} revenue financials business model funding"
            novada_financial = self.novada_tool.run({"query": financial_query}, {})
            research_data["general_search"]["financial"] = novada_financial
        except Exception as e:
            research_data["errors"].append(f"Novada financial search error: {e}")

        # 3. LinkedIn company data
        try:
            domain = self._extract_domain_from_company(company_name)
            linkedin_result = self.linkedin_tool.run({"domain": domain}, {})
            research_data["linkedin_data"] = linkedin_result
        except Exception as e:
            research_data["errors"].append(f"LinkedIn lookup error: {e}")

        # 4. Tavily search for additional context
        try:
            tavily_result = self.tavily_tool.run({"industry": f"{company_name} business", "country": ""}, {})
            research_data["news_and_articles"]["tavily"] = tavily_result
        except Exception as e:
            research_data["errors"].append(f"Tavily search error: {e}")

        # 5. Search for recent news
        try:
            news_query = f"{company_name} news latest announcements 2024 2025"
            news_result = self.novada_tool.run({"query": news_query}, {})
            research_data["news_and_articles"]["recent_news"] = news_result
        except Exception as e:
            research_data["errors"].append(f"News search error: {e}")

        # 6. Search for competitors and market position
        try:
            competitor_query = f"{company_name} competitors market share industry analysis"
            competitor_result = self.novada_tool.run({"query": competitor_query}, {})
            research_data["general_search"]["competitive_analysis"] = competitor_result
        except Exception as e:
            research_data["errors"].append(f"Competitor search error: {e}")

        return research_data

    def _analyze_and_structure_data(self, research_data: dict) -> str:
        """Use LLM to analyze research data and structure it into a comprehensive report."""
        prompt = f"""
        {self._make_system_prompt()}
        
        Based on the following research data about {research_data['company_name']}, create a comprehensive competitive intelligence report.
        
        Research Data:
        {research_data}
        
        Please structure your analysis in the following Markdown format:
        
        # {research_data['company_name']} - Competitive Intelligence Report
        
        ## Executive Summary
        
        ## Company Overview
        
        ## Products & Services
        
        ## Market Position & Strategy
        
        ## Financial Information
        
        ## Technology & Innovation
        
        ## Partnerships & Alliances
        
        ## Recent Developments
        
        ## Competitive Landscape
        
        ## Strengths & Opportunities
        
        ## Risks & Challenges
        
        ## Key Insights for Competitors
        
        ## Information Gaps & Follow-up Required
        
        For each section, provide detailed bullet points with specific information found in the research data.
        If information is missing for a section, clearly state "Gap – needs follow-up".
        Always include citations where possible.
        """
        
        try:
            analysis = self.llm.generate_response([], prompt)
            return analysis
        except Exception as e:
            logger.error(f"LLM analysis error: {e}")
            return f"Error in analysis: {e}"

    def run(self, input: dict, context: dict = None) -> dict:
        company_name = input.get("company_name", "")
        if not company_name:
            return {"error": "Company name is required."}

        logger.info(f"Starting competitive intelligence research for: {company_name}")

        # Phase 1: Research
        research_data = self._perform_research_phase(company_name)
        
        # Phase 2: Analysis and structuring
        structured_report = self._analyze_and_structure_data(research_data)
        
        return {
            "company_name": company_name,
            "competitive_intelligence_report": structured_report,
            "raw_research_data": research_data,
            "research_errors": research_data.get("errors", [])
        }

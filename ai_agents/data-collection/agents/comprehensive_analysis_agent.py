from core.base_tool import BaseTool
from core.llm_interface import GeminiLLM
from config import GOOGLE_API_KEY
from agents.competitive_intel_agent import CompetitiveIntelAgent
from agents.wayback_agent import WaybackAgent
import logging

logger = logging.getLogger(__name__)

class ComprehensiveCompanyAnalysisAgent(BaseTool):
    def __init__(self):
        super().__init__(
            name="comprehensive_company_analysis",
            description="Combines competitive intelligence research with historical Wayback Machine analysis for complete company insights."
        )
        self.llm = GeminiLLM(api_key=GOOGLE_API_KEY)
        self.competitive_intel_agent = CompetitiveIntelAgent()
        self.wayback_agent = WaybackAgent()

    def _create_synthesis_prompt(self, company_name: str, intel_report: str, wayback_report: dict) -> str:
        return f"""
        You are a senior strategic analyst tasked with creating a comprehensive company analysis by synthesizing 
        competitive intelligence research with historical evolution insights.

        COMPANY: {company_name}

        You have two key data sources:

        1. CURRENT COMPETITIVE INTELLIGENCE REPORT:
        {intel_report}

        2. HISTORICAL WAYBACK MACHINE ANALYSIS:
        Story Report: {wayback_report.get('story_report', 'Not available')}
        
        Analytic Report: {wayback_report.get('analytic_report', 'Not available')}
        
        Patterns Report: {wayback_report.get('patterns_report', 'Not available')}

        Your task is to create a COMPREHENSIVE STRATEGIC ANALYSIS that combines both current competitive intelligence 
        and historical evolution patterns. Structure your analysis as follows:

        # {company_name} - Comprehensive Strategic Analysis

        ## Executive Summary
        Synthesize the most critical insights from both current intelligence and historical analysis.

        ## Historical Evolution & Strategic Trajectory
        Combine insights from the Wayback analysis to show how the company has evolved strategically over time.

        ## Current Market Position & Competitive Landscape
        Use the competitive intelligence to assess current positioning and competitive dynamics.

        ## Strategic Pattern Analysis
        Identify patterns between historical strategic decisions and current market position.

        ## Financial Evolution & Performance Trajectory
        Connect historical financial patterns with current financial standing.

        ## Technology & Innovation Timeline
        Map the company's technology evolution from historical data to current capabilities.

        ## Strategic Consistency & Pivots
        Analyze which strategic elements have remained consistent vs. major pivots or changes.

        ## Competitive Advantages: Historical vs. Current
        Compare historical competitive advantages with current strengths.

        ## Market Opportunities & Strategic Recommendations
        Based on both historical patterns and current intelligence, identify opportunities and strategic recommendations.

        ## Risk Assessment: Historical Patterns & Current Threats
        Combine historical risk patterns with current competitive threats.

        ## Future Strategic Trajectory Prediction
        Based on historical evolution patterns and current intelligence, predict likely future strategic directions.

        ## Key Insights for Stakeholders
        Provide actionable insights for different stakeholder groups (competitors, investors, partners, etc.).

        ANALYSIS REQUIREMENTS:
        - Cross-reference historical patterns with current intelligence
        - Identify correlations between past strategic decisions and current market position
        - Highlight discrepancies or conflicts between historical and current data
        - Provide specific, actionable insights backed by both data sources
        - Note any information gaps that require additional research
        - Use quantitative data where available from both sources

        Create a cohesive narrative that shows how the company's history informs its current position and future prospects.
        """

    def run(self, input: dict, context: dict = None) -> dict:
        company_name = input.get("company_name", "")
        if not company_name:
            return {"error": "Company name is required."}

        logger.info(f"Starting comprehensive analysis for: {company_name}")

        # Step 1: Perform competitive intelligence research
        logger.info("Performing competitive intelligence research...")
        intel_result = self.competitive_intel_agent.run({"company_name": company_name}, context or {})
        
        if "error" in intel_result:
            return {"error": f"Competitive intelligence failed: {intel_result['error']}"}

        # Step 2: Perform Wayback Machine historical analysis
        logger.info("Performing Wayback Machine historical analysis...")
        wayback_input = {
            "company_name": company_name,
            "start_year": input.get("start_year", 2015),
            "end_year": input.get("end_year", 2025),
            "max_pages": input.get("max_pages", 3)
        }
        wayback_result = self.wayback_agent.run(wayback_input, context or {})
        
        if "error" in wayback_result:
            logger.warning(f"Wayback analysis failed: {wayback_result['error']}")
            wayback_result = {
                "story_report": "Historical analysis unavailable - company website may not be archived or accessible.",
                "analytic_report": "Historical strategic analysis unavailable.",
                "patterns_report": "Historical pattern analysis unavailable."
            }

        # Step 3: Synthesize both analyses
        logger.info("Synthesizing competitive intelligence and historical analysis...")
        intel_report = intel_result.get("competitive_intelligence_report", "")
        synthesis_prompt = self._create_synthesis_prompt(company_name, intel_report, wayback_result)
        
        try:
            comprehensive_analysis = self.llm.generate_response([], synthesis_prompt)
        except Exception as e:
            logger.error(f"Synthesis analysis error: {e}")
            comprehensive_analysis = f"Error in synthesis: {e}"

        return {
            "company_name": company_name,
            "comprehensive_analysis": comprehensive_analysis,
            "competitive_intelligence": intel_result,
            "historical_analysis": wayback_result,
            "analysis_timestamp": input.get("timestamp", "Not provided")
        }

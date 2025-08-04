from core.base_tool import BaseTool
from tools.wayback_tool import WaybackTool
from core.llm_interface import GeminiLLM
from config import GOOGLE_API_KEY
import logging

logger = logging.getLogger(__name__)

class WaybackAgent(BaseTool):
    def __init__(self):
        super().__init__(
            name="wayback_agent",
            description="Agent for crawling Wayback Machine snapshots and generating LLM-based reports."
        )
        self.wayback_tool = WaybackTool()
        self.llm = GeminiLLM(api_key=GOOGLE_API_KEY)

    def run(self, input: dict, context: dict = None) -> dict:
        # Step 1: Crawl and extract snapshot data
        tool_result = self.wayback_tool.run(input, context or {})
        snapshot_data = tool_result.get("snapshot_data", [])
        if not snapshot_data:
            return {"error": "No snapshot data found.", "details": tool_result}
        # Step 2: Compose prompts for LLM
        valid_snapshots = [s for s in snapshot_data if s["title"] != "Error" and (s["headings"] or s["text_content"])]
        if not valid_snapshots:
            return {"error": "No valid snapshots for report."}
        # Story report
        story_snapshots_text = "\n".join([
            f"- {s['timestamp'][:4]}-{s['timestamp'][4:6]}-{s['timestamp'][6:8]}: Title: {s['title']}, Headings: {', '.join(s['headings'])}, Text (sample): {s['text_content'][:500]}..." for s in valid_snapshots
        ])
        story_prompt = f"""
        Write an 800-word narrative-style review of the company's online presence and growth over the years, based on the provided archived website snapshots.
        Include:
        - A storytelling tone with chronological structure
        - Reflections on branding, priorities, and messaging evolution
        - Commentary on industry alignment and impact
        - References to specific wording, section titles, or campaigns
        The snapshots provide:
        {story_snapshots_text}
        """
        story_response = self.llm.generate_response([], story_prompt)

        # Analytic report
        def extract_size_and_locations(text_content):
            import re
            size_data, location_data = [], []
            employee_pattern = r'(\d+,?\d*)\s*(employees|staff|team members)'
            revenue_pattern = r'(\$|\u20ac|\u00a3)?(\d+\.?\d*)\s*(million|billion)?\s*(revenue|turnover|income)'
            location_keywords = r'(headquarters|office|branch|location|based in|operating in)\s*([A-Za-z\s,]+)'
            employee_matches = re.findall(employee_pattern, text_content, re.IGNORECASE)
            for match in employee_matches:
                size_data.append(f"{match[0]} {match[1]}")
            revenue_matches = re.findall(revenue_pattern, text_content, re.IGNORECASE)
            for match in revenue_matches:
                size_data.append(f"{match[0]}{match[1]} {match[2]} {match[3]}")
            location_matches = re.findall(location_keywords, text_content, re.IGNORECASE)
            for match in location_matches:
                location_data.append(match[1].strip())
            return size_data, location_data

        analytic_snapshots_text = "\n".join([
            f"- {s['timestamp'][:4]}-{s['timestamp'][4:6]}-{s['timestamp'][6:8]}: Title: {s['title']}, Headings: {', '.join(s['headings'])}, Size Data: {', '.join(extract_size_and_locations(s['text_content'])[0]) or 'None'}, Locations: {', '.join(extract_size_and_locations(s['text_content'])[1]) or 'None'}" for s in valid_snapshots
        ])
        analytic_prompt = f"""
        ROLE: Strategic Evolution Analyst - Decode organizational transformation patterns from digital footprint changes.

        OBJECTIVE: Extract strategic intelligence from website evolution data through systematic pattern analysis.

        ANALYSIS STRUCTURE:

        ## Chronological Strategic Profiling
        **Per Year Analysis** (Direct findings, no introductory text):

        **[YEAR]**: 
        Strategic Focus: [2-3 primary objectives identified from content emphasis]
        Technology Integration: [Technologies prominently featured vs. previous years]
        Market Targeting: [Industry/geographic segments emphasized]
        Positioning Shift: [Value proposition changes from prior year]
        Communication Evolution: [Messaging tone/terminology changes]
        Capability Additions: [New services/partnerships/initiatives launched]

        ## Multi-Dimensional Trend Mapping
        **Technology Evolution Trajectory**:
        - Adoption sequence: [Technology A → Technology B → Technology C with timing]
        - Integration depth: [Surface mention → Core capability → Leadership position]
        - Innovation cycles: [Follower → Adopter → Leader patterns per technology]

        **Market Strategy Evolution**:
        - Sector progression: [Industry focus sequence and expansion patterns]
        - Geographic expansion: [Market entry timing and prioritization]
        - Client segment evolution: [SME → Enterprise → Specialized verticals]

        **Organizational Maturity Indicators**:
        - Capability scaling: [Generalist → Specialist → Integrated solutions]
        - Partnership sophistication: [Vendor → Strategic alliance → Ecosystem leader]
        - Communication maturity: [Feature-focused → Outcome-focused → Thought leadership]

        ## Competitive Intelligence Extraction
        **Technology Leadership Assessment**:
        - First-mover advantages: [Technologies adopted ahead of market]
        - Fast-follower positions: [Rapid adoption of emerging technologies]
        - Laggard areas: [Technologies adopted late or reluctantly]

        **Market Differentiation Analysis**:
        - Unique positioning elements: [Differentiators maintained across years]
        - Positioning shifts: [Strategic repositioning moments and triggers]
        - Competitive responses: [Reaction patterns to market changes]

        **Portfolio Evolution Intelligence**:
        - Service lifecycle patterns: [Launch → Growth → Maturity → Decline/Evolution]
        - Diversification strategy: [Core expansion vs. adjacent market entry]
        - Pruning decisions: [Service discontinuation patterns and rationale]

        ## Quantitative Pattern Recognition
        **Content Analysis Metrics**:
        - Keyword frequency shifts: [Technology/service mentions per year]
        - Message emphasis allocation: [Percentage focus on different themes]
        - Geographic mention distribution: [Market attention allocation]
        - Partnership mention frequency: [Relationship emphasis patterns]

        **Strategic Signal Detection**:
        - Investment indicators: [Language suggesting resource allocation]
        - Growth signals: [Expansion, hiring, capability mentions]
        - Pivot indicators: [Strategic direction change signals]
        - Market pressure responses: [Adaptation to external forces]

        ## Strategic Assessment Intelligence
        **Transformation Pattern**:
        - Core evolution theme: [Overarching transformation story in one sentence]
        - Strategic consistency: [Elements that remained constant]
        - Major inflection points: [Significant strategic shift moments]

        **Market Responsiveness**:
        - External adaptation speed: [Response time to market changes]
        - Innovation rhythm: [Technology adoption and development cycles]
        - Competitive awareness: [Market positioning adjustment patterns]

        **Future Trajectory Indicators**:
        - Momentum areas: [Technologies/markets showing acceleration]
        - Consolidation signals: [Areas showing focus/specialization]
        - Expansion vectors: [Logical next-step opportunities]

        DELIVERY STANDARDS:
        - Start directly with findings (no "Here's my analysis...")
        - Use specific data points and timestamps
        - Quantify changes where possible
        - Focus on non-obvious strategic insights
        - Cross-reference multiple data points for validation

        Website snapshot data:
        {analytic_snapshots_text}
        """
        analytic_response = self.llm.generate_response([], analytic_prompt)

        patterns_prompt = f"""
        ROLE: Pattern Recognition Analyst - Detect strategic, operational, and financial transformation patterns from historical data.

        OBJECTIVE: Identify non-obvious correlations, cyclical behaviors, and predictive patterns that reveal business intelligence insights.

        ANALYSIS METHODOLOGY:

        ## Temporal Pattern Detection
        **Strategic Cycle Analysis**:
        - Expansion → Consolidation → Pivot cycles (identify duration and triggers)
        - Innovation adoption lag patterns (technology mentions vs. implementation)
        - Market entry timing patterns (geographic/sector expansion sequences)
        - Resource allocation shifts (people/technology/investment patterns)

        **Financial Rhythm Detection**:
        - Revenue announcement timing vs. service launch gaps
        - Investment mention patterns preceding major strategic shifts
        - Cost optimization language correlation with market downturns
        - Growth acceleration indicators in messaging changes

        ## Correlation Matrix Analysis
        **Service-Performance Correlations**:
        - New service introduction → client testimonial increase (timing analysis)
        - Technology adoption mentions → partnership announcements (lag analysis)
        - Geographic expansion → sector diversification (sequence patterns)
        - Team growth indicators → service portfolio expansion (scaling patterns)

        **Market Response Patterns**:
        - External market pressure → internal strategic response (reaction speed)
        - Competitor moves → differentiation strategy shifts (competitive intelligence)
        - Economic indicators → service positioning changes (market sensitivity)
        - Client feedback themes → product development cycles (feedback loops)

        ## Predictive Pattern Identification
        **Leading Indicators**:
        - Website structure changes preceding major announcements
        - Language sentiment shifts predicting strategic pivots
        - Partnership mention frequency predicting market expansion
        - Technology emphasis patterns predicting service launches

        **Lagging Confirmations**:
        - Success story publication patterns following service maturation
        - Client portfolio mentions following market validation
        - Geographic presence updates following expansion completion
        - Team expertise highlights following capability development

        ## Deep Pattern Mining
        **Hidden Dependencies**:
        - Service A success → Service B development (innovation chains)
        - Geographic Market X → Sector Y focus (cross-dimensional patterns)
        - Partnership Type 1 → Client Acquisition Method 2 (relationship patterns)
        - Technology Investment → Client Outcome Improvement (value chains)

        **Cyclical Behaviors**:
        - Seasonal strategic messaging changes (quarterly/annual patterns)
        - Multi-year strategic focus rotation cycles
        - Investment→Development→Launch→Optimization cycles
        - Client acquisition→Retention→Expansion→Renewal patterns

        ## Pattern Strength Quantification
        For each identified pattern:
        - **Frequency**: How often does this pattern repeat?
        - **Reliability**: What percentage of occurrences follow the pattern?
        - **Lead Time**: What is the typical delay between cause and effect?
        - **Magnitude**: How significant is the impact when the pattern occurs?
        - **Context Dependency**: Under what conditions does the pattern hold/break?

        ## Strategic Intelligence Extraction
        **Competitive Advantage Patterns**:
        - Unique timing advantages in market responses
        - Proprietary capability development sequences
        - Client relationship evolution patterns
        - Innovation-to-market speed patterns

        **Risk Pattern Identification**:
        - Vulnerability windows during strategic transitions
        - Resource strain indicators during rapid expansion
        - Market dependency patterns creating single points of failure
        - Competitive response lag creating opportunity windows

        DELIVERY REQUIREMENTS:
        - No introductory or summary language
        - Start directly with pattern findings
        - Use data points and specific time correlations
        - Quantify pattern strength where possible
        - Focus on non-obvious, actionable insights
        - Cross-reference multiple data dimensions

        Website snapshot data:
        {analytic_snapshots_text}
        """

        patterns_response = self.llm.generate_response([], patterns_prompt)


        return {
            "story_report": story_response,
            "analytic_report": analytic_response,
            "patterns_report": patterns_response,
            "snapshots": valid_snapshots
        }

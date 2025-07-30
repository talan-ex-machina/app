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
        ROLE: You are a senior strategy consultant specializing in digital transformation and technology evolution analysis.

        TASK: Conduct a comprehensive longitudinal analysis of the company's strategic evolution using archived website data. Extract actionable insights that reveal strategic patterns, technology adoption cycles, and market positioning shifts.

        INPUT DATA: Historical website snapshots spanning multiple years
        OUTPUT FORMAT: Professional strategy report with quantitative insights and trend analysis

        ANALYSIS FRAMEWORK:

        ## Section 1: Annual Strategic Profile
        For each year present in the data, create a structured analysis:

        **Year: [YYYY]**
        • **Strategic Priorities**: What were the 2-3 primary business objectives or strategic themes?
        • **Technology Portfolio**: Which technologies, platforms, or methodologies were prominently featured?
        • **Target Markets**: What industries, client segments, or geographic regions were emphasized?
        • **Value Proposition**: How did the company position its unique value and competitive advantages?
        • **Messaging Evolution**: Note changes in tone, terminology, or brand positioning
        • **Key Initiatives**: Highlight major projects, partnerships, or service launches mentioned

        *Analysis depth: 250-350 words per year with specific examples*

        IMPORTANT: If content is in French, translate to English before analyzing. Note the original language context where relevant.

        ## Section 2: Multi-Year Trend Analysis
        • **Strategic Trajectory**: Map the evolution of core strategic themes over time
        • **Technology Adoption Curve**: Track when new technologies first appeared and how emphasis shifted
        • **Market Focus Evolution**: Analyze changes in sector focus or geographic expansion
        • **Organizational Maturity**: Identify signs of scaling, specialization, or capability development
        • **Communication Strategy**: Evolution in brand voice, messaging sophistication, and market positioning

        ## Section 3: Competitive Positioning Analysis
        • **Technology Leadership**: Which areas show consistent innovation focus vs. follower positioning?
        • **Market Differentiation**: How has their unique value proposition evolved?
        • **Service Portfolio Evolution**: Track additions, discontinuations, or rebranding of offerings
        • **Client Relationship Strategy**: Changes in how they present client partnerships or success stories

        ## Section 4: Quantitative Insights
        Create data-driven observations:
        • **Keyword Frequency Analysis**: Most mentioned technologies, services, or concepts by year
        • **Emerging vs. Declining Terms**: Technologies or concepts gaining/losing prominence
        • **Geographic Mentions**: Track international expansion or market focus shifts
        • **Sector Emphasis**: Quantify attention given to different industries over time

        ## Section 5: Strategic Assessment & Future Implications
        • **Core Strategic Pattern**: What is the overarching transformation story?
        • **Competitive Response**: How do changes reflect broader market pressures or opportunities?
        • **Strategic Consistency**: Which elements remained constant vs. what evolved?
        • **Future Trajectory**: Based on evolution patterns, what strategic direction appears likely?
        • **Strategic Risks/Opportunities**: What gaps or strengths emerge from this historical analysis?

        QUALITY STANDARDS:
        - Use specific examples and quotes from the website content
        - Quantify observations where possible (e.g., "mentioned 15 times" vs. "frequently mentioned")
        - Focus on strategic implications, not just description
        - Identify cause-effect relationships between market changes and strategic responses
        - Maintain analytical objectivity while drawing actionable conclusions

        Begin analysis with the earliest year in the dataset and proceed chronologically.

        Website snapshot data:
        {analytic_snapshots_text}
        """
        analytic_response = self.llm.generate_response([], analytic_prompt)

        return {
            "story_report": story_response,
            "analytic_report": analytic_response,
            "snapshots": valid_snapshots
        }

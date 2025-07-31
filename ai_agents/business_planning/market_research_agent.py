# market_research_agent.py

import os
import json
import ast
import re
from typing import Dict, List, Any
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise EnvironmentError("GEMINI_API_KEY not found in .env file.")

genai.configure(api_key=GEMINI_API_KEY)

class MarketResearchAgent:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.0-flash")
        self.system_prompt = """You are a competitive intelligence expert specializing in identifying market opportunities and providing actionable insights for dashboard visualization.

IMPORTANT: You MUST respond with ONLY a valid JSON object. No explanations, no markdown, just JSON.

Focus on finding weaknesses and missed opportunities by the idol company that a new entrant can exploit. Also provide numeric and chart-friendly data for dashboard charts and big numbers.

Return this exact JSON structure:
{
  "market_overview": {
    "market_size": "value",
    "growth_rate": "value",
    "key_trends": ["trend1", "trend2", ...],
    "market_maturity": "value"
  },
  "competitor_breakdown": [
    {"name": "Competitor Name", "market_share": "number (percent)", "revenue": "number (in millions)", "growth_rate": "number (percent)"}
  ],
  "idol_company_analysis": {
    "name": "value",
    "strengths_to_avoid": [
      {"strength": "description", "why_avoid": "how to differentiate", "market_impact": "high/medium/low"}
    ],
    "weaknesses_to_exploit": [
      {"weakness": "description", "opportunity": "how to capitalize", "market_size": "number (in millions)", "difficulty": "high/medium/low"}
    ],
    "missed_opportunities": [
      {"opportunity": "description", "market_potential": "number (in millions)", "why_missed": "reason", "how_to_capture": "strategy"}
    ],
    "market_share": "number (percent)"
  },
  "competitive_gaps": [
    {"gap_title": "title", "description": "detailed description", "target_segment": "who benefits", "revenue_potential": "number (in millions)", "barriers_to_entry": "low/medium/high"}
  ],
  "top_trends": [
    {"trend": "trend name", "impact": "high/medium/low", "growth_rate": "number (percent)"}
  ],
  "strategic_recommendations": [
    {"strategy": "recommendation", "rationale": "why this works", "timeline": "implementation time", "investment_needed": "number (in millions)"}
  ]
}"""

    def clean_and_parse_response(self, response_text: str) -> Dict[str, Any]:
        """Clean and parse the Gemini response"""
        # Remove markdown formatting and code blocks
        cleaned = re.sub(r"^```(?:json|python)?", "", response_text.strip(), flags=re.MULTILINE)
        cleaned = re.sub(r"```$", "", cleaned, flags=re.MULTILINE)
        cleaned = cleaned.strip("` \n")
        
        # Remove leading assignment if present
        cleaned = re.sub(r'^\s*\w+\s*=\s*', '', cleaned)
        
        # Try multiple parsing methods
        for method in [json.loads, ast.literal_eval]:
            try:
                return method(cleaned)
            except Exception:
                continue
        
        # If all parsing fails, print debug info and return default
        print("❌ Error parsing Market Research response:")
        print(f"Original: {response_text[:200]}...")
        print(f"Cleaned: {cleaned[:200]}...")
        
        # Return default structure instead of raising error
        return {
            "error": "Failed to parse response",
            "market_overview": {"market_size": "Unknown", "growth_rate": "Unknown", "key_trends": [], "market_maturity": "Unknown"},
            "idol_company_analysis": {
                "name": "Unknown", 
                "strengths_to_avoid": [], 
                "weaknesses_to_exploit": [], 
                "missed_opportunities": [], 
                "market_share": "Unknown"
            },
            "competitive_gaps": [],
            "strategic_recommendations": []
        }

    def analyze_market(self, business_type: str, idol_company: str, additional_context: str = "") -> Dict[str, Any]:
        """Analyze market for the given business type and idol company"""
        
        prompt = f"""Business Type: {business_type}
Idol Company: {idol_company}
Context: {additional_context}

Analyze the idol company's weaknesses and missed opportunities. Focus on:
1. What are their main weaknesses that a new competitor could exploit?
2. What market opportunities have they missed or ignored?
3. What are their key strengths that we should avoid competing against directly?
4. What gaps exist in their service/product offerings?
5. Which customer segments do they underserve?"""
        
        try:
            response = self.model.generate_content(self.system_prompt + "\n" + prompt)
            if not response.text or not response.text.strip():
                raise ValueError("Empty response from Gemini API")
            return self.clean_and_parse_response(response.text)
        except Exception as e:
            return {
                "error": f"Failed to analyze market: {str(e)}",
                "market_overview": {"market_size": "Unknown", "growth_rate": "Unknown", "key_trends": [], "market_maturity": "Unknown"},
                "idol_company_analysis": {
                    "name": idol_company, 
                    "strengths_to_avoid": [], 
                    "weaknesses_to_exploit": [], 
                    "missed_opportunities": [], 
                    "market_share": "Unknown"
                },
                "competitive_gaps": [],
                "strategic_recommendations": []
            }

    def suggest_top_companies(self, business_type: str) -> List[Dict[str, str]]:
        """Suggest top 3 companies in the given business type"""
        
        prompt = f"""
### Business Type: {business_type}

### Instructions:
Suggest the top 3 most successful and influential companies in this business sector.
Return a Python list with this structure:
[
  {{
    "name": "Company Name",
    "description": "Brief description of what makes them a market leader",
    "why_choose": "Why this company is a good benchmark/idol"
  }}
]
"""
        
        try:
            response = self.model.generate_content(prompt)
            cleaned = re.sub(r"^```(?:python)?", "", response.text.strip(), flags=re.MULTILINE)
            cleaned = cleaned.strip("` \n")
            cleaned = re.sub(r'^\s*\w+\s*=\s*', '', cleaned)
            return ast.literal_eval(cleaned)
        except Exception as e:
            print(e)
            return [
                {"name": "Industry Leader 1", "description": "Market leader in the sector", "why_choose": "Strong market position"},
                {"name": "Industry Leader 2", "description": "Innovation leader", "why_choose": "Cutting-edge solutions"},
                {"name": "Industry Leader 3", "description": "Growth leader", "why_choose": "Rapid expansion model"}
            ]

if __name__ == "__main__":
    agent = MarketResearchAgent()
    
    # Test the agent
    companies = agent.suggest_top_companies("IT consulting")
    print("Top Companies:", json.dumps(companies, indent=2))
    
    market_analysis = agent.analyze_market("IT consulting", "Accenture", "Focus on digital transformation services")
    print("Market Analysis:", json.dumps(market_analysis, indent=2))

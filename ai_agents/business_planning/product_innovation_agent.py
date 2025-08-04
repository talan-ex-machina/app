# product_innovation_agent.py

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

class ProductInnovationAgent:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.0-flash")
        self.system_prompt = """
You are a product innovation strategist specializing in identifying future trends and creating unique value propositions.
Your task is to analyze market gaps and suggest innovative products/services based on emerging trends.

### OUTPUT FORMAT:
Return a Python dictionary with this structure:
{
  "future_trends": [
    {
      "trend_name": str,
      "description": str,
      "timeline": str,
      "impact_level": str,
      "adoption_likelihood": str
    }
  ],
  "innovation_opportunities": [
    {
      "opportunity_title": str,
      "description": str,
      "target_trend": str,
      "competitive_advantage": str,
      "implementation_complexity": str
    }
  ],
  "product_services": [
    {
      "name": str,
      "type": str,
      "description": str,
      "unique_value_proposition": str,
      "target_market": str,
      "revenue_model": str,
      "differentiation_factors": [str]
    }
  ],
  "implementation_roadmap": [
    {
      "phase": str,
      "timeline": str,
      "key_activities": [str],
      "resources_needed": [str],
      "success_metrics": [str]
    }
  ],
  "risk_assessment": {
    "technical_risks": [str],
    "market_risks": [str],
    "mitigation_strategies": [str]
  }
}
"""

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
        
        # If all parsing fails, return default structure
        print("❌ Error parsing Product Innovation response:")
        print(f"Original: {response_text[:200]}...")
        print(f"Cleaned: {cleaned[:200]}...")
        
        return {
            "error": "Failed to parse response",
            "future_trends": [],
            "innovation_opportunities": [],
            "product_services": [],
            "implementation_roadmap": [],
            "risk_assessment": {"technical_risks": [], "market_risks": [], "mitigation_strategies": []}
        }

    def generate_innovations(self, business_type: str, idol_company: str, market_gaps: List[Dict], additional_context: str = "") -> Dict[str, Any]:
        """Generate innovative product/service ideas based on market analysis"""
        
        market_gaps_text = json.dumps(market_gaps, indent=2) if market_gaps else "No specific gaps provided"
        
        prompt = f"""
### Business Type: {business_type}
### Idol Company: {idol_company}
### Market Gaps Identified: {market_gaps_text}
### Additional Context: {additional_context}

### Instructions:
Based on the market analysis, create innovative products and services that:
1. Address identified market gaps
2. Leverage emerging technology trends
3. Differentiate from existing solutions (especially from the idol company)
4. Have strong commercial potential
5. Are feasible to implement

Focus on future trends not yet fully exploited by competitors, especially the idol company.
Provide specific, actionable product/service concepts with clear value propositions.
"""
        
        try:
            response = self.model.generate_content([self.system_prompt, prompt])
            return self.clean_and_parse_response(response.text)
        except Exception as e:
            return {
                "error": f"Failed to generate innovations: {str(e)}",
                "future_trends": [],
                "innovation_opportunities": [],
                "product_services": [],
                "implementation_roadmap": [],
                "risk_assessment": {"technical_risks": [], "market_risks": [], "mitigation_strategies": []}
            }

if __name__ == "__main__":
    agent = ProductInnovationAgent()
    
    # Test the agent
    sample_gaps = [
        {"gap_title": "AI Integration Gap", "description": "Limited AI adoption in small business consulting"}
    ]
    
    innovation_plan = agent.generate_innovations("IT consulting", "Accenture", sample_gaps, "Focus on SME market")
    print("Innovation Plan:", json.dumps(innovation_plan, indent=2))

# target_audience_agent.py

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

class TargetAudienceAgent:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.0-flash")
        self.system_prompt = """You are a target audience expert with focus on geographic market analysis and competitive benchmarking.

IMPORTANT: You MUST respond with ONLY a valid JSON object. No explanations, no markdown, just JSON.

Return this exact JSON structure with geographic coordinates for mapping and idol company analysis:
{
  "primary_segments": [ ... ],
  "geographic_opportunities": [ {
      city: string;
      country: string;
      latitude: number;
      longitude: number;
      market_potential: string;
      opportunity_type: string;
      market_size: string;
      entry_difficulty: string;
      key_advantages: string[];
      population: number;
      recommended_priority: number;
    } ],
  "customer_personas": [ ... ],
  "market_entry_strategy": { ... },
  "idol_company_market_analysis": {
    "strengths_to_avoid": [
      {"strength": "description", "why_avoid": "how to differentiate", "market_impact": "high/medium/low"}
    ],
    "weaknesses_to_exploit": [
      {"weakness": "description", "opportunity": "how to capitalize", "market_size": "value", "difficulty": "high/medium/low"}
    ]
  }
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
        
        # If all parsing fails, return default structure
        print("❌ Error parsing Target Audience response:")
        print(f"Original: {response_text[:200]}...")
        print(f"Cleaned: {cleaned[:200]}...")
        
        return {
            "error": "Failed to parse response",
            "primary_segments": [],
            "geographic_opportunities": [],
            "customer_personas": [],
            "market_entry_strategy": {"acquisition_channels": [], "pricing_strategy": "", "go_to_market_approach": "", "success_metrics": []}
        }

    def analyze_target_audience(self, business_type: str, products_services: List[Dict], idol_company: str = "", geographic_preference: str = "", additional_context: str = "") -> Dict[str, Any]:
        """Analyze target audience for the given products/services and idol company"""

        products_text = json.dumps(products_services, indent=2) if products_services else "No specific products provided"

        prompt = f"""Business Type: {business_type}
Products/Services: {products_text}
Idol Company: {idol_company}
Geographic Preference: {geographic_preference}
Context: {additional_context}

Identify target audiences and geographic market opportunities. Include specific cities with latitude/longitude coordinates for mapping visualization. Also analyze the idol company's strengths (to avoid) and weaknesses (to exploit) in this market. Focus on:
1. Who are the ideal customer segments?
2. Which cities/regions offer the best market opportunities?
3. What are the geographic coordinates (lat/lng) of these opportunity locations?
4. Why are these locations attractive (market gaps, growth potential, etc.)?
5. What is the priority order for market entry?
6. What are the idol company's strengths in this market (that we should avoid competing with)?
7. What are their weaknesses (that we should exploit)?"""
        
        try:
            response = self.model.generate_content(self.system_prompt + "\n" + prompt)
            if not response.text or not response.text.strip():
                raise ValueError("Empty response from Gemini API")
            return self.clean_and_parse_response(response.text)
        except Exception as e:
            return {
                "error": f"Failed to analyze target audience: {str(e)}",
                "primary_segments": [],
                "geographic_opportunities": [],
                "customer_personas": [],
                "market_entry_strategy": {"acquisition_channels": [], "pricing_strategy": "", "go_to_market_approach": "", "success_metrics": []}
            }

if __name__ == "__main__":
    agent = TargetAudienceAgent()
    
    # Test the agent
    sample_products = [
        {"name": "AI-Powered Business Analytics", "type": "service", "description": "Automated business intelligence for SMEs"}
    ]
    
    audience_analysis = agent.analyze_target_audience("IT consulting", sample_products, "North America and Europe", "Focus on SME market")
    print("Target Audience Analysis:", json.dumps(audience_analysis, indent=2))

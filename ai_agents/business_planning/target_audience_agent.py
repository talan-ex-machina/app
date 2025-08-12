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
        self.idol_company = ""
        self.activity_type = ""
        self.system_prompt = ""
    def set_idol_company(self, idol_company):
        self.idol_company = idol_company
        self._update_system_prompt()
    
    def set_activity_type(self, activity_type):
        self.activity_type = activity_type
        self._update_system_prompt()
    
    def _update_system_prompt(self):
        """Update the system prompt with current idol company and activity type"""
        if self.idol_company and self.activity_type:
            self.system_prompt = f"""You are a target audience expert with focus on geographic and timeline market analysis and competitive benchmarking.
        you should do a timeline analysis on : {self.idol_company} and return a detailed timeline of their progress in {self.activity_type} over the last past 10 years and what they have achieved in that time, and what's the takeaway from that analysis and also analyze how new competitors could do better than {self.idol_company} given the current technological advancement (genAI, ML, etc..) and the current market state and how much money and ressources we would save using new technologies
        the analysis should include 
1. A detailed timeline from year to year including milestones, progress, and key achievements.
2. A takeaway or insight from each year.
3. A final takeaway summarizing the 10-year trajectory.
4. A comparative analysis: How could we do better today using current technologies, market conditions, and cost savings.
5. Quantify or estimate the advantages (time saved, cost reduced, efficiency gained) where possible.
IMPORTANT: You MUST respond with ONLY a valid JSON object. No explanations, no markdown, just JSON.

Return this exact JSON structure with geographic coordinates for mapping and idol company analysis:
{{
    "idol_timeline": [{{
        "year": number,
        "title": "string",
        "description": "string",
        "achievements": ["string"],
        "takeaway": "string",
    "how_we_can_do_better": {{
      "summary": "string",
      "technology_advantages": ["string"],
      "estimated_savings": {{
        "time": "string",
        "cost": "string",
        "resources": "string"
      }}
  }}
    }}],
  "primary_segments": [ 
    {{
      "segment_name": "string",
      "description": "string", 
      "size_estimate": "string",
      "demographics": {{
        "age_range": "string",
        "income_level": "string",
        "education": "string",
        "occupation": "string"
      }}
    }}
  ],
  "geographic_opportunities": [ {{
      "city": "string",
      "country": "string",
      "latitude": number,
      "longitude": number,
      "market_potential": "string",
      "opportunity_type": "string",
      "market_size": "string",
      "entry_difficulty": "string",
      "key_advantages": ["string"],
      "population": number,
      "recommended_priority": number
    }} ],
  "customer_personas": [ 
    {{
      "persona_name": "string",
      "role_title": "string", 
      "company_type": "string",
      "location": "string",
      "budget_range": "string"
    }}
  ],
  "market_entry_strategy": {{
    "acquisition_channels": ["string"],
    "pricing_strategy": "string",
    "go_to_market_approach": "string", 
    "success_metrics": ["string"]
  }},
  "idol_company_market_analysis": {{
    "strengths_to_avoid": [
      {{"strength": "description", "why_avoid": "how to differentiate", "market_impact": "high/medium/low"}}
    ],
    "weaknesses_to_exploit": [
      {{"weakness": "description", "opportunity": "how to capitalize", "market_size": "value", "difficulty": "high/medium/low"}}
    ]
  }}
}}"""
        
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
            "market_entry_strategy": {"acquisition_channels": [], "pricing_strategy": "", "go_to_market_approach": "", "success_metrics": []},
            "idol_timeline": [],
            "idol_company_market_analysis": {"strengths_to_avoid": [], "weaknesses_to_exploit": []}
        }

    def analyze_target_audience(self, business_type: str, products_services: List[Dict], idol_company: str = "", geographic_preference: str = "", additional_context: str = "") -> Dict[str, Any]:
        """Analyze target audience for the given products/services and idol company"""
        
        # Set idol company and activity type if provided
        if idol_company:
            self.set_idol_company(idol_company)
        if business_type:
            self.set_activity_type(business_type)

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
7. What are their weaknesses (that we should exploit)?
8. Provide a detailed 10-year timeline analysis of {idol_company}'s progress in {business_type} including their key achievements and strategic takeaways."""
        
        try:
            # Ensure system prompt is set
            if not self.system_prompt:
                self._update_system_prompt()
                
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
                "market_entry_strategy": {"acquisition_channels": [], "pricing_strategy": "", "go_to_market_approach": "", "success_metrics": []},
                "idol_timeline": [],
                "idol_company_market_analysis": {"strengths_to_avoid": [], "weaknesses_to_exploit": []}
            }

if __name__ == "__main__":
    agent = TargetAudienceAgent()
    
    # Test the agent
    sample_products = [
        {"name": "AI-Powered Business Analytics", "type": "service", "description": "Automated business intelligence for SMEs"}
    ]
    
    # Test with specific idol company and activity type
    agent.set_idol_company("Microsoft")
    agent.set_activity_type("IT consulting")
    
    audience_analysis = agent.analyze_target_audience("IT consulting", sample_products, "Microsoft", "North America and Europe", "Focus on SME market")
    print("Target Audience Analysis:", json.dumps(audience_analysis, indent=2))

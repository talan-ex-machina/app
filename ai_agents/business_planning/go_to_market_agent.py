# go_to_market_agent.py

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

class GoToMarketAgent:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.0-flash")
        self.frameworks = {
            "crossing_the_chasm": {
                "name": "Geoffrey Moore's Crossing the Chasm",
                "description": "Technology adoption lifecycle framework focusing on market segments and customer psychology",
                "phases": ["Innovators", "Early Adopters", "Early Majority", "Late Majority", "Laggards"]
            },
            "mckinsey_7s": {
                "name": "McKinsey's 7S Framework", 
                "description": "Holistic approach examining Strategy, Structure, Systems, Shared Values, Style, Staff, Skills",
                "elements": ["Strategy", "Structure", "Systems", "Shared Values", "Style", "Staff", "Skills"]
            },
            "kotler_4p": {
                "name": "Kotler's 4Ps Marketing Mix",
                "description": "Classic marketing framework covering Product, Price, Place, Promotion",
                "components": ["Product", "Price", "Place", "Promotion"]
            },
            "lean_canvas": {
                "name": "Lean Canvas",
                "description": "Startup-focused business model canvas for rapid iteration",
                "blocks": ["Problem", "Solution", "Key Metrics", "Unique Value Proposition", "Unfair Advantage", "Channels", "Customer Segments", "Cost Structure", "Revenue Streams"]
            }
        }

    def get_available_frameworks(self) -> Dict[str, Any]:
        """Return available GTM frameworks with descriptions"""
        return self.frameworks

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
        
        # If all parsing fails, return error structure
        print("❌ Error parsing Go-to-Market response:")
        print(f"Original: {response_text[:200]}...")
        print(f"Cleaned: {cleaned[:200]}...")
        
        return {
            "error": "Failed to parse response",
            "framework_used": "unknown",
            "executive_summary": "Error generating plan",
            "phases": [],
            "timeline": [],
            "budget_allocation": {},
            "success_metrics": [],
            "risk_mitigation": []
        }

    def generate_gtm_plan(self, framework: str, business_details: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a go-to-market plan using the specified framework"""
        
        if framework not in self.frameworks:
            return {"error": f"Framework '{framework}' not supported"}

        framework_info = self.frameworks[framework]
        
        # Create framework-specific system prompt
        system_prompt = f"""You are a go-to-market strategy expert specializing in the {framework_info['name']} framework.

IMPORTANT: You MUST respond with ONLY a valid JSON object. No explanations, no markdown, just JSON.

Based on the {framework_info['name']} framework, create a comprehensive go-to-market plan that includes:
1. Phase-by-phase breakdown according to the framework
2. Actionable tactics and strategies for each phase
3. Timeline with milestones and deliverables
4. Budget allocation recommendations
5. Success metrics and KPIs
6. Risk assessment and mitigation strategies

Return this exact JSON structure:
{{
  "framework_used": "{framework}",
  "framework_name": "{framework_info['name']}",
  "executive_summary": "Brief overview of the GTM strategy",
  "market_context": {{
    "target_market_size": "string",
    "competitive_landscape": "string", 
    "market_timing": "string",
    "key_assumptions": ["string"]
  }},
  "phases": [
    {{
      "phase_number": number,
      "phase_name": "string",
      "phase_description": "string",
      "duration_weeks": number,
      "key_objectives": ["string"],
      "tactics": [
        {{
          "tactic_name": "string",
          "description": "string",
          "resources_required": "string",
          "expected_outcome": "string",
          "priority": "high/medium/low"
        }}
      ],
      "deliverables": ["string"],
      "success_criteria": ["string"]
    }}
  ],
  "timeline": [
    {{
      "week": number,
      "milestone": "string",
      "deliverable": "string",
      "phase": "string",
      "stakeholders": ["string"]
    }}
  ],
  "budget_allocation": {{
    "total_budget_estimate": "string",
    "marketing": {{
      "percentage": number,
      "amount": "string",
      "breakdown": {{
        "digital_marketing": "string",
        "content_creation": "string", 
        "events_pr": "string",
        "tools_platforms": "string"
      }}
    }},
    "sales": {{
      "percentage": number,
      "amount": "string",
      "breakdown": {{
        "sales_team": "string",
        "sales_tools": "string",
        "training": "string"
      }}
    }},
    "product": {{
      "percentage": number,
      "amount": "string",
      "breakdown": {{
        "development": "string",
        "testing": "string",
        "infrastructure": "string"
      }}
    }},
    "operations": {{
      "percentage": number,
      "amount": "string",
      "breakdown": {{
        "customer_support": "string",
        "legal_compliance": "string",
        "miscellaneous": "string"
      }}
    }}
  }},
  "success_metrics": [
    {{
      "metric_name": "string",
      "description": "string",
      "target_value": "string",
      "measurement_frequency": "string",
      "tracking_method": "string"
    }}
  ],
  "risk_mitigation": [
    {{
      "risk_category": "string",
      "risk_description": "string",
      "probability": "high/medium/low",
      "impact": "high/medium/low",
      "mitigation_strategy": "string",
      "contingency_plan": "string"
    }}
  ],
  "channels": [
    {{
      "channel_name": "string",
      "channel_type": "string",
      "target_segment": "string",
      "investment_level": "string",
      "expected_roi": "string",
      "activation_timeline": "string"
    }}
  ],
  "competitive_positioning": {{
    "unique_value_proposition": "string",
    "differentiation_strategy": "string",
    "competitive_advantages": ["string"],
    "positioning_statement": "string"
  }}
}}"""

        # Create detailed prompt with business context
        business_context = f"""
Business Details:
- Company: {business_details.get('company_name', 'New Venture')}
- Product/Service: {business_details.get('product_description', 'Not specified')}
- Target Market: {business_details.get('target_market', 'Not specified')} 
- Budget Range: {business_details.get('budget_range', 'Not specified')}
- Timeline: {business_details.get('timeline_months', 'Not specified')} months
- Key Objectives: {business_details.get('objectives', 'Not specified')}
- Competition: {business_details.get('main_competitors', 'Not specified')}
- Unique Advantages: {business_details.get('unique_advantages', 'Not specified')}

Create a detailed go-to-market plan using the {framework_info['name']} framework.
Focus on actionable strategies, realistic timelines, and measurable outcomes.
Consider the business context and tailor recommendations accordingly.
"""

        try:
            response = self.model.generate_content(system_prompt + "\n" + business_context)
            if not response.text or not response.text.strip():
                raise ValueError("Empty response from Gemini API")
            
            result = self.clean_and_parse_response(response.text)
            
            # Add framework metadata to result
            if "error" not in result:
                result["framework_metadata"] = framework_info
                
            return result
            
        except Exception as e:
            return {
                "error": f"Failed to generate GTM plan: {str(e)}",
                "framework_used": framework,
                "framework_name": framework_info['name'],
                "executive_summary": "Error occurred during plan generation",
                "phases": [],
                "timeline": [],
                "budget_allocation": {},
                "success_metrics": [],
                "risk_mitigation": []
            }

if __name__ == "__main__":
    agent = GoToMarketAgent()
    
    # Test the agent
    sample_business = {
        "company_name": "TechStart AI",
        "product_description": "AI-powered business analytics platform for SMEs",
        "target_market": "Small to medium enterprises in North America",
        "budget_range": "$100K - $500K",
        "timeline_months": 12,
        "objectives": "Acquire 1000 customers, establish market presence",
        "main_competitors": "Tableau, PowerBI, Google Analytics",
        "unique_advantages": "AI automation, affordable pricing, easy setup"
    }
    
    # Test different frameworks
    for framework in ["crossing_the_chasm", "mckinsey_7s", "kotler_4p"]:
        print(f"\n=== Testing {framework} ===")
        result = agent.generate_gtm_plan(framework, sample_business)
        print("GTM Plan:", json.dumps(result, indent=2)[:500] + "...")

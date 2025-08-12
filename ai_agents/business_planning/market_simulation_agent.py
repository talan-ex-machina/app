# market_simulation_agent.py

import os
import json
import ast
import re
import math
import random
from typing import Dict, List, Any
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise EnvironmentError("GEMINI_API_KEY not found in .env file.")

genai.configure(api_key=GEMINI_API_KEY)

class MarketSimulationAgent:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.0-flash")
        self.simulation_methods = {
            "monte_carlo": "Monte Carlo simulation with multiple scenario iterations",
            "agent_based": "Agent-based modeling with individual customer behavior",
            "system_dynamics": "System dynamics approach with feedback loops",
            "regression_based": "Statistical regression with market factors"
        }

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
        print("❌ Error parsing Market Simulation response:")
        print(f"Original: {response_text[:200]}...")
        print(f"Cleaned: {cleaned[:200]}...")
        
        return {
            "error": "Failed to parse response",
            "simulation_id": "error",
            "summary": {"total_revenue": 0, "market_share": 0, "customer_acquisition": 0},
            "timeline_results": [],
            "scenario_analysis": {},
            "kpi_predictions": {},
            "risk_analysis": []
        }

    def generate_market_simulation(self, simulation_params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate market simulation based on user parameters"""
        
        system_prompt = """You are a market simulation expert specializing in predictive modeling and scenario analysis.

IMPORTANT: You MUST respond with ONLY a valid JSON object. No explanations, no markdown, just JSON.

Create a comprehensive market simulation that includes:
1. Timeline-based predictions with monthly/quarterly breakdown
2. Multiple scenario analysis (best case, worst case, most likely)
3. KPI predictions with confidence intervals
4. Risk analysis and sensitivity testing
5. Visual data for charts, heatmaps, and timeline graphs
6. Interactive scenario parameters

Use realistic market dynamics including:
- Competition effects and market saturation
- Seasonal variations and market cycles
- Customer acquisition costs and lifetime value
- Marketing channel effectiveness over time
- Product adoption curves and churn rates

Return this exact JSON structure:
{
  "simulation_id": "unique_simulation_identifier",
  "simulation_metadata": {
    "method_used": "simulation_approach",
    "confidence_level": "percentage",
    "iterations_run": number,
    "base_assumptions": ["string"],
    "market_conditions": "string"
  },
  "summary": {
    "total_revenue": number,
    "market_share_final": number,
    "customer_acquisition_total": number,
    "roi": number,
    "break_even_month": number,
    "key_insights": ["string"]
  },
  "timeline_results": [
    {
      "period": number,
      "period_type": "month/quarter",
      "metrics": {
        "revenue": number,
        "customers_acquired": number,
        "cumulative_customers": number,
        "market_share": number,
        "customer_acquisition_cost": number,
        "customer_lifetime_value": number,
        "churn_rate": number,
        "brand_awareness": number,
        "marketing_effectiveness": number
      },
      "events": ["string"]
    }
  ],
  "scenario_analysis": {
    "best_case": {
      "probability": number,
      "total_revenue": number,
      "market_share": number,
      "key_assumptions": ["string"],
      "revenue_timeline": [number]
    },
    "worst_case": {
      "probability": number,
      "total_revenue": number,
      "market_share": number,
      "key_assumptions": ["string"],
      "revenue_timeline": [number]
    },
    "most_likely": {
      "probability": number,
      "total_revenue": number,
      "market_share": number,
      "key_assumptions": ["string"],
      "revenue_timeline": [number]
    }
  },
  "kpi_predictions": {
    "revenue": {
      "forecast": [number],
      "confidence_upper": [number],
      "confidence_lower": [number],
      "trend": "string"
    },
    "market_share": {
      "forecast": [number],
      "confidence_upper": [number],
      "confidence_lower": [number],
      "trend": "string"
    },
    "customer_count": {
      "forecast": [number],
      "confidence_upper": [number],
      "confidence_lower": [number],
      "trend": "string"
    }
  },
  "channel_performance": [
    {
      "channel_name": "string",
      "investment": number,
      "customers_acquired": number,
      "cost_per_acquisition": number,
      "roi": number,
      "effectiveness_timeline": [number]
    }
  ],
  "competitive_impact": {
    "market_leaders": [
      {
        "competitor": "string",
        "current_share": number,
        "predicted_share": number,
        "impact_on_our_business": "string"
      }
    ],
    "new_entrants": [
      {
        "entrant_type": "string",
        "probability": number,
        "potential_impact": "string"
      }
    ]
  },
  "risk_analysis": [
    {
      "risk_factor": "string",
      "probability": number,
      "impact_severity": "high/medium/low",
      "revenue_impact": number,
      "mitigation_strategy": "string",
      "monitoring_indicators": ["string"]
    }
  ],
  "sensitivity_analysis": {
    "budget_sensitivity": {
      "parameter": "budget",
      "variations": [-20, -10, 0, 10, 20],
      "revenue_impact": [number],
      "market_share_impact": [number]
    },
    "pricing_sensitivity": {
      "parameter": "price",
      "variations": [-15, -5, 0, 5, 15],
      "revenue_impact": [number],
      "demand_impact": [number]
    },
    "competition_sensitivity": {
      "parameter": "competitive_pressure",
      "variations": ["low", "medium", "high"],
      "market_share_impact": [number],
      "customer_acquisition_impact": [number]
    }
  },
  "heatmap_data": {
    "market_segments": [
      {
        "segment_name": "string",
        "attractiveness": number,
        "accessibility": number,
        "profitability": number,
        "competition_intensity": number
      }
    ],
    "geographic_regions": [
      {
        "region": "string",
        "market_potential": number,
        "entry_difficulty": number,
        "revenue_potential": number
      }
    ]
  },
  "recommendations": [
    {
      "recommendation": "string",
      "rationale": "string",
      "expected_impact": "string",
      "implementation_priority": "high/medium/low",
      "resource_requirement": "string"
    }
  ]
}"""

        # Create detailed prompt with simulation parameters
        simulation_context = f"""
Simulation Parameters:
- Business: {simulation_params.get('business_name', 'New Venture')}
- Product: {simulation_params.get('product_type', 'Not specified')}
- Time Period: {simulation_params.get('simulation_months', 12)} months
- Total Budget: {simulation_params.get('total_budget', 'Not specified')}
- Target Market Size: {simulation_params.get('target_market_size', 'Not specified')}
- Target Segments: {simulation_params.get('target_segments', [])}
- Marketing Channels: {simulation_params.get('marketing_channels', [])}
- Channel Budgets: {simulation_params.get('channel_budgets', {})}
- Product Price: {simulation_params.get('product_price', 'Not specified')}
- Main Competitors: {simulation_params.get('competitors', [])}
- Competitive Advantage: {simulation_params.get('competitive_advantage', 'Not specified')}
- Expected Customer Acquisition Cost: {simulation_params.get('expected_cac', 'Not specified')}
- Expected Customer Lifetime Value: {simulation_params.get('expected_clv', 'Not specified')}
- Seasonality Factors: {simulation_params.get('seasonality', 'Not specified')}
- Market Growth Rate: {simulation_params.get('market_growth_rate', 'Not specified')}

Generate a realistic market simulation that accounts for:
1. Realistic customer acquisition curves (starts slow, accelerates, then plateaus)
2. Competition response to market entry
3. Marketing channel saturation effects
4. Seasonal business variations
5. Customer churn and retention patterns
6. Market size constraints and penetration limits
7. Budget allocation efficiency over time

Provide detailed monthly breakdowns and scenario analysis.
"""

        try:
            response = self.model.generate_content(system_prompt + "\n" + simulation_context)
            if not response.text or not response.text.strip():
                raise ValueError("Empty response from Gemini API")
            
            result = self.clean_and_parse_response(response.text)
            
            # Add simulation metadata
            if "error" not in result:
                result["simulation_parameters"] = simulation_params
                result["generated_at"] = "2025-08-12"  # Current date
                
            return result
            
        except Exception as e:
            return {
                "error": f"Failed to generate market simulation: {str(e)}",
                "simulation_id": f"error_{random.randint(1000, 9999)}",
                "summary": {
                    "total_revenue": 0,
                    "market_share_final": 0,
                    "customer_acquisition_total": 0,
                    "roi": 0,
                    "break_even_month": 0,
                    "key_insights": ["Simulation failed to generate"]
                },
                "timeline_results": [],
                "scenario_analysis": {},
                "kpi_predictions": {},
                "risk_analysis": []
            }

    def run_sensitivity_analysis(self, base_params: Dict[str, Any], sensitivity_factors: List[str]) -> Dict[str, Any]:
        """Run sensitivity analysis on key parameters"""
        
        sensitivity_results = {}
        
        for factor in sensitivity_factors:
            if factor == 'budget':
                variations = [-20, -10, 0, 10, 20]  # percentage changes
                results = []
                
                for variation in variations:
                    modified_params = base_params.copy()
                    if 'total_budget' in modified_params:
                        original_budget = float(modified_params['total_budget'].replace('$', '').replace(',', '').replace('K', '000').replace('M', '000000'))
                        modified_budget = original_budget * (1 + variation/100)
                        modified_params['total_budget'] = f"${modified_budget:,.0f}"
                    
                    # Run simulation with modified parameters
                    sim_result = self.generate_market_simulation(modified_params)
                    results.append({
                        'variation': variation,
                        'revenue_impact': sim_result.get('summary', {}).get('total_revenue', 0),
                        'market_share_impact': sim_result.get('summary', {}).get('market_share_final', 0)
                    })
                
                sensitivity_results[factor] = results
        
        return sensitivity_results

if __name__ == "__main__":
    agent = MarketSimulationAgent()
    
    # Test the agent
    sample_params = {
        "business_name": "TechStart AI",
        "product_type": "AI-powered business analytics SaaS",
        "simulation_months": 18,
        "total_budget": "$250,000",
        "target_market_size": "50,000 SMEs",
        "target_segments": ["Small Businesses", "Startups", "Consultants"],
        "marketing_channels": ["Google Ads", "Content Marketing", "LinkedIn", "Partnerships"],
        "channel_budgets": {
            "Google Ads": "$8,000/month",
            "Content Marketing": "$5,000/month", 
            "LinkedIn": "$4,000/month",
            "Partnerships": "$3,000/month"
        },
        "product_price": "$99/month",
        "competitors": ["Tableau", "PowerBI", "Google Analytics"],
        "competitive_advantage": "AI automation, affordable pricing",
        "expected_cac": "$150",
        "expected_clv": "$2,400",
        "seasonality": "Higher demand in Q1, Q4",
        "market_growth_rate": "15% annually"
    }
    
    print("=== Testing Market Simulation ===")
    result = agent.generate_market_simulation(sample_params)
    print("Simulation Result:", json.dumps(result, indent=2)[:800] + "...")

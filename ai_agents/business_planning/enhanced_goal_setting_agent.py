# enhanced_goal_setting_agent.py

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

class EnhancedGoalSettingAgent:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.0-flash")
        self.system_prompt = """
You are a strategic business planning expert specializing in goal setting and execution roadmaps.
Your task is to create detailed, time-bound action plans based on business context and market analysis.

### OUTPUT FORMAT:
Return a Python dictionary with this structure:
{
  "timeframe_months": int,
  "executive_summary": str,
  "strategic_goals": [
    {
      "goal_id": str,
      "title": str,
      "description": str,
      "category": str,
      "priority": str,
      "start_month": int,
      "end_month": int,
      "success_criteria": [str],
      "key_milestones": [
        {
          "milestone_id": str,
          "title": str,
          "month": int,
          "deliverables": [str],
          "dependencies": [str]
        }
      ],
      "resources_required": {
        "human_resources": [str],
        "financial_investment": str,
        "technology_tools": [str],
        "external_partnerships": [str]
      },
      "risk_factors": [
        {
          "risk": str,
          "impact": str,
          "probability": str,
          "mitigation": str
        }
      ]
    }
  ],
  "monthly_breakdown": [
    {
      "month": int,
      "focus_areas": [str],
      "key_activities": [str],
      "deliverables": [str],
      "budget_allocation": str,
      "team_requirements": [str]
    }
  ],
  "success_metrics": {
    "financial_kpis": [str],
    "operational_kpis": [str],
    "customer_kpis": [str],
    "growth_kpis": [str]
  },
  "contingency_plans": [
    {
      "scenario": str,
      "triggers": [str],
      "response_actions": [str]
    }
  ]
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
        print("❌ Error parsing Goal Setting response:")
        print(f"Original: {response_text[:200]}...")
        print(f"Cleaned: {cleaned[:200]}...")
        
        return {
            "error": "Failed to parse response",
            "timeframe_months": 12,
            "executive_summary": "",
            "strategic_goals": [],
            "monthly_breakdown": [],
            "success_metrics": {"financial_kpis": [], "operational_kpis": [], "customer_kpis": [], "growth_kpis": []},
            "contingency_plans": []
        }

    def generate_strategic_plan(self, 
                              business_type: str, 
                              market_analysis: Dict, 
                              products_services: List[Dict], 
                              target_audience: Dict, 
                              months: int = 12,
                              additional_context: str = "") -> Dict[str, Any]:
        """Generate comprehensive strategic plan based on all previous analyses"""
        
        prompt = f"""
### Business Type: {business_type}
### Timeframe: {months} months
### Market Analysis: {json.dumps(market_analysis, indent=2) if market_analysis else "Not provided"}
### Products/Services: {json.dumps(products_services, indent=2) if products_services else "Not provided"}
### Target Audience: {json.dumps(target_audience, indent=2) if target_audience else "Not provided"}
### Additional Context: {additional_context}

### Instructions:
Create a comprehensive {months}-month strategic business plan that:

1. **Builds on the market analysis** - Address identified gaps and leverage success patterns
2. **Implements the product/service strategy** - Detail how to develop and launch innovations
3. **Targets the right audience** - Execute the customer acquisition and market entry strategy
4. **Sets clear, measurable goals** - With specific timelines, milestones, and success criteria

Focus on:
- Actionable monthly breakdown of activities
- Realistic resource requirements and budgets
- Clear dependencies between goals and milestones
- Risk assessment and contingency planning
- Measurable KPIs and success metrics

Make the plan specific, practical, and executable for a new business entering this market.
"""
        
        try:
            response = self.model.generate_content([self.system_prompt, prompt])
            return self.clean_and_parse_response(response.text)
        except Exception as e:
            return {
                "error": f"Failed to generate strategic plan: {str(e)}",
                "timeframe_months": months,
                "executive_summary": "",
                "strategic_goals": [],
                "monthly_breakdown": [],
                "success_metrics": {"financial_kpis": [], "operational_kpis": [], "customer_kpis": [], "growth_kpis": []},
                "contingency_plans": []
            }

    def save_output(self, plan: Dict[str, Any], folder: str = "outputs") -> None:
        """Save the strategic plan outputs to files"""
        os.makedirs(folder, exist_ok=True)
        
        # Save complete plan
        with open(os.path.join(folder, "strategic_plan.json"), "w") as f:
            json.dump(plan, f, indent=2)
        
        # Save timeline data for visualization
        timeline_data = []
        for goal in plan.get("strategic_goals", []):
            for milestone in goal.get("key_milestones", []):
                timeline_data.append({
                    "goal": goal["title"],
                    "milestone": milestone["title"],
                    "month": milestone["month"],
                    "category": goal["category"]
                })
        
        with open(os.path.join(folder, "timeline_data.json"), "w") as f:
            json.dump(timeline_data, f, indent=2)
        
        # Save monthly breakdown for Gantt charts
        with open(os.path.join(folder, "monthly_breakdown.json"), "w") as f:
            json.dump(plan.get("monthly_breakdown", []), f, indent=2)
        
        # Generate markdown report
        markdown_report = self._generate_markdown_report(plan)
        with open(os.path.join(folder, "strategic_plan_report.md"), "w") as f:
            f.write(markdown_report)

    def _generate_markdown_report(self, plan: Dict[str, Any]) -> str:
        """Generate a markdown report from the strategic plan"""
        
        report = f"""# Strategic Business Plan ({plan.get('timeframe_months', 12)} Months)

## Executive Summary
{plan.get('executive_summary', 'Not provided')}

## Strategic Goals
"""
        
        for goal in plan.get("strategic_goals", []):
            report += f"""
### {goal.get('title', 'Untitled Goal')}
**Category:** {goal.get('category', 'General')} | **Priority:** {goal.get('priority', 'Medium')}
**Timeline:** Month {goal.get('start_month', 1)} - {goal.get('end_month', 12)}

{goal.get('description', 'No description provided')}

**Success Criteria:**
{chr(10).join(f"- {criteria}" for criteria in goal.get('success_criteria', []))}

**Key Milestones:**
{chr(10).join(f"- Month {ms.get('month', 0)}: {ms.get('title', 'Untitled')}" for ms in goal.get('key_milestones', []))}

**Resources Required:**
- **Human Resources:** {', '.join(goal.get('resources_required', {}).get('human_resources', []))}
- **Financial Investment:** {goal.get('resources_required', {}).get('financial_investment', 'Not specified')}
- **Technology Tools:** {', '.join(goal.get('resources_required', {}).get('technology_tools', []))}

"""
        
        report += """
## Success Metrics
"""
        metrics = plan.get("success_metrics", {})
        for category, kpis in metrics.items():
            if kpis:
                report += f"""
### {category.replace('_', ' ').title()}
{chr(10).join(f"- {kpi}" for kpi in kpis)}
"""
        
        return report

if __name__ == "__main__":
    agent = EnhancedGoalSettingAgent()
    
    # Test the agent
    sample_market = {"market_gaps": [{"gap_title": "AI Integration Gap"}]}
    sample_products = [{"name": "AI Analytics Service"}]
    sample_audience = {"primary_segments": [{"segment_name": "SME Tech Companies"}]}
    
    strategic_plan = agent.generate_strategic_plan(
        "IT consulting", 
        sample_market, 
        sample_products, 
        sample_audience, 
        12, 
        "Focus on digital transformation"
    )
    
    print("Strategic Plan:", json.dumps(strategic_plan, indent=2))

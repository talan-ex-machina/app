# business_planning_orchestrator.py

import os
import json
import re
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
import google.generativeai as genai
from market_research_agent import MarketResearchAgent
from product_innovation_agent import ProductInnovationAgent
from target_audience_agent import TargetAudienceAgent
from enhanced_goal_setting_agent import EnhancedGoalSettingAgent

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise EnvironmentError("GEMINI_API_KEY not found in .env file.")

genai.configure(api_key=GEMINI_API_KEY)

class BusinessPlanningOrchestrator:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.0-flash")
        self.market_agent = MarketResearchAgent()
        self.product_agent = ProductInnovationAgent()
        self.audience_agent = TargetAudienceAgent()
        self.goal_agent = EnhancedGoalSettingAgent()
        
        self.conversation_state = {
            "business_type": "",
            "idol_company": "",
            "additional_context": "",
            "geographic_preference": "",
            "timeframe_months": 12,
            "current_step": "initial",
            "collected_info": {},
            "analysis_results": {}
        }

    def extract_business_intent(self, user_prompt: str) -> Dict[str, str]:
        """Extract business type and intent from user prompt"""
        
        extraction_prompt = f"""
Extract business information from this user prompt: "{user_prompt}"

Return a JSON object with:
{{
  "business_type": "The type of business (e.g., 'IT consulting', 'e-commerce', 'healthcare')",
  "business_description": "Brief description of what they want to do",
  "geographic_hints": "Any geographic preferences mentioned",
  "additional_context": "Any other relevant details"
}}
"""
        
        try:
            response = self.model.generate_content(extraction_prompt)
            cleaned = re.sub(r"^```(?:json)?", "", response.text.strip(), flags=re.MULTILINE)
            cleaned = cleaned.strip("` \n")
            return json.loads(cleaned)
        except Exception as e:
            return {
                "business_type": "business",
                "business_description": user_prompt,
                "geographic_hints": "",
                "additional_context": ""
            }

    def suggest_idol_companies(self, business_type: str) -> List[Dict[str, str]]:
        """Get top 3 company suggestions for the business type"""
        return self.market_agent.suggest_top_companies(business_type)

    def generate_follow_up_questions(self, current_info: Dict[str, Any]) -> List[str]:
        """Generate follow-up questions based on current information"""
        
        questions_prompt = f"""
Based on the current business planning information: {json.dumps(current_info, indent=2)}

Generate 2-3 specific follow-up questions to gather missing important details for business planning.
Focus on:
- Geographic target markets
- Budget/investment capacity
- Timeline preferences
- Specific industry focus
- Target customer size (SME, Enterprise, etc.)

Return a JSON array of questions:
["Question 1", "Question 2", "Question 3"]
"""
        
        try:
            response = self.model.generate_content(questions_prompt)
            cleaned = re.sub(r"^```(?:json)?", "", response.text.strip(), flags=re.MULTILINE)
            cleaned = cleaned.strip("` \n")
            return json.loads(cleaned)
        except Exception:
            return [
                "What geographic markets are you primarily targeting?",
                "What is your expected timeline for launching this business?",
                "What is your initial investment budget range?"
            ]

    def check_readiness_for_analysis(self) -> bool:
        """Check if enough information is collected to proceed with analysis"""
        required_fields = ["business_type", "idol_company"]
        return all(self.conversation_state.get(field) for field in required_fields)

    async def process_user_input(self, user_input: str, step: str = None) -> Dict[str, Any]:
        """Process user input and return appropriate response"""
        
        if step == "initial" or not self.conversation_state.get("business_type"):
            # Extract business intent from initial prompt
            intent = self.extract_business_intent(user_input)
            self.conversation_state["business_type"] = intent["business_type"]
            self.conversation_state["additional_context"] = intent.get("additional_context", "") or ""
            self.conversation_state["geographic_preference"] = intent.get("geographic_hints", "") or ""
            
            # Get company suggestions
            companies = self.suggest_idol_companies(intent["business_type"])
            
            return {
                "type": "company_selection",
                "message": f"Great! I understand you want to work in {intent['business_type']}. Here are the top 3 companies in this sector that could serve as benchmarks:",
                "companies": companies,
                "business_type": intent["business_type"],
                "next_step": "company_selection"
            }
        
        elif step == "company_selection":
            # User selected or mentioned a company
            self.conversation_state["idol_company"] = user_input
            self.audience_agent.set_idol_company(user_input)
            
            # Check if we need more information
            if self.check_readiness_for_analysis():
                questions = self.generate_follow_up_questions(self.conversation_state)
                return {
                    "type": "follow_up_questions",
                    "message": f"Perfect! You've chosen {user_input} as your benchmark. I have a few more questions to create the best business plan:",
                    "questions": questions,
                    "next_step": "information_gathering"
                }
            else:
                questions = self.generate_follow_up_questions(self.conversation_state)
                return {
                    "type": "follow_up_questions",
                    "message": "I need a bit more information to create a comprehensive business plan:",
                    "questions": questions,
                    "next_step": "information_gathering"
                }
        
        elif step == "information_gathering":
            # Process additional information
            current_context = self.conversation_state.get("additional_context") or ""
            self.conversation_state["additional_context"] = current_context + f" {user_input}"
            
            # Check if ready for analysis
            if self.check_readiness_for_analysis():
                return {
                    "type": "ready_for_analysis",
                    "message": "Excellent! I have enough information to start the comprehensive business analysis. This will include market research, product innovation opportunities, target audience analysis, and strategic goal setting.",
                    "next_step": "analysis"
                }
            else:
                questions = self.generate_follow_up_questions(self.conversation_state)
                return {
                    "type": "follow_up_questions",
                    "message": "Thank you for that information. I have a couple more questions:",
                    "questions": questions,
                    "next_step": "information_gathering"
                }
        
        elif step == "analysis":
            return await self.run_complete_analysis()
        
        else:
            return {
                "type": "error",
                "message": "I'm not sure how to process that. Could you please clarify?"
            }

    async def run_complete_analysis(self) -> Dict[str, Any]:
        """Run the complete business analysis using all agents"""
        
        try:
            # Step 1: Market Research
            print("🔍 Running market research analysis...")
            market_analysis = self.market_agent.analyze_market(
                self.conversation_state["business_type"],
                self.conversation_state["idol_company"],
                self.conversation_state["additional_context"]
            )
            self.conversation_state["analysis_results"]["market_research"] = market_analysis
            
            # Step 2: Product Innovation
            print("💡 Generating product innovation opportunities...")
            product_analysis = self.product_agent.generate_innovations(
                self.conversation_state["business_type"],
                self.conversation_state["idol_company"],
                market_analysis.get("market_gaps", []),
                self.conversation_state["additional_context"]
            )
            self.conversation_state["analysis_results"]["product_innovation"] = product_analysis
            
            # Step 3: Target Audience Analysis
            print("🎯 Analyzing target audience...")
            audience_analysis = self.audience_agent.analyze_target_audience(
                self.conversation_state["business_type"],
                product_analysis.get("product_services", []),
                self.conversation_state["geographic_preference"],
                self.conversation_state["additional_context"]
            )
            self.conversation_state["analysis_results"]["target_audience"] = audience_analysis
            
            # Step 4: Strategic Goal Setting
            print("📊 Creating strategic plan...")
            strategic_plan = self.goal_agent.generate_strategic_plan(
                self.conversation_state["business_type"],
                market_analysis,
                product_analysis.get("product_services", []),
                audience_analysis,
                self.conversation_state["timeframe_months"],
                self.conversation_state["additional_context"]
            )
            self.conversation_state["analysis_results"]["strategic_plan"] = strategic_plan
            
            return {
                "type": "complete_analysis",
                "message": "🎉 Complete business analysis ready! Your comprehensive business plan includes market research, innovation opportunities, target audience insights, and strategic goals.",
                "results": self.conversation_state["analysis_results"],
                "conversation_state": self.conversation_state
            }
            
        except Exception as e:
            return {
                "type": "error",
                "message": f"An error occurred during analysis: {str(e)}",
                "error": str(e)
            }

    def save_complete_analysis(self, output_folder: str = "business_plan_output"):
        """Save all analysis results to files"""
        os.makedirs(output_folder, exist_ok=True)
        
        # Save individual analysis results
        for analysis_type, results in self.conversation_state["analysis_results"].items():
            with open(os.path.join(output_folder, f"{analysis_type}.json"), "w") as f:
                json.dump(results, f, indent=2)
        
        # Save conversation state
        with open(os.path.join(output_folder, "conversation_state.json"), "w") as f:
            json.dump(self.conversation_state, f, indent=2)
        
        # Save goal setting outputs using the agent's method
        if "strategic_plan" in self.conversation_state["analysis_results"]:
            self.goal_agent.save_output(
                self.conversation_state["analysis_results"]["strategic_plan"],
                output_folder
            )

    def reset_conversation(self):
        """Reset the conversation state"""
        self.conversation_state = {
            "business_type": "",
            "idol_company": "",
            "additional_context": "",
            "geographic_preference": "",
            "timeframe_months": 12,
            "current_step": "initial",
            "collected_info": {},
            "analysis_results": {}
        }

if __name__ == "__main__":
    import asyncio
    
    orchestrator = BusinessPlanningOrchestrator()
    
    async def test_workflow():
        # Test the complete workflow
        result1 = await orchestrator.process_user_input("I want to start an IT consulting business", "initial")
        print("Step 1:", json.dumps(result1, indent=2))
        
        result2 = await orchestrator.process_user_input("Accenture", "company_selection")
        print("Step 2:", json.dumps(result2, indent=2))
        
        result3 = await orchestrator.process_user_input("I want to focus on North America, mid-market companies, with $100k initial budget", "information_gathering")
        print("Step 3:", json.dumps(result3, indent=2))
        
        if result3.get("type") == "ready_for_analysis":
            result4 = await orchestrator.process_user_input("", "analysis")
            print("Step 4: Analysis complete!")
            orchestrator.save_complete_analysis()
    
    asyncio.run(test_workflow())

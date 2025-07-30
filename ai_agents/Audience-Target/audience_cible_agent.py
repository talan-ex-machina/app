import google.generativeai as genai
import os
from dotenv import load_dotenv
from audience_targeting_tool import AudienceTargetingTool

load_dotenv()
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

class AudienceCibleAgent:
    """
    An agent responsible for providing an audience analysis.
    It can be initialized with a specific tool for testing purposes (Dependency Injection).
    """
    def __init__(self, targeting_tool=None):
        """
        Initializes the agent. If a targeting_tool is provided, it uses it.
        Otherwise, it creates a new instance of the real AudienceTargetingTool.
        """
        if targeting_tool:
            self.targeting_tool = targeting_tool
            print("Agent initializing in TEST mode with a dependency-injected tool.")
        else:
            self.targeting_tool = AudienceTargetingTool()
            print("Agent initializing in PRODUCTION mode with the real AudienceTargetingTool.")
            
    def run(self, product_data: dict, business_data: dict) -> dict:
        """
        The agent's run method orchestrates the work by delegating to its tool.
        """
        print(f"Agent received a request for product data: '{product_data.get('product_idea')}'")
        print("Delegating the task to its tool...")
        
        analysis_result = self.targeting_tool.run(product_data, business_data)
        
        print("Agent has received the result from the tool.")
        return analysis_result

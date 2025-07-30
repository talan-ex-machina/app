import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import time

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel( 
         model_name='gemini-2.0-flash',
         generation_config={
         "temperature":0.4,
         "max_output_tokens":500
    }
)
def query_gemini(prompt):
     response = model.generate_content(prompt)
     return response.text
    
def get_company_domains(company_data, competitor_tech_domains=None):
    """
    Generate strategic technology domain recommendations for a company based on 
    competitive analysis and emerging trends.
    
    Args:
        company_data (str): Detailed company profile information
        competitor_tech_domains (list, optional): List of technology domains used by competitors
    
    Returns:
        str: Strategic technology recommendation report
    """
    import json
    import os
    
    # Set default values if not provided
    if competitor_tech_domains is None:
        competitor_tech_domains = []
    
    # Load trending domains from predicted_trends.json
    try:
        with open('predicted_trends.json', 'r', encoding='utf-8') as f:
            trends_data = json.load(f)
            # Extract domain names from the JSON structure
            if isinstance(trends_data, dict):
                trending_domains = list(trends_data.keys())
            elif isinstance(trends_data, list):
                trending_domains = [item.get('domain', item) if isinstance(item, dict) else str(item) for item in trends_data]
            else:
                raise ValueError("Unexpected JSON structure in predicted_trends.json")
    except FileNotFoundError:
        print("Warning: predicted_trends.json not found. Using default trending domains.")
        trending_domains = [
            "Artificial Intelligence", "Machine Learning", "Quantum Computing", 
            "Edge Computing", "5G/6G Networks", "Internet of Things (IoT)",
            "Blockchain", "Digital Twins", "Extended Reality (XR)", 
            "Cybersecurity", "Cloud Computing", "Robotics", "Autonomous Systems",
            "Green Technology", "Biotechnology", "Nanotechnology"
        ]
    except Exception as e:
        print(f"Error reading predicted_trends.json: {e}. Using default trending domains.")
        trending_domains = [
            "Artificial Intelligence", "Machine Learning", "Quantum Computing", 
            "Edge Computing", "5G/6G Networks", "Internet of Things (IoT)",
            "Blockchain", "Digital Twins", "Extended Reality (XR)", 
            "Cybersecurity", "Cloud Computing", "Robotics", "Autonomous Systems",
            "Green Technology", "Biotechnology", "Nanotechnology"
        ]
    
    # Convert lists to formatted strings for prompt
    competitor_domains_str = "\n".join([f"- {domain}" for domain in competitor_tech_domains]) if competitor_tech_domains else "No competitor data provided"
    trending_domains_str = "\n".join([f"- {domain}" for domain in trending_domains])
    
    domain_prompt = f"""
You are a strategic technology analyst specializing in competitive intelligence and emerging technology trends.

COMPANY ANALYSIS:
Given the company profile: "{company_data}"

COMPETITIVE LANDSCAPE:
Competitor technology domains currently used or planned:
{competitor_domains_str}

TREND REFERENCE:
Available trending domains from predicted_trends.json:
{trending_domains_str}

TASK REQUIREMENTS:
1. Analyze the company's current technology stack, business model, industry sector, and strategic objectives
2. Identify technology domains from the trending list that align with the company's:
   - Core business capabilities
   - Target market opportunities
   - Operational needs
   - Growth strategies

3. COMPETITIVE DIFFERENTIATION (CRITICAL):
   - Exclude any technology domains that competitors are already heavily investing in
   - Focus on trending technologies that offer competitive advantage through differentiation
   - Prioritize domains where the company can establish first-mover or fast-follower advantage

4. FUTURE-FOCUSED ANALYSIS:
   - Only recommend domains trending in the next 4 years (2025-2029)
   - Consider technology maturity cycles and adoption timelines
   - Evaluate market readiness and implementation feasibility

OUTPUT FORMAT:
Return a strategic technology recommendation report containing:
- Recommended technology domains (from trending list only)n
- Competitive advantage explanation
- Synergy with existing company capabilities

CONSTRAINTS:
- Maximum 2 recommended domains
- Each domain must be from the predicted_trends.json file
- No overlap with competitor focus areas
- Must align with company's industry and scale
- Consider budget and resource implications
"""
    
    try:
        response = query_gemini(domain_prompt)
        return response
    except Exception as e:
        return f"Error generating technology domain recommendations: {str(e)}"

# def filter_trending_domains(domains):
  #trend_prompt= f"""
  #you are a technology analyst trend expert 
  #and you are given a list of domains in trend predictions.json"{domains}"
  #,return only the domains that are trending in the next 5 years
  #and that are relevant to the company profile

   #"""
  
  #filtered_domains= query_gemini(trend_prompt)
  #return filtered_domains



if __name__=="__main__":
    company_data=input("enter a company name")

    domains = get_company_domains(company_data)
    print("Predicted Domains for the Company:", domains)
    #trend_domain=filter_trending_domains(domains)

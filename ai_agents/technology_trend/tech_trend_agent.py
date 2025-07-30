import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import re

    

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
def load_trending_domains(file_path="predicted_trends.json") -> list:
    """Load trending technology domains from JSON file or use defaults."""
    default_domains = [
        "Artificial Intelligence", "Machine Learning", "Quantum Computing",
        "Edge Computing", "5G/6G Networks", "Internet of Things (IoT)",
        "Blockchain", "Digital Twins", "Extended Reality (XR)",
        "Cybersecurity", "Cloud Computing", "Robotics", "Autonomous Systems",
        "Green Technology", "Biotechnology", "Nanotechnology"
    ]
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict):
                return list(data.keys())
            elif isinstance(data, list):
                return [item.get("domain", item) if isinstance(item, dict) else str(item) for item in data]
            else:
                raise ValueError("Unexpected JSON format")
    except Exception as e:
        print(f"⚠️ Warning loading trends: {e}")
        return default_domains
    
def generate_recommendation_prompt(company_profile, trending_domains, competitor_domains) -> str:
    """Build the full prompt to send to Gemini."""
    trending_str = "\n".join(f"- {d}" for d in trending_domains)
    competitors_str = "\n".join(f"- {d}" for d in competitor_domains) if competitor_domains else "No competitor data provided"
    
    return f"""
### ROLE
You are a strategic technology analyst.

### CONTEXT
Company Profile:
"{company_profile}"

Competitor Focus Domains:
{competitors_str}

Trending Technology Domains (2025–2029):
{trending_str}

### OBJECTIVE
Recommend maximum 2 strategic technology domains (from trending list only) that:
- Align with the company’s business model, industry, and goals
- Are not already used heavily by competitors
- Provide strong potential for differentiation or innovation
- Are feasible within 2025–2029 (technology readiness + budget)
### OUTPUT FORMAT

Provide the output in two clearly separated sections:

1. ✅ Recommended Domains (max 2):
    - Domain 1: [name] – [justification based on alignment, innovation potential, feasibility]
    - Domain 2: [name] – [justification based on alignment, innovation potential, feasibility]

    
2. ❌ Domains that competirors are already using:
    - List the technology domains (from the trending list) that should not be pursued by the company because they are heavily adopted or invested in by competitors.
    - For each domain, provide a brief reason (e.g., "Already saturated by direct competitors", "Lack of differentiation opportunity").

Only use domains from the provided trending domains list in both sections.
"""

def get_strategic_tech_domains(company_profile, competitor_domains=None) -> str:
    """Main function to generate recommendations based on company and trends."""
    competitor_domains = competitor_domains or []
    trending_domains = load_trending_domains()

    prompt = generate_recommendation_prompt(company_profile, trending_domains, competitor_domains)
    
    try:
        response = query_gemini(prompt)
        return response
    except Exception as e:
     
     
        return f"❌ Error during Gemini response: {str(e)}"
def save_json(data, filename="domain_recommendations.json"):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    print(f"✅ Saved recommendations to {filename}")

def parse_gemini_output_to_json(response_text):
    result = {
        "recommended_domains": [],
        "domains_used_by_company": []
    }

    # Extract recommended domains
    recommended_matches = re.findall(r"Domain\s\d:\s(.+?)\s–\s(.+)", response_text)
    for domain, reason in recommended_matches:
        result["recommended_domains"].append({
            "name": domain.strip(),
            "justification": reason.strip()
        })

    # Extract domains to avoid
    avoid_section = re.search(r"❌ Domains to Avoid:(.*)", response_text, re.DOTALL)
    if avoid_section:
        avoid_lines = avoid_section.group(1).strip().splitlines()
        for line in avoid_lines:
            if '-' in line:
                parts = line.split("–", 1)
                if len(parts) == 2:
                    name, reason = parts
                    result["domains_to_avoid"].append({
                        "name": name.strip("-"),
                        "justification": reason.strip()
                    })

    return result
if __name__=="__main__":
    print("🔍 Strategic Tech Domain Recommender\n")
    company = input("Enter company name: ")
    product = input("Enter the main product: ")
    service = input("Enter the main service/value: ")
    competitors = input("Enter competitor domains (comma-separated, optional): ")

    competitor_domains = [c.strip() for c in competitors.split(",")] if competitors.strip() else []

    company_profile = f"{company} develops '{product}' and offers '{service}' to its market. The goal is to identify future-ready, differentiated tech domains."

    # Step 1: Get Gemini output
    gemini_text = get_strategic_tech_domains(company_profile, competitor_domains)

    print("\n🧠 Gemini Output:\n")
    print(gemini_text)

    # Step 2: Parse and save
    parsed_json = parse_gemini_output_to_json(gemini_text)
    save_json(parsed_json)
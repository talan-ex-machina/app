# agent.py

import os
import json
import ast
import re
import argparse
from dotenv import load_dotenv
import google.generativeai as genai

# Load your Gemini API key from .env file
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise EnvironmentError("GEMINI_API_KEY not found in .env file.")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize Gemini model
model = genai.GenerativeModel("gemini-2.0-flash")

# System instruction
SYSTEM_PROMPT = """
You are a strategic planning assistant. Given a business context and a time range in months,
you must generate:
1. A structured goal plan in JSON.
2. A textual Markdown report.
3. Timeline + milestone data for charts.

### OUTPUT FORMAT:
Return a Python dictionary with these keys:
- "json_output": {...}
- "textual_report": "..."
- "timeline_data": [...]
- "milestone_data": [...]

JSON must include:
{
  "timeframe_months": int,
  "goals": [
    {
      "title": str,
      "description": str,
      "start_month": int,
      "end_month": int,
      "milestones": [{"label": str, "month": int}],
      "owner": str
    }
  ]
}
"""

def clean_and_parse_response(response_text: str):
    """
    Cleans and safely parses Gemini response text into a Python dictionary.
    """
    # Remove markdown formatting
    cleaned = re.sub(r"^```(?:python)?", "", response_text.strip(), flags=re.MULTILINE)
    cleaned = cleaned.strip("` \n")

    # Remove leading assignment like "output ="
    cleaned = re.sub(r'^\s*\w+\s*=\s*', '', cleaned)

    try:
        return ast.literal_eval(cleaned)
    except Exception as e:
        print("❌ Error parsing Gemini response:")
        print(cleaned)
        raise ValueError("Gemini returned an invalid format.") from e


def generate_plan(context: str, months: int = 6):
    prompt = f"""
### Context:
{context}

### Timeframe:
{months} months

### Instructions:
Generate the 4 output parts as described.
"""
    print("🤖 Calling Gemini API...")
    response = model.generate_content([SYSTEM_PROMPT, prompt])
    return clean_and_parse_response(response.text)

def save_output(plan: dict, folder: str = "outputs"):
    os.makedirs(folder, exist_ok=True)
    
    with open(os.path.join(folder, "goal_plan.json"), "w") as f:
        json.dump(plan["json_output"], f, indent=2)
        
    with open(os.path.join(folder, "report.md"), "w") as f:
        f.write(plan["textual_report"])
        
    with open(os.path.join(folder, "timeline_data.json"), "w") as f:
        json.dump(plan["timeline_data"], f, indent=2)

    with open(os.path.join(folder, "milestone_data.json"), "w") as f:
        json.dump(plan["milestone_data"], f, indent=2)

    print(f"\n✅ All outputs saved to: ./{folder}/")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI Goal Planning Agent using Gemini 1.5 Flash")
    parser.add_argument("--context", type=str, help="The business context (string).")
    parser.add_argument("--months", type=int, default=6, help="Timeframe in months (default: 6).")
    args = parser.parse_args()

    # Fallback if no context is passed
    context = args.context or """
Our startup is entering the smart agriculture sector in West Africa.
We have partnerships with two local co-ops and a $50,000 grant.
The goal is to deploy a precision farming MVP and onboard 100 farmers in 6 months.
Challenges: equipment delivery delays, training farmers, and integrating satellite data.
"""

    plan = generate_plan(context, months=args.months)

    print("\n📊 JSON Output (compact):")
    print(json.dumps(plan["json_output"], indent=2))

    print("\n📝 Textual Report:")
    print(plan["textual_report"][:1000], "...")  # Preview first 1000 chars

    print("\n📈 Timeline Sample:", plan["timeline_data"][:1])
    print("📍 Milestone Sample:", plan["milestone_data"][:1])

    save_output(plan)

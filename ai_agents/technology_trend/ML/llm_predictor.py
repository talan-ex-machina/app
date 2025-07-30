# do not use it 
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model=genai.GenerativeModel('gemini-1.5-pro')
def generate_company_forecast_gemini(company_data):
    prompt = f"""
You are an AI specialized in predicting technology  business trends.
based on the company  and services and the domain it works on 

Using the following company profile, generate a JSON object with:
1. Future job offers
2. Expected areas of investment
3. Strategic positioning by 2027

Format:
{{
  "company": "...",
  "industry": "...",
  "trend_domains": [...],
  "trend_score": ...,
  "revenue_growth": "...",
  "prediction": {{
    "job_offers": "...",
    "investments": "...",
    "positioning": "..."
  }}
}}

Company Info:
- Company: {company_data['company']}
- Industry: {company_data['industry']}
- Trend Domains: {company_data['trend_domains']}
- Trend Score: {company_data['trend_score']}
- Revenue Growth: {company_data['revenue_growth']}
- Products & Services: {company_data['products_services']}
"""

    response = model.generate_content(prompt)
    return response.text



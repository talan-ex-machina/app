import google.generativeai as genai
from dotenv import load_dotenv
import json
import re
load_dotenv()
import os

class FinalProductRecommendation:
    def __init__(self, api_key):
        self.api_key = api_key
        genai.configure(api_key=api_key)

    def clean_json_response(self, text):
        """Extract JSON from potentially messy LLM response"""
        try:
            json_str = re.search(r'\{.*\}', text, re.DOTALL)
            return json_str.group(0) if json_str else text
        except Exception:
            return text

    def generate_final_recommendation(self, product_summary, trends_data):
        """
        Generate product recommendation combining product insights and tech trends.
        """
        model = genai.GenerativeModel(model_name="gemini-2.0-flash")
        
        prompt = f"""Analyze these two information sources:

1. Product reviews summary (strengths/weaknesses of existing products):
{product_summary}

2. Trending technology domains with popularity scores (higher = more trending):
{json.dumps(trends_data, indent=2)}

Generate ONE innovative product recommendation according to Product reviews summary and Trending technology domains in STRICT JSON format with:
- "product_name": Creative generic name (no company brands)
- "product_idea": Full description of the innovative concept
- "trend_domains": Top 1-2 relevant trending domains used (array) and explain why we choose these domains
- "strengths": Key strengths to maintain (array)
- "concrete_steps_to_launch": Actionable launch steps (array)
- "differentiation_strategy": Competitive advantages (array)

Required JSON structure:
{{
    "product_name": "Product Name",
    "product_idea": "Detailed description...",
    "trend_domains": ["Domain1", "Domain2"],
    "strengths": ["Strength1", "Strength2"],
    "concrete_steps_to_launch": ["Step1", "Step2"],
    "differentiation_strategy": ["Advantage1", "Advantage2"]
}}

CRITICAL REQUIREMENTS:
1. Intelligently combine product insights with tech trends
2. Select domains with both high trend scores AND product fit
3. Address pain points from product reviews
4. Output ONLY valid JSON (no surrounding text)
5. Include ALL specified keys
6. Never include company names
"""

        response = model.generate_content(prompt)
        cleaned_response = self.clean_json_response(response.text)
        
        try:
            parsed = json.loads(cleaned_response)
            required_keys = [
                "product_name",
                "product_idea", 
                "trend_domains",
                "strengths",
                "concrete_steps_to_launch",
                "differentiation_strategy"
            ]
            
            if not all(key in parsed for key in required_keys):
                missing = [k for k in required_keys if k not in parsed]
                raise ValueError(f"Missing keys: {missing}")
            
            # Validate trend_domains references actual trends from input
            valid_domains = trends_data.keys()
            for domain in parsed.get("trend_domains", []):
                if domain not in valid_domains:
                    raise ValueError(f"Invalid trend domain: {domain}")
            
            return cleaned_response
        except (json.JSONDecodeError, ValueError) as e:
            return json.dumps({
                "product_name": "Generation Error",
                "product_idea": "Failed to generate idea",
                "trend_domains": [],
                "strengths": [],
                "concrete_steps_to_launch": [],
                "differentiation_strategy": []
            })
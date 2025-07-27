import google.generativeai as genai
from typing import List

class GeminiLLM:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    def generate_response(self, facts: List[dict], prompt: str = None) -> str:
        # prompt can be custom or default
        prompt = prompt or "Analyze the following scraped data and tell me if any values are missing or inconsistent:\n"
        formatted_data = "\n".join([str(item) for item in facts])
        response = self.model.generate_content(prompt + formatted_data)
        return response.text

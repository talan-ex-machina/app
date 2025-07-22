import google.generativeai as genai

from dotenv import load_dotenv
load_dotenv()
import os
class FinalProductRecommendation:
    def __init__(self, api_key):
        self.api_key = api_key
        genai.configure(api_key=api_key)

    def generate_final_recommendation(self, global_summary):
        """
        Utilise le LLM pour générer une recommandation finale basée sur les pros et cons globaux.
        """
        model = genai.GenerativeModel(model_name="gemini-2.0-flash")
        prompt = f"Here is a global summary of the pros and cons:\n{global_summary}\nBased on the advantages and disadvantages, generate an innovative product idea that leverages the strengths of existing products and addresses the identified issues.\n"
        prompt += "Also provide a detailed strategic recommendation to improve this product and make it more competitive in the market.\n\n"
        prompt += "The report should include:\n"
        prompt += "1. A product idea that leverages the identified trends.\n"
        prompt += "2. An analysis of the strengths to maintain and weaknesses to address.\n"
        prompt += "3. Concrete steps to launch this product (e.g., design, production, and launch phases).\n"
        prompt += "4. A differentiation strategy compared to competitors, based on the weaknesses of current products."
        prompt += "Don't include introductory sentences."

        # Appel au modèle GPT pour générer la recommandation finale
        response = model.generate_content(prompt)
        # For Gemini, the response object has a .text attribute, not ['choices'][0]['text']
        return response.text.strip()



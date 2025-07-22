import google.generativeai as genai
from product_processing import ProductDataProcessor
from dotenv import load_dotenv
load_dotenv()
import os

class LLMProcessor:
    def __init__(self, api_key):
        self.api_key = api_key
        genai.configure(api_key=api_key)

    def generate_pros_and_cons_summary(self, product_reviews):
        """
        Utilise le LLM pour générer un résumé des pros et des cons pour chaque produit.
        """
        import time
        summary = {}
        model = genai.GenerativeModel(model_name="gemini-2.0-flash")
        for review in product_reviews[39:45]:
            time.sleep(1)  # Sleep 1 second before each Gemini API call
            product_name = review['product_name']
            pros = " ".join(review['pros'])
            cons = " ".join(review['cons'])
            prompt = f"This is the pros and cons of the product {product_name} :\nPros: {pros}\nCons: {cons}\nCan you summarize these points and give a precise and brief summary of the advantages and disadvantages of this product?"
            # Appel au modèle GEMINI pour générer le résumé
            response = model.generate_content(prompt)
            # Sauvegarder le résumé généré
            summary[product_name] = response.text.strip()
        return summary



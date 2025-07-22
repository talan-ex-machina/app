import json
import os
from product_processing import ProductDataProcessor
from product_cons_pros import LLMProcessor
from product_idea_recommendation import FinalProductRecommendation
from dotenv import load_dotenv

load_dotenv()

def main():
    # Charger les données JSON
    json_file_path = "C:/Users/HP/Desktop/Talan/response.json"  
    with open(json_file_path, 'r', encoding='utf-8') as file:
        json_data = json.load(file)

    # Prétraiter les données
    processor = ProductDataProcessor()
    product_reviews = processor.preprocess_product_data(json_data)

    # Configurer l'API
    api_key = os.getenv("GEMINI_API_KEY")  # Charger la clé API depuis le fichier .env
    llm_processor = LLMProcessor(api_key)

    # Générer le résumé des pros et cons
    pros_and_cons_summary = llm_processor.generate_pros_and_cons_summary(product_reviews)

    # Générer l'idée de produit et la recommandation
    product_idea_generator = FinalProductRecommendation(api_key)
    product_idea_and_recommendation = product_idea_generator.generate_final_recommendation(pros_and_cons_summary)

    # Afficher la recommandation finale
    print("Final product idea and recommendation:", product_idea_and_recommendation)

if __name__ == "__main__":
    main()

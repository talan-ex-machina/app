import google.generativeai as genai
from dotenv import load_dotenv
import os
import time
import random
import json
from datetime import datetime, timedelta
from product_processing import ProductDataProcessor 

load_dotenv()

class LLMProcessor:
    def __init__(self, api_key):
        self.api_key = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name="gemini-2.0-flash")
        
        # Configuration des quotas
        self.rate_limit = 15  # Requêtes par minute (free tier)
        self.last_call_time = None
        self.request_count = 0
        self.rate_window = timedelta(minutes=1)
        
        # Optimisation
        self.min_delay = 5  # Délai minimum entre requêtes
        self.max_retries = 3
        self.retry_delays = [10, 30, 60]  # Délais de réessai en secondes

    def _enforce_rate_limit(self):
        """Applique strictement les limites de quota"""
        now = datetime.now()
        
        if self.last_call_time:
            time_since_last = now - self.last_call_time
            # Réinitialiser le compteur si la fenêtre de temps est écoulée
            if time_since_last > self.rate_window:
                self.request_count = 0
            
            # Calculer le délai nécessaire
            if self.request_count >= self.rate_limit:
                sleep_time = (self.rate_window - time_since_last).total_seconds()
                if sleep_time > 0:
                    print(f"Quota atteint. Attente de {sleep_time:.1f} secondes...")
                    time.sleep(sleep_time + 1)  # Marge de sécurité
                    self.request_count = 0
                    self.last_call_time = datetime.now()
        
        self.request_count += 1
        self.last_call_time = now if not self.last_call_time else datetime.now()

    def _safe_api_call(self, prompt):
        """Gestion robuste des appels API avec réessais"""
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                self._enforce_rate_limit()
                response = self.model.generate_content(prompt)
                return response.text.strip()
            except Exception as e:
                last_error = e
                if "quota" in str(e).lower():
                    print(f"Erreur de quota (tentative {attempt + 1}): {str(e)}")
                    # Délai plus long pour les erreurs de quota
                    wait_time = self.retry_delays[min(attempt, len(self.retry_delays)-1)]
                    print(f"Attente de {wait_time} secondes avant réessai...")
                    time.sleep(wait_time)
                else:
                    wait_time = self.min_delay * (attempt + 1)
                    time.sleep(wait_time)
        
        raise last_error if last_error else Exception("Erreur inconnue")

    def generate_summary(self, product_reviews, output_file="reviews_summary.json"):
        """
        Traitement optimisé des revues avec sauvegarde progressive
        """
        summary = {}
        processed_count = 0
        
        try:
            # Charger les progrès existants
            if os.path.exists(output_file):
                with open(output_file, 'r') as f:
                    summary = json.load(f)
                processed_count = len(summary)
                print(f"Reprise après {processed_count} revues traitées")
            
            for i, review in enumerate(product_reviews[processed_count:], start=processed_count):
                try:
                    product_name = review['product_name']
                    if product_name in summary:
                        continue
                        
                    # Prompt optimisé
                    prompt = f"""Résumez les points clés de ce produit en français:
                    Nom: {product_name}
                    Avantages: {', '.join(review['pros'][:3])}
                    Inconvénients: {', '.join(review['cons'][:3])}
                    
                    Donnez un résumé concis (2 phrases maximum) en français."""
                    
                    summary[product_name] = self._safe_api_call(prompt)
                    
                    # Sauvegarde périodique
                    if i % 5 == 0:
                        with open(output_file, 'w') as f:
                            json.dump(summary, f, indent=2)
                        print(f"Progrès: {i+1}/{len(product_reviews)} revues traitées")
                    
                    # Délai aléatoire entre 5 et 10 secondes
                    time.sleep(random.uniform(5, 10))
                    
                except Exception as e:
                    print(f"Erreur sur la revue {i}: {str(e)}")
                    continue
            
            # Sauvegarde finale
            with open(output_file, 'w') as f:
                json.dump(summary, f, indent=2)
                
            return summary
            
        except KeyboardInterrupt:
            print("\nInterruption détectée. Sauvegarde des résultats...")
            with open(output_file, 'w') as f:
                json.dump(summary, f, indent=2)
            return summary


PRODUCT_DATA_PATH = "C:/Users/HP/Desktop/Talan/response.json"


# Load input data
with open(PRODUCT_DATA_PATH, 'r', encoding='utf-8') as f:
    product_data = json.load(f)

        # Process product reviews
processor = ProductDataProcessor()
product_reviews = processor.preprocess_product_data(product_data)

        # Generate insights
llm_processor = LLMProcessor(os.getenv("GEMINI_API_KEY"))
product_summary = llm_processor.generate_summary(product_reviews)
print("Product Summary:", product_summary)
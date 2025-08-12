import pandas as pd
import requests
import os
from datetime import datetime
from dotenv import load_dotenv
import time

load_dotenv()

class InvestorServiceAgent:
    """
    Agent pour filtrer les investisseurs par service/secteur transmis dynamiquement
    """
    def __init__(self):
        self.input_file = "data/investors_data.csv"
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.api_url = os.getenv("GEMINI_API_URL", "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent")

    def get_synonyms(self, service: str):
        headers = {"Content-Type": "application/json"}
        prompt = (
            f"Donne uniquement les synonymes, abréviations et traductions du secteur ou service '{service}'. "
            "Ne donne pas de domaines d'application, ni de secteurs connexes. "
            "Exemple de format attendu : AI, intelligence artificielle, artificial intelligence, IA. "
            "Réponds uniquement par une liste de mots ou expressions séparés par des virgules."
        )
        data = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {"temperature": 0.2}
        }
        response = requests.post(f"{self.api_url}?key={self.api_key}", json=data, headers=headers)
        if response.status_code == 200:
            try:
                result = response.json()
                output = result['candidates'][0]['content']['parts'][0]['text']
                synonyms = [s.strip() for s in output.split(',') if s.strip()]
                return synonyms
            except Exception:
                return [service]
        else:
            return [service]

    def __call__(self, service: str):
        # Charger les données
        try:
            df = pd.read_csv(self.input_file)
        except Exception:
            return None

        # Récupérer les synonymes
        synonyms = self.get_synonyms(service)
        print(f"Synonymes trouvés : {synonyms}")

        # Garder TOUS les investisseurs et ajouter des notes
        all_df = df.copy()
        
        # Ajout de la colonne 'note' pour TOUS les investisseurs
        notes = []
        matching_count = 0
        for areas in all_df['Areas of investment']:
            note = 0
            if pd.notna(areas):
                area_list = [a.strip().lower() for a in str(areas).split(',')]
                # +25 points si le secteur correspond
                if any(s.lower() in area.lower() for s in synonyms for area in area_list):
                    note += 25
                    matching_count += 1
            notes.append(note)
        all_df['note'] = notes
        
        print(f"Investisseurs correspondant au secteur '{service}': {matching_count}/{len(all_df)}")
        # Création du nom de fichier avec timestamp
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        output_dir = 'data/output'
        os.makedirs(output_dir, exist_ok=True)
        output_path = f'{output_dir}/investors_with_notes_{timestamp}.csv'
        all_df.to_csv(output_path, index=False)
        print(f"Fichier '{output_path}' créé avec la colonne 'note'.")
        return output_path
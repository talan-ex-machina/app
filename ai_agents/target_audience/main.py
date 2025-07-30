import json
import os
from dotenv import load_dotenv

from modules.competition_analysis import analyze_competition_by_country
from modules.scoring import run_country_scoring

# Charger les variables d’environnement
load_dotenv()

def main():
    # Étape 1 – Charger les entrées
    with open("data/input.json", "r", encoding="utf-8") as f:
        input_data = json.load(f)

    # Étape 2 – Analyse de la concurrence (Gemini)
    print("📡 Étape 1 : Analyse concurrentielle...")
    competition_scores = analyze_competition_by_country(
        domain=input_data["domain"],
        product_or_service=input_data["product_or_service"],
        competitors=input_data["competitors"]
    )

    with open("data/competitores_scores.json", "w", encoding="utf-8") as f:
        json.dump(competition_scores, f, ensure_ascii=False, indent=2)

    # Étape 3 – Calculs des scores pays
    print("📊 Étape 2 : Évaluation des pays...")
    run_country_scoring()

    print("\n✅ Analyse terminée. Voir :")
    print("  - data/final_country_analysis.json")
    print("  - data/propositions.json")

if __name__ == "__main__":
    main()

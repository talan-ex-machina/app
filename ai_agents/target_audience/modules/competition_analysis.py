import os
import json
import re
from collections import defaultdict
from dotenv import load_dotenv
from tqdm import tqdm
import google.generativeai as genai

# Load API key
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Utils
def extract_country(address):
    if address and "," in address:
        return address.split(",")[-1].strip()
    return "Unknown"

def extract_score(text):
    match = re.search(r"Score\s*:\s*(\d+)/10", text)
    if match:
        return int(match.group(1))
    return None

# Main logic
from collections import Counter

def analyze_competition_by_country(domain, product_or_service, competitors):
    grouped_by_country = defaultdict(list)

    for comp in competitors.values():
        if not isinstance(comp, dict):
            continue
        address = comp.get("location", {}).get("address", "")
        country = extract_country(address)
        grouped_by_country[country].append(comp)

    model = genai.GenerativeModel("gemini-2.5-flash")
    analyses = {}

    print("🔍 Starting country-level analysis...\n")
    for country in tqdm(grouped_by_country, desc="Analyzing countries"):
        comps = grouped_by_country[country]
        total_employees = sum(c.get("number_of_employees", 0) or 0 for c in comps)
        total_revenue = sum(c.get("annual_revenue_usd", 0) or 0 for c in comps)
        count = len(comps)
        avg_employees = total_employees / count if count else 0
        avg_revenue = total_revenue / count if count else 0

        # Comptage des attributs demandés
        types = [c.get("type", "Unknown") for c in comps]
        target_segments = [c.get("target_segment", "Unknown") for c in comps]
        positionings = [c.get("positioning", "Unknown") for c in comps]
        maturities = [c.get("maturity", "Unknown") for c in comps]

        most_common_type = Counter(types).most_common(1)[0][0] if types else "Unknown"
        most_common_segment = Counter(target_segments).most_common(1)[0][0] if target_segments else "Unknown"
        most_common_positioning = Counter(positionings).most_common(1)[0][0] if positionings else "Unknown"
        most_common_maturity = Counter(maturities).most_common(1)[0][0] if maturities else "Unknown"

        prompt = f"""
Tu es un expert en stratégie d'entreprise. Analyse les informations suivantes pour le pays {country} :

- Domaine : {domain}
- Produit ou service : {product_or_service}
- Nombre de concurrents : {count}
- Taille moyenne des concurrents (employés) : {avg_employees:.0f}
- Revenu moyen annuel des concurrents (USD) : {avg_revenue:,.0f}
- Type dominant des concurrents : {most_common_type}
- Segment cible principal : {most_common_segment}
- Positionnement dominant : {most_common_positioning}
- Niveau de maturité principal : {most_common_maturity}

Donne une réponse avec ces 3 parties précises :
- Analyse : indique s'il s'agit d'une opportunité, menace ou situation neutre pour une nouvelle entreprise.
- Justification concise de cette analyse.
- Score : un entier entre 1 (très défavorable) et 10 (très favorable) au format exact "Score : X/10" à la toute fin de ta réponse.

Réponds uniquement en texte brut.
"""

        try:
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            score = extract_score(response_text)

            analyses[country] = {
                "analysis": response_text,
                "score": score
            }

        except Exception as e:
            print(f"❌ Erreur pour {country} : {e}")
            analyses[country] = {
                "analysis": "Erreur lors de l'analyse.",
                "score": None
            }

    return analyses

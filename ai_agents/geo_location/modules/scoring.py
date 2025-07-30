import os
import json
from dotenv import load_dotenv

def get_competition_score(country, competition_scores):
    entry = competition_scores.get(country)
    if entry and isinstance(entry.get("score"), int):
        return entry["score"]
    return 5  # Score neutre par défaut

# Fonctions de scoring
def calculate_economic_score(factors):
    try:
        avg_income = float(factors.get("average_income", 0))
        gdp_growth = float(factors.get("GDP_growth_rate", 0))
        d_index = float(factors.get("doing_business_index", 0))
        power = {"low": 3, "medium": 6, "high": 9}.get(factors.get("purchasing_power"), 0)
        stability = {"low": 3, "moderate": 6, "high": 9}.get(factors.get("economic_stability"), 0)

        score = (avg_income / 50000 * 10 + gdp_growth + d_index / 10 + power + stability) / 5
        return min(round(score, 2), 10)
    except:
        return 0

def calculate_digital_infrastructure_score(digital):
    try:
        internet_rate = float(digital.get("internet_penetration_rate", 0))
        speed = float(str(digital.get("average_internet_speed", "0")).split()[0])
        coverage = {"2G": 3, "3G": 6, "4G": 9}.get(digital.get("mobile_coverage"), 0)
        maturity = {"low": 3, "moderate": 6, "high": 9}.get(digital.get("digital_maturity"), 0)

        score = (internet_rate / 100 * 10 + speed / 20 * 10 + coverage + maturity) / 4
        return min(round(score, 2), 10)
    except:
        return 0

def calculate_education_score(edu):
    try:
        total = int(edu.get("total", 0))
        relevant = len(edu.get("relevant_study_fields", []))
        score = (total / 100 * 10 + relevant * 2)
        return min(round(score / 2, 2), 10)
    except:
        return 0

def calculate_general_infrastructure_score(infra):
    try:
        elect_rate = float(infra["energy"].get("electrification_rate", 0))
        stability = {"poor": 3, "fair": 5, "good": 7, "excellent": 10}.get(infra["energy"].get("stability"), 0)
        transport = len(infra.get("transport_network", ""))
        services = len(infra.get("public_services", ""))
        score = (elect_rate / 100 * 10 + stability + transport / 50 * 10 + services / 50 * 10) / 4
        return min(round(score, 2), 10)
    except:
        return 0

def run_country_scoring():
    load_dotenv()

    with open("data/countries_data.json", "r", encoding="utf-8") as f:
        countries_data = json.load(f)

    competition_scores = {}
    if os.path.exists("data/competitores_scores.json"):
        with open("data/competitores_scores.json", "r", encoding="utf-8") as f:
            competition_scores = json.load(f)

    results = {}

    for country, data in countries_data.items():
        econ = calculate_economic_score(data.get("economic_factors", {}))
        digital = calculate_digital_infrastructure_score(data.get("digital_infrastructure", {}))
        edu = calculate_education_score(data.get("number_of_universities", {}))
        infra = calculate_general_infrastructure_score(data.get("general_infrastructure", {}))
        comp = get_competition_score(country, competition_scores)

        overall = round((econ + digital + edu + infra + comp) / 5, 2)

        results[country] = {
            "location": data.get("location", {}),
            "economic_score": econ,
            "education_score": edu,
            "digital_infrastructure_score": digital,
            "general_infrastructure_score": infra,
            "competition_score": comp,
            "overall_country_score": overall,
            "market_potential_score": overall
        }

    # Sauvegarder résultats
    with open("data/final_country_analysis.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    top = sorted(results.items(), key=lambda x: x[1]["overall_country_score"], reverse=True)[:3]

    with open("data/countries_data.json", "r", encoding="utf-8") as f:
        full_data = json.load(f)

    with open("data/propositions.json", "w", encoding="utf-8") as f:
        top_countries_full_data = {country: full_data[country] for country, _ in top}
        json.dump(top_countries_full_data, f, ensure_ascii=False, indent=2)

    for country, metrics in top:
        print(f"▶️ {country}: {metrics['overall_country_score']} / 10")


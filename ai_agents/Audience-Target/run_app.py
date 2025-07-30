import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
from audience_cible_agent import AudienceCibleAgent

def load_json_file(file_path):
    """
    Charge un fichier JSON et renvoie son contenu.
    """
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_to_json(output_data, output_file):
    """
    Sauvegarde les données sous forme de JSON dans un fichier.
    """
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

def main():
    print("Chargement des variables d'environnement...")
    load_dotenv()
    api_key = os.environ.get("GOOGLE_API_KEY")
    
    if not api_key:
        print("Erreur : GOOGLE_API_KEY non trouvé dans le fichier .env.")
        return

    try:
        genai.configure(api_key=api_key)
        print("API Google AI configurée avec succès.")
    except Exception as e:
        print(f"Erreur lors de la configuration de l'API Google AI : {e}")
        return
    
    product_data_file = "data/product_details.json"
    business_data_file = "data/business_details.json"

    try:
        product_data = load_json_file(product_data_file)
        business_data = load_json_file(business_data_file)
    except FileNotFoundError as e:
        print(f"Erreur : {e}")
        return

    audience_agent = AudienceCibleAgent()

    final_report = audience_agent.run(product_data, business_data)

    output_file = "outputs/audience_analysis_report.json"
    save_to_json(final_report, output_file)

    print("\n" + "="*50)
    print("      RAPPORT FINAL D'ANALYSE D'AUDIENCE")
    print("="*50 + "\n")
    if "error" in final_report:
        print(f"Une erreur est survenue : {final_report['error']}")
    else:
        print("Rapport d'analyse d'audience sauvegardé avec succès dans 'outputs/audience_analysis_report.json'.")

if __name__ == "__main__":
    main()

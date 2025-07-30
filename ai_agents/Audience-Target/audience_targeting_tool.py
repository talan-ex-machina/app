import google.generativeai as genai
import os
from dotenv import load_dotenv
import json

load_dotenv()
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

class AudienceTargetingTool:
    """
    A tool that generates a detailed audience analysis, including personas,
    geographic locations, and communication channels, based on a product idea,
    business goal, and an optional idol/reference.
    """
    def __init__(self, model_name: str = "gemini-2.0-flash"):
        """
        Initializes the tool by setting up the generative model.
        It assumes genai has been configured externally.
        """
        try:
            generation_config = genai.GenerationConfig(
                response_mime_type="application/json"
            )
            self.model = genai.GenerativeModel(
                model_name,
                generation_config=generation_config
            )
        except Exception as e:
            raise RuntimeError(
                "genai.configure(api_key=...) must be called before creating this tool."
            ) from e

    def run(self, product_data: dict, business_data: dict) -> dict:
        """
        Executes the tool's main function.
        """
        product_idea = product_data.get("product_idea")
        strengths = product_data.get("strengths")
        steps_to_launch = product_data.get("concrete_steps_to_launch")
        differentiation_strategy = product_data.get("differentiation_strategy")
        
        domain = business_data.get("industry")
        country = business_data.get("country")
        
        if not domain or not country:
            raise ValueError("Business data must contain 'industry' and 'country' keys.")
        
        prompt = f"""
Tu es un expert en stratégie marketing et en ciblage d'audience. Ton analyse doit être concrète, actionnable et structurée pour aider un entrepreneur à réussir.
Ton rôle est de générer dynamiquement le contenu de chaque clé JSON en te basant UNIQUEMENT sur les informations du projet fournies ci-dessous.

Le "blueprint" JSON à la fin te montre les clés requises et le *type* d'information attendu pour chaque clé. Tu ne dois PAS copier les descriptions, mais générer des valeurs réelles et pertinentes.

---
**Informations sur le Projet :**
  **Produit :** {product_idea}
  **Forces du produit :** {', '.join(strengths)}
  **Étapes concrètes pour le lancement :** {', '.join(steps_to_launch)}
  **Stratégie de différenciation :** {differentiation_strategy}
  **Domaine :** {domain}
  **Pays :** {country}
---

**Instruction :** Produis une analyse complète en respectant impérativement la structure JSON suivante. Ne génère aucun texte avant ou après l'objet JSON.

```json
{{
  "demographic_characteristics": {{
    "age_range": "Tranche d'âge pertinente pour les décideurs dans le secteur '{domain}'",
    "education": "Niveau d'éducation typique des acheteurs pour ce type de produit",
    "gender": "Répartition par genre, si pertinente pour la cible, sinon 'Mixte'"
  }},
  "psychographics": {{
    "values": ["Valeur clé 1 pour la cible (ex: Sécurité)", "Valeur clé 2 (ex: ROI)", "Valeur clé 3 (ex: Innovation)"],
    "lifestyle": ["Trait de style de vie 1 (ex: Orienté résultats)", "Trait de style de vie 2 (ex: Surchargé de travail)"]
  }},
  "behavioral_traits": {{
    "purchase_habits": ["Habitude d'achat principale liée à la prise de décision pour ce produit", "Autre habitude d'achat importante"],
    "online_behaviors": ["Comportement en ligne principal pour la veille professionnelle (ex: LinkedIn)", "Autre comportement en ligne (ex: Consultation de sites spécialisés)"]
  }},
  "needs_and_pain_points": {{
    "needs": ["Besoin majeur auquel le produit répond directement", "Autre besoin important de la cible"],
    "pain_points": ["Problème le plus douloureux que le produit résout", "Frustration quotidienne de la cible liée au domaine '{domain}'"]
  }},
  "communication_channels": [
    "Canal de communication le plus efficace pour atteindre cette cible", 
    "Deuxième canal le plus pertinent", 
    "Troisième canal pertinent"
  ],
  "strategic_recommendations": [
    "Recommandation stratégique N°1, concrète et actionnable", 
    "Recommandation stratégique N°2, liée aux pain points", 
    "Recommandation stratégique N°3, pour se différencier"
  ]
}}
"""
        try:
            response = self.model.generate_content(prompt)
            output_dict = json.loads(response.text)
            return output_dict

        except json.JSONDecodeError as e:
            print(f"Erreur de décodage JSON : {e}")
            print(f"Réponse brute du modèle : \n{response.text}")
            return {"error": "Le modèle n'a pas retourné un JSON valide.", "raw_response": response.text}
        except Exception as e:
            print(f"Erreur lors de la génération de contenu : {e}")
            return {"error": f"Une erreur est survenue lors de la génération du contenu: {e}"}

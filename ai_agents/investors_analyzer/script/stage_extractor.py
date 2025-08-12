import pandas as pd
from tavily import TavilyClient
import re
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

class StageExtractor:
    def __init__(self, company_name, tavily_api_key=None):
        self.company_name = company_name
        
        # Récupérer la clé API depuis .env si non fournie
        if tavily_api_key is None:
            tavily_api_key = os.getenv('TAVILY_API_KEY')
            if not tavily_api_key:
                raise ValueError("TAVILY_API_KEY not found in .env file")
        
        self.tavily_client = TavilyClient(api_key=tavily_api_key)
        self.available_stages = self._load_available_stages()
        
    def _load_available_stages(self):
        """Charge la liste des stages disponibles depuis all_stages.csv"""
        try:
            csv_path = "data/all_stages.csv"
            df = pd.read_csv(csv_path)
            
            # Filtrer les lignes qui contiennent des stages
            stages_df = df[df.iloc[:, 0] != ''].dropna()
            
            # Prendre seulement les stages (pas les statistiques)
            stages_list = []
            for idx, row in stages_df.iterrows():
                if idx >= 8:  # Commencer après les statistiques
                    stage_name = row.iloc[0]
                    if isinstance(stage_name, str) and stage_name not in ['stage', '']:
                        stages_list.append(stage_name)
            
            print(f"Stages disponibles chargés : {stages_list}")
            return stages_list
            
        except Exception as e:
            print(f"Erreur lors du chargement des stages : {e}")
            # Fallback avec les stages par défaut
            return [
                "Convertible Note", "Crowdfunding", "Debt", "Early Stage Venture",
                "Grant", "Initial Coin Offering", "Late Stage", "Non Equity Assistance", 
                "Post-Ipo", "Private Equity", "Secondary Market", "Seed", "Venture"
            ]
    
    def search_company_info(self):
        """Recherche des informations sur l'entreprise avec Tavily"""
        try:
            # Requête optimisée pour trouver des informations de financement
            queries = [
                f"{self.company_name} funding round investment stage",
                f"{self.company_name} raised capital venture funding",
                f"{self.company_name} Series A B C seed investment",
                f"{self.company_name} startup investment stage"
            ]
            
            all_results = []
            
            for query in queries:
                print(f"Recherche Tavily : {query}")
                
                response = self.tavily_client.search(
                    query=query,
                    search_depth="advanced",
                    max_results=3
                )
                
                if "results" in response:
                    all_results.extend(response["results"])
            
            return all_results
            
        except Exception as e:
            print(f"Erreur lors de la recherche Tavily : {e}")
            return []
    
    def _create_stage_patterns(self):
        """Crée des patterns de recherche pour chaque stage disponible"""
        patterns = {}
        
        for stage in self.available_stages:
            # Créer des patterns flexibles pour chaque stage
            stage_lower = stage.lower()
            
            if "early stage" in stage_lower:
                patterns[stage] = [
                    r"early[-\s]?stage",
                    r"early[-\s]?round",
                    r"pre[-\s]?series",
                    r"angel\s+round"
                ]
            elif "late stage" in stage_lower:
                patterns[stage] = [
                    r"late[-\s]?stage",
                    r"growth\s+stage",
                    r"series\s+[d-z]",
                    r"expansion\s+round"
                ]
            elif "seed" in stage_lower:
                patterns[stage] = [
                    r"\bseed\b",
                    r"seed\s+round",
                    r"pre[-\s]?seed"
                ]
            elif "private equity" in stage_lower:
                patterns[stage] = [
                    r"private\s+equity",
                    r"\bpe\b\s+round",
                    r"buyout"
                ]
            elif "venture" in stage_lower and stage_lower == "venture":
                patterns[stage] = [
                    r"venture\s+capital",
                    r"\bvc\b\s+round",
                    r"venture\s+round"
                ]
            elif "convertible note" in stage_lower:
                patterns[stage] = [
                    r"convertible\s+note",
                    r"convertible\s+debt",
                    r"safe\s+note"
                ]
            elif "crowdfunding" in stage_lower:
                patterns[stage] = [
                    r"crowdfunding",
                    r"crowd\s+funding",
                    r"kickstarter",
                    r"indiegogo"
                ]
            elif "debt" in stage_lower:
                patterns[stage] = [
                    r"\bdebt\b\s+financing",
                    r"debt\s+round",
                    r"loan"
                ]
            elif "grant" in stage_lower:
                patterns[stage] = [
                    r"\bgrant\b",
                    r"government\s+funding",
                    r"subsidy"
                ]
            elif "initial coin offering" in stage_lower:
                patterns[stage] = [
                    r"\bico\b",
                    r"initial\s+coin\s+offering",
                    r"token\s+sale"
                ]
            elif "post-ipo" in stage_lower:
                patterns[stage] = [
                    r"post[-\s]?ipo",
                    r"after\s+ipo",
                    r"public\s+company"
                ]
            elif "secondary market" in stage_lower:
                patterns[stage] = [
                    r"secondary\s+market",
                    r"secondary\s+sale",
                    r"share\s+purchase"
                ]
            elif "non equity assistance" in stage_lower:
                patterns[stage] = [
                    r"non[-\s]?equity",
                    r"assistance",
                    r"support\s+program"
                ]
            else:
                # Pattern générique pour autres stages
                patterns[stage] = [stage_lower.replace(" ", r"[-\s]?")]
        
        return patterns
    
    def extract_stage_from_text(self, search_results):
        """Extrait le stage le plus probable du texte des résultats"""
        # Combiner tous les textes
        all_text = ""
        for result in search_results:
            all_text += " " + result.get("content", "")
            all_text += " " + result.get("title", "")
        
        all_text = all_text.lower()
        
        # Créer les patterns de recherche
        stage_patterns = self._create_stage_patterns()
        
        # Compter les occurrences de chaque stage
        stage_scores = {}
        
        for stage, patterns in stage_patterns.items():
            score = 0
            for pattern in patterns:
                matches = re.findall(pattern, all_text, re.IGNORECASE)
                score += len(matches)
                
                # Bonus pour les mots-clés contextuels
                if any(keyword in all_text for keyword in ["raised", "funding", "investment", "round"]):
                    score += len(matches) * 2
            
            if score > 0:
                stage_scores[stage] = score
        
        # Retourner le stage avec le score le plus élevé
        if stage_scores:
            best_stage = max(stage_scores, key=stage_scores.get)
            print(f"Scores détectés : {stage_scores}")
            return best_stage, stage_scores[best_stage]
        
        return "Unknown", 0
    
    def extract_company_stage(self):
        """Méthode principale pour extraire le stage de l'entreprise"""
        print(f"=== EXTRACTION DU STAGE POUR : {self.company_name} ===")
        print(f"Stages disponibles : {len(self.available_stages)} stages")
        
        # 1. Rechercher des informations sur l'entreprise
        search_results = self.search_company_info()
        
        if not search_results:
            print("Aucun résultat trouvé via Tavily")
            return "Unknown"
        
        print(f"Trouvé {len(search_results)} résultats de recherche")
        
        # 2. Extraire le stage des résultats
        detected_stage, confidence = self.extract_stage_from_text(search_results)
        
        # 3. Afficher les résultats
        print(f"\n🎯 STAGE DÉTECTÉ : {detected_stage}")
        print(f"📊 Niveau de confiance : {confidence}")
        
        if detected_stage != "Unknown":
            print(f"✅ Stage sélectionné parmi les options disponibles")
        else:
            print("❌ Aucun stage spécifique détecté")
            print("💡 Suggestions : Essayez avec plus d'informations sur l'entreprise")
        
        return detected_stage

# Fonction utilitaire pour utilisation simple
def extract_stage_for_company(company_name, tavily_api_key=None):
    """Fonction simple pour extraire le stage d'une entreprise"""
    extractor = StageExtractor(company_name, tavily_api_key)
    return extractor.extract_company_stage()

# Test du script
if __name__ == "__main__":
    # Test avec une entreprise exemple
    company_name = input("Entrez le nom de l'entreprise : ")
    
    try:
        stage = extract_stage_for_company(company_name)
        print(f"\n🎯 RÉSULTAT FINAL : {stage}")
    except ValueError as e:
        print(f"❌ Erreur : {e}")
        print("💡 Assurez-vous d'avoir un fichier .env avec TAVILY_API_KEY=votre_clé")

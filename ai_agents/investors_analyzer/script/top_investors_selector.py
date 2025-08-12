import pandas as pd
import os
from datetime import datetime

class TopInvestorsSelector:
    def __init__(self, input_file_path):
        """
        Initialise l'agent de sélection des meilleurs investisseurs
        
        Args:
            input_file_path: Chemin vers le fichier CSV avec les notes des investisseurs
        """
        self.input_file_path = input_file_path
        
    def select_top_investors(self, company_name, service_or_product, country, top_n=10):
        """
        Sélectionne les top N investisseurs avec les meilleures notes
        
        Args:
            company_name: Nom de la société
            service_or_product: Service ou produit
            country: Pays
            top_n: Nombre d'investisseurs à sélectionner (défaut: 10)
            
        Returns:
            str: Chemin vers le fichier de sortie créé
        """
        try:
            # Charger les données
            df = pd.read_csv(self.input_file_path)
            
            # Vérifier que la colonne 'note' existe
            if 'note' not in df.columns:
                print("Erreur: La colonne 'note' n'existe pas dans le fichier.")
                return None
                
            # Trier par note décroissante et sélectionner les top N
            top_investors = df.nlargest(top_n, 'note')
            
            # Créer le nom du fichier de sortie
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            # Nettoyer les noms pour éviter les caractères spéciaux dans le nom de fichier
            clean_company = self._clean_filename(company_name)
            clean_service = self._clean_filename(service_or_product)
            clean_country = self._clean_filename(country)
            
            output_filename = f"top_{top_n}_{clean_company}_{clean_service}_{clean_country}_{timestamp}.csv"
            
            # Créer le dossier de sortie s'il n'existe pas
            output_dir = "data/final_results"
            os.makedirs(output_dir, exist_ok=True)

           
            
            output_path = os.path.join(output_dir, output_filename)
            
            # Sauvegarder les résultats
            top_investors.to_csv(output_path, index=False, encoding='utf-8')
            
            print(f"\n=== TOP {top_n} INVESTISSEURS SÉLECTIONNÉS ===")
            print(f"Critères de sélection:")
            print(f"- Société: {company_name}")
            print(f"- Service/Produit: {service_or_product}")
            print(f"- Pays: {country}")
            print(f"\nTop {top_n} investisseurs par note:")
            
            for i, (_, investor) in enumerate(top_investors.iterrows(), 1):
                print(f"{i:2d}. {investor['investor_name']} - Note: {investor['note']:.2f}")
                if pd.notna(investor['location']):
                    print(f"    Localisation: {investor['location']}")
                if pd.notna(investor['Areas of investment']):
                    print(f"    Domaines: {investor['Areas of investment']}")
                print()
            
            print(f"Fichier sauvegardé: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"Erreur lors de la sélection des top investisseurs: {e}")
            return None
    
    def _clean_filename(self, text):
        """
        Nettoie le texte pour créer un nom de fichier valide
        
        Args:
            text: Texte à nettoyer
            
        Returns:
            str: Texte nettoyé
        """
        if not text:
            return "unknown"
            
        # Remplacer les caractères spéciaux par des underscores
        import re
        cleaned = re.sub(r'[^\w\s-]', '', text)
        cleaned = re.sub(r'\s+', '_', cleaned)
        cleaned = cleaned.strip('_')
        
        return cleaned[:50] if cleaned else "unknown"  # Limiter la longueur
    
    def get_statistics(self):
        """
        Affiche des statistiques sur le fichier d'entrée
        
        Returns:
            dict: Statistiques des données
        """
        try:
            df = pd.read_csv(self.input_file_path)
            
            stats = {
                'total_investors': len(df),
                'avg_note': df['note'].mean() if 'note' in df.columns else 0,
                'max_note': df['note'].max() if 'note' in df.columns else 0,
                'min_note': df['note'].min() if 'note' in df.columns else 0,
                'investors_with_notes': len(df[df['note'] > 0]) if 'note' in df.columns else 0
            }
            
            print(f"\n=== STATISTIQUES DES INVESTISSEURS ===")
            print(f"Nombre total d'investisseurs: {stats['total_investors']}")
            print(f"Investisseurs avec notes > 0: {stats['investors_with_notes']}")
            print(f"Note moyenne: {stats['avg_note']:.2f}")
            print(f"Note maximale: {stats['max_note']:.2f}")
            print(f"Note minimale: {stats['min_note']:.2f}")
            
            return stats
            
        except Exception as e:
            print(f"Erreur lors du calcul des statistiques: {e}")
            return None

def main():
    """Fonction de test pour l'agent"""
    # Exemple d'utilisation
    input_file = "data/output/investors_with_notes_20250812_104152.csv"
    
    if os.path.exists(input_file):
        selector = TopInvestorsSelector(input_file)
        
        # Afficher les statistiques
        selector.get_statistics()
        
        # Sélectionner les top 10
        output_file = selector.select_top_investors(
            company_name="Test Company",
            service_or_product="FinTech",
            country="France",
            top_n=10
        )
        
        if output_file:
            print(f"Fichier de sortie créé: {output_file}")
    else:
        print(f"Fichier d'entrée non trouvé: {input_file}")

if __name__ == "__main__":
    main()

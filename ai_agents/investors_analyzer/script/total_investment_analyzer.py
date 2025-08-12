import pandas as pd

class TotalInvestmentAnalyzer:
    """
    Agent pour ajouter des points bonus basés sur le nombre total d'investissements.
    Utilise la formule: (total_investments / max_total_investments) * 20
    """
    def __init__(self, input_file: str):
        self.input_file = input_file
        self.max_score_multiplier = 15

    def extract_max_total_investment(self, df):
        """
        Extrait la valeur maximale des investissements totaux
        
        Returns:
            float: Valeur maximale des investissements totaux
        """
        if 'total_investments' not in df.columns:
            print("Colonne 'total_investments' non trouvée")
            return 0
        
        # Filtrer les valeurs valides (non nulles et > 0)
        valid_investments = df['total_investments'].dropna()
        valid_investments = valid_investments[valid_investments > 0]
        
        if len(valid_investments) == 0:
            print("Aucun investissement valide trouvé")
            return 0
        
        max_investment = valid_investments.max()
        print(f"Investissement total maximum trouvé: {max_investment}")
        return max_investment

    def add_investment_bonus(self):
        """
        Ajoute des points bonus basés sur la formule: (total_investments / max_total_investments) * 20
        Modifie directement le fichier d'entrée.
        """
        try:
            df = pd.read_csv(self.input_file)
        except Exception as e:
            print(f"Erreur lors de la lecture du fichier: {e}")
            return None
        
        # S'assurer que la colonne 'note' existe et est de type float
        if 'note' not in df.columns:
            df['note'] = 0.0
        else:
            # Convertir la colonne 'note' en float pour éviter les erreurs de type
            df['note'] = df['note'].astype(float)
        
        # Extraire le maximum des investissements totaux
        max_total_investment = self.extract_max_total_investment(df)
        
        if max_total_investment == 0:
            print("Impossible de calculer les scores - pas d'investissements valides")
            return self.input_file
        
        # Calculer et ajouter les scores d'investissement
        investors_with_bonus = 0
        total_scores_added = 0
        
        for idx, row in df.iterrows():
            if pd.notna(row.get('total_investments')) and row.get('total_investments', 0) > 0:
                # Formule: (total_investments / max_total_investments) * 20
                investment_score = (float(row['total_investments']) / max_total_investment) * self.max_score_multiplier
                df.loc[idx, 'note'] += investment_score
                investors_with_bonus += 1
                total_scores_added += investment_score
                
                print(f"Investisseur {row.get('name', 'N/A')}: {row['total_investments']} investissements → +{investment_score:.2f} points")
        
        print(f"\n--- RÉSUMÉ ---")
        print(f"Investissement total maximum: {max_total_investment}")
        print(f"Bonus ajouté à {investors_with_bonus} investisseurs")
        print(f"Total des scores ajoutés: {total_scores_added:.2f}")
        print(f"Score moyen ajouté: {total_scores_added/investors_with_bonus:.2f}" if investors_with_bonus > 0 else "")
        
        # Sauvegarder dans le même fichier (écraser l'original)
        try:
            df.to_csv(self.input_file, index=False)
            print(f"Fichier mis à jour: {self.input_file}")
        except Exception as e:
            print(f"Erreur lors de la sauvegarde: {e}")
            return None
        
        return self.input_file

    def get_investment_statistics(self):
        """
        Affiche des statistiques sur les investissements totaux
        """
        try:
            df = pd.read_csv(self.input_file)
        except Exception as e:
            print(f"Erreur lors de la lecture du fichier: {e}")
            return
        
        if 'total_investments' not in df.columns:
            print("Colonne 'total_investments' non trouvée")
            return
        
        valid_investments = df['total_investments'].dropna()
        valid_investments = valid_investments[valid_investments > 0]
        
        if len(valid_investments) == 0:
            print("Aucun investissement valide trouvé")
            return
        
        print("\n--- STATISTIQUES DES INVESTISSEMENTS ---")
        print(f"Nombre d'investisseurs avec des investissements: {len(valid_investments)}")
        print(f"Investissement total maximum: {valid_investments.max()}")
        print(f"Investissement total minimum: {valid_investments.min()}")
        print(f"Investissement total moyen: {valid_investments.mean():.2f}")
        print(f"Investissement total médian: {valid_investments.median()}")
        print(f"Somme totale des investissements: {valid_investments.sum()}")
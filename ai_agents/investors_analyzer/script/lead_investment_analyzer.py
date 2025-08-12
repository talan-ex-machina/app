import pandas as pd

class LeadInvestmentAnalyzer:
    """
    Agent pour ajouter des points bonus basés sur le nombre de lead investments.
    Utilise la formule: (lead_investments / max_lead_investments) * 20
    """
    def __init__(self, input_file: str):
        self.input_file = input_file
        self.max_score_multiplier = 20

    def extract_max_lead_investment(self, df):
        """
        Extrait la valeur maximale des lead investments
        
        Returns:
            float: Valeur maximale des lead investments
        """
        if 'lead_investments' not in df.columns:
            print("Colonne 'lead_investments' non trouvée")
            return 0
        
        # Filtrer les valeurs valides (non nulles et > 0)
        valid_leads = df['lead_investments'].dropna()
        valid_leads = valid_leads[valid_leads > 0]
        
        if len(valid_leads) == 0:
            print("Aucun lead investment valide trouvé")
            return 0
        
        max_lead = valid_leads.max()
        print(f"Lead investment maximum trouvé: {max_lead}")
        return max_lead

    def add_lead_bonus(self):
        """
        Ajoute des points bonus basés sur la formule: (lead_investments / max_lead_investments) * 20
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
        
        # Extraire le maximum des lead investments
        max_lead_investment = self.extract_max_lead_investment(df)
        
        if max_lead_investment == 0:
            print("Impossible de calculer les scores - pas de lead investments valides")
            return self.input_file
        
        # Calculer et ajouter les scores de lead investment
        investors_with_bonus = 0
        total_scores_added = 0
        
        for idx, row in df.iterrows():
            if pd.notna(row.get('lead_investments')) and row.get('lead_investments', 0) > 0:
                # Formule: (lead_investments / max_lead_investments) * 20
                lead_score = (float(row['lead_investments']) / max_lead_investment) * self.max_score_multiplier
                df.loc[idx, 'note'] += lead_score
                investors_with_bonus += 1
                total_scores_added += lead_score
                
                print(f"Investisseur {row.get('name', 'N/A')}: {row['lead_investments']} leads → +{lead_score:.2f} points")
        
        print(f"\n--- RÉSUMÉ LEAD INVESTMENTS ---")
        print(f"Lead investment maximum: {max_lead_investment}")
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

    def get_lead_statistics(self):
        """
        Affiche des statistiques sur les lead investments
        """
        try:
            df = pd.read_csv(self.input_file)
        except Exception as e:
            print(f"Erreur lors de la lecture du fichier: {e}")
            return
        
        if 'lead_investments' not in df.columns:
            print("Colonne 'lead_investments' non trouvée")
            return
        
        valid_leads = df['lead_investments'].dropna()
        valid_leads = valid_leads[valid_leads > 0]
        
        if len(valid_leads) == 0:
            print("Aucun lead investment valide trouvé")
            return
        
        print("\n--- STATISTIQUES DES LEAD INVESTMENTS ---")
        print(f"Nombre d'investisseurs avec des leads: {len(valid_leads)}")
        print(f"Lead investment maximum: {valid_leads.max()}")
        print(f"Lead investment minimum: {valid_leads.min()}")
        print(f"Lead investment moyen: {valid_leads.mean():.2f}")
        print(f"Lead investment médian: {valid_leads.median()}")
        print(f"Somme totale des leads: {valid_leads.sum()}")
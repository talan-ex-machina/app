import pandas as pd

class StageInvestmentAnalyzer:
    """
    Analyseur pour ajouter des points bonus aux investisseurs qui investissent 
    dans la même étape que l'entreprise de l'utilisateur.
    """
    def __init__(self, input_file: str):
        self.input_file = input_file

    def add_stage_bonus(self, company_stage: str):
        """
        Ajoute +2 points aux investisseurs qui investissent dans la même étape que l'entreprise.
        
        Args:
            company_stage (str): L'étape d'investissement de l'entreprise de l'utilisateur
        """
        if not company_stage or company_stage.strip() == "":
            print("Aucune étape d'investissement détectée pour l'entreprise. Aucun bonus appliqué.")
            return self.input_file
            
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
        
        # Vérifier si la colonne 'Stages of investment' existe et a des données
        if 'Stages of investment' not in df.columns:
            print("Colonne 'Stages of investment' non trouvée dans les données.")
            return self.input_file
        
        # Nettoyer et normaliser les données
        company_stage_clean = company_stage.strip().lower()
        
        # Créer un masque pour les correspondances exactes (insensible à la casse)
        stage_column = df['Stages of investment'].fillna("").astype(str)
        
        # Vérifier les correspondances exactes (tolérant aux espaces et à la casse)
        mask = stage_column.str.lower().str.contains(company_stage_clean, regex=False, na=False)
        
        # Ajouter +20 points aux investisseurs correspondants
        matched_count = mask.sum()
        if matched_count > 0:
            df.loc[mask, 'note'] += 20
            print(f"Bonus de +20 points ajouté à {matched_count} investisseurs pour l'étape '{company_stage}'")
        else:
            print(f"Aucun investisseur trouvé pour l'étape '{company_stage}'")
        
        # Sauvegarder dans le même fichier
        df.to_csv(self.input_file, index=False)
        return self.input_file

    def get_available_stages(self):
        """
        Retourne la liste des étapes d'investissement disponibles dans les données.
        """
        try:
            df = pd.read_csv(self.input_file)
            if 'Stages of investment' in df.columns:
                stages = df['Stages of investment'].dropna().unique()
                return [stage for stage in stages if stage.strip()]
            return []
        except Exception:
            return []

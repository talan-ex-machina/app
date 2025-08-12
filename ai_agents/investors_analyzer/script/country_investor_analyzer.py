import pandas as pd

class CountryInvestorAnalyzer:
    """
    Agent pour ajouter des points bonus aux investisseurs du même pays.
    """
    def __init__(self, input_file: str):
        self.input_file = input_file

    def filter_by_country(self, country: str):
        try:
            df = pd.read_csv(self.input_file)
        except Exception:
            return None
        
        # S'assurer que la colonne 'note' existe et est de type float
        if 'note' not in df.columns:
            df['note'] = 0.0
        else:
            # Convertir la colonne 'note' en float pour éviter les erreurs de type
            df['note'] = df['note'].astype(float)
        
        # Ajouter +2 points aux investisseurs du même pays
        mask = df['country'].fillna("").astype(str).str.lower() == country.lower()
        df.loc[mask, 'note'] += 20
        
        # Compter les investisseurs du pays ciblé
        country_investors_count = mask.sum()
        print(f"Bonus de +20 points ajouté à {country_investors_count} investisseurs de {country}")
        
        # Sauvegarder dans le même fichier (écraser l'original)
        df.to_csv(self.input_file, index=False)
        return self.input_file

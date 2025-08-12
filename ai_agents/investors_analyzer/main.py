from script.service_investor_analyzer import InvestorServiceAgent
from script.country_investor_analyzer import CountryInvestorAnalyzer
from script.total_investment_analyzer import TotalInvestmentAnalyzer
from script.lead_investment_analyzer import LeadInvestmentAnalyzer
from script.stage_extractor import extract_stage_for_company
from script.stage_investment_analyzer import StageInvestmentAnalyzer
from script.top_investors_selector import TopInvestorsSelector

def main():
    country = input("Entrez le pays : ")
    service_or_product = input("Entrez le secteur, service ou produit à rechercher : ")
    company_name = input("Entrez le nom de la société : ")

    user_inputs = {
        "country": country,
        "service_or_product": service_or_product,
        "company_name": company_name
    }

    print(f"Inputs saisis : {user_inputs}")

    agent = InvestorServiceAgent()
    print("Debut analyse service/produit:")
    file_path = agent(service_or_product)

    if file_path:
        print(f"Fichier généré : {file_path}")

        print("Debut analyse country :")
        country_agent = CountryInvestorAnalyzer(file_path)
        country_agent.filter_by_country(country)

        print("Debut analyse des investissements totaux:")
        investment_analyzer = TotalInvestmentAnalyzer(file_path)
        investment_analyzer.add_investment_bonus()

        print("Debut analyse des lead investissements :")
        lead_investment_analyzer = LeadInvestmentAnalyzer(file_path)
        lead_investment_analyzer.add_lead_bonus()

        
        stage = extract_stage_for_company(company_name)
        print(f"Stage détecté : {stage}")

        if stage:
            print("Debut analyse des étapes d'investissement :")
            stage_analyzer = StageInvestmentAnalyzer(file_path)
            stage_analyzer.add_stage_bonus(stage)
        else:
            print("Aucune étape détectée, analyse ignorée.")

        # Ajout final de la sélection Top investisseurs
        print("Sélection des meilleurs investisseurs :")
        selector = TopInvestorsSelector(file_path)
        selector.select_top_investors(
            company_name=company_name,
            service_or_product=service_or_product,
            country=country,
            top_n=10
        )

    else:
        print("Aucun investisseur trouvé pour ce critère.")

if __name__ == "__main__":
    main()

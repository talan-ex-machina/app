#do not use it 
import google.generativeai as genai
import os
import json
from dotenv import load_dotenv
from typing import Dict, List, Any

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-pro')

class CompanyDomainMapper:
    def __init__(self):
        # Define available trend domains
        self.trend_domains = [
    "Artificial Intelligence", "Machine Learning", "Quantum Computing", "Biotechnology", 
    "Cybersecurity", "Robotics", "Augmented Reality", "Virtual Reality", "Blockchain", 
    "Internet of Things", "5G Networks", "Edge Computing", "Cloud Computing", 
    "Autonomous Vehicles", "Wearable Technology", "Green Energy", "Solar Technology",
    "Space Technology", "Nanotechnology", "3D Printing", "Smart Cities", "Digital Health",
    "Mobile Computing", "Web Technologies", "Social Media", "E-commerce", "Fintech",
    "Gaming Technology", "Streaming Technology", "Data Analytics", "Computer Vision"
]
    
    def map_company_to_domains(self, company_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Map a company to relevant trend domains using LLM analysis
        
        Args:
            company_data: Dictionary containing company information
            
        Returns:
            Dictionary with domain names as keys and relevance scores (0-1) as values
        """
        
        prompt = f"""
You are an expert business analyst specializing in technology trends and company classification.

Analyze the following company and determine its relevance to each trend domain listed below.
Assign a relevance score between 0.0 and 1.0 for each domain, where:
- 0.0 = No relevance/involvement
- 0.1-0.3 = Minimal relevance (tangential involvement)
- 0.4-0.6 = Moderate relevance (some products/services in this area)
- 0.7-0.9 = High relevance (core business area or major focus)
- 1.0 = Primary focus (main business revolves around this domain)

COMPANY INFORMATION:
- Company Name: {company_data.get('company', 'N/A')}
- Industry: {company_data.get('industry', 'N/A')}
- Products & Services: {company_data.get('products_services', 'N/A')}
- Business Description: {company_data.get('description', 'N/A')}

TREND DOMAINS TO ANALYZE:
{', '.join(self.trend_domains)}

INSTRUCTIONS:
1. Carefully analyze the company's products, services, and industry
2. Consider both direct involvement and indirect dependencies
3. Be conservative with high scores (0.8+) - reserve for core business areas
4. Consider future potential based on current trajectory
5. Return ONLY a valid JSON object with exact domain names as keys

REQUIRED JSON FORMAT:
{{
    "artificial_intelligence": 0.0,
    "machine_learning": 0.0,
    "cloud_computing": 0.0,
    "cybersecurity": 0.0,
    "blockchain": 0.0,
    "internet_of_things": 0.0,
    "fintech": 0.0,
    "healthtech": 0.0,
    "edtech": 0.0,
    "e_commerce": 0.0,
    "autonomous_vehicles": 0.0,
    "renewable_energy": 0.0,
    "biotechnology": 0.0,
    "robotics": 0.0,
    "virtual_reality": 0.0,
    "augmented_reality": 0.0,
    "quantum_computing": 0.0,
    "5g_technology": 0.0,
    "edge_computing": 0.0,
    "digital_transformation": 0.0
}}
"""

        try:
            response = model.generate_content(prompt)
            
            # Clean and parse the response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            response_text = response_text.strip()
            
            # Parse JSON
            domain_scores = json.loads(response_text)
            
            # Validate and clean scores
            validated_scores = {}
            for domain in self.trend_domains:
                score = domain_scores.get(domain, 0.0)
                # Ensure score is between 0 and 1
                validated_scores[domain] = max(0.0, min(1.0, float(score)))
            
            return validated_scores
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Response was: {response.text}")
            return self._get_default_scores()
        
        except Exception as e:
            print(f"Error in domain mapping: {e}")
            return self._get_default_scores()
    
    def _get_default_scores(self) -> Dict[str, float]:
        """Return default scores (all 0.0) in case of errors"""
        return {domain: 0.0 for domain in self.trend_domains}
    
    def get_top_domains(self, domain_scores: Dict[str, float], threshold: float = 0.3, top_n: int = 5) -> List[tuple]:
        """
        Get top relevant domains for a company
        
        Args:
            domain_scores: Domain relevance scores
            threshold: Minimum score to consider
            top_n: Maximum number of domains to return
            
        Returns:
            List of (domain, score) tuples sorted by score
        """
        relevant_domains = [(domain, score) for domain, score in domain_scores.items() 
                          if score >= threshold]
        
        # Sort by score (descending) and return top N
        relevant_domains.sort(key=lambda x: x[1], reverse=True)
        return relevant_domains[:top_n]
    
    def calculate_weighted_trend_score(self, domain_scores: Dict[str, float], 
                                     domain_trend_scores: Dict[str, float]) -> float:
        """
        Calculate company's weighted trend score based on domain relevance and trend momentum
        
        Args:
            domain_scores: Company's relevance to each domain (0-1)
            domain_trend_scores: Trend momentum scores for each domain
            
        Returns:
            Weighted trend score for the company
        """
        total_weighted_score = 0.0
        total_weight = 0.0
        
        for domain, relevance in domain_scores.items():
            if relevance > 0 and domain in domain_trend_scores:
                trend_score = domain_trend_scores[domain]
                weighted_contribution = relevance * trend_score
                total_weighted_score += weighted_contribution
                total_weight += relevance
        
        # Return weighted average, or 0 if no relevant domains
        return total_weighted_score / total_weight if total_weight > 0 else 0.0

# Example usage and testing
def test_domain_mapping():
    mapper = CompanyDomainMapper()
    
    # Test company data
    test_companies = [
        {
            "company": "OpenAI",
            "industry": "Artificial Intelligence",
            "products_services": "GPT language models, ChatGPT, DALL-E image generation, API services for AI applications",
            "description": "AI research company developing artificial general intelligence for the benefit of humanity"
        },
        {
            "company": "Tesla",
            "industry": "Automotive/Energy",
            "products_services": "Electric vehicles, autonomous driving software, energy storage systems, solar panels",
            "description": "Electric vehicle and clean energy company focused on sustainable transportation and energy"
        },
        {
            "company": "Shopify",
            "industry": "E-commerce",
            "products_services": "E-commerce platform, payment processing, inventory management, marketing tools",
            "description": "Commerce platform that helps businesses sell online and in-person"
        }
    ]
    
    for company in test_companies:
        print(f"\n=== Analyzing {company['company']} ===")
        domain_scores = mapper.map_company_to_domains(company)
        
        # Show top domains
        top_domains = mapper.get_top_domains(domain_scores, threshold=0.2)
        print("Top relevant domains:")
        for domain, score in top_domains:
            print(f"  {domain}: {score:.2f}")
        
        # Example trend score calculation
        example_trend_scores = {domain: 0.5 for domain in mapper.trend_domains}  # Mock trend scores
        weighted_score = mapper.calculate_weighted_trend_score(domain_scores, example_trend_scores)
        print(f"Weighted trend score: {weighted_score:.3f}")

if __name__ == "__main__":
    test_domain_mapping()
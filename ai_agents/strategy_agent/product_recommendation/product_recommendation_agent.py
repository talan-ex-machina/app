import json
import os
from product_processing import ProductDataProcessor
from product_cons_pros import LLMProcessor
from product_idea_recommendation import FinalProductRecommendation
from dotenv import load_dotenv

load_dotenv()

def load_trends_data(trends_path):
    """Load technology trends data with validation"""
    with open(trends_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if not isinstance(data, dict):
        raise ValueError("Trends data should be a dictionary {domain: score}")
    if not all(isinstance(v, (int, float)) for v in data.values()):
        raise ValueError("All trend scores should be numbers")
    
    return data

def recommend():
    # Configuration
    PRODUCT_DATA_PATH = "C:/Users/HP/Desktop/Talan/response.json"
    TRENDS_DATA_PATH = "C:/Users/HP/Desktop/Talan/app/ai_agents/technology_trend/predicted_trends.json"
    OUTPUT_DIR = "product_recommendation"
    
    try:
        # Load input data
        with open(PRODUCT_DATA_PATH, 'r', encoding='utf-8') as f:
            product_data = json.load(f)
        trends_data = load_trends_data(TRENDS_DATA_PATH)

        # Process product reviews
        processor = ProductDataProcessor()
        product_reviews = processor.preprocess_product_data(product_data)

        # Generate insights
        llm_processor = LLMProcessor(os.getenv("GEMINI_API_KEY"))
        product_summary = llm_processor.generate_pros_and_cons_summary(product_reviews)

        # Generate final recommendation
        idea_generator = FinalProductRecommendation(os.getenv("GEMINI_API_KEY"))
        recommendation = idea_generator.generate_final_recommendation(
            product_summary,
            trends_data
        )

        # Save output
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        output_path = os.path.join(OUTPUT_DIR, "product_recommendation.json")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(recommendation)
        
        print(f"Successfully generated recommendation at {output_path}")
        return json.loads(recommendation)

    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {str(e)}")
    except FileNotFoundError as e:
        print(f"File not found: {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {
            "product_name": "Error",
            "product_idea": "Failed to generate recommendation",
            "trend_domains": [],
            "strengths": [],
            "concrete_steps_to_launch": [],
            "differentiation_strategy": []
        }

if __name__ == "__main__":
    recommend()
import os
import google.generativeai as genai
from dotenv import load_dotenv
import csv
import time
import random
import re
from google.api_core.exceptions import ResourceExhausted, GoogleAPIError
from datetime import datetime

# Load environment variables from .env file
load_dotenv()
# Configure the Gemini API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --- Configuration ---
OUTPUT_CSV_FILE = "technology_trends_dataset.csv"
NUM_ROWS_TARGET = 10000  # More realistic target
TRENDS_PER_CALL = 3  # Reduced for better quality responses
CHECKPOINT_INTERVAL = 100  # Save progress every N rows

# Gemini API parameters
GEMINI_MODEL = "gemini-1.5-flash"
TEMPERATURE = 0.7
MAX_OUTPUT_TOKENS = 500  # Increased for better descriptions

# Rate limit management (more conservative)
BASE_DELAY_SECONDS = 30.0
MAX_RETRIES = 2

# Comprehensive list of technology domains
DOMAINS = [
    "Artificial Intelligence", "Machine Learning", "Quantum Computing", "Biotechnology", 
    "Cybersecurity", "Robotics", "Augmented Reality", "Virtual Reality", "Blockchain", 
    "Internet of Things", "5G Networks", "Edge Computing", "Cloud Computing", 
    "Autonomous Vehicles", "Wearable Technology", "Green Energy", "Solar Technology",
    "Space Technology", "Nanotechnology", "3D Printing", "Smart Cities", "Digital Health",
    "Mobile Computing", "Web Technologies", "Social Media", "E-commerce", "Fintech",
    "Gaming Technology", "Streaming Technology", "Data Analytics", "Computer Vision"
]

# Years for historical trends (2002 to current year)
CURRENT_YEAR = datetime.now().year
YEARS = list(range(2002, CURRENT_YEAR + 1))

def create_domain_year_combinations():
    """Create and shuffle domain-year combinations"""
    combinations = [(domain, year) for domain in DOMAINS for year in YEARS]
    random.shuffle(combinations)
    return combinations

def get_historical_context_prompt(domain, year):
    """Create a more historically accurate prompt based on the year"""
    if year <= 2005:
        context = "early 2000s, focusing on foundational technologies and emerging concepts"
    elif year <= 2010:
        context = "mid-2000s to late 2000s, including Web 2.0 era and mobile revolution beginnings"
    elif year <= 2015:
        context = "early 2010s, including smartphone proliferation and cloud computing adoption"
    elif year <= 2020:
        context = "mid-2010s to late 2010s, including AI renaissance and IoT expansion"
    else:
        context = "2020s, including pandemic-driven digital transformation and modern AI"
    
    return f"""
You are a technology historian and analyst. For the domain of {domain}, identify the top {TRENDS_PER_CALL} most significant and realistic technology trends that were actually emerging, developing, or gaining prominence specifically in the year {year}.

Consider the historical context of {context}. Focus on technologies that were genuinely relevant and emerging during that specific time period, not future technologies that didn't exist yet.

For each trend, provide:
- A concise, specific title (avoid generic terms)
- A detailed description (2-3 sentences) explaining what made this trend significant in {year}
- A realistic impact assessment based on how the trend actually developed

Format your response exactly as follows:

1. [Specific Trend Title]
Description: [Detailed 2-3 sentence description of the trend and its significance in {year}]
Estimated Impact: [High/Medium/Low]

2. [Specific Trend Title]  
Description: [Detailed 2-3 sentence description of the trend and its significance in {year}]
Estimated Impact: [High/Medium/Low]

3. [Specific Trend Title]
Description: [Detailed 2-3 sentence description of the trend and its significance in {year}]  
Estimated Impact: [High/Medium/Low]

Be historically accurate and avoid anachronisms. Focus on what was actually happening in {domain} during {year}.
"""

# Initialize the GenerativeModel
model = genai.GenerativeModel(GEMINI_MODEL)

def predict_tech_trends(domain, year, retry_count=0):
    """
    Predicts technology trends using Gemini API with improved error handling
    """
    prompt = get_historical_context_prompt(domain, year)
    
    generation_config = genai.types.GenerationConfig(
        temperature=TEMPERATURE,
        max_output_tokens=MAX_OUTPUT_TOKENS
    )

    try:
        response = model.generate_content(
            contents=prompt,
            generation_config=generation_config
        )
        return response.text

    except ResourceExhausted as e:
        wait_time = BASE_DELAY_SECONDS * (2 ** retry_count) + random.uniform(0, 2)
        print(f"Rate limit hit for {domain} ({year}). Retrying in {wait_time:.2f} seconds... (Attempt {retry_count + 1})")
        time.sleep(wait_time)
        if retry_count < MAX_RETRIES:
            return predict_tech_trends(domain, year, retry_count + 1)
        else:
            print(f"Max retries reached for rate limit on {domain} {year}. Skipping.")
            return None
            
    except GoogleAPIError as e:
        print(f"Gemini API Error for {domain} ({year}): {e}")
        if retry_count < MAX_RETRIES:
            wait_time = BASE_DELAY_SECONDS * (2** retry_count) + random.uniform(0, 2)
            print(f"API error. Retrying in {wait_time:.2f} seconds... (Attempt {retry_count + 1})")
            time.sleep(wait_time)
            return predict_tech_trends(domain, year, retry_count + 1)
        else:
            print(f"Max retries reached for API error on {domain} {year}. Skipping.")
            return None
            
    except Exception as e:
        print(f"Unexpected error for {domain} ({year}): {e}")
        return None

def parse_trends(raw_text, domain, year):
    """
    Improved parsing of LLM output with better error handling
    """
    trends = []
    
    # More flexible regex pattern
    pattern = r'(\d+)\.\s*\[(.*?)\]\s*\n\s*Description:\s*(.*?)\n\s*Estimated Impact:\s*(High|Medium|Low)'
    matches = re.findall(pattern, raw_text, re.IGNORECASE | re.DOTALL)
    
    if not matches:
        # Fallback pattern for different formatting
        pattern = r'(\d+)\.\s*(.*?)\n\s*Description:\s*(.*?)\n\s*Estimated Impact:\s*(High|Medium|Low)'
        matches = re.findall(pattern, raw_text, re.IGNORECASE | re.DOTALL)
    
    for match in matches:
        title = match[1].strip() if len(match) > 1 else match[1].strip()
        description = match[2].strip()
        impact = match[3].strip().capitalize()
        
        # Clean up the data
        title = re.sub(r'\[|\]', '', title)  # Remove brackets
        description = ' '.join(description.split())  # Normalize whitespace
        
        if title and description and len(description) > 10:  # Basic validation
            trends.append({
                "Date": year,
                "Domain": domain,
                "Trend Title": title,
                "Trend Description": description,
                "Estimated Impact": impact
            })
    
    return trends

def save_checkpoint(data, filename):
    """Save current progress to avoid data loss"""
    checkpoint_file = f"checkpoint_{filename}"
    with open(checkpoint_file, 'w', newline='', encoding='utf-8') as csvfile:
        if data:
            fieldnames = data[0].keys()
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
    print(f"Checkpoint saved to {checkpoint_file}")

def load_existing_data(filename):
    """Load existing data to resume generation"""
    try:
        with open(filename, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            return list(reader)
    except FileNotFoundError:
        return []

# --- Main Data Generation Loop ---
if __name__ == "__main__":
    print(f"Technology Trends Dataset Generator")
    print(f"Target: {NUM_ROWS_TARGET} rows")
    print(f"Domains: {len(DOMAINS)} domains")
    print(f"Years: {YEARS[0]} to {YEARS[-1]} ({len(YEARS)} years)")
    print(f"Total combinations available: {len(DOMAINS) * len(YEARS)}")
    print(f"Output file: {OUTPUT_CSV_FILE}")
    print(f"Using Gemini model: {GEMINI_MODEL}")
    print("-" * 50)

    # Load existing data if resuming
    existing_data = load_existing_data(OUTPUT_CSV_FILE)
    all_trends = existing_data.copy()
    rows_generated = len(existing_data)
    
    if rows_generated > 0:
        print(f"Resuming from {rows_generated} existing rows")

    # Create combinations and filter out already processed ones
    all_combinations = create_domain_year_combinations()
    processed_combinations = set()
    
    if existing_data:
        processed_combinations = {(row['Domain'], int(row['Date'])) for row in existing_data}
        all_combinations = [combo for combo in all_combinations if combo not in processed_combinations]
    
    print(f"Remaining combinations to process: {len(all_combinations)}")

    # Open CSV file for writing
    file_mode = 'a' if existing_data else 'w'
    with open(OUTPUT_CSV_FILE, file_mode, newline='', encoding='utf-8') as csvfile:
        fieldnames = ["Date", "Domain", "Trend Title", "Trend Description", "Estimated Impact"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        if not existing_data:  # Write header only for new files
            writer.writeheader()

        api_calls_made = 0
        failed_calls = 0
        
        for i, (domain, year) in enumerate(all_combinations):
            if rows_generated >= NUM_ROWS_TARGET:
                print(f"Target of {NUM_ROWS_TARGET} rows reached. Stopping.")
                break

            print(f"Processing {i + 1}/{len(all_combinations)}: {domain} ({year})...")
            
            raw_response = predict_tech_trends(domain, year)
            api_calls_made += 1

            if raw_response:
                parsed_trends = parse_trends(raw_response, domain, year)
                
                if parsed_trends:
                    for trend in parsed_trends:
                        if rows_generated < NUM_ROWS_TARGET:
                            writer.writerow(trend)
                            all_trends.append(trend)
                            rows_generated += 1
                        else:
                            break
                    print(f"  -> Added {len(parsed_trends)} trends (Total: {rows_generated})")
                else:
                    print(f"  -> Could not parse trends from response")
                    failed_calls += 1
            else:
                print(f"  -> API call failed")
                failed_calls += 1

            # Save checkpoint periodically
            if rows_generated % CHECKPOINT_INTERVAL == 0 and rows_generated > 0:
                save_checkpoint(all_trends, OUTPUT_CSV_FILE)

            # Rate limiting
            time.sleep(BASE_DELAY_SECONDS)

        # Final statistics
        print("\n" + "=" * 50)
        print("DATA GENERATION COMPLETE")
        print("=" * 50)
        print(f"Total rows generated: {rows_generated}")
        print(f"Target rows: {NUM_ROWS_TARGET}")
        print(f"API calls made: {api_calls_made}")
        print(f"Failed calls: {failed_calls}")
        print(f"Success rate: {((api_calls_made - failed_calls) / api_calls_made * 100):.1f}%" if api_calls_made > 0 else "N/A")
        print(f"Output saved to: {OUTPUT_CSV_FILE}")
        
        if rows_generated < NUM_ROWS_TARGET:
            print(f"\nNote: Target not fully met. You can run the script again to continue.")
        
        print(f"\nEnsure your GEMINI_API_KEY is set in your .env file.")
        print(f"Monitor your API usage in the Google Cloud Console.")
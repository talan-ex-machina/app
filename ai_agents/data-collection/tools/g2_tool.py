from core.base_tool import BaseTool
from core.llm_interface import GeminiLLM
from config import SCRAPE_DO_API_KEY
import requests
import urllib.parse
from bs4 import BeautifulSoup
import html2text
import json
import os
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class G2ScraperTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="g2_scraper",
            description="Scrapes G2 reviews and product info."
        )
        self.token = SCRAPE_DO_API_KEY
        logger.info(f"G2ScraperTool initialized with token: {self.token}")

        # Initialize GeminiLLM with your API key
        self.llm = GeminiLLM(api_key=os.environ.get("GOOGLE_API_KEY", ""))
        self.html_converter = html2text.HTML2Text()
        self.html_converter.ignore_links = True
        self.html_converter.body_width = 0

    def slugify(self, name):
        logger.info(f"Slugifying product name: {name}")
        return name.lower().replace(" ", "-").replace(".", "").replace(",", "")

    def fetch_page(self, url_to_scrape):
        # Use quote instead of quote_plus to avoid issues with + characters
        encoded_url = urllib.parse.quote(url_to_scrape, safe=':/?#[]@!$&\'()*+,;=')
        api_url = f"https://api.scrape.do/?token={self.token}&url={encoded_url}&geoCode=us"
        logger.info(f"Fetching page: {api_url}")
        try:
            response = requests.get(api_url, timeout=30)
            response.raise_for_status()
            logger.info(f"Page fetched successfully: {url_to_scrape}")
            return response.text
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch page {url_to_scrape}. Error: {e}")
            return None

    def clean_gemini_output(self, text):
        # Remove markdown JSON code fences if present
        if text.startswith("```json"):
            text = text[len("```json"):].strip()
        if text.endswith("```"):
            text = text[:-3].strip()
        return text

    def process_single_review(self, review_soup_element):
        logger.info("Processing single review element.")
        raw_html = str(review_soup_element)
        plain_text = self.html_converter.handle(raw_html)

        prompt = f"""
You are a strict JSON generator.

Extract the following fields from the review below and respond with only valid minified JSON — no markdown, no code blocks, no text. Return just the JSON:

{{
  "reviewer_name": "",
  "reviewer_industry": "",
  "review_date": "",
  "pros": "",
  "cons": "",
  "problems_solved": "",
  "sentiment": "",
  "star_rating": ""
}}

Review:
{plain_text}
"""

        try:
            response_text = self.llm.generate_response([], prompt)
            cleaned_json = self.clean_gemini_output(response_text)
            review_data = json.loads(cleaned_json)
            logger.info(f"Extracted review data: {review_data}")
            return review_data
        except Exception as e:
            logger.error(f"GeminiLLM JSON parse failed: {e}")
            return None

    def run(self, input: dict, context: dict) -> dict:
        logger.info(f"G2ScraperTool.run called with input: {input}")
        product_or_company_name = input.get("product_name")
        # If product_name is a dict (from Tavily), try to extract the name string
        if isinstance(product_or_company_name, dict):
            logger.info(f"Extracting product name from dict: {product_or_company_name}")
            product_or_company_name = product_or_company_name.get("name") or product_or_company_name.get("title") or str(product_or_company_name)
        if not product_or_company_name:
            logger.error("Missing 'product_name' in input.")
            return {"error": "Missing 'product_name' in input."}

        product_slug = self.slugify(product_or_company_name)
        product_base_url = f"https://www.g2.com/products/{product_slug}"
        logger.info(f"Constructed G2 product URL: {product_base_url}")

        html_content = self.fetch_page(product_base_url)
        if not html_content:
            logger.error(f"Could not fetch the main product page for {product_or_company_name}.")
            return {"error": f"Could not fetch the main product page for {product_or_company_name}."}

        soup = BeautifulSoup(html_content, 'html.parser')

        product_name = "Not available"
        product_name_element = soup.find('div', class_='product-head__title')
        if product_name_element:
            name_span = product_name_element.select_one('div[itemprop="name"]')
            if name_span:
                product_name = name_span.text.strip()
        logger.info(f"Extracted product name: {product_name}")

        product_website = "Not available"
        try:
            product_website_element = soup.find('input', id='secure_url')
            if product_website_element:
                product_website = product_website_element['value']
        except TypeError:
            pass
        logger.info(f"Extracted product website: {product_website}")

        product_logo = "Not available"
        try:
            product_logo_element = soup.find('img', class_='js-product-img')
            if product_logo_element:
                product_logo = product_logo_element['src']
        except TypeError:
            pass
        logger.info(f"Extracted product logo: {product_logo}")

        review_count = "0"
        review_count_element = soup.find('h3', class_='mb-half')
        if review_count_element:
            review_count = review_count_element.text.strip()
        logger.info(f"Extracted review count: {review_count}")

        review_rating = "Not available"
        review_rating_element = soup.find('span', class_='fw-semibold')
        if review_rating_element:
            review_rating = review_rating_element.text.strip()
        logger.info(f"Extracted review rating: {review_rating}")

        pricing_info = []
        for tag in soup.find_all('a', class_='preview-cards__card'):
            head_element = tag.find('div', class_='preview-cards__card__head')
            head = head_element.text.strip() if head_element else "N/A"

            money_unit_element = tag.find('span', class_='money__unit')
            money_value_element = tag.find('span', class_='money__value')

            if money_unit_element and money_value_element:
                money_unit_text = money_unit_element.text.strip()
                money_value = money_value_element.text.strip()
                pricing_info.append(f"{head} - {money_unit_text}{money_value}")
            elif money_value_element:
                money_value = money_value_element.text.strip()
                pricing_info.append(f"{head} - {money_value}")
            else:
                pricing_info.append(f"{head} - Price not found")
        logger.info(f"Extracted pricing info: {pricing_info}")

        pros_container = soup.select_one('div[aria-label="Pros"]')
        pros = [tag.text.strip() for tag in pros_container.find_all('div', class_='ellipsis')] if pros_container else []
        logger.info(f"Extracted pros: {pros}")

        cons_container = soup.select_one('div[aria-label="Cons"]')
        cons = [tag.text.strip() for tag in cons_container.find_all('div', class_='ellipsis')] if cons_container else []
        logger.info(f"Extracted cons: {cons}")

        # Scrape reviews
        reviews = []
        max_pages_to_scrape = input.get("max_pages", 1)
        current_page = 1
        while current_page <= max_pages_to_scrape:
            reviews_page_url = f"{product_base_url}/reviews?page={current_page}"
            logger.info(f"Fetching reviews from page: {current_page}")
            html_content_reviews = self.fetch_page(reviews_page_url)
            if not html_content_reviews:
                logger.warning(f"Could not fetch reviews page {current_page}. Exiting review scraping.")
                break
            soup_reviews = BeautifulSoup(html_content_reviews, 'html.parser')
            reviews_on_page = soup_reviews.find_all('article', class_='elv-bg-neutral-0')
            if not reviews_on_page:
                logger.info(f"No more reviews found on page {current_page}. Finishing scraping.")
                break
            for review in reviews_on_page:
                review_data = self.process_single_review(review)
                if review_data:
                    reviews.append(review_data)
                else:
                    logger.warning("A review failed to parse.")
            current_page += 1
        logger.info(f"Total reviews scraped: {len(reviews)}")

        return {
            "product_info": {
                "product_name": product_name,
                "product_website": product_website,
                "product_logo": product_logo,
                "review_count": review_count,
                "review_rating": review_rating,
                "pricing_info": pricing_info,
                "pros": pros,
                "cons": cons
            },
            "reviews": reviews
        }
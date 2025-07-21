from core.base_tool import BaseTool
import requests
import urllib.parse
from bs4 import BeautifulSoup
from config import SCRAPE_DO_API_KEY
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class G2ScraperTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="g2_scraper",
            description="Scrapes G2 reviews and product info."
        )
        self.token = SCRAPE_DO_API_KEY
        logger.info(f"G2ScraperTool initialized with token: {self.token}")

    def slugify(self, name):
        logger.info(f"Slugifying product name: {name}")
        return name.lower().replace(" ", "-").replace(".", "").replace(",", "")

    def fetch_page(self, url_to_scrape):
        encoded_url = urllib.parse.quote_plus(url_to_scrape)
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

    def process_single_review(self, review_soup_element):
        logger.info("Processing single review element.")
        reviewer_name = "Not available"
        title = "Not available"
        industry = "Not available"
        review_title = "Not available"
        rating = 0.0
        content_pros = "Not available"
        content_cons = "Not available"
        content_problems_solved = "Not available"

        try:
            reviewer_name_element = review_soup_element.select_one('div[itemprop="author"] h5')
            if reviewer_name_element:
                reviewer_name = reviewer_name_element.text.strip()

            reviewer_info_divs = review_soup_element.select('div[itemprop="author"] + div > div')
            if len(reviewer_info_divs) > 0:
                title = reviewer_info_divs[0].text.strip()
            if len(reviewer_info_divs) > 1:
                industry = reviewer_info_divs[1].text.strip()

            review_title_element = review_soup_element.select_one('div[itemprop="name"] h5')
            if review_title_element:
                review_title = review_title_element.text.strip()

            rating_meta_element = review_soup_element.select_one('span[itemprop="reviewRating"] meta[itemprop="ratingValue"]')
            if rating_meta_element and 'content' in rating_meta_element.attrs:
                try:
                    rating = float(rating_meta_element['content'])
                except ValueError:
                    pass

            sections = review_soup_element.find_all('section')
            for section in sections:
                header_element = section.find('h5')
                if header_element:
                    header_text = header_element.text.strip()
                    paragraph_element = section.find('p')
                    if paragraph_element:
                        content_text = paragraph_element.text.strip().replace("Review collected by and hosted on G2.com.", "").strip()
                        if "What do you like best about" in header_text:
                            content_pros = content_text
                        elif "What do you dislike about" in header_text:
                            content_cons = content_text
                        elif "What problems is" in header_text and "solving and how is that benefiting you?" in header_text:
                            content_problems_solved = content_text

        except Exception as e:
            logger.error(f"Error processing review: {e}")
            full_review_body_element = review_soup_element.select_one('div[itemprop="reviewBody"]')
            if full_review_body_element:
                content_pros = full_review_body_element.text.strip().replace("Review collected by and hosted on G2.com.", "").strip()
                content_cons = ""
                content_problems_solved = ""

        logger.info(f"Processed review: Reviewer={reviewer_name}, Title={title}, Industry={industry}, Rating={rating}")
        return {
            "Reviewer": reviewer_name,
            "Title": title,
            "Industry": industry,
            "Review Title": review_title,
            "Rating": rating,
            "Pros": content_pros,
            "Cons": content_cons,
            "Problems Solved": content_problems_solved
        }

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
        max_pages_to_scrape = input.get("max_pages", 3)
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
                reviews.append(review_data)
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

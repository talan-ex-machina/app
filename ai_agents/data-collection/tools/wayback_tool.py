from core.base_tool import BaseTool
from core.llm_interface import GeminiLLM
from config import GOOGLE_API_KEY
import requests
from tools.tavily_tool import TavilySearchTool
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import time
import json
import logging
import sys
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from urllib.parse import urljoin, urlparse
from core.llm_interface import GeminiLLM
from tools.serper_tool import SerperTool
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('wayback_tool')
logger.setLevel(logging.DEBUG)

# Add file handler
file_handler = logging.FileHandler('wayback_debug.log')
file_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

class WaybackTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="wayback_tool",
            description="Crawls Wayback Machine snapshots and extracts content."
        )

    def run(self, input: dict, context: dict = None) -> dict:
        url = input.get("company_url")
        start_year = input.get("start_year", 2015)
        end_year = input.get("end_year", 2025)
        max_pages = input.get("max_pages", 5)
        industry = input.get("industry")
        country = input.get("country")
        company_name = input.get("company_name")
        
        # If company_url is not provided, try to find it
        if not url:
            selected_name = None
            
            # Method 1: If we have a specific company name, use it directly
            if company_name:
                selected_name = company_name
                logger.info(f"Using provided company name: {company_name}")
            
            # Method 2: If no company name but have industry/country, search for companies
            elif industry:
                tavily_tool = TavilySearchTool()
                tavily_result = tavily_tool.run({"industry": industry, "country": country}, context or {})
                top_products = tavily_result.get("top_products", [])
                print("Tavily search result:", json.dumps(top_products, indent=2, ensure_ascii=False))  # Debug print
                print("1")
                if not top_products:
                    return {"error": "Could not find any companies for the given industry/country."}
                # Use GeminiLLM to filter and rank companies
                llm = GeminiLLM(api_key=GOOGLE_API_KEY)
                print("2")
                filter_prompt = (
                    "Given the following list of companies, select the one that is the largest, most dominant, or most relevant for the industry and country provided. "
                    "Return only the company name as a string.\n\n"
                    f"Industry: {industry}\nCountry: {country if country else 'Global'}\nCompanies: {json.dumps(top_products, ensure_ascii=False)}"
                )
                print("4")
                selected_name = llm.generate_response([], filter_prompt)
                print("3")
                print("LLM selected company name:", selected_name)
            else:
                return {"error": "Either company_url, company_name, or industry must be provided."}
            
            # Now get the company website using SerperTool
            if selected_name:
                serper_tool = SerperTool()
                # Try original name
                print("SerperTool query company name:", selected_name)
                serper_result = serper_tool.run({"company_name": selected_name, "country": country})
                url = serper_result.get("website")
                print("SerperTool selected company url:", url)
                # If not found, try with enriched query
                if not url:
                    enriched_name = f"{selected_name} official website"
                    print("SerperTool enriched query:", enriched_name)
                    serper_result = serper_tool.run({"company_name": enriched_name, "country": country})
                    url = serper_result.get("website")
                    print("SerperTool enriched selected company url:", url)
                # If still not found, fallback to Tavily result (only if we used Tavily search)
                if not url and industry:
                    print("Fallback: trying to extract URL from Tavily top_products")
                    selected = None
                    if country:
                        for prod in top_products:
                            desc = prod.get("description", "") if isinstance(prod, dict) else str(prod)
                            name = prod.get("name", "") if isinstance(prod, dict) else str(prod)
                            if country.lower() in desc.lower() or country.lower() in name.lower():
                                selected = prod
                                break
                    if not selected and 'top_products' in locals():
                        selected = top_products[0]
                    
                    if isinstance(selected, dict):
                        url = selected.get("website") or selected.get("url") or selected.get("link")
                        if not url:
                            import re
                            desc = selected.get("description", "")
                            match = re.search(r'(https?://[\w.-]+)', desc)
                            if match:
                                url = match.group(1)
                    elif isinstance(selected, str):
                        import re
                        match = re.search(r'(https?://[\w.-]+)', selected)
                        if match:
                            url = match.group(1)
                    print("Tavily fallback url:", url)
                
                if not url:
                    return {"error": f"Could not find website for company: {selected_name}", "details": {"company_name": selected_name}}
        # Clean URL for Wayback Machine (remove protocol and www.)
        import re

        cleaned_url = re.sub(r'^https?://', '', url)
        cleaned_url = re.sub(r'^www\.', '', cleaned_url)
        print("Cleaned company URL for Wayback:", cleaned_url)
        snapshots = self.get_wayback_snapshots(cleaned_url, start_year, end_year)
        selected_snapshots = self.select_one_snapshot_per_year(snapshots, start_year, end_year)
        snapshot_data = []
        for snapshot in selected_snapshots:
            content = self.crawl_snapshot(snapshot["url"], max_pages=max_pages)
            content["timestamp"] = snapshot["timestamp"]
            snapshot_data.append(content)
            time.sleep(1)
        return {"snapshot_data": snapshot_data, "company_url": url}

    def is_same_domain(self, base_url, test_url):
        return urlparse(base_url).netloc == urlparse(test_url).netloc

    def crawl_snapshot(self, snapshot_url, max_pages=5):
        visited = set()
        to_visit = [snapshot_url]
        aggregated_text = ""
        aggregated_headings = []
        aggregated_links = []
        while to_visit and len(visited) < max_pages:
            current_url = to_visit.pop(0)
            if current_url in visited:
                continue
            visited.add(current_url)
            page_data = self.scrape_with_requests(current_url)
            aggregated_text += "\n" + page_data.get("text_content", "")
            aggregated_headings.extend(page_data.get("headings", []))
            page_links = page_data.get("links", [])
            for link in page_links:
                if not link.startswith("http"):
                    link = urljoin(current_url, link)
                if self.is_same_domain(snapshot_url, link) and link not in visited:
                    to_visit.append(link)
            aggregated_links.extend(page_links)
            time.sleep(0.5)
        return {
            "title": f"Crawled content from {snapshot_url}",
            "headings": aggregated_headings[:30],
            "text_content": aggregated_text[:15000],
            "links": aggregated_links[:200],
            "url": snapshot_url
        }

    def get_wayback_snapshots(self, url, start_year, end_year):
        logger.info(f"Fetching snapshots for {url} from {start_year} to {end_year}")
        ua = UserAgent()
        headers = {"User-Agent": ua.chrome}
        cdx_url = f"http://web.archive.org/cdx/search/cdx?url={url}&output=json&from={start_year}&to={end_year}&fl=timestamp,original"
        
        logger.debug(f"CDX API URL: {cdx_url}")
        
        session = requests.Session()
        retries = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET"]
        )
        session.mount("http://", HTTPAdapter(max_retries=retries))
        
        try:
            logger.debug("Sending request to Wayback Machine CDX API")
            response = session.get(cdx_url, headers=headers, timeout=30)
            logger.debug(f"Response status code: {response.status_code}")
            logger.debug(f"Response headers: {dict(response.headers)}")
            
            response.raise_for_status()
            
            try:
                data = json.loads(response.text)
                logger.debug(f"Received {len(data) - 1} snapshots (excluding header row)")
                
                if not data or len(data) <= 1:
                    logger.warning("No snapshots found or empty response from CDX API")
                    return []
                
                snapshots = [
                    {"timestamp": entry[0], "url": f"https://web.archive.org/web/{entry[0]}/{entry[1]}"}
                    for entry in data[1:]
                ]
                
                logger.info(f"Successfully retrieved {len(snapshots)} snapshots")
                if snapshots:
                    logger.debug(f"First snapshot: {snapshots[0]}")
                    logger.debug(f"Last snapshot: {snapshots[-1]}")
                
                return snapshots
                
            except json.JSONDecodeError as je:
                logger.error(f"Failed to decode JSON response: {je}")
                logger.debug(f"Response content: {response.text[:500]}...")  # Log first 500 chars of response
                return []
                
        except requests.exceptions.HTTPError as he:
            logger.error(f"HTTP Error: {he}")
            if hasattr(he, 'response') and he.response is not None:
                logger.error(f"Response status: {he.response.status_code}")
                logger.error(f"Response body: {he.response.text[:500]}...")
            return []
            
        except requests.exceptions.RequestException as re:
            logger.error(f"Request failed: {re}")
            return []
            
        except Exception as e:
            logger.error(f"Unexpected error in get_wayback_snapshots: {str(e)}", exc_info=True)
            return []

    def select_one_snapshot_per_year(self, snapshots, start_year, end_year):
        selected_snapshots = []
        for year in range(start_year, end_year + 1):
            year_str = str(year)
            for snapshot in snapshots:
                if snapshot["timestamp"].startswith(year_str):
                    selected_snapshots.append(snapshot)
                    break
        return selected_snapshots

    def scrape_with_requests(self, snapshot_url):
        logger.info(f"Scraping: {snapshot_url}")
        ua = UserAgent()
        headers = {"User-Agent": ua.chrome}
        
        session = requests.Session()
        retries = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        session.mount("http://", HTTPAdapter(max_retries=retries))
        
        try:
            logger.debug(f"Requesting URL: {snapshot_url}")
            response = session.get(snapshot_url, headers=headers, timeout=30)
            logger.debug(f"Response status: {response.status_code}")
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, "html.parser")
            title = soup.title.text.strip() if soup.title else "No title"
            headings = [h.text.strip() for h in soup.find_all(["h1", "h2"]) if h.text.strip()]
            text_content = ' '.join([p.text.strip() for p in soup.find_all(["p", "div", "li"]) if p.text.strip()])
            links = [a.get('href') for a in soup.find_all('a') if a.get('href')]
            
            logger.debug(f"Scraped: {title} - {len(headings)} headings, {len(text_content)} chars, {len(links)} links")
            
            return {
                "title": title,
                "headings": headings,
                "text_content": text_content[:30000],
                "links": links[:100],
                "url": snapshot_url
            }
            
        except requests.exceptions.HTTPError as he:
            logger.error(f"HTTP Error: {he}")
            if hasattr(he, 'response') and he.response:
                logger.error(f"Status: {he.response.status_code}, Response: {he.response.text[:200]}...")
        except Exception as e:
            logger.error(f"Error scraping {snapshot_url}: {str(e)}", exc_info=True)
            
        return {"title": "Error", "headings": [], "text_content": "", "links": [], "url": snapshot_url}
from core.base_tool import BaseTool
from core.llm_interface import GeminiLLM
from config import GOOGLE_API_KEY, NOVADA_API_KEY, RAPIDAPI_KEY
import requests
import os
import logging

logger = logging.getLogger(__name__)

class NovadaSearchTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="novada_google_search",
            description="Research tool that search your query in google via NovaDA and return the result as raw JSON."
        )
        if not NOVADA_API_KEY:
            raise ValueError("NOVADA_API_KEY is required but not found in configuration.")
        self.api_key = NOVADA_API_KEY

    def run(self, input: dict, context: dict) -> dict:
        query = input.get("query", "")
        if not query:
            return {"error": "Query is required."}
        
        try:
            params = {
                "engine": "google",
                "q": query,
                "no_cache": False,
                "api_key": self.api_key,
            }
            resp = requests.get("https://scraperapi.novada.com/search", params=params, timeout=30)
            resp.raise_for_status()
            return {"results": resp.json()}
        except Exception as e:
            logger.error(f"NovadaSearchTool error: {e}")
            return {"error": str(e)}

class LinkedInLookupTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="linkedin_lookup",
            description="Fetch basic company metadata from LinkedIn by its email domain."
        )
        if not RAPIDAPI_KEY:
            raise ValueError("RAPIDAPI_KEY is required but not found in configuration.")
        self.api_key = RAPIDAPI_KEY

    def run(self, input: dict, context: dict) -> dict:
        domain = input.get("domain", "")
        if not domain:
            return {"error": "Domain is required."}
        
        try:
            headers = {
                "x-rapidapi-key": self.api_key,
                "x-rapidapi-host": "linkedin-data-api.p.rapidapi.com",
            }
            resp = requests.get(
                "https://linkedin-data-api.p.rapidapi.com/get-company-by-domain",
                headers=headers,
                params={"domain": domain},
                timeout=30,
            )
            resp.raise_for_status()
            return {"results": resp.json()}
        except Exception as e:
            logger.error(f"LinkedInLookupTool error: {e}")
            return {"error": str(e)}

class TwitterLookupTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="twitter_lookup",
            description="Retrieve a single tweet's JSON payload via the RapidAPI twitter241 endpoint."
        )
        if not RAPIDAPI_KEY:
            raise ValueError("RAPIDAPI_KEY is required but not found in configuration.")
        self.api_key = RAPIDAPI_KEY

    def run(self, input: dict, context: dict) -> dict:
        pid = input.get("pid", "")
        if not pid:
            return {"error": "Tweet ID (pid) is required."}
        
        try:
            headers = {
                "x-rapidapi-key": self.api_key,
                "x-rapidapi-host": "twitter241.p.rapidapi.com",
            }
            resp = requests.get(
                "https://twitter241.p.rapidapi.com/tweet",
                headers=headers,
                params={"pid": pid},
                timeout=30
            )
            resp.raise_for_status()
            return {"results": resp.json()}
        except Exception as e:
            logger.error(f"TwitterLookupTool error: {e}")
            return {"error": str(e)}

class FacebookPageTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="facebook_page_videos",
            description="Search facebook to get details about profiles and pages and posts."
        )
        if not RAPIDAPI_KEY:
            raise ValueError("RAPIDAPI_KEY is required but not found in configuration.")
        self.api_key = RAPIDAPI_KEY

    def run(self, input: dict, context: dict) -> dict:
        page_id = input.get("delegate_page_id", "")
        if not page_id:
            return {"error": "Page ID is required."}
        
        try:
            headers = {
                "x-rapidapi-key": self.api_key,
                "x-rapidapi-host": "facebook-scraper3.p.rapidapi.com",
            }
            resp = requests.get(
                "https://facebook-scraper3.p.rapidapi.com/page/videos",
                headers=headers,
                params={"delegate_page_id": page_id},
                timeout=30
            )
            resp.raise_for_status()
            return {"results": resp.json()}
        except Exception as e:
            logger.error(f"FacebookPageTool error: {e}")
            return {"error": str(e)}

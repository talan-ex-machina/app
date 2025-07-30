from core.base_tool import BaseTool
from config import SERPER_API_KEY
import requests

class SerperTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="serper_tool",
            description="Extracts the official website of a company using Serper.dev."
        )
        self.api_key = SERPER_API_KEY
        self.base_url = "https://google.serper.dev/search"

    def run(self, input: dict, context: dict = None) -> dict:
        company_name = input.get("company_name")
        country = input.get("country")
        if not company_name:
            return {"error": "company_name is required"}
        payload = {"q": company_name}
        headers = {"X-API-KEY": self.api_key, "Content-Type": "application/json"}
        try:
            response = requests.post(self.base_url, json=payload, headers=headers, timeout=15)
            print(f"[SerperTool] Response status: {response.status_code}")
            print(f"[SerperTool] Response text: {response.text}")
            response.raise_for_status()
            data = response.json()
            # Try to extract the official website from organic results
            for result in data.get("organic", []):
                link = result.get("link", "")
                if link and company_name.lower().split()[0] in link.lower():
                    return {"website": link}
            if data.get("organic"):
                return {"website": data["organic"][0].get("link", "")}
        except Exception as e:
            print(f"[SerperTool] Exception: {e}")
            return {"error": f"SerperTool error: {e}"}
        return {"error": "No website found"}

from core.base_tool import BaseTool
from core.llm_interface import GeminiLLM
from config import GOOGLE_API_KEY, SCRAPE_DO_API_KEY

class JudgeTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="judge_structured_data",
            description="LLM judge that summarizes what was retrieved and what is missing."
        )
        self.judge = GeminiLLM(api_key=GOOGLE_API_KEY)

    def run(self, input: dict, context: dict) -> dict:
        # Expect structured_data directly in input
        structured_data = input.get("structured_data")
        if not structured_data:
            return {"error": "No structured_data provided to judge."}

        # Compose a prompt for the LLM to summarize and identify missing info
        prompt = (
            "You are a data quality judge.\n"
            "Summarize the information retrieved below.\n"
            "List any important fields or details that are missing, incomplete, or unclear.\n"
            "Be specific and concise.\n"
            "\nData to judge:\n"
            f"{structured_data}"
        )
        feedback = self.judge.generate_response(facts=[], prompt=prompt)

        return {
            "result": "Judged",
            "data": structured_data,
            "judge_feedback": feedback
        }

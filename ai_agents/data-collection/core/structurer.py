from core.llm_interface import GeminiJudge

class DataStructurer:
    def __init__(self, api_key: str):
        self.llm = GeminiJudge(api_key)

    def structure(self, raw_text_list: list[str]) -> dict:
        prompt = (
            "You are a data normalizer. For each raw input, extract and structure the following fields:\n"
            "- name\n- description\n- price\n- link\n- rating\n\n"
            "Return a JSON array of objects with exactly those fields.\n\n"
            "Raw Inputs:\n"
        )
        combined_input = "\n".join(f"- {item}" for item in raw_text_list)
        result = self.llm.judge([], prompt + combined_input)
        return result  # assumed to be a JSON string or object

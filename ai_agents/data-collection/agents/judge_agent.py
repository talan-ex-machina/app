from tools.judge_tool import JudgeTool
from langgraph.graph import StateGraph, END

class JudgeAgent:
    def __init__(self):
        self.judge_tool = JudgeTool()

    def run(self, input: dict, context: dict = None):
        # Judge the structured data
        return self.judge_tool.run(input, context or {})

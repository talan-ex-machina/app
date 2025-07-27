from fastapi import FastAPI
from dotenv import load_dotenv
load_dotenv()
import os
from agents.judge_agent import JudgeAgent
from agents.scraper_agent import ScraperAgent
from agents.meta_agent import MetaAgent
from agents.wayback_agent import WaybackAgent
import uvicorn
from langgraph.graph import StateGraph, END

app = FastAPI()

judge_agent = JudgeAgent()
scraper_agent = ScraperAgent()
meta_agent = MetaAgent()
wayback_agent = WaybackAgent()
# For local testing
workflow = StateGraph(dict)

def wayback_node(state):
    wayback_result = wayback_agent.run(state.get("input", {}))
    return wayback_result

workflow.add_node("wayback", wayback_node)
workflow.set_entry_point("wayback")
workflow.add_edge("wayback", END)
wayback_workflow = workflow.compile()

@app.post("/wayback_report")
def wayback_report(payload: dict):
    result = wayback_workflow.invoke({"input": payload})
    return result

# LangGraph workflow for scraping and judging
workflow = StateGraph(dict)

def scrape_node(state):
    scraped = scraper_agent.run(state.get("input", {}))
    return {"scraped": scraped}

def judge_node(state):
    structured_data = state["scraped"].get("structured_data", {})
    judge_result = judge_agent.run({"structured_data": structured_data})
    return {
        "data_collected": structured_data,
        "judge_feedback": judge_result.get("judge_feedback", judge_result)
    }

workflow.add_node("scrape", scrape_node)
workflow.add_node("judge", judge_node)
workflow.set_entry_point("scrape")
workflow.add_edge("scrape", "judge")
workflow.add_edge("judge", END)
langgraph_workflow = workflow.compile()

@app.post("/search_and_judge")
def search_and_judge(payload: dict):
    result = langgraph_workflow.invoke({"input": payload})
    return result

# LangGraph workflow for meta agent
workflow = StateGraph(dict)

def meta_node(state):
    meta_result = meta_agent.run(state.get("input", {}))
    return meta_result

workflow.add_node("meta", meta_node)
workflow.set_entry_point("meta")
workflow.add_edge("meta", END)
langgraph_workflow = workflow.compile()

@app.post("/industry_search")
def industry_search(payload: dict):
    result = langgraph_workflow.invoke({"input": payload})
    return result

# For local testing
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
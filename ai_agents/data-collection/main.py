from fastapi import FastAPI
from dotenv import load_dotenv
load_dotenv()
import os
from agents.judge_agent import JudgeAgent
from agents.scraper_agent import ScraperAgent
from agents.meta_agent import MetaAgent
from agents.wayback_agent import WaybackAgent
from agents.competitive_intel_agent import CompetitiveIntelAgent
from agents.comprehensive_analysis_agent import ComprehensiveCompanyAnalysisAgent
from agents.industry_master_agent import IndustryComprehensiveAnalysisAgent
import uvicorn
from langgraph.graph import StateGraph, END

app = FastAPI()

judge_agent = JudgeAgent()
scraper_agent = ScraperAgent()
meta_agent = MetaAgent()
wayback_agent = WaybackAgent()
competitive_intel_agent = CompetitiveIntelAgent()
comprehensive_analysis_agent = ComprehensiveCompanyAnalysisAgent()
industry_master_agent = IndustryComprehensiveAnalysisAgent()
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

# LangGraph workflow for competitive intelligence
workflow = StateGraph(dict)

def competitive_intel_node(state):
    intel_result = competitive_intel_agent.run(state.get("input", {}))
    return intel_result

workflow.add_node("competitive_intel", competitive_intel_node)
workflow.set_entry_point("competitive_intel")
workflow.add_edge("competitive_intel", END)
competitive_intel_workflow = workflow.compile()

@app.post("/competitive_intelligence")
def competitive_intelligence(payload: dict):
    result = competitive_intel_workflow.invoke({"input": payload})
    return result

# LangGraph workflow for comprehensive company analysis (competitive intel + wayback)
workflow = StateGraph(dict)

def comprehensive_analysis_node(state):
    analysis_result = comprehensive_analysis_agent.run(state.get("input", {}))
    return analysis_result

workflow.add_node("comprehensive_analysis", comprehensive_analysis_node)
workflow.set_entry_point("comprehensive_analysis")
workflow.add_edge("comprehensive_analysis", END)
comprehensive_analysis_workflow = workflow.compile()

@app.post("/comprehensive_company_analysis")
def comprehensive_company_analysis(payload: dict):
    result = comprehensive_analysis_workflow.invoke({"input": payload})
    return result

# LangGraph workflow for unified industry comprehensive analysis
workflow = StateGraph(dict)

def industry_master_node(state):
    master_result = industry_master_agent.run(state.get("input", {}))
    return master_result

workflow.add_node("industry_master", industry_master_node)
workflow.set_entry_point("industry_master")
workflow.add_edge("industry_master", END)
industry_master_workflow = workflow.compile()

@app.post("/industry_comprehensive_analysis")
def industry_comprehensive_analysis(payload: dict):
    """
    Unified endpoint for complete industry analysis:
    1. Finds top products in industry using Tavily + LLM
    2. Runs G2 analysis on top 4 products
    3. Selects top 3 companies based on G2 scores
    4. Performs comprehensive analysis (competitive intel + wayback) on selected companies
    5. Creates industry intelligence report
    
    Payload example:
    {
        "industry": "Cloud Computing",
        "country": "United States", // optional
        "target_products": 4, // optional, default 4
        "target_companies": 3, // optional, default 3
        "start_year": 2020, // optional for wayback analysis
        "end_year": 2025, // optional for wayback analysis
        "max_pages": 3 // optional for wayback crawling
    }
    """
    result = industry_master_workflow.invoke({"input": payload})
    return result
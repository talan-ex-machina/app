# api_server.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import json
import asyncio
from business_planning_orchestrator import BusinessPlanningOrchestrator

app = FastAPI(title="Business Planning API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global orchestrator instance
orchestrator = BusinessPlanningOrchestrator()

# Request/Response Models
class InitialPromptRequest(BaseModel):
    prompt: str

class CompanySelectionRequest(BaseModel):
    company: str
    session_id: Optional[str] = None

class FollowUpRequest(BaseModel):
    answer: str
    session_id: Optional[str] = None

class AnalysisRequest(BaseModel):
    session_id: Optional[str] = None

class ApiResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    error: Optional[str] = None

# Session management (in production, use Redis or database)
sessions = {}

def get_or_create_session(session_id: Optional[str] = None) -> str:
    """Get existing session or create new one"""
    if session_id and session_id in sessions:
        return session_id
    
    # Create new session
    import uuid
    new_session_id = str(uuid.uuid4())
    sessions[new_session_id] = BusinessPlanningOrchestrator()
    return new_session_id

@app.get("/")
async def root():
    return {"message": "Business Planning API is running"}

@app.post("/api/business-planning/start", response_model=ApiResponse)
async def start_business_planning(request: InitialPromptRequest):
    """Start the business planning process with initial prompt"""
    try:
        session_id = get_or_create_session()
        session_orchestrator = sessions[session_id]


        result = await session_orchestrator.process_user_input(request.prompt, "initial")
        result["session_id"] = session_id
        
        return ApiResponse(success=True, data=result)
    
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

@app.post("/api/business-planning/select-company", response_model=ApiResponse)
async def select_company(request: CompanySelectionRequest):
    """Select idol company for benchmarking"""
    try:
        session_id = get_or_create_session(request.session_id)
        
        if session_id not in sessions:
            return ApiResponse(success=False, error="Invalid session ID")
        
        session_orchestrator = sessions[session_id]
        result = await session_orchestrator.process_user_input(request.company, "company_selection")
        result["session_id"] = session_id
        
        return ApiResponse(success=True, data=result)
    
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

@app.post("/api/business-planning/follow-up", response_model=ApiResponse)
async def answer_follow_up(request: FollowUpRequest):
    """Answer follow-up questions"""
    try:
        if not request.session_id or request.session_id not in sessions:
            return ApiResponse(success=False, error="Invalid session ID")

        session_orchestrator = sessions[request.session_id]
        result = await session_orchestrator.process_user_input(request.answer, "information_gathering")
        result["session_id"] = request.session_id
        
        return ApiResponse(success=True, data=result)
    
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

@app.post("/api/business-planning/analyze", response_model=ApiResponse)
async def run_analysis(request: AnalysisRequest):
    """Run the complete business analysis"""
    try:
        if not request.session_id or request.session_id not in sessions:
            return ApiResponse(success=False, error="Invalid session ID")
        
        session_orchestrator = sessions[request.session_id]
        result = await session_orchestrator.process_user_input("", "analysis")
        result["session_id"] = request.session_id
        
        return ApiResponse(success=True, data=result)
    
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

@app.get("/api/business-planning/results/{session_id}", response_model=ApiResponse)
async def get_results(session_id: str):
    """Get analysis results for a session"""
    try:
        if session_id not in sessions:
            return ApiResponse(success=False, error="Invalid session ID")
        
        session_orchestrator = sessions[session_id]
        results = session_orchestrator.conversation_state.get("analysis_results", {})
        
        return ApiResponse(success=True, data={
            "results": results,
            "conversation_state": session_orchestrator.conversation_state
        })
    
    except Exception as e:
        return ApiResponse(success=False, error=str(e))


@app.delete("/api/business-planning/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    try:
        if session_id in sessions:
            del sessions[session_id]
            return ApiResponse(success=True, message="Session deleted")
        else:
            return ApiResponse(success=False, error="Session not found")
    
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

@app.get("/api/business-planning/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "active_sessions": len(sessions),
        "version": "1.0.0"
    }


@app.get("/api/business-planning/market-research/{session_id}")
async def get_market_research(session_id: str):
    """Get market research results"""
    try:
        if session_id not in sessions:
            return ApiResponse(success=False, error="Invalid session ID")
        
        session_orchestrator = sessions[session_id]
        market_research = session_orchestrator.conversation_state.get("analysis_results", {}).get("market_research", {})
        
        return ApiResponse(success=True, data=market_research)
    
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

@app.get("/api/business-planning/product-innovation/{session_id}")
async def get_product_innovation(session_id: str):
    """Get product innovation results"""
    try:
        if session_id not in sessions:
            return ApiResponse(success=False, error="Invalid session ID")
        
        session_orchestrator = sessions[session_id]
        product_innovation = session_orchestrator.conversation_state.get("analysis_results", {}).get("product_innovation", {})
        
        return ApiResponse(success=True, data=product_innovation)
    
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

@app.get("/api/business-planning/target-audience/{session_id}")
async def get_target_audience(session_id: str):
    """Get target audience results"""
    try:
        if session_id not in sessions:
            return ApiResponse(success=False, error="Invalid session ID")
        
        session_orchestrator = sessions[session_id]
        target_audience = session_orchestrator.conversation_state.get("analysis_results", {}).get("target_audience", {})
        
        return ApiResponse(success=True, data=target_audience)
    
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

@app.get("/api/business-planning/strategic-plan/{session_id}")
async def get_strategic_plan(session_id: str):
    """Get strategic plan results"""
    try:
        if session_id not in sessions:
            return ApiResponse(success=False, error="Invalid session ID")
        
        session_orchestrator = sessions[session_id]
        strategic_plan = session_orchestrator.conversation_state.get("analysis_results", {}).get("strategic_plan", {})
        
        return ApiResponse(success=True, data=strategic_plan)
    
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

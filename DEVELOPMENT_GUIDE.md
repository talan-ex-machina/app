# Business Planning System - Development Guide

## 🎯 System Overview

The Business Planning System is a comprehensive AI-powered platform that helps entrepreneurs create detailed business plans through intelligent analysis across four key domains:

1. **Market Research** - Competitive analysis and opportunity identification
2. **Product Innovation** - Future trends and unique value propositions
3. **Target Audience** - Customer segmentation and market entry strategies
4. **Strategic Planning** - Goal setting and implementation roadmaps

## 🗂️ Project Structure

```
talan_app/
├── 📁 ai_agents/business_planning/     # Python AI backend
│   ├── 🤖 market_research_agent.py
│   ├── 🤖 product_innovation_agent.py
│   ├── 🤖 target_audience_agent.py
│   ├── 🤖 enhanced_goal_setting_agent.py
│   ├── 🎯 business_planning_orchestrator.py
│   ├── 🌐 api_server.py
│   ├── 🧪 test_api.py
│   └── 📋 requirements.txt
├── 📁 dashboard/                       # Next.js frontend
│   ├── 📁 app/
│   │   ├── 📁 components/
│   │   │   ├── 🎨 BusinessPlanningHub.tsx
│   │   │   └── 🎨 Dashboard.tsx
│   │   └── 📁 api/business-planning/   # Next.js API routes
│   └── 📦 package.json
├── 🚀 setup.sh                        # Initial setup script
├── 🚀 start_system.sh                 # Start both servers
└── 📖 BUSINESS_PLANNING_README.md      # Complete documentation
```

## 🛠️ Development Workflow

### 1. Initial Setup
```bash
# Clone and setup the project
cd talan_app
./setup.sh

# Configure your Gemini API key
# Edit ai_agents/business_planning/.env
```

### 2. Development Mode
```bash
# Start both servers in development mode
./start_system.sh

# Or start individually:
# Terminal 1: Python API
cd ai_agents/business_planning
source venv/bin/activate
python api_server.py

# Terminal 2: Next.js frontend
cd dashboard
npm run dev
```

### 3. Testing
```bash
# Test the Python API
cd ai_agents/business_planning
source venv/bin/activate
python test_api.py

# Test individual agents only
python test_api.py --agents-only

# Test complete workflow only
python test_api.py --workflow-only
```

## 🧠 AI Agents Architecture

### Data Flow
```
User Input → Orchestrator → Agents → AI Models (Gemini) → Structured Output
```

### Agent Responsibilities

#### 1. Market Research Agent
- **Input**: Business type, benchmark company, context
- **Process**: Market analysis using Gemini AI
- **Output**: Market overview, gaps, competitive analysis
- **Key Function**: `analyze_market(business_type, idol_company, context)`

#### 2. Product Innovation Agent  
- **Input**: Market gaps, business context
- **Process**: Trend analysis and innovation identification
- **Output**: Product recommendations, future trends
- **Key Function**: `generate_innovations(business_type, idol_company, market_gaps)`

#### 3. Target Audience Agent
- **Input**: Products/services, geographic preferences
- **Process**: Customer segmentation and persona creation
- **Output**: Market segments, personas, geographic analysis
- **Key Function**: `analyze_target_audience(business_type, products, geography)`

#### 4. Enhanced Goal Setting Agent
- **Input**: All previous analysis results
- **Process**: Strategic planning and timeline creation
- **Output**: Goals, milestones, monthly breakdown
- **Key Function**: `generate_strategic_plan(business_type, analyses, months)`

### Orchestrator Pattern
The `BusinessPlanningOrchestrator` manages the complete workflow:
1. **Session Management** - Tracks conversation state
2. **Sequential Processing** - Coordinates agent execution
3. **Data Integration** - Combines outputs from all agents
4. **Error Handling** - Manages failures gracefully

## 🎨 Frontend Components

### BusinessPlanningHub Component

#### State Management
```typescript
interface SessionState {
  sessionId: string | null;
  currentStep: 'initial' | 'company_selection' | 'follow_up' | 'analysis' | 'results';
  businessType: string;
  selectedCompany: string;
  isLoading: boolean;
  companies: Company[];
  followUpQuestions: string[];
  analysisResults: AnalysisResults | null;
}
```

#### User Flow States
1. **Initial** - User enters business description
2. **Company Selection** - Choose benchmark company
3. **Follow-up** - Answer additional questions
4. **Analysis** - AI processing (loading state)
5. **Results** - Tabbed display of analysis

#### Result Tabs
- **Market Research Tab** - Market overview, gaps, opportunities
- **Product Innovation Tab** - Products/services, future trends
- **Target Audience Tab** - Segments, personas, geography
- **Strategic Plan Tab** - Goals, milestones, timeline

## 🔌 API Integration

### Next.js Proxy Pattern
The dashboard uses Next.js API routes to proxy requests to the Python backend:

```
Frontend → Next.js API Routes → Python FastAPI → AI Agents
```

### Key Endpoints
- `POST /api/business-planning/start` - Initial business analysis
- `POST /api/business-planning/select-company` - Company selection
- `POST /api/business-planning/follow-up` - Answer questions
- `POST /api/business-planning/analyze` - Run AI analysis

### Session Management
- Sessions stored in memory (production: Redis/Database)
- Session ID tracks conversation state
- Timeout handling for long-running analyses

## 📝 Adding New Features

### 1. New AI Agent
```python
# Create new agent file
class NewAgent:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.0-flash")
        self.system_prompt = "Your specialized prompt..."
    
    def analyze(self, input_data):
        # Your analysis logic
        pass

# Add to orchestrator
from new_agent import NewAgent

class BusinessPlanningOrchestrator:
    def __init__(self):
        self.new_agent = NewAgent()
    
    async def run_complete_analysis(self):
        # Add new agent to pipeline
        new_result = self.new_agent.analyze(context)
```

### 2. New UI Tab
```typescript
// Add to tabs array
const tabs = [
  // existing tabs...
  { id: 'new-analysis', label: 'New Analysis', icon: NewIcon }
];

// Add render function
const renderNewAnalysis = () => {
  const data = session.analysisResults?.new_analysis;
  // Your UI implementation
};

// Add to tab content
{activeTab === 4 && renderNewAnalysis()}
```

### 3. New API Endpoint
```python
# Add to api_server.py
@app.get("/api/business-planning/new-endpoint/{session_id}")
async def new_endpoint(session_id: str):
    # Your endpoint logic
    pass
```

```typescript
// Add Next.js proxy route
// app/api/business-planning/new-endpoint/route.ts
export async function GET(request: NextRequest) {
  // Proxy to Python API
}
```

## 🔧 Configuration

### Environment Variables

#### Python Backend (.env)
```env
GEMINI_API_KEY=your_gemini_api_key
# Optional overrides
GEMINI_MODEL=gemini-2.0-flash
MAX_RETRIES=3
TIMEOUT_SECONDS=60
```

#### Next.js Frontend (.env.local)
```env
PYTHON_API_BASE=http://localhost:8000/api/business-planning
NEXT_PUBLIC_APP_NAME=Business Planning System
```

### Model Configuration
```python
# Adjust in each agent
model = genai.GenerativeModel(
    "gemini-2.0-flash",
    generation_config={
        "temperature": 0.7,
        "top_p": 0.8,
        "max_output_tokens": 4096,
    }
)
```

## 🐛 Debugging

### Python API Debugging
```bash
# Enable debug mode
cd ai_agents/business_planning
source venv/bin/activate
export DEBUG=True
python api_server.py

# Check logs
tail -f api.log
```

### Frontend Debugging
```bash
# Next.js debug mode
cd dashboard
npm run dev -- --debug

# Check browser console for API errors
# Use Next.js built-in debugging tools
```

### Common Issues
1. **Gemini API Errors** - Check API key and quota
2. **CORS Issues** - Verify CORS settings in FastAPI
3. **Session Timeout** - Check session management
4. **Type Errors** - Verify TypeScript interfaces

## 🚀 Deployment

### Python API (Production)
```bash
# Use production ASGI server
pip install gunicorn uvicorn
gunicorn api_server:app -w 4 -k uvicorn.workers.UnicornWorker
```

### Next.js Dashboard (Production)
```bash
# Build and deploy
npm run build
npm start

# Or deploy to Vercel
vercel deploy
```

### Docker Deployment
```dockerfile
# Dockerfile for Python API
FROM python:3.9-slim
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📊 Performance Optimization

### AI Response Caching
```python
# Add response caching
import redis
cache = redis.Redis()

def cached_analysis(key, analysis_func):
    cached = cache.get(key)
    if cached:
        return json.loads(cached)
    
    result = analysis_func()
    cache.setex(key, 3600, json.dumps(result))  # 1 hour cache
    return result
```

### Streaming Responses
```python
# Stream long analyses
@app.post("/api/business-planning/analyze-stream")
async def analyze_stream(request: AnalysisRequest):
    async def generate():
        yield "data: Starting market research...\n\n"
        market_result = await run_market_analysis()
        yield f"data: {json.dumps(market_result)}\n\n"
        # Continue for other agents...
    
    return StreamingResponse(generate(), media_type="text/plain")
```

## 🧪 Testing Strategy

### Unit Tests
```python
# test_agents.py
import pytest
from market_research_agent import MarketResearchAgent

def test_market_research_agent():
    agent = MarketResearchAgent()
    result = agent.analyze_market("IT consulting", "Accenture", "test")
    assert "market_overview" in result
    assert "market_gaps" in result
```

### Integration Tests
```python
# test_integration.py
async def test_complete_workflow():
    orchestrator = BusinessPlanningOrchestrator()
    result = await orchestrator.run_complete_analysis()
    assert result["type"] == "complete_analysis"
```

### Frontend Tests
```typescript
// __tests__/BusinessPlanningHub.test.tsx
import { render, screen } from '@testing-library/react';
import BusinessPlanningHub from '../components/BusinessPlanningHub';

test('renders business planning interface', () => {
  render(<BusinessPlanningHub darkMode={false} />);
  expect(screen.getByText('Business Planning Assistant')).toBeInTheDocument();
});
```

---

This development guide provides comprehensive information for working with the Business Planning System. For questions or contributions, please refer to the main README and create GitHub issues for support.

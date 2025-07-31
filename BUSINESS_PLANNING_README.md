# Business Planning AI System

A comprehensive business planning system that combines AI-powered analysis with an intuitive dashboard interface. This system helps entrepreneurs and business owners create detailed business plans through intelligent market research, product innovation, target audience analysis, and strategic planning.

## 🌟 Features

### 1. **Intelligent Business Analysis Pipeline**
- **Market Research**: Competitive analysis, market gaps identification, and success patterns
- **Product Innovation**: Future trends analysis and unique value proposition development  
- **Target Audience**: Customer segmentation, personas, and geographic analysis
- **Strategic Planning**: Goal setting, timeline planning, and milestone tracking

### 2. **Interactive Dashboard Interface**
- Modern, responsive Next.js 14 dashboard
- Dark/light mode support
- Real-time AI conversation flow
- Tabbed results presentation
- Beautiful animations with Framer Motion

### 3. **AI-Powered Agents**
- **Market Research Agent**: Analyzes market opportunities and competitive landscape
- **Product Innovation Agent**: Identifies innovation opportunities and future trends
- **Target Audience Agent**: Creates detailed customer profiles and market segmentation
- **Goal Setting Agent**: Develops strategic plans with timelines and milestones

## 🏗️ Architecture

```
talan_app/
├── ai_agents/
│   └── business_planning/
│       ├── market_research_agent.py      # Market analysis AI
│       ├── product_innovation_agent.py   # Innovation opportunities AI
│       ├── target_audience_agent.py      # Customer analysis AI
│       ├── enhanced_goal_setting_agent.py # Strategic planning AI
│       ├── business_planning_orchestrator.py # Main workflow coordinator
│       ├── api_server.py                 # FastAPI backend
│       └── requirements.txt              # Python dependencies
└── dashboard/
    ├── app/
    │   ├── components/
    │   │   ├── BusinessPlanningHub.tsx   # Main business planning interface
    │   │   └── Dashboard.tsx             # Main dashboard component
    │   └── api/
    │       └── business-planning/        # Next.js API routes
    └── package.json                      # Node.js dependencies
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** with pip
- **Node.js 18+** with npm
- **Gemini API Key** from Google AI Studio

### 1. Clone and Setup
```bash
git clone <your-repo>
cd talan_app
chmod +x setup.sh
./setup.sh
```

### 2. Configure API Key
Edit `ai_agents/business_planning/.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Start the System

**Terminal 1 - Python API Server:**
```bash
cd ai_agents/business_planning
source venv/bin/activate
python api_server.py
```

**Terminal 2 - Next.js Dashboard:**
```bash
cd dashboard
npm run dev
```

### 4. Access the System
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How to Use

### Step 1: Initial Prompt
Enter your business idea or goal, for example:
- "I want to start an IT consulting business"
- "Help me improve my e-commerce startup"
- "I'm planning a healthcare technology company"

### Step 2: Choose Benchmark Company
The system suggests top 3 companies in your sector. Select one as your benchmark for analysis.

### Step 3: Follow-up Questions
Answer additional questions about:
- Geographic target markets
- Budget and timeline
- Specific industry focus
- Target customer segments

### Step 4: AI Analysis
The system runs comprehensive analysis across 4 domains:
1. **Market Research** - Competition, gaps, opportunities
2. **Product Innovation** - Future trends, unique value propositions
3. **Target Audience** - Customer segments, personas, geography
4. **Strategic Planning** - Goals, timelines, milestones

### Step 5: Review Results
Navigate through the 4 tabs to review:
- Market opportunities and competitive landscape
- Recommended products/services and innovation opportunities
- Target customer profiles and market entry strategies
- Strategic goals with detailed implementation roadmap

## 🧠 AI Agents Deep Dive

### Market Research Agent
- **Input**: Business type, benchmark company, additional context
- **Output**: Market overview, competitive analysis, market gaps, success patterns
- **Key Features**: Market sizing, growth analysis, opportunity identification

### Product Innovation Agent  
- **Input**: Market gaps, business context, competitive landscape
- **Output**: Future trends, innovation opportunities, product recommendations
- **Key Features**: Trend forecasting, differentiation strategies, implementation roadmaps

### Target Audience Agent
- **Input**: Products/services, geographic preferences, business context
- **Output**: Market segments, customer personas, geographic analysis
- **Key Features**: Demographic profiling, geographic prioritization, acquisition strategies

### Enhanced Goal Setting Agent
- **Input**: All previous analysis results, timeline preferences
- **Output**: Strategic goals, monthly breakdown, success metrics, contingency plans
- **Key Features**: SMART goals, milestone tracking, risk assessment

## 🔧 API Reference

### Python Backend Endpoints

#### Start Business Planning
```http
POST /api/business-planning/start
Content-Type: application/json

{
  "prompt": "I want to start an IT consulting business"
}
```

#### Select Company
```http
POST /api/business-planning/select-company
Content-Type: application/json

{
  "company": "Accenture",
  "session_id": "uuid-session-id"
}
```

#### Follow-up Questions
```http
POST /api/business-planning/follow-up
Content-Type: application/json

{
  "answer": "I want to focus on North America with $100k budget",
  "session_id": "uuid-session-id"
}
```

#### Run Analysis
```http
POST /api/business-planning/analyze
Content-Type: application/json

{
  "session_id": "uuid-session-id"
}
```

### Next.js API Routes
The dashboard includes proxy routes that forward requests to the Python backend:
- `/api/business-planning/start`
- `/api/business-planning/select-company`
- `/api/business-planning/follow-up`
- `/api/business-planning/analyze`

## 🎨 UI Components

### BusinessPlanningHub
Main interface component featuring:
- **Initial Input**: Textarea for business description
- **Company Selection**: Cards for benchmark company selection  
- **Follow-up Flow**: Progressive question answering
- **Results Tabs**: Organized display of analysis results
- **Loading States**: Smooth transitions and loading indicators

### Dashboard
Updated dashboard that:
- Features the BusinessPlanningHub as the main component
- Includes basic metrics grid
- Comments out 3D and database components for focus
- Supports dark/light mode theming

## 🔒 Environment Variables

### Python Backend (.env in ai_agents/business_planning/)
```env
GEMINI_API_KEY=your_gemini_api_key
```

### Next.js Frontend (optional .env.local in dashboard/)
```env
PYTHON_API_BASE=http://localhost:8000/api/business-planning
```

## 📊 Sample Output

The system generates comprehensive business plans including:

### Market Research
- Market size and growth projections
- Competitive landscape analysis
- Identified market gaps and opportunities
- Success patterns from industry leaders

### Product Innovation
- Future trend analysis (AI, automation, sustainability)
- Recommended products/services with unique value propositions
- Implementation roadmaps with risk assessments
- Technology adoption strategies

### Target Audience
- Detailed customer segments with demographics
- Customer personas with pain points and motivations
- Geographic market prioritization
- Customer acquisition channel recommendations

### Strategic Planning
- 6-12 month strategic goals with priorities
- Monthly breakdown of activities and deliverables
- Key milestones and success metrics
- Resource requirements and budget allocations
- Risk factors and mitigation strategies

## 🚀 Deployment

### Python API Deployment
- Deploy FastAPI server using platforms like Railway, Render, or AWS
- Set environment variables for GEMINI_API_KEY
- Update CORS settings for production domains

### Next.js Dashboard Deployment
- Deploy to Vercel, Netlify, or your preferred platform
- Set PYTHON_API_BASE environment variable to your deployed API URL
- Configure build settings for Next.js 14

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

**Python API not starting:**
- Check Python version (3.8+ required)
- Verify GEMINI_API_KEY in .env file
- Ensure all dependencies installed: `pip install -r requirements.txt`

**Dashboard not connecting to API:**
- Verify Python API is running on port 8000
- Check CORS settings in api_server.py
- Ensure Next.js is running on port 3000

**Analysis taking too long:**
- Check internet connection for Gemini API calls
- Verify API key is valid and has sufficient quota
- Monitor Python API logs for error messages

### Getting Help
- Check the GitHub Issues for common problems
- Review the API logs for detailed error messages
- Ensure all environment variables are properly set

---

Built with ❤️ using Next.js, FastAPI, and Google Gemini AI

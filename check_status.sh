#!/bin/bash

# Business Planning System - Status Check Script
# This script verifies that all components are working correctly

echo "🔍 Business Planning System - Status Check"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "setup.sh" ]; then
    echo "❌ Error: Please run this script from the talan_app directory"
    exit 1
fi

echo ""
echo "📁 Checking Project Structure..."

# Check main directories
if [ -d "ai_agents/business_planning" ]; then
    echo "✅ AI Agents directory exists"
else
    echo "❌ AI Agents directory missing"
fi

if [ -d "dashboard" ]; then
    echo "✅ Dashboard directory exists"
else
    echo "❌ Dashboard directory missing"
fi

echo ""
echo "🤖 Checking AI Agents..."

# Check Python files
agents=(
    "ai_agents/business_planning/market_research_agent.py"
    "ai_agents/business_planning/product_innovation_agent.py"
    "ai_agents/business_planning/target_audience_agent.py"
    "ai_agents/business_planning/enhanced_goal_setting_agent.py"
    "ai_agents/business_planning/business_planning_orchestrator.py"
    "ai_agents/business_planning/api_server.py"
)

for agent in "${agents[@]}"; do
    if [ -f "$agent" ]; then
        echo "✅ $(basename "$agent") exists"
    else
        echo "❌ $(basename "$agent") missing"
    fi
done

echo ""
echo "🎨 Checking Dashboard Components..."

# Check React components
components=(
    "dashboard/app/components/BusinessPlanningHub.tsx"
    "dashboard/app/components/Dashboard.tsx"
    "dashboard/package.json"
)

for component in "${components[@]}"; do
    if [ -f "$component" ]; then
        echo "✅ $(basename "$component") exists"
    else
        echo "❌ $(basename "$component") missing"
    fi
done

echo ""
echo "🔌 Checking API Routes..."

# Check Next.js API routes
routes=(
    "dashboard/app/api/business-planning/start/route.ts"
    "dashboard/app/api/business-planning/select-company/route.ts"
    "dashboard/app/api/business-planning/follow-up/route.ts"
    "dashboard/app/api/business-planning/analyze/route.ts"
)

for route in "${routes[@]}"; do
    if [ -f "$route" ]; then
        echo "✅ $(basename "$(dirname "$route")")/$(basename "$route") exists"
    else
        echo "❌ $(basename "$(dirname "$route")")/$(basename "$route") missing"
    fi
done

echo ""
echo "📋 Checking Configuration Files..."

# Check config files
configs=(
    "ai_agents/business_planning/requirements.txt"
    "ai_agents/business_planning/.env.template"
    "setup.sh"
    "start_system.sh"
)

for config in "${configs[@]}"; do
    if [ -f "$config" ]; then
        echo "✅ $(basename "$config") exists"
    else
        echo "❌ $(basename "$config") missing"
    fi
done

echo ""
echo "🐍 Checking Python Environment..."

# Check if virtual environment exists
if [ -d "ai_agents/business_planning/venv" ]; then
    echo "✅ Python virtual environment exists"
    
    # Check if requirements are installed
    if [ -f "ai_agents/business_planning/venv/bin/activate" ]; then
        source ai_agents/business_planning/venv/bin/activate
        
        # Check critical packages
        python -c "import fastapi" 2>/dev/null && echo "✅ FastAPI installed" || echo "❌ FastAPI not installed"
        python -c "import google.generativeai" 2>/dev/null && echo "✅ Google Generative AI installed" || echo "❌ Google Generative AI not installed"
        python -c "import uvicorn" 2>/dev/null && echo "✅ Uvicorn installed" || echo "❌ Uvicorn not installed"
        
        deactivate
    fi
else
    echo "❌ Python virtual environment not found"
    echo "   Run ./setup.sh to create it"
fi

echo ""
echo "📦 Checking Node.js Dependencies..."

if [ -d "dashboard/node_modules" ]; then
    echo "✅ Node.js dependencies installed"
else
    echo "❌ Node.js dependencies not installed"
    echo "   Run: cd dashboard && npm install"
fi

echo ""
echo "🔑 Checking Environment Configuration..."

if [ -f "ai_agents/business_planning/.env" ]; then
    echo "✅ Environment file exists"
    
    # Check if API key is set (without showing the key)
    if grep -q "GEMINI_API_KEY=.*[^=]" ai_agents/business_planning/.env; then
        echo "✅ Gemini API key configured"
    else
        echo "⚠️  Gemini API key not set"
        echo "   Edit ai_agents/business_planning/.env and add your API key"
    fi
else
    echo "❌ Environment file not found"
    echo "   Copy .env.template to .env and configure your API key"
fi

echo ""
echo "🚀 Quick Test (if environment is ready)..."

if [ -f "ai_agents/business_planning/.env" ] && [ -d "ai_agents/business_planning/venv" ]; then
    echo "Running quick API test..."
    
    cd ai_agents/business_planning
    source venv/bin/activate
    
    # Quick import test
    python -c "
try:
    from market_research_agent import MarketResearchAgent
    from business_planning_orchestrator import BusinessPlanningOrchestrator
    print('✅ Python imports working')
except Exception as e:
    print(f'❌ Import error: {e}')
" 2>/dev/null

    deactivate
    cd ../..
else
    echo "⚠️  Environment not ready for testing"
fi

echo ""
echo "📊 System Status Summary"
echo "=================================================="

# Count files
total_files=0
existing_files=0

all_files=(
    "${agents[@]}"
    "${components[@]}"
    "${routes[@]}"
    "${configs[@]}"
)

for file in "${all_files[@]}"; do
    total_files=$((total_files + 1))
    if [ -f "$file" ]; then
        existing_files=$((existing_files + 1))
    fi
done

echo "📁 Files: $existing_files/$total_files present"

if [ -d "ai_agents/business_planning/venv" ]; then
    echo "🐍 Python Environment: Ready"
else
    echo "🐍 Python Environment: Not Ready"
fi

if [ -d "dashboard/node_modules" ]; then
    echo "📦 Node.js Dependencies: Installed"
else
    echo "📦 Node.js Dependencies: Not Installed"
fi

if [ -f "ai_agents/business_planning/.env" ]; then
    echo "🔑 Configuration: Present"
else
    echo "🔑 Configuration: Missing"
fi

echo ""
echo "🎯 Next Steps:"

if [ ! -d "ai_agents/business_planning/venv" ]; then
    echo "1. Run ./setup.sh to install Python dependencies"
fi

if [ ! -d "dashboard/node_modules" ]; then
    echo "2. Run: cd dashboard && npm install"
fi

if [ ! -f "ai_agents/business_planning/.env" ]; then
    echo "3. Configure environment: cp ai_agents/business_planning/.env.template ai_agents/business_planning/.env"
    echo "4. Edit ai_agents/business_planning/.env and add your Gemini API key"
fi

echo "5. Start the system: ./start_system.sh"
echo "6. Open http://localhost:3000 in your browser"

echo ""
echo "📖 Documentation:"
echo "   • BUSINESS_PLANNING_README.md - Complete user guide"
echo "   • DEVELOPMENT_GUIDE.md - Developer documentation"

echo ""
echo "Status check completed! 🎉"

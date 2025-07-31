#!/bin/bash

# start_system.sh - Start the complete Business Planning System

echo "🚀 Starting Business Planning System..."

# Check if we're in the right directory
if [ ! -f "setup.sh" ]; then
    echo "❌ Please run this script from the talan_app directory"
    exit 1
fi

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down system..."
    kill $PYTHON_PID 2>/dev/null
    kill $NEXTJS_PID 2>/dev/null
    echo "✅ System stopped"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT

# Check if Python API dependencies are installed
if [ ! -d "ai_agents/business_planning/venv" ]; then
    echo "❌ Python virtual environment not found. Please run ./setup.sh first"
    exit 1
fi

# Check if .env file exists
if [ ! -f "ai_agents/business_planning/.env" ]; then
    echo "❌ .env file not found. Please run ./setup.sh and configure your GEMINI_API_KEY"
    exit 1
fi

# Check if GEMINI_API_KEY is set
if ! grep -q "GEMINI_API_KEY=.*[^_here]" ai_agents/business_planning/.env; then
    echo "❌ GEMINI_API_KEY not configured. Please edit ai_agents/business_planning/.env"
    exit 1
fi

# Start Python API server
echo "🐍 Starting Python API server..."
cd ai_agents/business_planning
source venv/bin/activate
python api_server.py &
PYTHON_PID=$!
cd ../../

# Wait a moment for Python server to start
sleep 3

# Check if Python server started successfully
if ! kill -0 $PYTHON_PID 2>/dev/null; then
    echo "❌ Failed to start Python API server"
    exit 1
fi

echo "✅ Python API server started (PID: $PYTHON_PID)"

# Start Next.js development server
echo "⚛️  Starting Next.js development server..."
cd dashboard
npm run dev &
NEXTJS_PID=$!
cd ..

# Wait a moment for Next.js server to start
sleep 5

# Check if Next.js server started successfully
if ! kill -0 $NEXTJS_PID 2>/dev/null; then
    echo "❌ Failed to start Next.js development server"
    kill $PYTHON_PID 2>/dev/null
    exit 1
fi

echo "✅ Next.js development server started (PID: $NEXTJS_PID)"
echo ""
echo "🎉 Business Planning System is now running!"
echo ""
echo "📡 Services:"
echo "  - Python API: http://localhost:8000"
echo "  - Next.js Dashboard: http://localhost:3000"
echo "  - API Documentation: http://localhost:8000/docs"
echo ""
echo "🌐 Open http://localhost:3000 in your browser to start business planning"
echo ""
echo "Press Ctrl+C to stop the system"

# Wait for user to stop the system
wait

#!/bin/bash

# Business Planning System Setup Script

echo "🚀 Setting up the Business Planning System..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the dashboard directory"
    exit 1
fi

# Install Python dependencies for AI agents
echo "📦 Installing Python dependencies..."
cd ../ai_agents/business_planning
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found in ai_agents/business_planning"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
echo "📥 Installing Python packages..."
source venv/bin/activate
pip install -r requirements.txt

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file template..."
    cat > .env << 'EOF'
# Add your Gemini API key here
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Set custom Python API base URL
PYTHON_API_BASE=http://localhost:8000/api/business-planning
EOF
    echo "📝 Please edit .env file and add your GEMINI_API_KEY"
else
    echo "✅ .env file already exists"
fi

# Go back to dashboard directory
cd ../../dashboard

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the system:"
echo "1. Start the Python API server:"
echo "   cd ../ai_agents/business_planning"
echo "   source venv/bin/activate"
echo "   python api_server.py"
echo ""
echo "2. In another terminal, start the Next.js dashboard:"
echo "   cd dashboard"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "📋 Don't forget to:"
echo "- Add your GEMINI_API_KEY to ai_agents/business_planning/.env"
echo "- Ensure Python 3.8+ is installed"
echo "- Ensure Node.js 18+ is installed"

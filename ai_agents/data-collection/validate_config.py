#!/usr/bin/env python3
"""
Configuration validation script to check if all required API keys are loaded properly.
"""

import os
from dotenv import load_dotenv

def validate_configuration():
    """Validate that all required API keys are available."""
    
    print("🔧 Configuration Validation")
    print("=" * 40)
    
    # Load environment variables
    load_dotenv()
    print("✅ Environment variables loaded from .env file")
    
    # Required API keys
    required_keys = {
        "GOOGLE_API_KEY": "Google Gemini LLM",
        "TAVILY_API_KEY": "Tavily Search API",
        "SCRAPE_DO_API_KEY": "Scrape.do Web Scraping",
        "SERPER_API_KEY": "Serper Google Search",
        "NOVADA_API_KEY": "NovaDA Search API",
        "RAPIDAPI_KEY": "RapidAPI (LinkedIn, Twitter, Facebook)"
    }
    
    print("\n📋 API Key Status:")
    print("-" * 40)
    
    all_valid = True
    
    for key_name, description in required_keys.items():
        value = os.getenv(key_name, "")
        if value:
            # Show first 8 and last 4 characters for security
            masked_value = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else f"{value[:4]}..."
            print(f"✅ {key_name:<20} | {description:<30} | {masked_value}")
        else:
            print(f"❌ {key_name:<20} | {description:<30} | NOT SET")
            all_valid = False
    
    print("-" * 40)
    
    if all_valid:
        print("✅ All required API keys are configured!")
        return True
    else:
        print("❌ Some required API keys are missing.")
        print("\nPlease check your .env file and ensure all keys are set.")
        return False

def test_imports():
    """Test that all modules can be imported without errors."""
    
    print("\n🧪 Import Testing")
    print("=" * 40)
    
    try:
        print("Testing core modules...")
        from core.base_tool import BaseTool
        from core.llm_interface import GeminiLLM
        print("✅ Core modules imported successfully")
        
        print("Testing tool modules...")
        from tools.tavily_tool import TavilySearchTool
        from tools.serper_tool import SerperTool
        from tools.g2_tool import G2ScraperTool
        from tools.competitive_intel_tool import NovadaSearchTool, LinkedInLookupTool
        print("✅ Tool modules imported successfully")
        
        print("Testing agent modules...")
        from agents.meta_agent import MetaAgent
        from agents.competitive_intel_agent import CompetitiveIntelAgent
        from agents.comprehensive_analysis_agent import ComprehensiveCompanyAnalysisAgent
        from agents.industry_master_agent import IndustryComprehensiveAnalysisAgent
        print("✅ Agent modules imported successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Import error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main validation function."""
    
    print("🚀 AI Agents Configuration & Import Validation")
    print("=" * 60)
    
    # Step 1: Validate configuration
    config_valid = validate_configuration()
    
    # Step 2: Test imports
    imports_valid = test_imports()
    
    print("\n" + "=" * 60)
    print("📊 VALIDATION SUMMARY")
    print("=" * 60)
    
    if config_valid and imports_valid:
        print("✅ All validations passed! The system is ready to use.")
        print("\nYou can now run:")
        print("  • python main.py                     (start the API server)")
        print("  • python example_unified_workflow.py (run example analysis)")
        print("  • python test_unified_endpoint.py    (test the system)")
    else:
        print("❌ Some validations failed. Please fix the issues above.")
        
        if not config_valid:
            print("\n🔧 To fix configuration issues:")
            print("  1. Check that your .env file exists")
            print("  2. Verify all API keys are set correctly")
            print("  3. Make sure there are no extra spaces or quotes")
        
        if not imports_valid:
            print("\n📦 To fix import issues:")
            print("  1. Install requirements: pip install -r requirements.txt")
            print("  2. Check for syntax errors in the code")
            print("  3. Ensure all files are in the correct directories")

if __name__ == "__main__":
    main()

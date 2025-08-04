#!/usr/bin/env python3
# test_api.py - Test script for the Business Planning API

import asyncio
import json
import sys
from business_planning_orchestrator import BusinessPlanningOrchestrator

async def test_complete_workflow():
    """Test the complete business planning workflow"""
    
    print("🧪 Testing Business Planning API Workflow...")
    print("=" * 50)
    
    orchestrator = BusinessPlanningOrchestrator()
    
    try:
        # Step 1: Initial prompt
        print("\n📝 Step 1: Processing initial prompt...")
        result1 = await orchestrator.process_user_input(
            "I want to start an IT consulting business focused on digital transformation", 
            "initial"
        )
        print(f"✅ Initial processing complete")
        print(f"Business Type: {result1.get('business_type', 'Not detected')}")
        print(f"Companies suggested: {len(result1.get('companies', []))}")
        
        if result1.get('companies'):
            print("\nSuggested companies:")
            for i, company in enumerate(result1['companies'][:3], 1):
                print(f"  {i}. {company['name']}: {company['description']}")
        
        # Step 2: Company selection
        print("\n🏢 Step 2: Selecting benchmark company...")
        selected_company = result1.get('companies', [{}])[0].get('name', 'Accenture')
        result2 = await orchestrator.process_user_input(
            selected_company, 
            "company_selection"
        )
        print(f"✅ Company selection complete: {selected_company}")
        
        if result2.get('questions'):
            print(f"Follow-up questions generated: {len(result2['questions'])}")
            for i, question in enumerate(result2['questions'], 1):
                print(f"  {i}. {question}")
        
        # Step 3: Follow-up answers
        print("\n❓ Step 3: Answering follow-up questions...")
        result3 = await orchestrator.process_user_input(
            "I want to target North America and Europe, focusing on mid-market companies with 100-1000 employees. My initial budget is $150,000 and I want to launch within 12 months.", 
            "information_gathering"
        )
        print(f"✅ Information gathering complete")
        print(f"Status: {result3.get('type', 'Unknown')}")
        
        # Step 4: Run analysis if ready
        if result3.get('type') == 'ready_for_analysis':
            print("\n🔍 Step 4: Running comprehensive analysis...")
            print("This may take 2-3 minutes...")
            
            result4 = await orchestrator.process_user_input("", "analysis")
            
            if result4.get('type') == 'complete_analysis':
                print("✅ Analysis complete!")
                
                results = result4.get('results', {})
                
                # Market Research Summary
                if 'market_research' in results:
                    market = results['market_research']
                    print(f"\n📊 Market Research:")
                    if market.get('market_overview'):
                        print(f"  - Market Size: {market['market_overview'].get('market_size', 'N/A')}")
                        print(f"  - Growth Rate: {market['market_overview'].get('growth_rate', 'N/A')}")
                    if market.get('market_gaps'):
                        print(f"  - Market Gaps Identified: {len(market['market_gaps'])}")
                
                # Product Innovation Summary
                if 'product_innovation' in results:
                    products = results['product_innovation']
                    print(f"\n💡 Product Innovation:")
                    if products.get('product_services'):
                        print(f"  - Product/Service Ideas: {len(products['product_services'])}")
                    if products.get('future_trends'):
                        print(f"  - Future Trends Identified: {len(products['future_trends'])}")
                
                # Target Audience Summary
                if 'target_audience' in results:
                    audience = results['target_audience']
                    print(f"\n🎯 Target Audience:")
                    if audience.get('primary_segments'):
                        print(f"  - Market Segments: {len(audience['primary_segments'])}")
                    if audience.get('customer_personas'):
                        print(f"  - Customer Personas: {len(audience['customer_personas'])}")
                
                # Strategic Plan Summary
                if 'strategic_plan' in results:
                    strategy = results['strategic_plan']
                    print(f"\n📈 Strategic Plan:")
                    print(f"  - Timeframe: {strategy.get('timeframe_months', 'N/A')} months")
                    if strategy.get('strategic_goals'):
                        print(f"  - Strategic Goals: {len(strategy['strategic_goals'])}")
                
                # Save results for inspection
                orchestrator.save_complete_analysis("test_output")
                print(f"\n💾 Results saved to: ./test_output/")
                
            else:
                print(f"❌ Analysis failed: {result4.get('message', 'Unknown error')}")
        else:
            print(f"⚠️  Not ready for analysis: {result3.get('message', 'Unknown status')}")
            
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n🎉 Test completed successfully!")
    return True

async def test_individual_agents():
    """Test individual AI agents"""
    
    print("\n🔬 Testing Individual AI Agents...")
    print("=" * 40)
    
    from market_research_agent import MarketResearchAgent
    from product_innovation_agent import ProductInnovationAgent
    from target_audience_agent import TargetAudienceAgent
    from enhanced_goal_setting_agent import EnhancedGoalSettingAgent
    
    try:
        # Test Market Research Agent
        print("\n📊 Testing Market Research Agent...")
        market_agent = MarketResearchAgent()
        companies = market_agent.suggest_top_companies("IT consulting")
        print(f"✅ Company suggestions: {len(companies)} companies")
        
        market_analysis = market_agent.analyze_market("IT consulting", "Accenture", "Digital transformation focus")
        print(f"✅ Market analysis: {len(market_analysis.get('market_gaps', []))} gaps identified")
        
        # Test Product Innovation Agent
        print("\n💡 Testing Product Innovation Agent...")
        product_agent = ProductInnovationAgent()
        innovations = product_agent.generate_innovations(
            "IT consulting", 
            "Accenture", 
            market_analysis.get('market_gaps', []), 
            "SME focus"
        )
        print(f"✅ Product innovations: {len(innovations.get('product_services', []))} products/services")
        
        # Test Target Audience Agent
        print("\n🎯 Testing Target Audience Agent...")
        audience_agent = TargetAudienceAgent()
        audience_analysis = audience_agent.analyze_target_audience(
            "IT consulting",
            innovations.get('product_services', []),
            "North America",
            "Mid-market focus"
        )
        print(f"✅ Audience analysis: {len(audience_analysis.get('primary_segments', []))} segments")
        
        # Test Goal Setting Agent
        print("\n📈 Testing Goal Setting Agent...")
        goal_agent = EnhancedGoalSettingAgent()
        strategic_plan = goal_agent.generate_strategic_plan(
            "IT consulting",
            market_analysis,
            innovations.get('product_services', []),
            audience_analysis,
            12,
            "Quick time to market"
        )
        print(f"✅ Strategic plan: {len(strategic_plan.get('strategic_goals', []))} goals")
        
        print("\n🎉 All individual agents tested successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Individual agent test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("🚀 Business Planning API Test Suite")
    print("=" * 60)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--agents-only":
        # Test individual agents only
        result = asyncio.run(test_individual_agents())
    elif len(sys.argv) > 1 and sys.argv[1] == "--workflow-only":
        # Test complete workflow only
        result = asyncio.run(test_complete_workflow())
    else:
        # Test both
        print("Running complete test suite...")
        result1 = asyncio.run(test_individual_agents())
        result2 = asyncio.run(test_complete_workflow())
        result = result1 and result2
    
    if result:
        print("\n✅ All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  Calendar,
  Send,
  Loader,
  CheckCircle,
  Building2,
  BarChart3
} from 'lucide-react';

// Dynamic import for MarketOpportunitiesMap to avoid SSR issues
const MarketOpportunitiesMap = dynamic(() => import('./MarketOpportunitiesMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
});

interface Company {
  name: string;
  description: string;
  why_choose: string;
}

interface MarketGap {
  gap_title: string;
  description: string;
  opportunity_size?: string;
  difficulty_level?: string;
}

interface ProductService {
  name: string;
  type: string;
  description: string;
  unique_value_proposition: string;
  target_market?: string;
  revenue_model?: string;
}

interface FutureTrend {
  trend_name: string;
  description: string;
  timeline?: string;
  impact_level?: string;
}

interface MarketSegment {
  segment_name: string;
  description: string;
  size_estimate?: string;
  demographics?: {
    age_range?: string;
    income_level?: string;
    education?: string;
    occupation?: string;
    company_size?: string;
  };
}

interface CustomerPersona {
  persona_name: string;
  role_title: string;
  company_type: string;
  location?: string;
  budget_range?: string;
}

interface Milestone {
  milestone_id?: string;
  title: string;
  month: number;
  deliverables?: string[];
  dependencies?: string[];
}

interface StrategicGoal {
  goal_id?: string;
  title: string;
  description: string;
  category?: string;
  priority: string;
  start_month: number;
  end_month: number;
  success_criteria?: string[];
  key_milestones?: Milestone[];
}

interface AnalysisResults {
  market_research?: {
    market_overview?: {
      market_size: string;
      growth_rate: string;
      key_trends?: string[];
      market_maturity?: string;
    };
    market_gaps?: MarketGap[];
    competitor_analysis?: Record<string, unknown>;
    success_patterns?: Record<string, unknown>[];
    recommendations?: string[];
  };
  product_innovation?: {
    product_services?: ProductService[];
    future_trends?: FutureTrend[];
    innovation_opportunities?: Record<string, unknown>[];
    implementation_roadmap?: Record<string, unknown>[];
    risk_assessment?: Record<string, unknown>;
  };
  target_audience?: {
    primary_segments?: MarketSegment[];
    customer_personas?: CustomerPersona[];
    geographic_opportunities?: Array<{
      city: string;
      country: string;
      latitude: number;
      longitude: number;
      market_potential: string;
      opportunity_type: string;
      market_size: string;
      entry_difficulty: string;
      key_advantages: string[];
      population: number;
      recommended_priority: number;
    }>;
    idol_company_market_analysis?: {
      strengths_to_avoid?: Array<{ strength: string; why_avoid: string; market_impact: string }>;
      weaknesses_to_exploit?: Array<{ weakness: string; opportunity: string; market_size: string; difficulty: string }>;
    };
    geographic_analysis?: Record<string, unknown>;
    market_entry_strategy?: Record<string, unknown>;
  };
  strategic_plan?: {
    timeframe_months: number;
    executive_summary?: string;
    strategic_goals?: StrategicGoal[];
    monthly_breakdown?: Record<string, unknown>[];
    success_metrics?: {
      financial_kpis?: string[];
      operational_kpis?: string[];
      customer_kpis?: string[];
      growth_kpis?: string[];
    };
    contingency_plans?: Record<string, unknown>[];
  };
}

interface BusinessPlanningHubProps {
  darkMode: boolean;
}

interface SessionState {
  sessionId: string | null;
  currentStep: 'initial' | 'company_selection' | 'follow_up' | 'analysis' | 'results';
  businessType: string;
  selectedCompany: string;
  isLoading: boolean;
  companies: Company[];
  followUpQuestions: string[];
  currentQuestionIndex: number;
  answers: string[];
  analysisResults: AnalysisResults | null;
}

export default function BusinessPlanningHub({ darkMode }: BusinessPlanningHubProps) {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [session, setSession] = useState<SessionState>({
    sessionId: null,
    currentStep: 'initial',
    businessType: '',
    selectedCompany: '',
    isLoading: false,
    companies: [],
    followUpQuestions: [],
    currentQuestionIndex: 0,
    answers: [],
    analysisResults: null
  });

  const tabs = [
    { id: 'market-research', label: 'Market Research', icon: BarChart3 },
    { id: 'product-innovation', label: 'Product Innovation', icon: Lightbulb },
    { id: 'target-audience', label: 'Target Audience', icon: Target },
    { id: 'strategic-plan', label: 'Strategic Planning', icon: Calendar }
  ];

  const API_BASE = '/api/business-planning';

  const handleInitialSubmit = async () => {
    if (!prompt.trim()) return;

    setSession(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setSession(prev => ({
          ...prev,
          sessionId: result.data.session_id,
          businessType: result.data.business_type,
          companies: result.data.companies || [],
          currentStep: 'company_selection',
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error starting business planning:', error);
      setSession(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCompanySelection = async (company: string) => {
    setSession(prev => ({ ...prev, isLoading: true, selectedCompany: company }));

    try {
      const response = await fetch(`${API_BASE}/select-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          company, 
          session_id: session.sessionId 
        })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setSession(prev => ({
          ...prev,
          followUpQuestions: result.data.questions || [],
          currentStep: 'follow_up',
          currentQuestionIndex: 0,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error selecting company:', error);
      setSession(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleFollowUpAnswer = async (answer: string) => {
    const newAnswers = [...session.answers, answer];
    setSession(prev => ({ ...prev, answers: newAnswers, isLoading: true }));

    try {
      const response = await fetch(`${API_BASE}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answer, 
          session_id: session.sessionId 
        })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        if (result.data.type === 'ready_for_analysis') {
          setSession(prev => ({
            ...prev,
            currentStep: 'analysis',
            isLoading: false
          }));
        } else if (result.data.questions) {
          setSession(prev => ({
            ...prev,
            followUpQuestions: result.data.questions,
            currentQuestionIndex: 0,
            isLoading: false
          }));
        }
      }
    } catch (error) {
      console.error('Error answering follow-up:', error);
      setSession(prev => ({ ...prev, isLoading: false }));
    }
  };

  const runAnalysis = async () => {
    setSession(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.sessionId })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setSession(prev => ({
          ...prev,
          analysisResults: result.data.results,
          currentStep: 'results',
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error running analysis:', error);
      setSession(prev => ({ ...prev, isLoading: false }));
    }
  };

  const resetSession = () => {
    setSession({
      sessionId: null,
      currentStep: 'initial',
      businessType: '',
      selectedCompany: '',
      isLoading: false,
      companies: [],
      followUpQuestions: [],
      currentQuestionIndex: 0,
      answers: [],
      analysisResults: null
    });
    setPrompt('');
    setActiveTab(0);
  };

  const renderInitialStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="space-y-4">
        <Building2 className={`w-16 h-16 mx-auto ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Business Planning Assistant
        </h2>
        <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Tell me about the business you want to start or improve
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., I want to open/improve a business in IT consulting..."
          className={`w-full h-32 p-4 rounded-lg border resize-none ${
            darkMode 
              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        />
        
        <motion.button
          onClick={handleInitialSubmit}
          disabled={!prompt.trim() || session.isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {session.isLoading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Start Planning</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );

  const renderCompanySelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Choose Your Benchmark Company
        </h3>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Select a company in {session.businessType} to use as a benchmark for analysis
        </p>
      </div>
      
      <div className="grid gap-4 max-w-4xl mx-auto">
        {session.companies.map((company, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleCompanySelection(company.name)}
            className={`p-6 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 hover:border-blue-400' 
                : 'bg-white border-gray-200 hover:border-blue-400'
            }`}
          >
            <h4 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {company.name}
            </h4>
            <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {company.description}
            </p>
            <p className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <strong>Why choose this:</strong> {company.why_choose}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderFollowUp = () => {
    const currentQuestion = session.followUpQuestions[session.currentQuestionIndex];
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-2xl mx-auto"
      >
        <div className="text-center">
          <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Additional Information
          </h3>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Question {session.currentQuestionIndex + 1} of {session.followUpQuestions.length}
          </p>
        </div>
        
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {currentQuestion}
          </p>
          
          <textarea
            placeholder="Your answer..."
            className={`w-full h-24 p-3 rounded-lg border resize-none ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const answer = e.currentTarget.value.trim();
                if (answer) {
                  handleFollowUpAnswer(answer);
                  e.currentTarget.value = '';
                }
              }
            }}
          />
          
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Press Enter to continue, Shift+Enter for new line
          </p>
        </div>
      </motion.div>
    );
  };

  const renderAnalysis = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="space-y-4">
        <div className={`w-16 h-16 mx-auto ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          <Loader className="w-full h-full animate-spin" />
        </div>
        <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Running Comprehensive Analysis
        </h3>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Analyzing market research, innovation opportunities, target audience, and strategic planning...
        </p>
      </div>
      
      <motion.button
        onClick={runAnalysis}
        disabled={session.isLoading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-8 rounded-lg font-medium flex items-center space-x-2 mx-auto transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {session.isLoading ? (
          <Loader className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <TrendingUp className="w-5 h-5" />
            <span>Start Analysis</span>
          </>
        )}
      </motion.button>
    </motion.div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(index)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
                activeTab === index
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className={`min-h-96 p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        {session.analysisResults ? (
          <div>
            {activeTab === 0 && renderMarketResearch()}
            {activeTab === 1 && renderProductInnovation()}
            {activeTab === 2 && renderTargetAudience()}
            {activeTab === 3 && renderStrategicPlan()}
          </div>
        ) : (
          <div className="text-center">
            <Loader className={`w-8 h-8 animate-spin mx-auto mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading analysis results...</p>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <motion.button
          onClick={resetSession}
          className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start New Analysis
        </motion.button>
      </div>
    </div>
  );

  const renderMarketResearch = () => {
    const data = session.analysisResults?.market_research;
    if (!data) return <div>No market research data available</div>;

    return (
      <div className="space-y-6">
        <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Market Research Analysis
        </h3>
        
        {data.market_overview && (
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Market Overview
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Market Size:</span>
                <p className={darkMode ? 'text-white' : 'text-gray-900'}>{data.market_overview.market_size}</p>
              </div>
              <div>
                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Growth Rate:</span>
                <p className={darkMode ? 'text-white' : 'text-gray-900'}>{data.market_overview.growth_rate}</p>
              </div>
            </div>
          </div>
        )}

        {data.market_gaps && data.market_gaps.length > 0 && (
          <div>
            <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Market Opportunities
            </h4>
            <div className="space-y-3">
              {data.market_gaps.map((gap: MarketGap, index: number) => (
                <div key={index} className={`p-4 border rounded-lg ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
                  <h5 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{gap.gap_title}</h5>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{gap.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProductInnovation = () => {
    const data = session.analysisResults?.product_innovation;
    if (!data) return <div>No product innovation data available</div>;

    return (
      <div className="space-y-6">
        <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Product Innovation Opportunities
        </h3>
        
        {data.product_services && data.product_services.length > 0 && (
          <div>
            <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Recommended Products & Services
            </h4>
            <div className="space-y-4">
              {data.product_services.map((product: ProductService, index: number) => (
                <div key={index} className={`p-4 border rounded-lg ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
                  <h5 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</h5>
                  <p className={`text-sm mt-1 mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{product.description}</p>
                  <div className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    <strong>Value Proposition:</strong> {product.unique_value_proposition}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.future_trends && data.future_trends.length > 0 && (
          <div>
            <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Future Trends to Leverage
            </h4>
            <div className="grid gap-3">
              {data.future_trends.map((trend: FutureTrend, index: number) => (
                <div key={index} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h6 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{trend.trend_name}</h6>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{trend.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTargetAudience = () => {
    const data = session.analysisResults?.target_audience;
    if (!data) return <div>No target audience data available</div>;

    const geoOpportunities = data.geographic_opportunities || [];
    const idolAnalysis = data.idol_company_market_analysis || {};

    return (
      <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Target Audience Analysis
        </h3>

        {idolAnalysis.strengths_to_avoid && idolAnalysis.strengths_to_avoid.length > 0 && (
          <div>
          <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Idol Company Strengths (Avoid Competing Directly)
          </h4>
            <ul className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {idolAnalysis.strengths_to_avoid.map((item: any, idx: number) => (
                 <li key={idx} className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <strong className="text-gray-900 dark:text-white">{item.strength}</strong>{' '}
                  <span className="text-xs text-gray-700 dark:text-gray-300">({item.market_impact})</span>
                  <div className="text-sm mt-1 text-gray-800 dark:text-gray-200">
                    Why avoid: {item.why_avoid}
                  </div>
              </li>
              ))}
            </ul>
          </div>
        )}

        {idolAnalysis.weaknesses_to_exploit && idolAnalysis.weaknesses_to_exploit.length > 0 && (
          <div>
          <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Idol Company Weaknesses (Exploit These)
          </h4>
          <ul className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {idolAnalysis.weaknesses_to_exploit.map((item: any, idx: number) => (
              <li key={idx} className="p-3 rounded-lg bg-red-100 dark:bg-red-900">
                 <strong className="text-gray-900 dark:text-white">{item.weakness}</strong>{' '}
                <span className="text-xs text-red-800 dark:text-red-200">({item.difficulty})</span>
                <div className="text-sm mt-1 text-red-900 dark:text-red-100">
                  Opportunity: {item.opportunity}
                </div>
                <div className="text-xs text-red-800 dark:text-red-200">
                  Market Size: {item.market_size}
                </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {geoOpportunities.length > 0 && (
          <div>
            <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Geographic Market Opportunities</h4>
            <MarketOpportunitiesMap opportunities={geoOpportunities} darkMode={darkMode} />
          </div>
        )}

        {data.primary_segments && data.primary_segments.length > 0 && (
          <div>
            <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Primary Market Segments
            </h4>
            <div className="space-y-4">
              {data.primary_segments.map((segment: MarketSegment, index: number) => (
                <div key={index} className={`p-4 border rounded-lg ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
                  <h5 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{segment.segment_name}</h5>
                  <p className={`text-sm mt-1 mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{segment.description}</p>
                  {segment.demographics && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Age:</span>
                        <span className={`ml-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{segment.demographics.age_range}</span>
                      </div>
                      <div>
                        <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Income:</span>
                        <span className={`ml-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{segment.demographics.income_level}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.customer_personas && data.customer_personas.length > 0 && (
          <div>
            <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Customer Personas
            </h4>
            <div className="grid gap-3">
              {data.customer_personas.map((persona: CustomerPersona, index: number) => (
                <div key={index} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h6 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{persona.persona_name}</h6>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {persona.role_title} at {persona.company_type}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStrategicPlan = () => {
    const data = session.analysisResults?.strategic_plan;
    if (!data) return <div>No strategic plan data available</div>;

    return (
      <div className="space-y-6">
        <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Strategic Planning ({data.timeframe_months} Months)
        </h3>
        
        {data.executive_summary && (
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Executive Summary
            </h4>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.executive_summary}</p>
          </div>
        )}

        {data.strategic_goals && data.strategic_goals.length > 0 && (
          <div>
            <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Strategic Goals
            </h4>
            <div className="space-y-4">
              {data.strategic_goals.map((goal: StrategicGoal, index: number) => (
                <div key={index} className={`p-4 border rounded-lg ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h5 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{goal.title}</h5>
                    <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}>
                      {goal.priority} Priority
                    </span>
                  </div>
                  <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{goal.description}</p>
                  <div className="text-xs">
                    <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Timeline:</span>
                    <span className={`ml-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Month {goal.start_month} - {goal.end_month}
                    </span>
                  </div>
                  
                  {goal.key_milestones && goal.key_milestones.length > 0 && (
                    <div className="mt-3">
                      <div className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Key Milestones:
                      </div>
                      <div className="space-y-1">
                        {goal.key_milestones.map((milestone: Milestone, mIndex: number) => (
                          <div key={mIndex} className="flex items-center text-xs">
                            <CheckCircle className={`w-3 h-3 mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                              Month {milestone.month}: {milestone.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.success_metrics && (
          <div>
            <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Success Metrics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(data.success_metrics).map(([category, metrics]: [string, string[] | undefined]) => (
                metrics && metrics.length > 0 && (
                  <div key={category} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h6 className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {category.replace('_', ' ').toUpperCase()}
                    </h6>
                    <ul className="space-y-1">
                      {metrics.map((metric: string, mIndex: number) => (
                        <li key={mIndex} className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          • {metric}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl shadow-xl overflow-hidden ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        >
          <div className="p-8">
            {session.currentStep === 'initial' && renderInitialStep()}
            {session.currentStep === 'company_selection' && renderCompanySelection()}
            {session.currentStep === 'follow_up' && renderFollowUp()}
            {session.currentStep === 'analysis' && renderAnalysis()}
            {session.currentStep === 'results' && renderResults()}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

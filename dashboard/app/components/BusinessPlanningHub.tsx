/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import MarketCharts from './MarketCharts';
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  Calendar,
  Send,
  Loader,
  CheckCircle,
  Building2,
  BarChart3,
  Volume2,
  Play,
  Pause
} from 'lucide-react';

// Dynamic import for MarketOpportunitiesMap to avoid SSR issues
const MarketOpportunitiesMap = dynamic(() => import('./MarketOpportunitiesMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-gray-200 rounded-lg animate-pulse" />
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
      summary?: string;
    };
    competitor_breakdown?: {
      name: string;
      market_share: string; // percent
      revenue: string; // in millions
      growth_rate: string; // percent
      summary?: string;
    }[];
    idol_company_analysis?: {
      name: string;
      strengths_to_avoid?: {
        strength: string;
        why_avoid: string;
        market_impact: "high" | "medium" | "low";
        summary?: string;
      }[];
      weaknesses_to_exploit?: {
        weakness: string;
        opportunity: string;
        market_size: string; // in millions
        difficulty: "high" | "medium" | "low";
        summary?: string;
      }[];
      missed_opportunities?: {
        opportunity: string;
        market_potential: string; // in millions
        why_missed: string;
        how_to_capture: string;
        summary?: string;
      }[];
      market_share: string; // percent
    };
    competitive_gaps?: {
      gap_title: string;
      description: string;
      target_segment: string;
      revenue_potential: string; // in millions
      barriers_to_entry: "low" | "medium" | "high";
      summary?: string;
    }[];
    top_trends?: {
      trend: string;
      impact: "high" | "medium" | "low";
      growth_rate: string; // percent
      summary?: string;
    }[];
    strategic_recommendations?: {
      strategy: string;
      rationale: string;
      timeline: string;
      investment_needed: string;
      summary?: string; // in millions
    }[];
  };
  product_innovation?: {
    product_services?: ProductService[];
    future_trends?: FutureTrend[];
    innovation_opportunities?: Record<string, unknown>[];
    implementation_roadmap?: Record<string, unknown>[];
    risk_assessment?: Record<string, unknown>;
  };
  target_audience?: {
    idol_timeline?:[{
      year: number,
      title: string,
      description: string,
      achievements: string[],
      takeaway: string,
      how_we_can_do_better?: {
      summary?: string,
      technology_advantages?: [string],
      estimated_savings?: {
        time?: string,
        cost?: string,
        resources?: string
      }
  }
    }];
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

  // TTS State Management
  const [ttsState, setTtsState] = useState<{
    [key: string]: {
      isPlaying: boolean;
      volume: number;
      utterance: SpeechSynthesisUtterance | null;
    }
  }>({});

  const speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;

  // TTS Functions
  const handleTTS = (cardId: string, text: string) => {
    if (!speechSynthesis) return;

    const currentTTS = ttsState[cardId];
    
    if (currentTTS?.isPlaying) {
      // Pause current speech
      speechSynthesis.pause();
      setTtsState(prev => ({
        ...prev,
        [cardId]: { ...prev[cardId], isPlaying: false }
      }));
    } else if (currentTTS?.utterance && speechSynthesis.paused) {
      // Resume paused speech
      speechSynthesis.resume();
      setTtsState(prev => ({
        ...prev,
        [cardId]: { ...prev[cardId], isPlaying: true }
      }));
    } else {
      // Start new speech
      speechSynthesis.cancel(); // Stop any other ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = currentTTS?.volume || 0.8;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => {
        setTtsState(prev => ({
          ...prev,
          [cardId]: { isPlaying: true, volume: utterance.volume, utterance }
        }));
      };
      
      utterance.onend = () => {
        setTtsState(prev => ({
          ...prev,
          [cardId]: { ...prev[cardId], isPlaying: false }
        }));
      };
      
      speechSynthesis.speak(utterance);
    }
  };

  const handleVolumeChange = (cardId: string, volume: number) => {
    setTtsState(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], volume }
    }));
    
    if (ttsState[cardId]?.utterance) {
      ttsState[cardId].utterance!.volume = volume;
    }
  };

  const stopAllTTS = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setTtsState({});
    }
  };

  // Stop TTS when tab changes
  const handleTabChange = (tabIndex: number) => {
    stopAllTTS();
    setActiveTab(tabIndex);
  };

  // TTS Button Component
  const TTSButton = ({ cardId, text, title }: { cardId: string; text: string; title: string }) => {
    const currentTTS = ttsState[cardId];
    const isPlaying = currentTTS?.isPlaying || false;
    const volume = currentTTS?.volume || 0.8;

    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleTTS(cardId, `${title}. ${text}`)}
          className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-all ${
            isPlaying
              ? darkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-500 text-white hover:bg-blue-600'
              : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          <span>🔊 Hear Summary</span>
        </button>
        
        {(currentTTS || isPlaying) && (
          <div className="flex items-center space-x-1">
            <Volume2 className={`w-3 h-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(cardId, parseFloat(e.target.value))}
              className={`w-12 h-1 rounded-lg appearance-none cursor-pointer ${
                darkMode ? 'bg-gray-600' : 'bg-gray-300'
              }`}
              style={{
                background: `linear-gradient(to right, ${darkMode ? '#3B82F6' : '#2563EB'} 0%, ${darkMode ? '#3B82F6' : '#2563EB'} ${volume * 100}%, ${darkMode ? '#4B5563' : '#D1D5DB'} ${volume * 100}%, ${darkMode ? '#4B5563' : '#D1D5DB'} 100%)`
              }}
            />
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {Math.round(volume * 100)}%
            </span>
          </div>
        )}
      </div>
    );
  };

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
          Market Gap Strategy Assistant
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
      <div className={`flex space-x-1 p-1 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(index)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
                activeTab === index
                  ? darkMode 
                    ? 'bg-gray-700 text-blue-400 shadow-sm'
                    : 'bg-white text-blue-600 shadow-sm'
                  : darkMode
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
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
  const targetData = session.analysisResults?.target_audience;
  const idolAnalysis = targetData?.idol_company_market_analysis || {};

  if (!data) return <div>No market research data available</div>;
  return (
    <div className="space-y-6">
      <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Market Research Analysis
      </h3>

      {/* Market KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div className="flex justify-between items-start mb-1">
            <div className={`text-xs font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              📊 MARKET METRICS
            </div>
          </div>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Market Size</p>
          <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data?.market_overview?.market_size ?? 'N/A'}</p>
        </div>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div className="flex justify-between items-start mb-1">
            <div className={`text-xs font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              📈 GROWTH RATE
            </div>
            
          </div>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Annual Growth Rate</p>
          <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data?.market_overview?.growth_rate ?? 'N/A'}</p>
        </div>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div className="flex justify-between items-start mb-1">
            <div className={`text-xs font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
              🎯 MARKET STAGE
            </div>
          </div>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Market Maturity Level</p>
          <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data?.market_overview?.market_maturity ?? 'N/A'}</p>
        </div>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div className="flex justify-between items-start mb-1">
            <div className={`text-xs font-semibold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
              🏢 BENCHMARK SHARE
            </div>
          </div>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{session.selectedCompany} Market Share</p>
          <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.idol_company_analysis?.market_share ?? 'N/A'}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-4">
        <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Market Share by Competitor</h4>
        <MarketCharts
          competitorData={data?.competitor_breakdown}
          topTrends={data?.top_trends}
          marketGaps={data?.competitive_gaps}
          darkMode={darkMode}
          onTTSClick={handleTTS}
          onVolumeChange={handleVolumeChange}
          ttsState={ttsState}
        />
      </div>

      {/* Overview Section */}
      {data.market_overview && (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Market Overview
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Key Trends:</span>
              <ul className={darkMode ? 'text-white' : 'text-gray-900'}>
                {(data?.market_overview?.key_trends || []).map((trend: string, i: number) => (
                  <li key={i}>• {trend}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {idolAnalysis.strengths_to_avoid && idolAnalysis.strengths_to_avoid.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {session.selectedCompany}&apos;s Strengths (Avoid Competing Directly)
            </h4>
          </div>
          <ul className="space-y-2">
            {idolAnalysis.strengths_to_avoid.map((item: any, idx: number) => (
              <li key={idx} className={`p-4 rounded-lg border-l-4 border-orange-500 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className={`text-xs font-semibold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                    ⚠️ STRENGTH TO AVOID #{idx + 1}
                  </div>

                </div>
                <div className="mb-2">
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Strength Description: </span>
                  <strong className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.strength}</strong>
                </div>
                <div className="mb-2">
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Market Impact Level: </span>
                  <span className={`text-sm font-medium ${
                    item.market_impact?.toLowerCase() === 'high' 
                      ? darkMode ? 'text-red-400' : 'text-red-600'
                      : item.market_impact?.toLowerCase() === 'medium'
                      ? darkMode ? 'text-yellow-400' : 'text-yellow-600'
                      : darkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {item.market_impact?.toUpperCase() || 'NOT SPECIFIED'}
                  </span>
                </div>
                <div>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Strategic Advice: </span>
                  <div className={`text-sm mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {item.why_avoid}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
        {idolAnalysis.weaknesses_to_exploit && idolAnalysis.weaknesses_to_exploit.length > 0 && (
          <div>
          <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {session.selectedCompany}&apos;s Weaknesses (Exploit These)
          </h4>
          <ul className="space-y-2">
            {idolAnalysis.weaknesses_to_exploit.map((item: any, idx: number) => (
              <li key={idx} className={`p-4 rounded-lg border-l-4 border-green-500 ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
                <div className={`text-xs font-semibold mb-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  💡 OPPORTUNITY #{idx + 1}
                </div>
                <div className="mb-2">
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Weakness Identified: </span>
                  <strong className={`${darkMode ? 'text-red-200' : 'text-red-800'}`}>{item.weakness}</strong>
                </div>
                <div className="mb-2">
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Difficulty to Exploit: </span>
                  <span className={`text-sm font-medium ${
                    item.difficulty?.toLowerCase() === 'high' 
                      ? darkMode ? 'text-red-400' : 'text-red-600'
                      : item.difficulty?.toLowerCase() === 'medium'
                      ? darkMode ? 'text-yellow-400' : 'text-yellow-600'
                      : darkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {item.difficulty?.toUpperCase() || 'NOT SPECIFIED'}
                  </span>
                </div>
                <div className="mb-2">
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Business Opportunity: </span>
                  <div className={`text-sm mt-1 ${darkMode ? 'text-red-100' : 'text-red-900'}`}>
                    {item.opportunity}
                  </div>
                </div>
                <div>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Potential Market Size: </span>
                  <span className={`text-sm font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {item.market_size}
                  </span>
                </div>
              </li>
            ))}
            </ul>
          </div>
        )}
      

      {/* Gaps Section */}
      {data.competitive_gaps && data.competitive_gaps.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Market Opportunities
            </h4>
            <TTSButton 
              cardId="market-opportunities" 
              text={`Market opportunities analysis: ${data.competitive_gaps?.map(gap => `${gap.gap_title}. ${gap.description}. ${(gap as any).opportunity_size || (gap as any).revenue_potential ? `Market size: ${(gap as any).opportunity_size || (gap as any).revenue_potential}` : 'Size unknown'}. ${(gap as any).difficulty_level || (gap as any).barriers_to_entry ? `Entry difficulty: ${(gap as any).difficulty_level || (gap as any).barriers_to_entry}` : 'Difficulty unknown'}`).join('. ') || 'No market opportunities data available'}`}
              title="Market Opportunities"
            />
          </div>
          <div className="space-y-3">
            {data.competitive_gaps.map((gap: MarketGap, index: number) => (
              <div
                key={index}
                className={`p-4 border-l-4 border-blue-500 rounded-lg ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`text-xs font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    🎯 MARKET GAP #{index + 1}
                  </div>
                  <TTSButton 
                    cardId={`gap-${index}`} 
                    text={`Market gap ${index + 1}: ${gap.gap_title}. ${gap.description}. ${(gap as any).opportunity_size || (gap as any).revenue_potential ? `Market size: ${(gap as any).opportunity_size || (gap as any).revenue_potential}` : ''}. ${(gap as any).difficulty_level || (gap as any).barriers_to_entry ? `Entry difficulty: ${(gap as any).difficulty_level || (gap as any).barriers_to_entry}` : ''}`}
                    title={`Market Gap ${index + 1}`}
                  />
                </div>
                <div className="mb-2">
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Opportunity Title: </span>
                  <h5 className={`inline font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{gap.gap_title}</h5>
                </div>
                <div className="mb-2">
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description: </span>
                  <p className={`text-sm inline ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{gap.description}</p>
                </div>
                {((gap as any).opportunity_size || (gap as any).revenue_potential) && (
                  <div className="mb-1">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Market Size: </span>
                    <span className={`text-sm font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{(gap as any).opportunity_size || (gap as any).revenue_potential}</span>
                  </div>
                )}
                {((gap as any).difficulty_level || (gap as any).barriers_to_entry) && (
                  <div>
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Entry Difficulty: </span>
                    <span className={`text-sm font-medium ${
                      ((gap as any).difficulty_level || (gap as any).barriers_to_entry)?.toLowerCase() === 'high' 
                        ? darkMode ? 'text-red-400' : 'text-red-600'
                        : ((gap as any).difficulty_level || (gap as any).barriers_to_entry)?.toLowerCase() === 'medium'
                        ? darkMode ? 'text-yellow-400' : 'text-yellow-600'
                        : darkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {((gap as any).difficulty_level || (gap as any).barriers_to_entry)?.toUpperCase()}
                    </span>
                  </div>
                )}
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
                  <div className={`text-xs font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    PRODUCT #{index + 1}
                  </div>
                  <div className="mb-3">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Product Name: </span>
                    <h5 className={`inline font-medium text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</h5>
                  </div>
                  <div className="mb-3">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Type: </span>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{product.type || 'Not specified'}</span>
                  </div>
                  <div className="mb-3">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description: </span>
                    <p className={`text-sm inline ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{product.description}</p>
                  </div>
                  <div className="mb-2">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Value Proposition: </span>
                    <div className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {product.unique_value_proposition}
                    </div>
                  </div>
                  {product.target_market && (
                    <div className="mb-2">
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Target Market: </span>
                      <span className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{product.target_market}</span>
                    </div>
                  )}
                  {product.revenue_model && (
                    <div>
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Revenue Model: </span>
                      <span className={`text-sm ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{product.revenue_model}</span>
                    </div>
                  )}
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
                  <div className={`text-xs font-semibold mb-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    TREND #{index + 1}
                  </div>
                  <div className="mb-2">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Trend Name: </span>
                    <h6 className={`inline font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{trend.trend_name}</h6>
                  </div>
                  <div className="mb-2">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description: </span>
                    <p className={`text-sm inline ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{trend.description}</p>
                  </div>
                  {trend.timeline && (
                    <div className="mb-1">
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Timeline: </span>
                      <span className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{trend.timeline}</span>
                    </div>
                  )}
                  {trend.impact_level && (
                    <div>
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Impact Level: </span>
                      <span className={`text-sm font-medium ${
                        trend.impact_level.toLowerCase() === 'high' 
                          ? darkMode ? 'text-red-400' : 'text-red-600'
                          : trend.impact_level.toLowerCase() === 'medium'
                          ? darkMode ? 'text-yellow-400' : 'text-yellow-600'
                          : darkMode ? 'text-green-400' : 'text-green-600'
                      }`}>
                        {trend.impact_level.toUpperCase()}
                      </span>
                    </div>
                  )}
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
  const timelineData = session.analysisResults?.target_audience?.idol_timeline
  console.log(session.analysisResults?.target_audience);


  
  if (!data) return <div>No target audience data available</div>;

  const geoOpportunities = data.geographic_opportunities || [];
  console.log('Geographic Opportunities:', geoOpportunities);
  console.log("Timeline Data:", timelineData);  

  return (
    <div className="space-y-6">
      <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Target Audience Analysis
      </h3>

        {geoOpportunities.length > 0 && (
          <div>
            <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Geographic Market Opportunities</h4>
            <MarketOpportunitiesMap opportunities={geoOpportunities} darkMode={darkMode} />
          </div>
        )}

        <div className="space-y-4">
        <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          📈 {session.selectedCompany} Evolution Timeline
        </h4>
        
        {/* Enhanced Timeline Container */}
        <div className={`relative p-6 rounded-xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg`}>
          {/* Timeline Progress Bar */}
          <div className={`absolute left-6 top-0 bottom-0 w-1 ${darkMode ? 'bg-gradient-to-b from-blue-400 via-purple-500 to-green-400' : 'bg-gradient-to-b from-blue-600 via-purple-600 to-green-600'} rounded-full`}></div>
          
          <div className="space-y-8 ml-8">
            {timelineData?.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                className="relative"
              >
                {/* Enhanced Timeline Dot with Year Badge */}
                <div className="absolute -left-12 top-0 flex flex-col items-center">
                  <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                    index === timelineData.length - 1 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                    'bg-gradient-to-r from-purple-400 to-purple-600'
                  } shadow-lg border-2 border-white dark:border-gray-800`}>
                    <div className={`w-2 h-2 rounded-full bg-white`}></div>
                    <div className={`absolute inset-0 rounded-full ${
                      index === 0 ? 'bg-green-400' :
                      index === timelineData.length - 1 ? 'bg-blue-400' :
                      'bg-purple-400'
                    } animate-ping opacity-30`}></div>
                  </div>
                  
                  {/* Year Badge */}
                  <div className={`mt-2 px-2 py-1 rounded-md text-xs font-bold shadow-sm ${
                    darkMode ? 'bg-gray-700 text-blue-300 border border-gray-600' : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {event.year}
                  </div>
                </div>
                
                {/* Enhanced Content Card */}
                <div className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                  darkMode ? 'bg-gray-800 border-gray-600 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400'
                }`}>
                  
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
                        darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                      }`}>
                        📅 MILESTONE #{index + 1}
                      </div>
                      <h5 className={`text-lg font-bold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {event.title}
                      </h5>
                    </div>
                    
                    {/* Progress Indicator */}
                    <div className={`text-right ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className={`text-2xl font-bold ${
                        index === 0 ? 'text-green-500' :
                        index === timelineData.length - 1 ? 'text-blue-500' :
                        'text-purple-500'
                      }`}>
                        {(index + 1)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-gray-700 border-l-4 border-gray-500' : 'bg-gray-50 border-l-4 border-gray-300'}`}>
                    <div className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      📋 Historical Impact
                    </div>
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {event.description}
                    </p>
                  </div>
                  
                  {/* Achievements Section - Enhanced */}
                  {event.achievements && event.achievements.length > 0 && (
                    <div className={`p-5 rounded-xl mb-4 ${darkMode ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-800' : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'}`}>
                      <div className="flex items-center mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${darkMode ? 'bg-green-800' : 'bg-green-200'}`}>
                          <span className="text-green-600 font-bold">🏆</span>
                        </div>
                        <div>
                          <h6 className={`font-bold ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                            💰 Key Achievements & Technology Advantages
                          </h6>
                          <p className={`text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                            {event.achievements.length} strategic breakthrough{event.achievements.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid gap-3">
                        {event.achievements.map((achievement, achIndex) => (
                          <motion.div
                            key={achIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + achIndex * 0.05 }}
                            className={`flex items-start p-3 rounded-lg ${darkMode ? 'bg-green-800/20 border border-green-700/50' : 'bg-white border border-green-200'}`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${darkMode ? 'bg-green-700' : 'bg-green-100'}`}>
                              <span className="text-xs text-green-600 font-bold">✓</span>
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-green-200' : 'text-green-800'}`}>
                                {achievement}
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-bold ${darkMode ? 'bg-green-600 text-white' : 'bg-green-200 text-green-800'}`}>
                              #{achIndex + 1}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Strategic Takeaway Section - Enhanced */}
                  {event.takeaway && (
                    <div className={`p-5 rounded-xl mb-4 ${darkMode ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-800' : 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'}`}>
                      <div className="flex items-start">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${darkMode ? 'bg-yellow-800' : 'bg-yellow-200'}`}>
                          <span className="text-xl">💡</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className={`font-bold ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                              Strategic Business Lesson
                            </h6>
                            <div className={`px-2 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-yellow-600 text-yellow-100' : 'bg-yellow-200 text-yellow-800'}`}>
                              KEY INSIGHT
                            </div>
                          </div>
                          <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-800/20 border border-yellow-700/50' : 'bg-white border border-yellow-200'}`}>
                            <p className={`text-sm font-medium italic leading-relaxed ${darkMode ? 'text-yellow-200' : 'text-yellow-900'}`}>
                              &ldquo;{event.takeaway}&rdquo;
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* How We Can Do Better Section - Enhanced */}
                  {event.how_we_can_do_better && (
                    <div className={`p-5 rounded-xl ${darkMode ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-800' : 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200'}`}>
                      <div className="flex items-start mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${darkMode ? 'bg-purple-800' : 'bg-purple-200'}`}>
                          <span className="text-xl">🚀</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className={`font-bold ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>
                              How We Can Do Better Today
                            </h6>
                            <div className={`px-2 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-purple-600 text-purple-100' : 'bg-purple-200 text-purple-800'}`}>
                              COMPETITIVE ADVANTAGE
                            </div>
                          </div>
                          
                          {/* Summary */}
                          <div className={`p-3 rounded-lg mb-4 ${darkMode ? 'bg-purple-800/20 border border-purple-700/50' : 'bg-white border border-purple-200'}`}>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>
                              {event.how_we_can_do_better.summary}
                            </p>
                          </div>

                          {/* Technology Advantages */}
                          {event.how_we_can_do_better.technology_advantages && event.how_we_can_do_better.technology_advantages.length > 0 && (
                            <div className="mb-4">
                              <h6 className={`text-xs font-bold mb-2 block ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                🔧 TECHNOLOGY ADVANTAGES
                              </h6>
                              <div className="grid gap-2">
                                {event.how_we_can_do_better.technology_advantages.map((advantage, techIndex) => (
                                  <div key={techIndex} className={`flex items-center p-2 rounded ${darkMode ? 'bg-purple-800/30' : 'bg-purple-100'}`}>
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-2 ${darkMode ? 'bg-purple-600' : 'bg-purple-300'}`}>
                                      <span className="text-xs text-purple-800 font-bold">⚡</span>
                                    </div>
                                    <span className={`text-xs ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                                      {advantage}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Estimated Savings - The Key Section */}
                          {event.how_we_can_do_better.estimated_savings && (
                            <div>
                              <h6 className={`text-xs font-bold mb-3 block ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                💰 ESTIMATED SAVINGS & EFFICIENCY GAINS
                              </h6>
                              <div className="grid grid-cols-3 gap-3">
                                {/* Time Savings */}
                                <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-green-900/30 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${darkMode ? 'bg-green-800' : 'bg-green-200'}`}>
                                    <span className="text-green-600 text-sm">⏱️</span>
                                  </div>
                                  <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                    Time Saved
                                  </div>
                                  <div className={`text-sm font-bold ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                                    {event.how_we_can_do_better.estimated_savings.time}
                                  </div>
                                </div>

                                {/* Cost Savings */}
                                <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${darkMode ? 'bg-blue-800' : 'bg-blue-200'}`}>
                                    <span className="text-blue-600 text-sm">💵</span>
                                  </div>
                                  <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                    Cost Reduction
                                  </div>
                                  <div className={`text-sm font-bold ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                                    {event.how_we_can_do_better.estimated_savings.cost}
                                  </div>
                                </div>

                                {/* Resource Savings */}
                                <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-orange-900/30 border border-orange-800' : 'bg-orange-50 border border-orange-200'}`}>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${darkMode ? 'bg-orange-800' : 'bg-orange-200'}`}>
                                    <span className="text-orange-600 text-sm">📊</span>
                                  </div>
                                  <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                    Resource Efficiency
                                  </div>
                                  <div className={`text-sm font-bold ${darkMode ? 'text-orange-300' : 'text-orange-800'}`}>
                                    {event.how_we_can_do_better.estimated_savings.resources}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Timeline Summary Footer */}
          <div className={`mt-8 p-4 rounded-lg ${darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-100 border border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${darkMode ? 'bg-blue-400' : 'bg-blue-600'}`}></div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Total Evolution Period: {timelineData?.length || 0} Key Milestones
                </span>
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Timeline Analysis Complete
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* {data.primary_segments && data.primary_segments.length > 0 && (
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
        )} */}

        {/* {data.customer_personas && data.customer_personas.length > 0 && (
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
        )} */}
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
          <div className={`p-4 border-l-4 border-indigo-500 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-xs font-semibold mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              📋 EXECUTIVE SUMMARY
            </div>
            <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Strategic Overview ({data.timeframe_months}-Month Plan)
            </h4>
            <div>
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Executive Summary: </span>
              <p className={`text-sm inline ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.executive_summary}</p>
            </div>
          </div>
        )}

        {data.strategic_goals && data.strategic_goals.length > 0 && (
          <div>
            <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Strategic Goals
            </h4>
            <div className="space-y-4">
              {data.strategic_goals.map((goal: StrategicGoal, index: number) => (
                <div key={index} className={`p-4 border-l-4 border-purple-500 rounded-lg ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
                  <div className={`text-xs font-semibold mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    🎯 STRATEGIC GOAL #{index + 1}
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Goal Title: </span>
                      <h5 className={`inline font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{goal.title}</h5>
                    </div>
                    <div>
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Priority: </span>
                      <span className={`text-xs px-2 py-1 rounded font-bold ${
                        goal.priority?.toLowerCase() === 'high' 
                          ? darkMode ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'
                          : goal.priority?.toLowerCase() === 'medium'
                          ? darkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'
                          : darkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
                      }`}>
                        {goal.priority?.toUpperCase() || 'NORMAL'} PRIORITY
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description: </span>
                    <p className={`text-sm inline ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{goal.description}</p>
                  </div>
                  <div className="mb-3">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Timeline: </span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      Month {goal.start_month} → Month {goal.end_month} ({goal.end_month - goal.start_month + 1} months duration)
                    </span>
                  </div>
                  {goal.category && (
                    <div className="mb-3">
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Category: </span>
                      <span className={`text-sm ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{goal.category}</span>
                    </div>
                  )}
                  
                  {goal.key_milestones && goal.key_milestones.length > 0 && (
                    <div className="mt-3">
                      <div className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Key Milestones ({goal.key_milestones.length} total):
                      </div>
                      <div className="space-y-1">
                        {goal.key_milestones.map((milestone: Milestone, mIndex: number) => (
                          <div key={mIndex} className="flex items-start text-xs">
                            <CheckCircle className={`w-3 h-3 mr-2 mt-0.5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                            <div>
                              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Month {milestone.month}:
                              </span>{' '}
                              <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                                {milestone.title}
                              </span>
                            </div>
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
              📊 Key Performance Indicators (KPIs)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data.success_metrics).map(([category, metrics]: [string, string[] | undefined]) => (
                metrics && metrics.length > 0 && (
                  <div key={category} className={`p-4 border-l-4 rounded-lg ${
                    category.includes('financial') 
                      ? `border-green-500 ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`
                      : category.includes('operational')
                      ? `border-blue-500 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`
                      : category.includes('customer')
                      ? `border-purple-500 ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`
                      : `border-orange-500 ${darkMode ? 'bg-gray-700' : 'bg-orange-50'}`
                  }`}>
                    <div className={`text-xs font-semibold mb-2 ${
                      category.includes('financial') 
                        ? darkMode ? 'text-green-400' : 'text-green-600'
                        : category.includes('operational')
                        ? darkMode ? 'text-blue-400' : 'text-blue-600'
                        : category.includes('customer')
                        ? darkMode ? 'text-purple-400' : 'text-purple-600'
                        : darkMode ? 'text-orange-400' : 'text-orange-600'
                    }`}>
                      {category.includes('financial') ? '💰' : category.includes('operational') ? '⚙️' : category.includes('customer') ? '👥' : '📈'} {category.replace('_', ' ').toUpperCase()} METRICS
                    </div>
                    <h6 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {category.replace('_kpis', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} KPIs ({metrics.length} indicators)
                    </h6>
                    <ul className="space-y-2">
                      {metrics.map((metric: string, mIndex: number) => (
                        <li key={mIndex} className="flex items-start">
                          <span className={`text-xs font-bold mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            KPI #{mIndex + 1}:
                          </span>
                          <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {metric}
                          </span>
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

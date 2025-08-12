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
  Pause,
  Rocket,
  PieChart,
  Upload,
  FileText,
  Globe,
  X
} from 'lucide-react';

// Dynamic import for MarketOpportunitiesMap to avoid SSR issues
const MarketOpportunitiesMap = dynamic(() => import('./MarketOpportunitiesMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-gray-200 rounded-lg animate-pulse" />
});

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
  key_features?: string[];
}

interface GTMPlan {
  framework_name: string;
  executive_summary: string;
  product_focus: string;
  phases: Array<{
    phase_number: number;
    phase_name: string;
    phase_description: string;
    duration_weeks: number;
    key_objectives: string[];
    tactics?: Array<{
      tactic_name: string;
      description: string;
    }>;
  }>;
  framework_elements: Record<string, string>;
  w5h1_analysis: {
    who: string;
    what: string;
    where: string;
    when: string;
    why: string;
    how: string;
  };
  budget_allocation?: Record<string, any>;
  launch_timeline?: Array<{
    phase: string;
    timeline: string;
    activities: string[];
  }>;
  success_metrics?: Record<string, string[]>;
}

interface MarketSimulation {
  simulation_id: string;
  scenario_name: string;
  product_focus: string;
  executive_summary: string;
  timeline_results: Array<{
    month: number;
    conservative: number;
    realistic: number;
    optimistic: number;
    market_share: number;
    customer_acquisition: number;
    revenue: number;
    customers: number;
  }>;
  scenario_analysis: Record<string, {
    revenue: number;
    market_share: number;
    roi: number;
  }>;
  key_metrics: Record<string, any>;
  risk_factors: string[];
  recommendations: string[];
  risk_assessment: Record<string, string>;
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

interface SessionState {
  sessionId: string | null;
  currentStep: 'initial' | 'company_selection' | 'follow_up' | 'analysis' | 'results';
  businessType: string;
  selectedCompany: string;
  selectedIdolCompanies: string[];
  isLoading: boolean;
  companies: any[];
  followUpQuestions: any[];
  currentQuestionIndex: number;
  answers: any[];
  analysisResults: any;
  companyInfo?: any;
}

interface BusinessPlanningHubProps {
  darkMode: boolean;
}

export default function BusinessPlanningHub({ darkMode }: BusinessPlanningHubProps) {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [companySettings, setCompanySettings] = useState({
    name: 'Talan Consulting',
    size: 'Large',
    specialty: 'Digital Transformation and Technology Consulting',
    industry: 'Information Technology',
    description: 'Global technology consulting firm specializing in digital transformation',
    external_data: {
      uploaded_files: [] as File[],
      website_urls: [] as string[],
      data_sources: [] as string[]
    }
  });
  const [session, setSession] = useState<SessionState>({
    sessionId: null,
    currentStep: 'initial',
    businessType: '',
    selectedCompany: '',
    selectedIdolCompanies: [],
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

  // GTM Plan State
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [customProduct, setCustomProduct] = useState<string>('');
  const [customProductDetails, setCustomProductDetails] = useState({
    name: '',
    description: '',
    target_market: '',
    key_features: '',
    value_proposition: '',
    pricing_model: '',
    competitive_advantage: ''
  });
  const [selectedFramework, setSelectedFramework] = useState<string>('crossing_chasm');
  const [isGenerating, setIsGenerating] = useState(false);
  const [gtmPlan, setGtmPlan] = useState<GTMPlan | null>(null);

  // Market Simulation State
  const [simulationParams, setSimulationParams] = useState({
    product_type: '',
    target_market_size: 1000000,
    marketing_budget: 100000,
    competitive_intensity: 'medium',
    market_growth_rate: 5,
    customer_acquisition_cost: 100,
    customer_lifetime_value: 1000,
    conversion_rate: 2.5,
    pricing_strategy: 'competitive'
  });
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['digital_marketing', 'content_marketing']);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<MarketSimulation | null>(null);

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
    { id: 'strategic-plan', label: 'Strategic Planning', icon: Calendar },
    { id: 'go-to-market', label: 'Go-to-Market Plan', icon: Rocket },
    { id: 'market-simulation', label: 'Market Simulation', icon: TrendingUp }
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
      analysisResults: null,
      selectedIdolCompanies: []
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
        <Building2 className={`w-20 h-20 mx-auto ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        <h2 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Market Gap Strategy Assistant
        </h2>
        <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
            {activeTab === 4 && renderGoToMarketPlan()}
            {activeTab === 5 && renderMarketSimulation()}
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
              {Object.entries(data.success_metrics).map(([category, metrics]) => {
                const typedMetrics = metrics as string[] | undefined;
                return typedMetrics && typedMetrics.length > 0 && (
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
                      {category.replace('_kpis', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} KPIs ({typedMetrics.length} indicators)
                    </h6>
                    <ul className="space-y-2">
                      {typedMetrics.map((metric: string, mIndex: number) => (
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
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGoToMarketPlan = () => {
    const frameworks = [
      { 
        id: 'crossing_chasm', 
        name: 'Crossing the Chasm', 
        description: 'Focus on early adopters and mainstream market transition',
        icon: '🌉'
      },
      { 
        id: 'mckinsey_7s', 
        name: 'McKinsey 7S Framework', 
        description: 'Align strategy, structure, systems, and more',
        icon: '⚙️'
      },
      { 
        id: 'kotler_4p', 
        name: 'Kotler 4Ps Marketing', 
        description: 'Product, Price, Place, Promotion strategy',
        icon: '📊'
      },
      { 
        id: 'lean_canvas', 
        name: 'Lean Canvas', 
        description: 'Problem-solution fit and business model',
        icon: '📋'
      }
    ];

    const generateGTMPlan = async () => {
      // Validate input
      if (!selectedProduct && customProduct !== 'custom') return;
      if (customProduct === 'custom' && (!customProductDetails.name || !customProductDetails.description || !customProductDetails.target_market)) return;
      
      setIsGenerating(true);
      try {
        let productData;
        
        if (selectedProduct) {
          // Find the selected product from Product Innovation results
          const selectedProductData = availableProducts.find((p: ProductService) => p.name === selectedProduct);
          productData = {
            name: selectedProduct,
            description: selectedProductData?.description || '',
            target_market: selectedProductData?.target_market || '',
            key_features: selectedProductData?.key_features || [],
            value_proposition: selectedProductData?.value_proposition || '',
            pricing_model: selectedProductData?.pricing_strategy || '',
            competitive_advantage: selectedProductData?.differentiation || ''
          };
        } else {
          // Use custom product details
          productData = {
            name: customProductDetails.name,
            description: customProductDetails.description,
            target_market: customProductDetails.target_market,
            key_features: customProductDetails.key_features.split('\n').filter(f => f.trim()),
            value_proposition: customProductDetails.value_proposition,
            pricing_model: customProductDetails.pricing_model,
            competitive_advantage: customProductDetails.competitive_advantage
          };
        }

        const response = await fetch('/api/agents/gtm-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_data: productData,
            framework: selectedFramework,
            company_context: session.companyInfo,
            idol_companies: session.selectedIdolCompanies
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setGtmPlan(data);
        }
      } catch (error) {
        console.error('Error generating GTM plan:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    // Validation for generate button
    const canGenerate = () => {
      if (selectedProduct) return true;
      if (customProduct === 'custom') {
        return customProductDetails.name && customProductDetails.description && customProductDetails.target_market;
      }
      return false;
    };

    // Get products from Product Innovation results
    const availableProducts = session.analysisResults?.product_innovation?.product_services || [];

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Rocket className={`w-16 h-16 mx-auto mb-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
          <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Go-to-Market Strategy
          </h2>
          <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Create comprehensive product launch strategies with proven frameworks
          </p>
        </div>

        {/* Product Selection */}
        <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`text-2xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            📦 Select Product/Service
          </h3>
          
          {/* Product Innovation Results */}
          {availableProducts.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🚀 Products from Innovation Analysis
                </label>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  darkMode ? 'bg-green-900/30 text-green-400 border border-green-600' : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  {availableProducts.length} Products Available
                </span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {availableProducts.map((product: ProductService, index: number) => (
                  <motion.div
                    key={index}
                    onClick={() => {
                      setSelectedProduct(product.name);
                      setCustomProduct('');
                      // Clear custom product details when selecting from innovation
                      setCustomProductDetails({
                        name: '',
                        description: '',
                        target_market: '',
                        key_features: '',
                        value_proposition: '',
                        pricing_model: '',
                        competitive_advantage: ''
                      });
                    }}
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedProduct === product.name
                        ? darkMode 
                          ? 'border-green-500 bg-gradient-to-br from-green-900/30 to-green-800/20 shadow-lg shadow-green-500/20' 
                          : 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-lg shadow-green-500/20'
                        : darkMode 
                          ? 'border-gray-600 bg-gradient-to-br from-gray-800 to-gray-700 hover:border-gray-500 hover:shadow-lg' 
                          : 'border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-gray-300 hover:shadow-lg'
                    }`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Selection Indicator */}
                    {selectedProduct === product.name && (
                      <div className="absolute top-4 right-4">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          darkMode ? 'bg-green-500' : 'bg-green-600'
                        }`}>
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Product Header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`text-xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {product.name}
                        </h4>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ml-2 ${
                          darkMode ? 'bg-blue-600 text-blue-100' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {product.type}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {product.description}
                      </p>
                    </div>

                    {/* Value Proposition */}
                    {product.unique_value_proposition && (
                      <div className={`p-3 rounded-lg mb-4 ${
                        selectedProduct === product.name
                          ? darkMode ? 'bg-green-800/30' : 'bg-green-100/70'
                          : darkMode ? 'bg-gray-700/50' : 'bg-gray-100/70'
                      }`}>
                        <h5 className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                          darkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          💡 Value Proposition
                        </h5>
                        <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          {product.unique_value_proposition}
                        </p>
                      </div>
                    )}

                    {/* Key Features */}
                    {product.key_features && product.key_features.length > 0 && (
                      <div className="mb-4">
                        <h5 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          ⭐ Key Features
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {product.key_features.slice(0, 4).map((feature: string, fIndex: number) => (
                            <span 
                              key={fIndex}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                selectedProduct === product.name
                                  ? darkMode ? 'bg-green-700 text-green-200' : 'bg-green-200 text-green-800'
                                  : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {feature}
                            </span>
                          ))}
                          {product.key_features.length > 4 && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600'
                            }`}>
                              +{product.key_features.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Target Market & Revenue Model */}
                    <div className="grid grid-cols-2 gap-3">
                      {product.target_market && (
                        <div>
                          <h5 className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            🎯 Target Market
                          </h5>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {product.target_market}
                          </p>
                        </div>
                      )}
                      {product.revenue_model && (
                        <div>
                          <h5 className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            💰 Revenue Model
                          </h5>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {product.revenue_model}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Selection Call-to-Action */}
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                      <div className={`text-center text-sm font-medium ${
                        selectedProduct === product.name
                          ? darkMode ? 'text-green-400' : 'text-green-600'
                          : darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {selectedProduct === product.name ? '✓ Selected for GTM Strategy' : 'Click to select for GTM Strategy'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Product Entry */}
          <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                ✨ Or Create Custom Product/Service
              </label>
              <button
                onClick={() => {
                  setSelectedProduct('');
                  setCustomProduct('custom');
                }}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                  customProduct === 'custom'
                    ? 'bg-blue-600 text-white'
                    : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {customProduct === 'custom' ? 'Selected' : 'Create Custom'}
              </button>
            </div>
            
            {customProduct === 'custom' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Product/Service Name *
                    </label>
                    <input
                      type="text"
                      value={customProductDetails.name}
                      onChange={(e) => setCustomProductDetails(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., AI-Powered Analytics Platform"
                      className={`w-full p-3 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Target Market *
                    </label>
                    <input
                      type="text"
                      value={customProductDetails.target_market}
                      onChange={(e) => setCustomProductDetails(prev => ({ ...prev, target_market: e.target.value }))}
                      placeholder="e.g., Mid-size tech companies"
                      className={`w-full p-3 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Product Description *
                  </label>
                  <textarea
                    value={customProductDetails.description}
                    onChange={(e) => setCustomProductDetails(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Describe what your product/service does and what problems it solves..."
                    className={`w-full p-3 rounded-lg border resize-none ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Key Features & Benefits
                  </label>
                  <textarea
                    value={customProductDetails.key_features}
                    onChange={(e) => setCustomProductDetails(prev => ({ ...prev, key_features: e.target.value }))}
                    rows={3}
                    placeholder="List the main features and benefits (one per line)..."
                    className={`w-full p-3 rounded-lg border resize-none ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Value Proposition
                    </label>
                    <textarea
                      value={customProductDetails.value_proposition}
                      onChange={(e) => setCustomProductDetails(prev => ({ ...prev, value_proposition: e.target.value }))}
                      rows={2}
                      placeholder="What unique value do you provide?"
                      className={`w-full p-3 rounded-lg border resize-none ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Pricing Model
                    </label>
                    <input
                      type="text"
                      value={customProductDetails.pricing_model}
                      onChange={(e) => setCustomProductDetails(prev => ({ ...prev, pricing_model: e.target.value }))}
                      placeholder="e.g., SaaS subscription, one-time fee"
                      className={`w-full p-3 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Competitive Advantage
                  </label>
                  <textarea
                    value={customProductDetails.competitive_advantage}
                    onChange={(e) => setCustomProductDetails(prev => ({ ...prev, competitive_advantage: e.target.value }))}
                    rows={2}
                    placeholder="What makes you different from competitors?"
                    className={`w-full p-3 rounded-lg border resize-none ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Framework Selection */}
        <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            🎯 Strategic Framework
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {frameworks.map((framework) => (
              <motion.div
                key={framework.id}
                onClick={() => setSelectedFramework(framework.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedFramework === framework.id
                    ? darkMode 
                      ? 'border-blue-500 bg-blue-900/20' 
                      : 'border-blue-500 bg-blue-50'
                    : darkMode 
                      ? 'border-gray-600 bg-gray-800 hover:border-gray-500' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{framework.icon}</span>
                  <div>
                    <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {framework.name}
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {framework.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <motion.button
          onClick={generateGTMPlan}
          disabled={!canGenerate() || isGenerating}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isGenerating ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              <span>Generate GTM Strategy</span>
            </>
          )}
        </motion.button>

        {/* GTM Plan Results */}
        {gtmPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Executive Summary */}
            <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🎯 Executive Summary
              </h3>
              <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {gtmPlan.executive_summary}
              </p>
            </div>

            {/* Framework Elements */}
            {gtmPlan.framework_elements && (
              <div className={`p-8 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                <div className="mb-6">
                  <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                    ⚙️ Framework Analysis
                    <span className={`ml-3 px-4 py-2 rounded-full text-sm font-medium ${
                      darkMode ? 'bg-purple-600 text-purple-100' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {gtmPlan.framework_name} Applied
                    </span>
                  </h3>
                  <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Deep analysis of {gtmPlan.product_focus} using strategic framework elements tailored to your product&apos;s unique characteristics.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(gtmPlan.framework_elements).map(([key, value], index) => {
                    const elementIcons = {
                      'market_segmentation': '🎯',
                      'value_proposition': '💎',
                      'positioning': '📍',
                      'pricing_strategy': '💰',
                      'distribution_channels': '🚛',
                      'promotional_mix': '📢',
                      'competitive_advantage': '🏆',
                      'customer_journey': '🛤️',
                      'product_strategy': '📦',
                      'market_entry': '🚪',
                      'scalability': '📈',
                      'risk_mitigation': '🛡️'
                    };
                    
                    const icon = elementIcons[key as keyof typeof elementIcons] || '⭐';
                    
                    return (
                      <motion.div 
                        key={key} 
                        className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                          darkMode ? 'bg-gray-800 border-gray-600 hover:border-gray-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-start space-x-3 mb-4">
                          <span className="text-2xl">{icon}</span>
                          <div className="flex-1">
                            <h4 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </h4>
                            <div className={`text-xs font-medium mb-3 ${
                              darkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                              Framework Element • Product-Specific Analysis
                            </div>
                          </div>
                        </div>
                        <p className={`text-base leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {value}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5W1H Analysis */}
            {gtmPlan.w5h1_analysis && (
              <div className={`p-8 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                <div className="mb-8">
                  <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                    🔍 Strategic 5W1H Analysis
                    <span className={`ml-3 px-4 py-2 rounded-full text-sm font-medium ${
                      darkMode ? 'bg-blue-600 text-blue-100' : 'bg-blue-100 text-blue-700'
                    }`}>
                      Product-Specific Insights
                    </span>
                  </h3>
                  <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Comprehensive strategic analysis based on your product&apos;s unique market position, derived from competitive research and market data analysis.
                  </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">{Object.entries(gtmPlan.w5h1_analysis).map(([question, answer]) => {
                    const questionConfig = {
                      who: { 
                        icon: '👥', 
                        title: 'Target Audience', 
                        color: 'green',
                        subtitle: 'Who are we targeting and why?'
                      },
                      what: { 
                        icon: '🎯', 
                        title: 'Product Positioning', 
                        color: 'blue',
                        subtitle: 'What are we launching and how?'
                      },
                      where: { 
                        icon: '🌍', 
                        title: 'Market Geography', 
                        color: 'purple',
                        subtitle: 'Where will we focus our efforts?'
                      },
                      when: { 
                        icon: '⏰', 
                        title: 'Launch Timeline', 
                        color: 'orange',
                        subtitle: 'When is the optimal timing?'
                      },
                      why: { 
                        icon: '💡', 
                        title: 'Market Opportunity', 
                        color: 'red',
                        subtitle: 'Why is this the right move now?'
                      },
                      how: { 
                        icon: '🚀', 
                        title: 'Execution Strategy', 
                        color: 'yellow',
                        subtitle: 'How will we execute and deliver?'
                      }
                    };

                    const config = questionConfig[question as keyof typeof questionConfig];
                    
                    return (
                      <motion.div 
                        key={question} 
                        className={`p-6 rounded-xl border-l-4 relative overflow-hidden ${
                          config.color === 'blue' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                          config.color === 'green' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                          config.color === 'purple' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' :
                          config.color === 'orange' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                          config.color === 'red' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                          'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Object.keys(gtmPlan.w5h1_analysis).indexOf(question) * 0.1 }}
                      >
                        {/* Background Decoration */}
                        <div className={`absolute top-0 right-0 text-6xl opacity-10 ${darkMode ? 'text-white' : 'text-gray-400'}`}>
                          {config.icon}
                        </div>
                        
                        {/* Header */}
                        <div className="relative z-10 mb-6">
                          <div className="flex items-center mb-3">
                            <span className="text-3xl mr-4">{config.icon}</span>
                            <div>
                              <h4 className={`font-bold text-xl uppercase tracking-wide ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {config.title}
                              </h4>
                              <p className={`text-sm font-medium ${
                                config.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                                config.color === 'green' ? 'text-green-600 dark:text-green-400' :
                                config.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                                config.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                                config.color === 'red' ? 'text-red-600 dark:text-red-400' :
                                'text-yellow-600 dark:text-yellow-400'
                              }`}>
                                {config.subtitle}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="relative z-10">
                          <p className={`text-lg leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'} font-medium`}>
                            {answer}
                          </p>
                        </div>

                        {/* Reasoning Badge */}
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                            config.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200' :
                            config.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200' :
                            config.color === 'purple' ? 'bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200' :
                            config.color === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200' :
                            config.color === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200'
                          }`}>
                            🧠 Based on market analysis & competitive research
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Launch Timeline */}
            {gtmPlan.launch_timeline && (
              <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  📅 Launch Timeline
                </h3>
                <div className="space-y-4">
                  {gtmPlan.launch_timeline.map((phase, index) => (
                    <div key={index} className={`flex items-start space-x-4 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index % 4 === 0 ? 'bg-blue-500' :
                        index % 4 === 1 ? 'bg-green-500' :
                        index % 4 === 2 ? 'bg-purple-500' : 'bg-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {phase.phase}
                        </h4>
                        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {phase.timeline}
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          {phase.activities.map((activity, aIndex) => (
                            <li key={aIndex} className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {activity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Metrics */}
            {gtmPlan.success_metrics && (
              <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  📊 Success Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(gtmPlan.success_metrics).map(([category, metrics]) => (
                    <div key={category} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                      <ul className="space-y-2">
                        {(Array.isArray(metrics) ? metrics : []).map((metric, mIndex) => (
                          <li key={mIndex} className={`text-sm flex items-start ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <span className="mr-2">•</span>
                            {metric}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    );
  };

  const renderMarketSimulation = () => {
    const competitiveOptions = [
      { value: 'low', label: 'Low Competition', description: 'Niche market with few competitors' },
      { value: 'medium', label: 'Medium Competition', description: 'Balanced competitive landscape' },
      { value: 'high', label: 'High Competition', description: 'Saturated market with many players' }
    ];

    const pricingStrategies = [
      { value: 'premium', label: 'Premium Pricing', description: 'Higher prices for premium positioning' },
      { value: 'competitive', label: 'Competitive Pricing', description: 'Match market average prices' },
      { value: 'penetration', label: 'Penetration Pricing', description: 'Lower prices to gain market share' }
    ];

    const marketingChannels = [
      { id: 'digital_marketing', name: 'Digital Marketing', icon: '💻' },
      { id: 'content_marketing', name: 'Content Marketing', icon: '📝' },
      { id: 'social_media', name: 'Social Media', icon: '📱' },
      { id: 'email_marketing', name: 'Email Marketing', icon: '📧' },
      { id: 'seo', name: 'SEO/SEM', icon: '🔍' },
      { id: 'pr', name: 'Public Relations', icon: '📢' },
      { id: 'events', name: 'Events & Webinars', icon: '🎪' },
      { id: 'partnerships', name: 'Partnerships', icon: '🤝' }
    ];

    const runSimulation = async () => {
      setIsSimulating(true);
      try {
        const response = await fetch('/api/agents/market-simulation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...simulationParams,
            marketing_channels: selectedChannels,
            company_context: session.companyInfo,
            simulation_period: 12 // months
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setSimulationResults(data);
        }
      } catch (error) {
        console.error('Error running simulation:', error);
      } finally {
        setIsSimulating(false);
      }
    };

    const toggleChannel = (channelId: string) => {
      setSelectedChannels(prev => 
        prev.includes(channelId) 
          ? prev.filter(id => id !== channelId)
          : [...prev, channelId]
      );
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <PieChart className={`w-16 h-16 mx-auto mb-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Market Simulation
          </h2>
          <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Run Monte Carlo simulations to predict market performance and ROI
          </p>
        </div>

        {/* Simulation Parameters */}
        <div className={`p-8 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`text-2xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            ⚙️ Simulation Parameters
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Type */}
            <div>
              <label className={`block text-base font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Product/Service Type
              </label>
              <input
                type="text"
                value={simulationParams.product_type}
                onChange={(e) => setSimulationParams(prev => ({ ...prev, product_type: e.target.value }))}
                placeholder="e.g., SaaS platform, consulting service"
                className={`w-full p-4 text-base rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Market Size */}
            <div>
              <label className={`block text-base font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Target Market Size ($)
              </label>
              <input
                type="number"
                value={simulationParams.target_market_size}
                onChange={(e) => setSimulationParams(prev => ({ ...prev, target_market_size: Number(e.target.value) }))}
                className={`w-full p-4 text-base rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Marketing Budget */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Marketing Budget ($)
              </label>
              <input
                type="number"
                value={simulationParams.marketing_budget}
                onChange={(e) => setSimulationParams(prev => ({ ...prev, marketing_budget: Number(e.target.value) }))}
                className={`w-full p-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Market Growth Rate */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Market Growth Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={simulationParams.market_growth_rate}
                onChange={(e) => setSimulationParams(prev => ({ ...prev, market_growth_rate: Number(e.target.value) }))}
                className={`w-full p-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Customer Acquisition Cost */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Customer Acquisition Cost ($)
              </label>
              <input
                type="number"
                value={simulationParams.customer_acquisition_cost}
                onChange={(e) => setSimulationParams(prev => ({ ...prev, customer_acquisition_cost: Number(e.target.value) }))}
                className={`w-full p-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Customer Lifetime Value */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Customer Lifetime Value ($)
              </label>
              <input
                type="number"
                value={simulationParams.customer_lifetime_value}
                onChange={(e) => setSimulationParams(prev => ({ ...prev, customer_lifetime_value: Number(e.target.value) }))}
                className={`w-full p-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Competitive Intensity */}
        <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            🏆 Competitive Environment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {competitiveOptions.map((option) => (
              <motion.div
                key={option.value}
                onClick={() => setSimulationParams(prev => ({ ...prev, competitive_intensity: option.value }))}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  simulationParams.competitive_intensity === option.value
                    ? darkMode 
                      ? 'border-purple-500 bg-purple-900/20' 
                      : 'border-purple-500 bg-purple-50'
                    : darkMode 
                      ? 'border-gray-600 bg-gray-800 hover:border-gray-500' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {option.label}
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {option.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pricing Strategy */}
        <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            💰 Pricing Strategy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pricingStrategies.map((strategy) => (
              <motion.div
                key={strategy.value}
                onClick={() => setSimulationParams(prev => ({ ...prev, pricing_strategy: strategy.value }))}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  simulationParams.pricing_strategy === strategy.value
                    ? darkMode 
                      ? 'border-green-500 bg-green-900/20' 
                      : 'border-green-500 bg-green-50'
                    : darkMode 
                      ? 'border-gray-600 bg-gray-800 hover:border-gray-500' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {strategy.label}
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {strategy.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Marketing Channels */}
        <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            📈 Marketing Channels
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {marketingChannels.map((channel) => (
              <motion.div
                key={channel.id}
                onClick={() => toggleChannel(channel.id)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                  selectedChannels.includes(channel.id)
                    ? darkMode 
                      ? 'border-blue-500 bg-blue-900/20' 
                      : 'border-blue-500 bg-blue-50'
                    : darkMode 
                      ? 'border-gray-600 bg-gray-800 hover:border-gray-500' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-2xl mb-1">{channel.icon}</div>
                <div className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {channel.name}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Run Simulation Button */}
        <motion.button
          onClick={runSimulation}
          disabled={!simulationParams.product_type.trim() || isSimulating}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-4 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSimulating ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <PieChart className="w-5 h-5" />
              <span>Run Market Simulation</span>
            </>
          )}
        </motion.button>

        {/* Simulation Results */}
        {simulationResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Executive Summary */}
            {simulationResults.simulation?.executive_summary && (
              <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                  📊 Executive Summary
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className={`font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      Overall Assessment
                    </h4>
                    <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {simulationResults.simulation.executive_summary.overall_assessment}
                    </p>
                  </div>
                  <div>
                    <h4 className={`font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      Key Success Factors
                    </h4>
                    <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {simulationResults.simulation.executive_summary.key_success_factors}
                    </p>
                  </div>
                  <div>
                    <h4 className={`font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      Primary Recommendation
                    </h4>
                    <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {simulationResults.simulation.executive_summary.primary_recommendation}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                    <h4 className={`font-semibold mb-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      Confidence Level
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {simulationResults.simulation.executive_summary.confidence_level}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Scenario Analysis */}
            {simulationResults.simulation?.scenario_analysis && (
              <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                  🎯 Scenario Analysis
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {Object.entries(simulationResults.simulation.scenario_analysis).map(([scenario, data]: [string, any]) => (
                    <div key={scenario} className={`p-4 rounded-lg border-2 ${
                      scenario === 'optimistic_scenario' ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600' :
                      scenario === 'realistic_scenario' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' :
                      'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600'
                    }`}>
                      <h4 className={`font-bold mb-3 text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {scenario.replace('_scenario', '').replace('_', ' ').split(' ').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')} Scenario
                      </h4>
                      
                      {/* Key Metrics */}
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between">
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Market Share Growth:</span>
                          <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {data.market_share_growth}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Revenue Projection:</span>
                          <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {data.revenue_projection}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Customer Acquisition:</span>
                          <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {data.customer_acquisition_rate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Probability:</span>
                          <span className={`text-sm font-bold ${
                            scenario === 'optimistic_scenario' ? 'text-green-600 dark:text-green-400' :
                            scenario === 'realistic_scenario' ? 'text-blue-600 dark:text-blue-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {data.probability}
                          </span>
                        </div>
                      </div>

                      {/* Reasoning */}
                      <div className="mb-4">
                        <h5 className={`font-semibold mb-2 text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          💡 Why This Scenario?
                        </h5>
                        <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {data.reasoning}
                        </p>
                      </div>

                      {/* Key Drivers */}
                      <div>
                        <h5 className={`font-semibold mb-2 text-sm ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                          🚀 Key Drivers
                        </h5>
                        <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {data.key_drivers}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Results */}
            {simulationResults.simulation?.timeline_results && (
              <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                  📅 12-Month Growth Timeline
                </h3>
                <div className="space-y-4">
                  {Object.entries(simulationResults.simulation.timeline_results).map(([period, data]: [string, any], index) => (
                    <div key={period} className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-orange-500' : 'bg-green-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {period}
                          </h4>
                          
                          {/* Key Metrics */}
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                              <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Market Penetration</div>
                              <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {data.market_penetration}
                              </div>
                            </div>
                            <div>
                              <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Customer Base</div>
                              <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {data.customer_base}
                              </div>
                            </div>
                            <div>
                              <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Revenue</div>
                              <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {data.revenue}
                              </div>
                            </div>
                          </div>

                          {/* Explanation */}
                          <div className="mb-3">
                            <h5 className={`font-semibold mb-1 text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              📈 Phase Analysis
                            </h5>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {data.explanation}
                            </p>
                          </div>

                          {/* Critical Activities */}
                          <div>
                            <h5 className={`font-semibold mb-1 text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                              ⭐ Critical Activities
                            </h5>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {data.critical_activities}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Assessment */}
            {simulationResults.simulation?.risk_assessment && (
              <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                  ⚠️ Risk Assessment & Mitigation
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* High Impact Risks */}
                  <div>
                    <h4 className={`font-semibold mb-3 ${darkMode ? 'text-red-400' : 'text-red-600'} flex items-center`}>
                      🔴 High Impact Risks
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(simulationResults.simulation.risk_assessment.high_impact_risks).map(([risk, details]: [string, any]) => (
                        <div key={risk} className={`p-3 rounded-lg border ${darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`}>
                          <h5 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {risk.replace(/_/g, ' ').split(' ').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Probability:</span>
                              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{details.probability}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Impact:</span>
                              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{details.impact}</span>
                            </div>
                            <div className="mt-2">
                              <span className={`text-xs font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Mitigation Strategy:</span>
                              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {details.mitigation}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Medium Impact Risks */}
                  <div>
                    <h4 className={`font-semibold mb-3 ${darkMode ? 'text-orange-400' : 'text-orange-600'} flex items-center`}>
                      🟡 Medium Impact Risks
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(simulationResults.simulation.risk_assessment.medium_impact_risks).map(([risk, details]: [string, any]) => (
                        <div key={risk} className={`p-3 rounded-lg border ${darkMode ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'}`}>
                          <h5 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {risk.replace(/_/g, ' ').split(' ').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Probability:</span>
                              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{details.probability}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Impact:</span>
                              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{details.impact}</span>
                            </div>
                            <div className="mt-2">
                              <span className={`text-xs font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Mitigation Strategy:</span>
                              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {details.mitigation}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Competitive Analysis */}
            {simulationResults.simulation?.competitive_analysis && (
              <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                  🏆 Competitive Analysis
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className={`font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      Market Position
                    </h4>
                    <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {simulationResults.simulation.competitive_analysis.market_position}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className={`font-semibold mb-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                        ✅ Competitive Advantages
                      </h4>
                      <ul className="space-y-1">
                        {simulationResults.simulation.competitive_analysis.competitive_advantages.map((advantage: string, index: number) => (
                          <li key={index} className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-start`}>
                            <span className="text-green-500 mr-2">•</span>
                            {advantage}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className={`font-semibold mb-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                        ⚠️ Competitive Threats
                      </h4>
                      <ul className="space-y-1">
                        {simulationResults.simulation.competitive_analysis.threats.map((threat: string, index: number) => (
                          <li key={index} className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-start`}>
                            <span className="text-red-500 mr-2">•</span>
                            {threat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
                    <h4 className={`font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      📋 Strategic Recommendations
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {simulationResults.simulation.competitive_analysis.strategic_recommendations}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Projections */}
            {simulationResults.simulation?.financial_projections && (
              <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                  💰 Financial Projections & Analysis
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className={`font-semibold mb-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      Revenue Model Analysis
                    </h4>
                    <p className={`text-sm leading-relaxed mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {simulationResults.simulation.financial_projections.revenue_model_analysis}
                    </p>
                    
                    <h4 className={`font-semibold mb-2 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                      Cost Structure Optimization
                    </h4>
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {simulationResults.simulation.financial_projections.cost_structure_optimization}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className={`font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      Profitability Timeline
                    </h4>
                    <p className={`text-sm leading-relaxed mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {simulationResults.simulation.financial_projections.profitability_timeline}
                    </p>
                    
                    <h4 className={`font-semibold mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      Funding Requirements
                    </h4>
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {simulationResults.simulation.financial_projections.funding_requirements}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header with Company Selector */}
        <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Business Planning Hub
              </h1>
              <p className={`mt-1 text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Company: {companySettings.name} • {companySettings.specialty}
              </p>
            </div>
            <button
              onClick={() => setShowCompanyDialog(true)}
              className={`px-6 py-3 text-lg rounded-lg border ${
                darkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              } transition-colors`}
            >
              <Building2 className="w-5 h-5 inline mr-2" />
              Company Settings
            </button>
          </div>
        </div>

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

      {/* Company Settings Dialog */}
      {showCompanyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`max-w-4xl w-full max-h-[90vh] rounded-xl ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            } shadow-2xl flex flex-col`}
          >
            <div className={`flex justify-between items-center p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Company Settings
              </h2>
              <button
                onClick={() => setShowCompanyDialog(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Company Selection */}
                <div className={`p-4 rounded-lg border-2 ${
                  darkMode ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-300'
                }`}>
                  <h3 className={`text-lg font-semibold mb-3 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    🏢 Current Company Profile
                  </h3>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} border-2 border-blue-500`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {companySettings.name}
                        </h4>
                        <p className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {companySettings.size} • {companySettings.industry}
                        </p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {companySettings.specialty}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                      }`}>
                        ACTIVE
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      📋 Basic Information
                    </h3>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={companySettings.name}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full p-3 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Company Size
                        </label>
                        <select
                          value={companySettings.size}
                          onChange={(e) => setCompanySettings(prev => ({ ...prev, size: e.target.value }))}
                          className={`w-full p-3 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="Startup">Startup (1-10)</option>
                          <option value="Small">Small (11-50)</option>
                          <option value="Medium">Medium (51-200)</option>
                          <option value="Large">Large (201-1000)</option>
                          <option value="Enterprise">Enterprise (1000+)</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Industry
                        </label>
                        <input
                          type="text"
                          value={companySettings.industry}
                          onChange={(e) => setCompanySettings(prev => ({ ...prev, industry: e.target.value }))}
                          className={`w-full p-3 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Specialty/Focus
                      </label>
                      <textarea
                        value={companySettings.specialty}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, specialty: e.target.value }))}
                        rows={3}
                        className={`w-full p-3 rounded-lg border resize-none ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Company Description
                      </label>
                      <textarea
                        value={companySettings.description}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className={`w-full p-3 rounded-lg border resize-none ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* External Data Sources */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      📊 External Data Sources
                    </h3>
                    
                    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <Upload className="w-4 h-4 inline mr-2" />
                            Upload Files (ZIP, PDF, Excel)
                          </label>
                          <input
                            type="file"
                            multiple
                            accept=".zip,.pdf,.xlsx,.xls,.csv"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setCompanySettings(prev => ({
                                ...prev,
                                external_data: {
                                  ...prev.external_data,
                                  uploaded_files: files
                                }
                              }));
                            }}
                            className={`w-full p-3 rounded-lg border ${
                              darkMode 
                                ? 'bg-gray-600 border-gray-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          {companySettings.external_data.uploaded_files.length > 0 && (
                            <div className="mt-2">
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {companySettings.external_data.uploaded_files.length} file(s) selected
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <Globe className="w-4 h-4 inline mr-2" />
                            Website URLs (one per line)
                          </label>
                          <textarea
                            value={companySettings.external_data.website_urls.join('\n')}
                            onChange={(e) => {
                              const urls = e.target.value.split('\n').filter(url => url.trim());
                              setCompanySettings(prev => ({
                                ...prev,
                                external_data: {
                                  ...prev.external_data,
                                  website_urls: urls
                                }
                              }));
                            }}
                            rows={3}
                            placeholder="https://example.com&#10;https://competitor.com"
                            className={`w-full p-3 rounded-lg border resize-none ${
                              darkMode 
                                ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>

                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <FileText className="w-4 h-4 inline mr-2" />
                            Additional Data Sources
                          </label>
                          <textarea
                            value={companySettings.external_data.data_sources.join('\n')}
                            onChange={(e) => {
                              const sources = e.target.value.split('\n').filter(source => source.trim());
                              setCompanySettings(prev => ({
                                ...prev,
                                external_data: {
                                  ...prev.external_data,
                                  data_sources: sources
                                }
                              }));
                            }}
                            rows={3}
                            placeholder="Industry reports&#10;Market research data&#10;Customer surveys"
                            className={`w-full p-3 rounded-lg border resize-none ${
                              darkMode 
                                ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex justify-end space-x-3 p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowCompanyDialog(false)}
                className={`px-6 py-2 rounded-lg border ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCompanyDialog(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Play, Pause, Volume2 } from 'lucide-react';

interface CompetitorData {
  name: string;
  market_share: string;
  revenue: string;
  growth_rate: string;
}

interface TopTrend {
  trend: string;
  impact: "high" | "medium" | "low";
  growth_rate: string;
}

interface MarketGap {
  gap_title: string;
  description: string;
  target_segment: string;
  revenue_potential: string;
  barriers_to_entry: "low" | "medium" | "high";
}

interface MarketChartsProps {
  competitorData?: CompetitorData[];
  topTrends?: TopTrend[];
  marketGaps?: MarketGap[];
  darkMode?: boolean;
  onTTSClick?: (cardId: string, text: string) => void;
  onVolumeChange?: (cardId: string, volume: number) => void;
  ttsState?: {
    [key: string]: {
      isPlaying: boolean;
      volume: number;
      utterance: SpeechSynthesisUtterance | null;
    }
  };
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'];

const MarketCharts: React.FC<MarketChartsProps> = ({ 
  competitorData = [], 
  topTrends = [], 
  marketGaps = [],
  darkMode = false,
  onTTSClick,
  onVolumeChange,
  ttsState = {}
}) => {
  // Process competitor data for pie chart
  const pieData = competitorData.map((competitor, index) => ({
    name: competitor.name,
    value: parseFloat(competitor.market_share.replace('%', '')),
    revenue: competitor.revenue,
    growth: competitor.growth_rate
  }));

  // Process trends data for bar chart
  const trendsData = topTrends.map(trend => ({
    name: trend.trend.length > 20 ? trend.trend.substring(0, 20) + '...' : trend.trend,
    fullName: trend.trend,
    growth: parseFloat(trend.growth_rate.replace('%', '')),
    impact: trend.impact,
    impactScore: trend.impact === 'high' ? 3 : trend.impact === 'medium' ? 2 : 1
  }));

  // Process market gaps for opportunity chart
  const gapsData = marketGaps.map(gap => ({
    name: gap.gap_title.length > 15 ? gap.gap_title.substring(0, 15) + '...' : gap.gap_title,
    fullName: gap.gap_title,
    potential: parseFloat(gap.revenue_potential.replace(/[^0-9.]/g, '')),
    difficulty: gap.barriers_to_entry === 'low' ? 1 : gap.barriers_to_entry === 'medium' ? 2 : 3,
    segment: gap.target_segment
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 border rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.payload.revenue && (
                <span className={`text-xs block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Revenue: {entry.payload.revenue}
                </span>
              )}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 border rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.name}</p>
          <p className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Market Share: {data.value}%</p>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Revenue: {data.revenue}</p>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Growth: {data.growth}</p>
        </div>
      );
    }
    return null;
  };

  const TrendsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 border rounded-lg shadow-lg max-w-xs ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.fullName}</p>
          <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>Growth: {data.growth}%</p>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Impact: {data.impact}</p>
        </div>
      );
    }
    return null;
  };

  const GapsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 border rounded-lg shadow-lg max-w-xs ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.fullName}</p>
          <p className={`text-sm ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Potential: ${data.potential}M</p>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Segment: {data.segment}</p>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Difficulty: {data.difficulty === 1 ? 'Low' : data.difficulty === 2 ? 'Medium' : 'High'}
          </p>
        </div>
      );
    }
    return null;
  };

  // TTS Button Component
  const TTSButton = ({ cardId, text, title }: { cardId: string; text: string; title: string }) => {
    if (!onTTSClick) return null;
    
    const currentTTS = ttsState[cardId];
    const isPlaying = currentTTS?.isPlaying || false;
    const volume = currentTTS?.volume || 0.8;

    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onTTSClick(cardId, `${title}. ${text}`)}
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
        
        {(currentTTS || isPlaying) && onVolumeChange && (
          <div className="flex items-center space-x-1">
            <Volume2 className={`w-3 h-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => onVolumeChange(cardId, parseFloat(e.target.value))}
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

  return (
    <div className="space-y-8">
      {/* Market Share Pie Chart */}
      {pieData.length > 0 && (
        <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Market Share Distribution
            </h4>
            <TTSButton 
              cardId="market-share-chart" 
              text={`Market share distribution shows ${pieData.map(item => `${item.name} with ${item.value}% market share`).join(', ')}`}
              title="Market Share Distribution"
            />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Market Trends Bar Chart */}
      {trendsData.length > 0 && (
        <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Market Trends Growth Rate
            </h4>
            <TTSButton 
              cardId="trends-chart" 
              text={`Market trends analysis shows ${trendsData.map(trend => `${trend.fullName} with ${trend.growth}% growth rate and ${trend.impact} impact`).join(', ')}`}
              title="Market Trends Growth Rate"
            />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis stroke="#6B7280" />
                <Tooltip content={<TrendsTooltip />} />
                <Bar 
                  dataKey="growth" 
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Market Gaps Opportunity Chart */}
      {gapsData.length > 0 && (
        <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Market Opportunity Analysis
            </h4>
            <TTSButton 
              cardId="opportunity-chart" 
              text={`Market opportunity analysis reveals ${gapsData.map(gap => `${gap.fullName} with ${gap.potential} million potential in ${gap.segment} segment`).join(', ')}`}
              title="Market Opportunity Analysis"
            />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gapsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis stroke="#6B7280" />
                <Tooltip content={<GapsTooltip />} />
                <Bar 
                  dataKey="potential" 
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Combined Impact vs Growth Scatter */}
      {trendsData.length > 0 && (
        <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Trend Impact vs Growth Rate
            </h4>
            <TTSButton 
              cardId="impact-growth-chart" 
              text={`Trend impact versus growth rate analysis shows ${trendsData.map(trend => `${trend.fullName} trend with ${trend.growth}% growth and ${trend.impact} market impact`).join(', ')}`}
              title="Trend Impact vs Growth Rate"
            />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis stroke="#6B7280" />
                <Tooltip content={<TrendsTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="growth" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {competitorData.length > 0 && (
          <div className={`p-4 rounded-lg border ${
            darkMode 
              ? 'bg-blue-900/20 border-blue-800' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <h5 className={`text-sm font-medium mb-2 ${
              darkMode ? 'text-blue-100' : 'text-blue-900'
            }`}>
              Total Competitors Analyzed
            </h5>
            <p className={`text-2xl font-bold ${
              darkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {competitorData.length}
            </p>
          </div>
        )}
        
        {topTrends.length > 0 && (
          <div className={`p-4 rounded-lg border ${
            darkMode 
              ? 'bg-green-900/20 border-green-800' 
              : 'bg-green-50 border-green-200'
          }`}>
            <h5 className={`text-sm font-medium mb-2 ${
              darkMode ? 'text-green-100' : 'text-green-900'
            }`}>
              High-Impact Trends
            </h5>
            <p className={`text-2xl font-bold ${
              darkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              {topTrends.filter(t => t.impact === 'high').length}
            </p>
          </div>
        )}
        
        {marketGaps.length > 0 && (
          <div className={`p-4 rounded-lg border ${
            darkMode 
              ? 'bg-purple-900/20 border-purple-800' 
              : 'bg-purple-50 border-purple-200'
          }`}>
            <h5 className={`text-sm font-medium mb-2 ${
              darkMode ? 'text-purple-100' : 'text-purple-900'
            }`}>
              Market Opportunities
            </h5>
            <p className={`text-2xl font-bold ${
              darkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>
              {marketGaps.length}
            </p>
          </div>
        )}
      </div>

      {/* No Data Message */}
      {competitorData.length === 0 && topTrends.length === 0 && marketGaps.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-600">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg font-medium">No market data available</p>
            <p className="text-sm mt-1">Charts will appear once market research is completed</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketCharts;
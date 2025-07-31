/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

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
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'];

const MarketCharts: React.FC<MarketChartsProps> = ({ 
  competitorData = [], 
  topTrends = [], 
  marketGaps = [] 
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
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.payload.revenue && (
                <span className="text-xs text-gray-500 dark:text-gray-400 block">
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
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">Market Share: {data.value}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Revenue: {data.revenue}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Growth: {data.growth}</p>
        </div>
      );
    }
    return null;
  };

  const TrendsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-w-xs">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{data.fullName}</p>
          <p className="text-sm text-green-600 dark:text-green-400">Growth: {data.growth}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Impact: {data.impact}</p>
        </div>
      );
    }
    return null;
  };

  const GapsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-w-xs">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{data.fullName}</p>
          <p className="text-sm text-purple-600 dark:text-purple-400">Potential: ${data.potential}M</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Segment: {data.segment}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Difficulty: {data.difficulty === 1 ? 'Low' : data.difficulty === 2 ? 'Medium' : 'High'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Market Share Pie Chart */}
      {pieData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Market Share Distribution
          </h4>
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Market Trends Growth Rate
          </h4>
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Market Opportunity Analysis
          </h4>
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Trend Impact vs Growth Rate
          </h4>
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
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Total Competitors Analyzed
            </h5>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {competitorData.length}
            </p>
          </div>
        )}
        
        {topTrends.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h5 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
              High-Impact Trends
            </h5>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {topTrends.filter(t => t.impact === 'high').length}
            </p>
          </div>
        )}
        
        {marketGaps.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <h5 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
              Market Opportunities
            </h5>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
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
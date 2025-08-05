'use client';

import html2canvas from 'html2canvas-pro';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useEffect } from 'react';
import { use, useRef } from 'react';
const revenueData = [
  { month: 'Jan', revenue: 3.2, growth: 12 },
  { month: 'Feb', revenue: 3.8, growth: 18 },
  { month: 'Mar', revenue: 4.1, growth: 22 },
  { month: 'Apr', revenue: 3.9, growth: 15 },
  { month: 'May', revenue: 4.5, growth: 28 },
  { month: 'Jun', revenue: 4.8, growth: 32 },
];

const serviceData = [
  { name: 'Digital Transformation', value: 35, color: '#3B82F6' },
  { name: 'Cloud Solutions', value: 25, color: '#8B5CF6' },
  { name: 'Data Analytics', value: 20, color: '#10B981' },
  { name: 'Cybersecurity', value: 12, color: '#F59E0B' },
  { name: 'AI/ML Consulting', value: 8, color: '#EF4444' },
];

const clientSatisfactionData = [
  { quarter: 'Q1 2023', satisfaction: 92, projects: 45 },
  { quarter: 'Q2 2023', satisfaction: 94, projects: 52 },
  { quarter: 'Q3 2023', satisfaction: 96, projects: 48 },
  { quarter: 'Q4 2023', satisfaction: 98, projects: 65 },
  { quarter: 'Q1 2024', satisfaction: 97, projects: 58 },
  { quarter: 'Q2 2024', satisfaction: 99, projects: 72 },
];

const geographicalData = [
  { region: 'Europe', revenue: 18.5 },
  { region: 'North America', revenue: 12.3 },
  { region: 'Asia Pacific', revenue: 8.7 },
  { region: 'Middle East', revenue: 3.2 },
  { region: 'Latin America', revenue: 2.5 },
];


export default function ChartsSection() {
  const revenueRef = useRef(null);
  const serviceRef = useRef(null);
  const satisfactionRef = useRef(null);
  const geoRef = useRef(null);

  const captureAndSendCharts = async () => {
  const chartRefs = [
    { ref: revenueRef, name: 'revenue-growth' },
    { ref: serviceRef, name: 'service-distribution' },
    { ref: satisfactionRef, name: 'client-satisfaction' },
    { ref: geoRef, name: 'revenue-by-region' },
  ];

  for (const { ref, name } of chartRefs) {
    if (ref.current) {
      const canvas = await html2canvas(ref.current);
      const image = canvas.toDataURL('image/png');
      console.log("sending image")
      await fetch('http://localhost:5000/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chartName: name,
          imageData: image, // base64 PNG
        }),
      });
    }
  }
};

useEffect(() => {
  captureAndSendCharts();
}, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Growth Chart */}
      <motion.div ref={revenueRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Revenue Growth (€M)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="month" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#F9FAFB',
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Service Distribution */}
      <motion.div  ref={serviceRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Service Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={serviceData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {serviceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#F9FAFB',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {serviceData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Client Satisfaction */}
      <motion.div ref={satisfactionRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Client Satisfaction & Projects
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={clientSatisfactionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="quarter" stroke="#6B7280" />
            <YAxis yAxisId="left" stroke="#6B7280" />
            <YAxis yAxisId="right" orientation="right" stroke="#6B7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#F9FAFB',
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="satisfaction"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="projects"
              stroke="#8B5CF6"
              strokeWidth={3}
              dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Geographical Revenue */}
      <motion.div ref={geoRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Revenue by Region (€M)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={geographicalData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis type="number" stroke="#6B7280" />
            <YAxis dataKey="region" type="category" stroke="#6B7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#F9FAFB',
              }}
            />
            <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

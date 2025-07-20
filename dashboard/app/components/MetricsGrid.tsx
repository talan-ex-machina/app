'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, DollarSign, Award, Globe } from 'lucide-react';

const metrics = [
  {
    title: 'Total Revenue',
    value: '€45.2M',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'from-green-400 to-green-600',
  },
  {
    title: 'Active Clients',
    value: '1,247',
    change: '+8.2%',
    trend: 'up',
    icon: Users,
    color: 'from-blue-400 to-blue-600',
  },
  {
    title: 'Projects Delivered',
    value: '892',
    change: '+15.3%',
    trend: 'up',
    icon: Award,
    color: 'from-purple-400 to-purple-600',
  },
  {
    title: 'Global Presence',
    value: '24',
    change: '+4',
    trend: 'up',
    icon: Globe,
    color: 'from-orange-400 to-orange-600',
  },
  {
    title: 'Consultants',
    value: '3,450',
    change: '+7.8%',
    trend: 'up',
    icon: Users,
    color: 'from-indigo-400 to-indigo-600',
  },
  {
    title: 'Client Satisfaction',
    value: '98.2%',
    change: '+2.1%',
    trend: 'up',
    icon: TrendingUp,
    color: 'from-pink-400 to-pink-600',
  },
];

export default function MetricsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color}`}>
              <metric.icon className="w-6 h-6 text-white" />
            </div>
            <div className={`flex items-center space-x-1 text-sm ${
              metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
            }`}>
              {metric.trend === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-medium">{metric.change}</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {metric.value}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {metric.title}
            </p>
          </div>

          <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '75%' }}
              transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
              className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

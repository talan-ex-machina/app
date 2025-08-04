'use client';

import { motion } from 'framer-motion';
import { 
  Home, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Settings, 
  FileText,
  Briefcase,
  Globe,
  Cpu
} from 'lucide-react';

const menuItems = [
  { icon: Home, label: 'Dashboard', active: true },
  { icon: BarChart3, label: 'Analytics' },
  { icon: Users, label: 'Clients' },
  { icon: Briefcase, label: 'Projects' },
  { icon: TrendingUp, label: 'Performance' },
  { icon: Globe, label: 'Global Presence' },
  { icon: Cpu, label: 'Technology' },
  { icon: FileText, label: 'Reports' },
  { icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  darkMode?: boolean;
}

export default function Sidebar({ darkMode = false }: SidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-64 border-r shadow-lg ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Logo */}
      <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Talan</h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Consulting</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
              item.active
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </motion.div>
        ))}
      </nav>

      
    </motion.aside>
  );
}

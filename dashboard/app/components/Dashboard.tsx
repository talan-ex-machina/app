'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import MetricsGrid from './MetricsGrid';
import Simple3DScene from './Simple3DScene';
import ARVRToggle from './ARVRToggle';
import ChartsSection from './ChartsSection';
import Enhanced3DView from './Enhanced3DView';

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [isXRActive, setIsXRActive] = useState(false);
  const [show3DView, setShow3DView] = useState(false);

  useEffect(() => {
    // Check for user preference or system preference
    const isDark = localStorage.getItem('darkMode') === 'true' || 
                   (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />
          
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Hero Section with 3D Scene */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative h-96 rounded-2xl overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 shadow-2xl"
            >
              <Simple3DScene />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white z-10">
                  <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-5xl font-bold mb-4"
                  >
                    Talan Consulting
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-xl mb-6"
                  >
                    Innovation • Technology • Transformation
                  </motion.p>
                  <div className="flex space-x-4 justify-center">
                    <ARVRToggle isXRActive={isXRActive} setIsXRActive={setIsXRActive} />
                    <motion.button
                      onClick={() => setShow3DView(!show3DView)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {show3DView ? 'Hide' : 'Launch'} Business Intelligence
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Metrics Grid */}
            <MetricsGrid />

            {/* Enhanced 3D Business Intelligence Hub */}
            {show3DView && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Business Intelligence Hub
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Explore multi-sector analysis with interactive 3D visualizations
                  </p>
                </div>
                <Enhanced3DView />
              </motion.div>
            )}

            {/* Charts Section */}
            <ChartsSection />
          </main>
        </div>
      </div>

      {/* Enhanced 3D View Modal for XR Mode */}
      {isXRActive && (
        <Enhanced3DView 
          isOpen={true} 
          onClose={() => setIsXRActive(false)} 
        />
      )}
    </div>
  );
}

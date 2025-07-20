'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import MetricsGrid from './MetricsGrid';
import ThreeJSScene from './ThreeJSScene';
import ARVRToggle from './ARVRToggle';
import ChartsSection from './ChartsSection';
import ProjectsSection from './ProjectsSection';
import TestimonialsSection from './TestimonialsSection';

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [isXRActive, setIsXRActive] = useState(false);

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
              <ThreeJSScene />
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
                  <ARVRToggle isXRActive={isXRActive} setIsXRActive={setIsXRActive} />
                </div>
              </div>
            </motion.div>

            {/* Metrics Grid */}
            <MetricsGrid />

            {/* Charts Section */}
            <ChartsSection />

            {/* Projects and Testimonials */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ProjectsSection />
              <TestimonialsSection />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

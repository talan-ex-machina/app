'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import BusinessPlanningHub from './BusinessPlanningHub';
// import Simple3DScene from './Simple3DScene';
// import ARVRToggle from './ARVRToggle';
// import ChartsSection from './ChartsSection';
// import Enhanced3DView from './Enhanced3DView';
// import DatabaseDashboard from './DatabaseDashboard';

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  // const [isXRActive, setIsXRActive] = useState(false);
  // const [show3DView, setShow3DView] = useState(false);
  // const [showDatabaseHub, setShowDatabaseHub] = useState(false);

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
            {/* Hero Section - Business Planning */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl"
            >
              <BusinessPlanningHub darkMode={darkMode} />
            </motion.div>

            {/* Metrics Grid - Basic version without props */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Active Projects
                </h3>
                <p className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  24
                </p>
              </div>
              
              <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Revenue Growth
                </h3>
                <p className={`text-3xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  +18%
                </p>
              </div>
              
              <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Client Satisfaction
                </h3>
                <p className={`text-3xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  98%
                </p>
              </div>
              
              <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Team Members
                </h3>
                <p className={`text-3xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  156
                </p>
              </div>
            </motion.div>

            {/* Commented out 3D and Database components for now */}
            {/* 
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
                      3D Intelligence Hub
                    </motion.button>
                    <motion.button
                      onClick={() => setShowDatabaseHub(!showDatabaseHub)}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Database Hub
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

            {show3DView && (
              <Enhanced3DView 
                darkMode={darkMode} 
                onClose={() => setShow3DView(false)} 
              />
            )}

            {showDatabaseHub && (
              <DatabaseDashboard 
                darkMode={darkMode} 
                onClose={() => setShowDatabaseHub(false)} 
              />
            )}

            <ChartsSection darkMode={darkMode} />
            */}
          </main>
        </div>
      </div>
    </div>
  );
}

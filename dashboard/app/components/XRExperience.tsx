'use client';

import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Headphones, Eye } from 'lucide-react';

interface XRExperienceProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'AR' | 'VR';
}

function XRScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {/* 3D Dashboard Elements in XR Space */}
      <mesh position={[0, 1.6, -2]}>
        <planeGeometry args={[4, 2]} />
        <meshStandardMaterial color="#1a1a2e" opacity={0.8} transparent />
      </mesh>
      
      <mesh position={[0, 1.6, -1.99]}>
        <boxGeometry args={[0.3, 0.3, 0.1]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      
      <mesh position={[0.5, 1.6, -1.99]}>
        <boxGeometry args={[0.3, 0.3, 0.1]} />
        <meshStandardMaterial color="#8b5cf6" />
      </mesh>
      
      <mesh position={[-0.5, 1.6, -1.99]}>
        <boxGeometry args={[0.3, 0.3, 0.1]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>
    </>
  );
}

export default function XRExperience({ isOpen, onClose, mode }: XRExperienceProps) {
  const [isXRSupported, setIsXRSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for XR support
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      navigator.xr?.isSessionSupported('immersive-ar').then((supported) => {
        setIsXRSupported(supported);
        setIsLoading(false);
      }).catch(() => {
        setIsXRSupported(false);
        setIsLoading(false);
      });
    } else {
      setIsXRSupported(false);
      setIsLoading(false);
    }
  }, []);

  const startXRSession = async () => {
    try {
      // XR session would be started here
      console.log(`Starting ${mode} session...`);
    } catch (error) {
      console.error('Failed to start XR session:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full mx-4 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                {mode === 'AR' ? (
                  <Eye className="w-10 h-10 text-white" />
                ) : (
                  <Headphones className="w-10 h-10 text-white" />
                )}
              </div>

              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {mode} Experience
              </h2>

              {isLoading ? (
                <div className="text-gray-600 dark:text-gray-400 mb-6">
                  Checking {mode} support...
                </div>
              ) : isXRSupported ? (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Experience the Talan dashboard in {mode === 'AR' ? 'augmented reality' : 'virtual reality'}.
                    Interact with 3D data visualizations and immersive analytics.
                  </p>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {mode} Features:
                    </h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• 3D data visualization</li>
                      <li>• Interactive dashboard elements</li>
                      <li>• Hand tracking and gesture controls</li>
                      <li>• Immersive analytics experience</li>
                      <li>• Real-time collaboration</li>
                    </ul>
                  </div>

                  <button
                    onClick={startXRSession}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    Enter {mode} Mode
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {mode} is not supported on this device. You need a compatible {mode} headset and browser support.
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Requirements:
                    </h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Compatible {mode} headset (Quest, HoloLens, etc.)</li>
                      <li>• WebXR-enabled browser (Chrome, Firefox, Edge)</li>
                      <li>• Secure HTTPS connection</li>
                      <li>• Updated browser and device drivers</li>
                    </ul>
                  </div>

                  <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                    <Canvas camera={{ position: [0, 0, 5] }}>
                      <XRScene />
                      <OrbitControls enableZoom={false} />
                    </Canvas>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                    Preview of {mode} dashboard experience
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

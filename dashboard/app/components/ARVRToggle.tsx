'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Headphones, Monitor, AlertCircle, X } from 'lucide-react';

interface ARVRToggleProps {
  isXRActive: boolean;
  setIsXRActive: (value: boolean) => void;
}

export default function ARVRToggle({ setIsXRActive }: ARVRToggleProps) {
  const [xrMode, setXrMode] = useState<'AR' | 'VR' | '3D'>('3D');
  const [showModal, setShowModal] = useState(false);
  const [isXRSupported, setIsXRSupported] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState('');

  useEffect(() => {
    // Check for XR support
    const checkXRSupport = async () => {
      if (typeof navigator !== 'undefined' && 'xr' in navigator) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const xr = (navigator as any).xr;
          const isARSupported = await xr?.isSessionSupported('immersive-ar');
          const isVRSupported = await xr?.isSessionSupported('immersive-vr');
          setIsXRSupported(isARSupported || isVRSupported);
        } catch {
          setIsXRSupported(false);
        }
      } else {
        setIsXRSupported(false);
      }

      // Detect device type
      const userAgent = navigator.userAgent;
      if (/Mobi|Android/i.test(userAgent)) {
        setDeviceInfo('Mobile Device - Limited XR Support');
      } else if (/iPad|Mac/i.test(userAgent)) {
        setDeviceInfo('Apple Device - Safari XR Limited');
      } else {
        setDeviceInfo('Desktop - Chrome/Edge Recommended for XR');
      }
    };

    checkXRSupport();
  }, []);

  const handleARClick = () => {
    if (isXRSupported) {
      setXrMode('AR');
      setIsXRActive(true);
    } else {
      setXrMode('AR');
      setShowModal(true);
    }
  };

  const handleVRClick = () => {
    if (isXRSupported) {
      setXrMode('VR');
      setIsXRActive(true);
    } else {
      setXrMode('VR');
      setShowModal(true);
    }
  };

  const handle3DClick = () => {
    setXrMode('3D');
    setIsXRActive(true);
    setShowModal(false);
  };

  return (
    <>
      <div className="flex space-x-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleARClick}
          className={`flex items-center space-x-2 px-4 py-2 backdrop-blur-md rounded-full font-medium transition-all ${
            isXRSupported 
              ? 'bg-white/20 text-white hover:bg-white/30' 
              : 'bg-white/10 text-white/70 cursor-not-allowed'
          }`}
          disabled={!isXRSupported}
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm">AR View</span>
          {!isXRSupported && <AlertCircle className="w-3 h-3" />}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleVRClick}
          className={`flex items-center space-x-2 px-4 py-2 backdrop-blur-md rounded-full font-medium transition-all ${
            isXRSupported 
              ? 'bg-white/20 text-white hover:bg-white/30' 
              : 'bg-white/10 text-white/70 cursor-not-allowed'
          }`}
          disabled={!isXRSupported}
        >
          <Headphones className="w-4 h-4" />
          <span className="text-sm">VR Experience</span>
          {!isXRSupported && <AlertCircle className="w-3 h-3" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handle3DClick}
          className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white font-medium hover:bg-white/30 transition-all"
        >
          <Monitor className="w-4 h-4" />
          <span className="text-sm">3D View</span>
        </motion.button>
      </div>

      {/* XR Not Supported Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {xrMode} Not Available
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {deviceInfo}
                </p>
              </div>

              <div className="text-gray-600 dark:text-gray-300 text-sm space-y-2">
                <p>
                  <strong>{xrMode} features</strong> require compatible hardware and browser support.
                </p>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Recommended for XR:
                  </p>
                  <ul className="text-blue-600 dark:text-blue-400 text-xs space-y-1">
                    <li>• Desktop: Chrome/Edge with XR support</li>
                    <li>• Mobile: Android Chrome with ARCore</li>
                    <li>• VR Headset: Oculus Browser, SteamVR</li>
                  </ul>
                </div>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handle3DClick}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Monitor className="w-4 h-4" />
                  <span>Try 3D View Instead</span>
                </motion.button>
                
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

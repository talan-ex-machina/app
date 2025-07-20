'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Headphones } from 'lucide-react';
import XRExperience from './XRExperience';

interface ARVRToggleProps {
  isXRActive: boolean;
  setIsXRActive: (value: boolean) => void;
}

export default function ARVRToggle({ isXRActive, setIsXRActive }: ARVRToggleProps) {
  const [xrMode, setXrMode] = useState<'AR' | 'VR'>('AR');
  const [showXRModal, setShowXRModal] = useState(false);

  const handleARClick = () => {
    setXrMode('AR');
    setShowXRModal(true);
  };

  const handleVRClick = () => {
    setXrMode('VR');
    setShowXRModal(true);
  };

  return (
    <>
      <div className="flex space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleARClick}
          className="flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-md rounded-full text-white font-medium hover:bg-white/30 transition-all"
        >
          <Eye className="w-5 h-5" />
          <span>AR View</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleVRClick}
          className="flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-md rounded-full text-white font-medium hover:bg-white/30 transition-all"
        >
          <Headphones className="w-5 h-5" />
          <span>VR Experience</span>
        </motion.button>
      </div>

      <XRExperience
        isOpen={showXRModal}
        onClose={() => setShowXRModal(false)}
        mode={xrMode}
      />
    </>
  );
}

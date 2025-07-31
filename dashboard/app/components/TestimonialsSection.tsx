'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { clientTestimonials } from '../data/mockData';

interface TestimonialsSectionProps {
  darkMode?: boolean;
}

export default function TestimonialsSection({ darkMode = false }: TestimonialsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.2 }}
      className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Client Testimonials
      </h3>

      <div className="space-y-4">
        {clientTestimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={`border rounded-xl p-4 relative overflow-hidden ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <div className="absolute top-4 right-4 opacity-10">
              <Quote className="w-8 h-8 text-blue-500" />
            </div>
            
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                {testimonial.client.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {testimonial.client}
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {testimonial.position}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {testimonial.company}
                </p>
              </div>
            </div>

            <p className={`mb-3 italic ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              &ldquo;{testimonial.quote}&rdquo;
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                darkMode 
                  ? 'bg-blue-900 text-blue-200' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {testimonial.projectType}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

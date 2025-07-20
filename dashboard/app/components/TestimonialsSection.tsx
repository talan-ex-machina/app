'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { clientTestimonials } from '../data/mockData';

export default function TestimonialsSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.2 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
    >
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Client Testimonials
      </h3>

      <div className="space-y-4">
        {clientTestimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 opacity-10">
              <Quote className="w-8 h-8 text-blue-500" />
            </div>
            
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                {testimonial.client.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {testimonial.client}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {testimonial.position}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {testimonial.company}
                </p>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-3 italic">
              &ldquo;{testimonial.quote}&rdquo;
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                {testimonial.projectType}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

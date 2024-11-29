import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Store, CreditCard, BarChart3, Shield, ChevronDown, Globe, Zap, Users } from 'lucide-react';
import ParticlesBackground from '../components/ParticlesBackground';
import FloatingCard from '../components/FloatingCard';

const APP_NAME = import.meta.env.VITE_APP_NAME;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const features = [
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Connect with affiliates worldwide and expand your market presence.'
  },
  {
    icon: Zap,
    title: 'Instant Setup',
    description: 'Get your affiliate program up and running in minutes, not days.'
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'Automated, secure commission payments to your affiliates.'
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Track performance and optimize your campaigns with detailed insights.'
  }
];

const stats = [
  { number: '10K+', label: 'Active Affiliates' },
  { number: '$1M+', label: 'Commissions Paid' },
  { number: '50+', label: 'Countries' },
  { number: '24/7', label: 'Support' }
];

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const [isVisible, setIsVisible] = useState(true);

  const scaleProgress = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const opacityProgress = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white overflow-hidden">
      <ParticlesBackground />
      
      {/* Hero Section */}
      <div className="relative">
        {/* Background gradient and effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-blue-50/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent" />
        
        {/* Main content */}
        <div className="relative">
          {/* Navigation */}
          <motion.nav 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 50, delay: 0.2 }}
            className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 shadow-sm"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <motion.div 
                  className="flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
                  <span className="ml-2 text-xl font-bold text-gray-900">{APP_NAME}</span>
                </motion.div>
                <div className="flex items-center space-x-4">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link
                      to="/login"
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                    >
                      Sign in
                    </Link>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/register"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      Get Started
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.nav>

          {/* Hero Content */}
          <div className="pt-24 pb-16 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center space-y-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
                  Transform Your
                  <span className="block mt-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Affiliate Business
                  </span>
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 leading-relaxed"
              >
                Launch your affiliate program in minutes. Scale your business with a powerful platform that handles everything from tracking to payments.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  Start Free Trial
                </Link>
                <Link
                  to="/learn-more"
                  className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                >
                  Learn More
                  <ChevronDown className="ml-2 h-5 w-5 inline-block" />
                </Link>
              </motion.div>
            </div>

            {/* Stats Section */}
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                      <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {stat.number}
                        </div>
                        <div className="text-sm font-medium text-gray-600 mt-1">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-16 bg-gradient-to-b from-blue-50/50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <motion.h2
                  variants={item}
                  className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
                >
                  Everything you need to succeed
                </motion.h2>
                <motion.p
                  variants={item}
                  className="text-xl text-gray-600 max-w-3xl mx-auto"
                >
                  Built for businesses that want to grow through affiliate marketing
                </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
              <motion.h2
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
              >
                <span className="block">Ready to dive in?</span>
                <span className="block text-blue-200">Start your free trial today.</span>
              </motion.h2>
              <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex rounded-md shadow"
                >
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
                  >
                    Get started
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <footer className="bg-white">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <p className="text-sm text-gray-400 text-center sm:text-left">
                  &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
                </p>
                <div className="flex justify-center sm:justify-end space-x-6">
                  <a href="#" className="text-sm text-gray-400 hover:text-gray-500 transition-colors">Terms</a>
                  <a href="#" className="text-sm text-gray-400 hover:text-gray-500 transition-colors">Privacy</a>
                  <a href="#" className="text-sm text-gray-400 hover:text-gray-500 transition-colors">Contact</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

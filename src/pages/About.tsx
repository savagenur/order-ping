import { motion } from 'framer-motion';
import { Smartphone, LineChart, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import orderpingLogo from '/orderping-logo.svg';
import Logo from '../components/ui/Logo';

export default function About() {
  const scrollToContact = () => {
    const element = document.getElementById('final-cta');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sticky Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50">
        <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4">
          {/* Logo on the left */}
          <div className="w-10 h-10 sm:w-12 sm:h-12">
            <Logo />
          </div>
          
          {/* Navigation links on the right */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/login"
              className="text-zinc-300 hover:text-white px-2 py-2 rounded-lg transition-all duration-200 hover:bg-zinc-800/50 text-sm"
            >
              Login
            </Link>
            <button
              onClick={scrollToContact}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="min-h-screen flex flex-col items-center justify-center px-4 relative"
      >
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <img src={orderpingLogo} alt="OrderPing Logo" className="w-8 h-8 sm:w-12 sm:h-12" />
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                OrderPing
              </h1>
            </div>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight"
          >
            Modern Queue Management
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              for Food Carts
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-lg sm:text-xl md:text-2xl text-zinc-300 mb-8 sm:mb-12 max-w-2xl mx-auto"
          >
            Replace shouting with a digital board.
            <br />
            <span className="text-zinc-400">No hardware, no hassle.</span>
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
            >
              Launch Your Cart
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* The Problem Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-16 sm:py-24 px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-8"
          >
            The Problem
          </motion.h3>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6 sm:gap-8 text-left"
          >
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <h4 className="text-lg sm:text-xl font-semibold text-red-400 mb-3 sm:mb-4">Lost Customers</h4>
              <p className="text-zinc-300 leading-relaxed">
                When customers can't see their order status, they wander off, get frustrated, or leave entirely. 
                Every confused customer is a lost sale and a damaged reputation.
              </p>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <h4 className="text-lg sm:text-xl font-semibold text-orange-400 mb-3 sm:mb-4">Constant Noise</h4>
              <p className="text-zinc-300 leading-relaxed">
                Shouting order numbers creates chaos, stresses your staff, and makes your cart seem unprofessional. 
                Your customers deserve a better experience.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* The Solution Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-16 sm:py-24 px-4 bg-gradient-to-b from-transparent to-blue-500/5"
      >
        <div className="max-w-6xl mx-auto">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12 sm:mb-16"
          >
            The Solution
          </motion.h3>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 sm:gap-8"
          >
            {/* Card 1: QR Powered */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.05, y: -5 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl p-6 sm:p-8 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
            >
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/20 rounded-full mb-4 sm:mb-6">
                <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
              <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-blue-400">QR Powered</h4>
              <p className="text-zinc-300 leading-relaxed">
                Customers scan a simple QR code and watch their order status from their phones. 
                No app download required - just instant access to real-time updates.
              </p>
            </motion.div>

            {/* Card 2: Chef Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.05, y: -5 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl p-6 sm:p-8 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300"
            >
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-cyan-500/20 rounded-full mb-4 sm:mb-6">
                <img src={orderpingLogo} alt="OrderPing Logo" className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-cyan-400">Chef Dashboard</h4>
              <p className="text-zinc-300 leading-relaxed">
                Simple 1-click updates from any device. Mark orders as ready with a single tap, 
                and watch them disappear from the queue automatically.
              </p>
            </motion.div>

            {/* Card 3: Growth Tools */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl p-6 sm:p-8 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300"
            >
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-full mb-4 sm:mb-6">
                <LineChart className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
              </div>
              <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-green-400">Growth Tools</h4>
              <p className="text-zinc-300 leading-relaxed">
                Direct links to your Instagram and Google Reviews built right into the customer experience. 
                Turn happy customers into 5-star reviews and social media followers.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Portland Local Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-16 sm:py-24 px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-full px-4 py-2 mb-6 backdrop-blur-sm"
          >
            <MapPin className="w-4 h-4 text-zinc-400" />
            <span className="text-sm text-zinc-300 font-medium">Built in Portland, for Portland</span>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto"
          >
            Designed specifically for the Portland food cart community. 
            We understand the unique challenges of running a cart in PDX - 
            from rainy days to lunch rushes to festival crowds.
          </motion.p>
        </div>
      </motion.section>

      {/* Final CTA */}
      <motion.section 
        id="final-cta"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-16 sm:py-24 px-4 bg-gradient-to-t from-blue-500/10 to-transparent"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8"
          >
            Ready to Transform Your Cart?
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg sm:text-xl text-zinc-300 mb-8 sm:mb-12"
          >
            Join dozens of Portland carts already using OrderPing
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
            >
              Launch Your Cart
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}

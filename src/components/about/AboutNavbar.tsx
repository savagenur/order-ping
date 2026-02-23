import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

interface AboutNavbarProps {
  scrollToContact: () => void;
}

export default function AboutNavbar({ scrollToContact }: AboutNavbarProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 w-full z-50 bg-zinc-950/70 backdrop-blur-xl border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-8 py-3">
        {/* Logo + brand name */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center group-hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.7)] transition-all duration-300">
            <Logo />
          </div>
          <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            OrderPing
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="text-zinc-400 hover:text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            Sign in
          </Link>
          <button
            onClick={scrollToContact}
            className="group inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

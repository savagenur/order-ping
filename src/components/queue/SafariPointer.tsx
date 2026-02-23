import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

interface SafariPointerProps {
  isVisible: boolean;
}

// Extend Navigator interface for iOS standalone detection
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

// Enhanced iOS detection using vibrate API and user agent
const isIOSDevice = (): boolean => {
  // Check for vibrate API (iOS doesn't support it)
  const hasVibrate = 'vibrate' in navigator;
  
  // Check user agent for iOS devices
  const isIOSUA = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // iOS devices don't support vibrate, so this helps distinguish
  return isIOSUA && !hasVibrate;
};

// Check if app is in standalone mode (PWA)
const isStandaloneMode = (): boolean => {
  return window.navigator.standalone === true;
};

export default function SafariPointer({ isVisible }: SafariPointerProps) {
  const [viewportOffset, setViewportOffset] = useState(10);

  // Handle mobile Safari visual viewport changes (address bar expand/minimize)
  useEffect(() => {
    if (!isVisible) return;

    const updateViewportOffset = () => {
      // Use visual viewport API if available for precise positioning
      if ('visualViewport' in window && window.visualViewport) {
        const viewport = window.visualViewport;
        const offset = Math.max(10, viewport.height - window.innerHeight + 10);
        setViewportOffset(offset);
      }
    };

    // Initial check
    updateViewportOffset();

    // Listen for viewport changes
    if ('visualViewport' in window && window.visualViewport) {
      const viewport = window.visualViewport;
      viewport.addEventListener('resize', updateViewportOffset);
      viewport.addEventListener('scroll', updateViewportOffset);

      return () => {
        viewport.removeEventListener('resize', updateViewportOffset);
        viewport.removeEventListener('scroll', updateViewportOffset);
      };
    } else {
      // Fallback: listen for window resize/orientation changes
      window.addEventListener('resize', updateViewportOffset);
      window.addEventListener('orientationchange', updateViewportOffset);

      return () => {
        window.removeEventListener('resize', updateViewportOffset);
        window.removeEventListener('orientationchange', updateViewportOffset);
      };
    }
  }, [isVisible]);

  // Enhanced detection logic
  const shouldRender = isVisible && isIOSDevice() && !isStandaloneMode();

  if (!shouldRender) return null;

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{ 
            position: 'fixed',
            bottom: `${viewportOffset}px`,
            right: '20px',
            zIndex: 70 // Higher than bottom sheet
          }}
          className="flex flex-col items-center"
        >
          {/* Text bubble */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 mb-3 shadow-lg"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <p className="text-xs font-medium text-gray-700">
              Tap Share to install
            </p>
          </motion.div>

          {/* Floating arrow with ping effect */}
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative self-end"
          >
            {/* Ping pulse effect */}
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 0.2, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-gray-400 rounded-full"
              style={{ backgroundColor: '#9CA3AF' }}
            />
            
            {/* Second ping ring for enhanced effect */}
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              className="absolute inset-0 bg-gray-300 rounded-full"
              style={{ backgroundColor: '#D1D5DB' }}
            />
            
            {/* Arrow icon */}
            <div className="relative bg-gray-500 rounded-full p-2 shadow-lg border-2 border-gray-600 pr-8" style={{ backgroundColor: '#6B7280', paddingRight: '15px',paddingLeft: '15px' }}>
              <ChevronDown className="w-5 h-5 text-white" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

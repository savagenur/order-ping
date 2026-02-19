
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Logo = () => {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [isGlowing, setIsGlowing] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleClick = () => {
    // Increment click count
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check if this is the third tap
    if (newClickCount === 3) {
      // Navigate to login
      navigate('/dashboard');
      
      // Show glow effect
      setIsGlowing(true);
      setTimeout(() => setIsGlowing(false), 300);
      
      // Reset click count
      setClickCount(0);
    } else {
      // Set timeout to reset counter after 1 second
      timeoutRef.current = setTimeout(() => {
        setClickCount(0);
      }, 1000);
    }
  };

  return (
    <div 
      className={`cursor-pointer transition-all duration-300 ${
        isGlowing ? 'drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]' : ''
      }`}
      onClick={handleClick}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="48" 
        height="48" 
        viewBox="0 0 48 48" 
        fill="none"
      >
        <rect width="48" height="48" fill="white" fill-opacity="0.01"/>
        
        {/* Main circle */}
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="#FBBF24"
          stroke="#D1D5DB"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        {/* Small rectangle */}
        <path d="M44 18V20H42V18H44Z" fill="#FBBF24"/>

        {/* Outer arc */}
        <path
          d="M42 20H44V18H42V20ZM42 20C42 29.1371 36.4299 36.9732 28.5 40.2978"
          stroke="#D1D5DB"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        {/* Base */}
        <path
          d="M14 35L10 44H30L26 35"
          stroke="#D1D5DB"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        {/* Center circle */}
        <circle
          cx="20"
          cy="20"
          r="4"
          fill="#FBBF24"
          stroke="#D1D5DB"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        {/* Inner arc */}
        <path
          d="M10 20C10 14.4772 14.4772 10 20 10"
          stroke="#D1D5DB"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  );
};

export default Logo;

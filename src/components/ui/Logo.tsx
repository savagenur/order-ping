
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
      <img 
        src="/logox.svg?v=3" 
        alt="OrderPing Logo"
        width="48"
        height="48"
        className="w-12 h-12"
      />
    </div>
  );
};

export default Logo;

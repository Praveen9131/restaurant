import React, { useEffect, useRef, useState } from 'react';

const SuccessDialog = ({ show, orderNumber, onClose }) => {
  const timerRef = useRef(null);
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (show) {
      // Play "tin tin tin" success sound (three ascending notes)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Play three notes in sequence with smoother transitions
      [523.25, 659.25, 783.99].forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + (index * 0.15);
        
        // Smoother fade in/out for better transition
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.03);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.12);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2);
      });
      
      // No text-to-speech - just the tin-tin-tin sound
      
      // Countdown timer (4 seconds)
      let count = 4;
      setCountdown(4);
      
      const countdownInterval = setInterval(() => {
        count--;
        setCountdown(count);
      }, 1000);

      // Auto-close and redirect after 4 seconds
      timerRef.current = setTimeout(() => {
        clearInterval(countdownInterval);
        onClose();
      }, 4000);

      return () => {
        clearInterval(countdownInterval);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex items-center justify-center z-50">
      {/* Success Animation */}
      <div className="flex flex-col items-center justify-center h-full w-full p-8 animate-fade-in">
        {/* Animated Checkmark */}
        <div className="relative mb-10">
          {/* Outer Ring Animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-white border-opacity-50 animate-ring-expand"></div>
          </div>
          
          {/* Checkmark Circle */}
          <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl animate-scale-circle">
            <svg 
              className="w-14 h-14 text-green-600 animate-draw-check" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth={3}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Order Number */}
        {orderNumber && (
          <div className="bg-white bg-opacity-20 backdrop-blur-md border-2 border-white border-opacity-40 rounded-2xl px-10 py-6 min-w-[280px]">
            <p className="text-sm text-white text-center mb-2 font-medium opacity-90">Order Number</p>
            <p className="text-3xl font-bold text-white text-center">{orderNumber}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Add custom animations to your global CSS or use inline styles
const styles = `
  @keyframes fade-in {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  
  @keyframes scale-circle {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.15);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  @keyframes ring-expand {
    0% {
      transform: scale(0.5);
      opacity: 1;
    }
    100% {
      transform: scale(2.5);
      opacity: 0;
    }
  }
  
  @keyframes draw-check {
    0% {
      stroke-dasharray: 0, 100;
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      stroke-dasharray: 100, 0;
      opacity: 1;
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }
  
  .animate-scale-circle {
    animation: scale-circle 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .animate-ring-expand {
    animation: ring-expand 1.2s ease-out infinite;
  }
  
  .animate-draw-check {
    animation: draw-check 1s ease-out 0.4s forwards;
    stroke-dasharray: 0, 100;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  if (!document.getElementById('success-dialog-styles')) {
    styleSheet.id = 'success-dialog-styles';
    document.head.appendChild(styleSheet);
  }
}

export default SuccessDialog;
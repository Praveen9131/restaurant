import React from 'react';

const SeaSideLogo = ({ size = 'default', showText = true, className = '' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-20 h-20'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Icon - SeaSide Bake Design */}
      <div className={`${sizeClasses[size]} bg-orange-500 rounded-full flex items-center justify-center shadow-lg relative group hover:scale-105 transition-all duration-300`}>
        {/* Option 1: Try to use the actual logo image first */}
        <img 
          src="https://seasidesample.s3.ap-south-2.amazonaws.com/dishes/logo.jpg" 
          alt="SeaSide Bake Logo" 
          className="w-full h-full object-contain rounded-lg"
          onError={(e) => {
            // If image fails, hide it and show SVG
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        
        {/* Option 2: SVG replica of your logo design */}
        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'none'}}>
          {/* Stacked layers/baking rack icon - matches your logo design */}
          <rect x="6" y="8" width="12" height="2" rx="1" fill="none" stroke="currentColor"/>
          <rect x="6" y="14" width="12" height="2" rx="1" fill="none" stroke="currentColor"/>
          <circle cx="12" cy="11" r="1" fill="currentColor"/>
          <path d="M6 8 L6 14 M18 8 L18 14" stroke="currentColor"/>
        </svg>
        
        {/* Green dot indicator - matches your logo */}
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      </div>
      
      {showText && (
        <div className="group-hover:translate-x-1 transition-transform duration-300">
          <div className="text-xl md:text-2xl font-display font-bold text-gray-800 group-hover:text-orange-600 transition-colors duration-300 tracking-tight">
            SeaSide Bake
          </div>
          <div className="text-sm md:text-base text-gray-600 group-hover:text-orange-500 transition-colors duration-300 font-medium">
            Live • Fresh • Delicious
          </div>
        </div>
      )}
    </div>
  );
};

export default SeaSideLogo;

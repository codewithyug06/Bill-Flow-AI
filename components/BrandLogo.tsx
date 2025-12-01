
import React from 'react';

interface BrandLogoProps {
  className?: string;
  variant?: 'color' | 'white';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = "w-12 h-12", variant = 'color' }) => {
  const strokeColor = variant === 'white' ? '#e2e8f0' : '#0f766e';
  const leafColor = '#10b981';

  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
       {/* Outer Circle Ring */}
       <circle cx="100" cy="100" r="95" stroke="url(#gradRing)" strokeWidth="3" opacity="0.5" />
       
       {/* Circuit Lines */}
       <path d="M100 5V25" stroke={strokeColor} strokeWidth="4" strokeLinecap="round"/>
       <circle cx="100" cy="5" r="4" fill={leafColor}/>
       
       <path d="M170 40L155 55" stroke={strokeColor} strokeWidth="4" strokeLinecap="round"/>
       <circle cx="170" cy="40" r="4" fill={leafColor}/>

       <path d="M195 100H175" stroke={strokeColor} strokeWidth="4" strokeLinecap="round"/>
       <circle cx="195" cy="100" r="4" fill={leafColor}/>
       
       <path d="M25 150L45 130" stroke={strokeColor} strokeWidth="4" strokeLinecap="round"/>
       <circle cx="25" cy="150" r="4" fill={leafColor}/>

       {/* B Shape - Tech Style */}
       <path d="M50 40H90C115 40 120 60 95 80C120 85 120 110 95 120H50V40Z" stroke="url(#gradMain)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M50 80H90" stroke="url(#gradMain)" strokeWidth="6" strokeLinecap="round"/>

       {/* F Shape - Intertwined */}
       <path d="M85 130V160" stroke="url(#gradMain)" strokeWidth="8" strokeLinecap="round"/>
       <path d="M85 130C85 130 135 130 135 90" stroke="url(#gradMain)" strokeWidth="8" strokeLinecap="round"/> 
       <path d="M110 110H140" stroke="url(#gradMain)" strokeWidth="8" strokeLinecap="round"/>

       {/* Leaf Element with Dollar */}
       <path d="M135 60C135 60 170 60 170 95C170 130 135 130 135 130C135 130 135 95 135 60Z" fill="url(#gradLeaf)"/>
       <text x="144" y="105" fontFamily="sans-serif" fontWeight="bold" fontSize="28" fill="white">$</text>

       <defs>
         <linearGradient id="gradRing" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
           <stop offset="0%" stopColor="#2dd4bf"/>
           <stop offset="100%" stopColor="#0f766e"/>
         </linearGradient>
         <linearGradient id="gradMain" x1="50" y1="40" x2="140" y2="160" gradientUnits="userSpaceOnUse">
           <stop offset="0%" stopColor={variant === 'white' ? '#f0fdf4' : '#0d9488'}/>
           <stop offset="100%" stopColor={variant === 'white' ? '#2dd4bf' : '#115e59'}/>
         </linearGradient>
         <linearGradient id="gradLeaf" x1="135" y1="60" x2="170" y2="130" gradientUnits="userSpaceOnUse">
           <stop offset="0%" stopColor="#34d399"/>
           <stop offset="100%" stopColor="#059669"/>
         </linearGradient>
       </defs>
    </svg>
  );
};

'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  variant?: 'dark' | 'light' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'dark',
  size = 'md',
  href = '/',
  className = '',
}) => {
  const isLight = variant === 'light'; // White text for dark backgrounds (Footer / Admin)
  const isIconOnly = variant === 'icon-only';

  const iconSizes = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-9 h-9 sm:w-11 sm:h-11',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
  };

  const titleSizes = {
    sm: 'text-xs sm:text-sm font-black',
    md: 'text-sm sm:text-base md:text-lg font-black',
    lg: 'text-base sm:text-xl md:text-2xl font-black',
  };

  const sublineSizes = {
    sm: 'text-[7px] sm:text-[8px]',
    md: 'text-[8px] sm:text-[9.5px]',
    lg: 'text-[9px] sm:text-[11px]',
  };

  const content = (
    <div className={`flex items-center gap-2 sm:gap-2.5 select-none ${className}`}>
      {/* 1. Luxury Imperial Emblem (Bursa Silk Loom Crest & Gold Monogram) */}
      <div className={`${iconSizes[size]} relative flex-shrink-0 rounded-xl overflow-hidden shadow-sm`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Rich Navy & Midnight Background Gradient */}
            <linearGradient id={`bgNavy-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isLight ? '#1E293B' : '#0B1528'} />
              <stop offset="50%" stopColor={isLight ? '#0F172A' : '#060B14'} />
              <stop offset="100%" stopColor={isLight ? '#020617' : '#020617'} />
            </linearGradient>

            {/* High-End Polished Gold Gradient */}
            <linearGradient id={`goldPrimary-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF4D0" />
              <stop offset="25%" stopColor="#E6C280" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="75%" stopColor="#AA771C" />
              <stop offset="100%" stopColor="#6E4A0C" />
            </linearGradient>

            {/* Subtle Radiant Gold Highlight */}
            <linearGradient id={`goldShine-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            {/* Silk Thread Glow */}
            <filter id={`glow-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Crest Shield Base with Rounded Polygon Profile */}
          <rect width="100" height="100" rx="22" fill={`url(#bgNavy-${variant})`} />
          <rect width="100" height="100" rx="22" fill={`url(#goldShine-${variant})`} />

          {/* Outer Precision Gold Border */}
          <rect x="2" y="2" width="96" height="96" rx="20" stroke={`url(#goldPrimary-${variant})`} strokeWidth="1.5" strokeOpacity="0.8" />
          <rect x="5.5" y="5.5" width="89" height="89" rx="17" stroke={`url(#goldPrimary-${variant})`} strokeWidth="0.7" strokeDasharray="3 2" strokeOpacity="0.5" />

          {/* Corner Flourishes */}
          <circle cx="10" cy="10" r="1.5" fill={`url(#goldPrimary-${variant})`} />
          <circle cx="90" cy="10" r="1.5" fill={`url(#goldPrimary-${variant})`} />
          <circle cx="10" cy="90" r="1.5" fill={`url(#goldPrimary-${variant})`} />
          <circle cx="90" cy="90" r="1.5" fill={`url(#goldPrimary-${variant})`} />

          {/* Textile Warp & Weft Lattice (Subtle Micro Texture) */}
          <g stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1">
            <line x1="20" y1="20" x2="80" y2="20" />
            <line x1="20" y1="35" x2="80" y2="35" />
            <line x1="20" y1="50" x2="80" y2="50" />
            <line x1="20" y1="65" x2="80" y2="65" />
            <line x1="20" y1="80" x2="80" y2="80" />
            <line x1="20" y1="20" x2="20" y2="80" />
            <line x1="35" y1="20" x2="35" y2="80" />
            <line x1="50" y1="20" x2="50" y2="80" />
            <line x1="65" y1="20" x2="65" y2="80" />
            <line x1="80" y1="20" x2="80" y2="80" />
          </g>

          {/* Centerpiece: Intertwined B & K with Silk Shuttle Curve */}
          {/* Silk Fabric Ribbon Loop (Letter B Spine and Lower Bow) */}
          <path
            d="M32 23 H47 C57 23, 64 28, 64 36 C64 42, 59 47, 51 49 C62 52, 68 59, 68 68 C68 77, 59 82, 47 82 H32 Z"
            fill="none"
            stroke={`url(#goldPrimary-${variant})`}
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Inner B Openings */}
          <path
            d="M40 33 H46 C51 33, 54 35, 54 39 C54 43, 51 45, 46 45 H40 Z"
            fill={isLight ? '#0F172A' : '#0B1528'}
            stroke={`url(#goldPrimary-${variant})`}
            strokeWidth="2.5"
          />
          <path
            d="M40 55 H47 C53 55, 57 58, 57 63 C57 68, 53 71, 47 71 H40 Z"
            fill={isLight ? '#0F172A' : '#0B1528'}
            stroke={`url(#goldPrimary-${variant})`}
            strokeWidth="2.5"
          />

          {/* Letter K Diagonal Fabric Ribbon Intertwining through B */}
          <path
            d="M51 49 L74 24 M51 49 L75 79"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Golden Weaver's Shuttle & Silk Thread Accents */}
          <path
            d="M24 50 Q50 18 76 50 Q50 82 24 50"
            fill="none"
            stroke={`url(#goldPrimary-${variant})`}
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />

          {/* Golden Silk Diamond Sparkles */}
          <polygon points="76,50 78,46 82,50 78,54" fill={`url(#goldPrimary-${variant})`} />
          <polygon points="24,50 22,46 18,50 22,54" fill={`url(#goldPrimary-${variant})`} />
        </svg>
      </div>

      {/* 2. Premium Typography */}
      {!isIconOnly && (
        <div className="flex flex-col min-w-0 leading-tight">
          <div className="flex items-center gap-1">
            <span
              className={`${titleSizes[size]} tracking-tight leading-tight uppercase font-serif ${
                isLight ? 'text-white' : 'text-slate-900'
              }`}
            >
              BURSA KUMAŞ DÜNYASI
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`${sublineSizes[size]} font-bold tracking-widest uppercase ${
                isLight ? 'text-amber-300' : 'text-[#801030]'
              }`}
            >
              TÜRKİYE'NİN KUMAŞ MERKEZİ
            </span>
            <span className={`text-[8px] ${isLight ? 'text-amber-400/80' : 'text-slate-300'}`}>◆</span>
            <span
              className={`${sublineSizes[size]} font-semibold tracking-wider ${
                isLight ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              EST. 1994
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};

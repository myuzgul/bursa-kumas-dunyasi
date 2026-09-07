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
    md: 'w-8 h-8 sm:w-10 sm:h-10',
    lg: 'w-10 h-10 sm:w-12 sm:h-12',
  };

  const titleSizes = {
    sm: 'text-xs sm:text-sm font-black',
    md: 'text-sm sm:text-base md:text-lg font-black',
    lg: 'text-base sm:text-xl md:text-2xl font-black',
  };

  const sublineSizes = {
    sm: 'text-[7.5px] sm:text-[8.5px]',
    md: 'text-[8.5px] sm:text-[10px]',
    lg: 'text-[9.5px] sm:text-[11px]',
  };

  const content = (
    <div className={`flex items-center gap-2 sm:gap-2.5 select-none ${className}`}>
      {/* 1. Custom SVG Emblem (BK Monogram & Golden Weft Thread) */}
      <div className={`${iconSizes[size]} relative flex-shrink-0 rounded-xl overflow-hidden shadow-sm`}>
        <svg viewBox="0 0 96 96" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id={`emblemNavy-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color={isLight ? '#2563EB' : '#1E3A8A'} />
              <stop offset="100%" stop-color={isLight ? '#1E3A8A' : '#0F172A'} />
            </linearGradient>
            <linearGradient id={`emblemGold-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FBBF24" />
              <stop offset="50%" stop-color="#F59E0B" />
              <stop offset="100%" stop-color="#D97706" />
            </linearGradient>
            <linearGradient id={`emblemShine-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
            </linearGradient>
          </defs>

          {/* Background Rounded Shield */}
          <rect width="96" height="96" rx="22" fill={`url(#emblemNavy-${variant})`} />
          <rect width="96" height="96" rx="22" fill={`url(#emblemShine-${variant})`} />
          <rect x="1" y="1" width="94" height="94" rx="21" stroke={isLight ? '#60A5FA' : '#3B82F6'} stroke-opacity="0.35" stroke-width="2" />

          {/* Left Ribbon Fold (Letter B) */}
          <path d="M30 24 C30 22, 35 20, 42 20 C51 20, 58 24, 58 32 C58 38, 52 42, 45 44 C54 47, 60 52, 60 61 C60 70, 52 75, 42 75 C34 75, 30 71, 30 69 Z" fill={isLight ? '#3B82F6' : '#2563EB'} opacity="0.45" />

          {/* Outer Weave Ribbon */}
          <path d="M32 27 C32 25, 36 23, 43 23 C51 23, 57 27, 57 34 C57 40, 51 44, 44 46 L44 48 C52 50, 59 55, 59 63 C59 71, 52 74, 43 74 C36 74, 32 72, 32 69 L32 27 Z" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />

          {/* Inner Thread Accents */}
          <line x1="40" y1="34" x2="48" y2="34" stroke="#93C5FD" stroke-width="3" stroke-linecap="round" />
          <line x1="40" y1="61" x2="51" y2="61" stroke="#93C5FD" stroke-width="3" stroke-linecap="round" />

          {/* Golden Warp & Weft Thread Weave */}
          <path d="M48 29 L67 58 M67 58 L51 74 M51 45 L70 74" stroke={`url(#emblemGold-${variant})`} stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />

          {/* Golden Sparkle Point */}
          <circle cx="67" cy="58" r="5" fill={`url(#emblemGold-${variant})`} />
          <circle cx="67" cy="58" r="2.2" fill="#FFFFFF" />
        </svg>
      </div>

      {/* 2. Typography */}
      {!isIconOnly && (
        <div className="flex flex-col min-w-0 leading-none">
          <div className="flex items-center gap-1">
            <span
              className={`${titleSizes[size]} tracking-tight leading-tight uppercase ${
                isLight ? 'text-white' : 'text-slate-900'
              }`}
            >
              BURSA KUMAŞ DÜNYASI
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`${sublineSizes[size]} font-extrabold tracking-widest uppercase ${
                isLight ? 'text-amber-400' : 'text-amber-600'
              }`}
            >
              Kumaşın Hesaplı Adresi
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group transition transform active:scale-98">
        {content}
      </Link>
    );
  }

  return content;
};

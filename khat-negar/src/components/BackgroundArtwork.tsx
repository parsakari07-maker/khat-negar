import React from 'react';

interface BackgroundArtworkProps {
  variant?: 'full' | 'auth' | 'admin';
  className?: string;
}

export function BackgroundArtwork({ variant = 'full', className = '' }: BackgroundArtworkProps) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      style={{ contain: 'strict', isolation: 'isolate' }}
      aria-hidden="true"
    >
      {/* 1. Ultra-Smooth Hardware-Accelerated Ambient Radial Orbs (GPU Layer, 0% JS CPU) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top-Right Warm Crimson & Coral Ambient Gradient */}
        <div
          className="absolute -top-36 -right-20 w-[42rem] h-[42rem] rounded-full gpu-orb-1"
          style={{
            background:
              variant === 'admin'
                ? 'radial-gradient(circle at 40% 40%, rgba(245, 89, 81, 0.09) 0%, rgba(251, 191, 36, 0.04) 45%, transparent 70%)'
                : 'radial-gradient(circle at 40% 40%, rgba(245, 89, 81, 0.16) 0%, rgba(251, 191, 36, 0.07) 45%, transparent 70%)',
            transform: 'translateZ(0)'
          }}
        />

        {/* Bottom-Left Royal Plum & Persian Indigo Ambient Gradient */}
        <div
          className="absolute -bottom-36 -left-20 w-[46rem] h-[46rem] rounded-full gpu-orb-2"
          style={{
            background:
              variant === 'admin'
                ? 'radial-gradient(circle at 50% 50%, rgba(54, 29, 50, 0.08) 0%, rgba(84, 60, 82, 0.04) 50%, transparent 70%)'
                : 'radial-gradient(circle at 50% 50%, rgba(54, 29, 50, 0.14) 0%, rgba(84, 60, 82, 0.07) 50%, transparent 70%)',
            transform: 'translateZ(0)'
          }}
        />

        {/* Center Radiant Aura */}
        {variant !== 'admin' && (
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full gpu-orb-1"
            style={{
              background: 'radial-gradient(circle, rgba(245, 89, 81, 0.07) 0%, rgba(251, 191, 36, 0.04) 40%, transparent 70%)',
              animationDelay: '-4s',
              transform: 'translateZ(0)'
            }}
          />
        )}
      </div>

      {/* 2. Living Persian Girih Geometric Pattern (گره چینی یکپارچه و بهینه‌سازی شده با تراکم زیباتر) */}
      <div
        className="absolute inset-0 w-full h-full gpu-girih pointer-events-none"
        style={{ transform: 'translateZ(0)' }}
      >
        <svg
          className="w-full h-full text-[#361D32] dark:text-[#EDD2CB]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="khatnegar-girih-pattern"
              width="64"
              height="64"
              patternUnits="userSpaceOnUse"
            >
              {/* Central 8-Pointed Persian Star */}
              <polygon
                points="32,12 37,22 47,22 39,28 42,38 32,32 22,38 25,28 17,22 27,22"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.8"
              />
              {/* Interlocking Hex & Diamond Rhombus */}
              <path
                d="M32 0 L64 32 L32 64 L0 32 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.65"
                strokeDasharray="3 2"
              />
              {/* Secondary Cross Girih Lines */}
              <path
                d="M0 0 L64 64 M64 0 L0 64"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.45"
                strokeOpacity="0.6"
              />
              {/* Corner Star Connectors */}
              <path
                d="M0 0 L14 14 M64 0 L50 14 M64 64 L50 50 M0 64 L14 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.85"
              />
              {/* Micro Calligraphic Accent Diamond */}
              <rect
                x="30"
                y="30"
                width="4"
                height="4"
                transform="rotate(45 32 32)"
                fill="currentColor"
                className="text-[#F55951]"
              />
              {/* Four micro accent points */}
              <circle cx="32" cy="6" r="1" fill="currentColor" opacity="0.7" />
              <circle cx="32" cy="58" r="1" fill="currentColor" opacity="0.7" />
              <circle cx="6" cy="32" r="1" fill="currentColor" opacity="0.7" />
              <circle cx="58" cy="32" r="1" fill="currentColor" opacity="0.7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#khatnegar-girih-pattern)" />
        </svg>
      </div>

      {/* 3. Living Persian Calligraphic Nastaliq Sweeps (حرکت روان خطوط نستعلیق و نقوش ایرانی) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Calligraphic Sweep 1 - Top Right */}
        <div
          className="absolute -top-12 -right-16 w-80 h-80 sm:w-[32rem] sm:h-[32rem] text-[#F55951] gpu-calligraphy-1"
          style={{ transform: 'translateZ(0)' }}
        >
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path
              d="M380 40 C320 80, 260 180, 230 260 C200 340, 120 370, 50 360 C20 355, 40 330, 80 320 C150 300, 200 240, 220 180 C240 120, 300 60, 380 40 Z"
              fill="currentColor"
            />
            <rect x="260" y="90" width="14" height="14" transform="rotate(45 260 90)" fill="currentColor" opacity="0.85" />
            <rect x="280" y="110" width="11" height="11" transform="rotate(45 280 110)" fill="currentColor" opacity="0.65" />
            <circle cx="310" cy="140" r="5" fill="currentColor" opacity="0.5" />
          </svg>
        </div>

        {/* Calligraphic Sweep 2 - Bottom Left */}
        <div
          className="absolute -bottom-16 -left-16 w-80 h-80 sm:w-[34rem] sm:h-[34rem] text-[#543C52] dark:text-[#EDD2CB] gpu-calligraphy-2"
          style={{ transform: 'translateZ(0)' }}
        >
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path
              d="M20 380 C80 320, 160 270, 240 200 C300 150, 340 90, 370 20 C375 10, 355 25, 330 60 C280 130, 220 190, 150 250 C90 300, 40 340, 20 380 Z"
              fill="currentColor"
            />
            <path
              d="M250 180 C235 160, 220 190, 240 210 C260 230, 280 200, 250 180 Z"
              fill="#F55951"
              opacity="0.75"
            />
            <rect x="180" y="240" width="12" height="12" transform="rotate(45 180 240)" fill="currentColor" opacity="0.85" />
            <rect x="155" y="265" width="8" height="8" transform="rotate(45 155 265)" fill="currentColor" opacity="0.6" />
          </svg>
        </div>

        {/* Floating Calligraphic Dots & Rhombus Diamonds (نقاط شناور خوشنویسی با تحرک زنده) */}
        <div
          className="absolute top-1/5 right-1/5 w-3.5 h-3.5 rounded-xs bg-[#F55951] transform rotate-45 gpu-particle shadow-xs"
          style={{ transform: 'translateZ(0)' }}
        />
        <div
          className="absolute top-2/5 left-1/6 w-3 h-3 rounded-xs bg-amber-500 transform rotate-45 gpu-particle shadow-xs"
          style={{ animationDelay: '-2.5s', transform: 'translateZ(0)' }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-2.5 h-2.5 rounded-xs bg-[#543C52] dark:bg-[#EDD2CB] transform rotate-45 gpu-particle"
          style={{ animationDelay: '-4s', transform: 'translateZ(0)' }}
        />
        <div
          className="absolute bottom-1/5 left-1/3 w-3 h-3 rounded-xs bg-[#F55951] transform rotate-45 gpu-particle"
          style={{ animationDelay: '-1.8s', transform: 'translateZ(0)' }}
        />
        <div
          className="absolute top-2/3 right-1/8 w-2 h-2 rounded-xs bg-amber-400 transform rotate-45 gpu-particle"
          style={{ animationDelay: '-3.2s', transform: 'translateZ(0)' }}
        />
      </div>

      {/* 4. Elegant Persian Toranj Border Details (ترنج و شمسه گوشه‌های صفحه) */}
      {variant !== 'admin' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 right-2 w-40 h-40 opacity-16 dark:opacity-22 text-[#F55951] gpu-toranj">
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="160" cy="0" r="140" stroke="currentColor" strokeWidth="1.2" strokeDasharray="5 3" />
              <circle cx="160" cy="0" r="100" stroke="currentColor" strokeWidth="0.9" />
              <circle cx="160" cy="0" r="60" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="160" cy="0" r="25" stroke="currentColor" strokeWidth="1.8" />
              <path d="M160 0 C120 30, 90 70, 70 120 C55 155, 30 160, 0 160" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </div>

          <div className="absolute bottom-2 left-2 w-40 h-40 opacity-16 dark:opacity-22 text-[#543C52] dark:text-[#EDD2CB] gpu-toranj" style={{ animationDelay: '-4.5s' }}>
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="0" cy="160" r="140" stroke="currentColor" strokeWidth="1.2" strokeDasharray="5 3" />
              <circle cx="0" cy="160" r="100" stroke="currentColor" strokeWidth="0.9" />
              <circle cx="0" cy="160" r="60" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="0" cy="160" r="25" stroke="currentColor" strokeWidth="1.8" />
              <path d="M0 160 C40 130, 70 90, 90 40 C105 5, 130 0, 160 0" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}


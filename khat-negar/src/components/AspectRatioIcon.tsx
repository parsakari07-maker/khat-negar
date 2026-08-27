import React from 'react';

interface AspectRatioIconProps {
  ratio?: string;
  className?: string;
  active?: boolean;
}

export function AspectRatioIcon({ ratio = '1:1', className = '', active = false }: AspectRatioIconProps) {
  const cleanRatio = ratio.trim();

  // Determine frame width and height relative to a 24x24 box
  let width = 18;
  let height = 18;
  let isStory = false;
  let isWide = false;

  if (cleanRatio === '1:1') {
    width = 18;
    height = 18;
  } else if (cleanRatio === '4:5') {
    width = 16;
    height = 20;
  } else if (cleanRatio === '3:4' || cleanRatio === '2:3') {
    width = 15;
    height = 20;
  } else if (cleanRatio === '4:3' || cleanRatio === '3:2') {
    width = 20;
    height = 15;
  } else if (cleanRatio === '16:9') {
    width = 22;
    height = 12.5;
    isWide = true;
  } else if (cleanRatio === '9:16') {
    width = 12.5;
    height = 22;
    isStory = true;
  } else {
    // Attempt parsing "W:H"
    const parts = cleanRatio.split(':').map(Number);
    if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
      const r = parts[0] / parts[1];
      if (r > 1) {
        width = 21;
        height = Math.max(10, Math.round(21 / r));
      } else if (r < 1) {
        height = 21;
        width = Math.max(10, Math.round(21 * r));
      }
    }
  }

  const strokeColor = active ? '#F55951' : 'currentColor';
  const fillColor = active ? 'rgba(245, 89, 81, 0.15)' : 'rgba(125, 101, 123, 0.08)';

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 w-7 h-7 rounded-lg transition-all ${className}`}
      title={`نسبت ابعاد ${ratio}`}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-200 group-hover:scale-105"
      >
        {/* Aspect Frame Rectangle */}
        <rect
          x={(26 - width) / 2}
          y={(26 - height) / 2}
          width={width}
          height={height}
          rx="2.5"
          stroke={strokeColor}
          strokeWidth="1.6"
          fill={fillColor}
        />

        {/* Inner Subtle Composition Viewfinder Indicators */}
        {isWide ? (
          <line
            x1={(26 - width) / 2 + 3}
            y1="13"
            x2={(26 + width) / 2 - 3}
            y2="13"
            stroke={strokeColor}
            strokeWidth="0.8"
            strokeDasharray="2 2"
            opacity="0.6"
          />
        ) : isStory ? (
          <line
            x1="13"
            y1={(26 - height) / 2 + 3}
            x2="13"
            y2={(26 + height) / 2 - 3}
            stroke={strokeColor}
            strokeWidth="0.8"
            strokeDasharray="2 2"
            opacity="0.6"
          />
        ) : (
          <circle
            cx="13"
            cy="13"
            r="2"
            fill={strokeColor}
            opacity="0.5"
          />
        )}
      </svg>
    </div>
  );
}

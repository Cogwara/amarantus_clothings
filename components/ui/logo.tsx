'use client';

import * as React from 'react';
import Link from 'next/link';

interface LogoProps {
  variant?: 'horizontal' | 'stacked' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  subtitle?: string;
  href?: string;
  className?: string;
  light?: boolean;
}

export function Logo({
  variant = 'horizontal',
  size = 'md',
  showSubtitle = true,
  subtitle = 'CLOTHINGS',
  href = '/',
  className = '',
  light = false,
}: LogoProps) {
  const sizeMap = {
    xs: {
      icon: 'w-7 h-7',
      imgSize: 28,
      title: 'text-sm tracking-tight',
      sub: 'text-[9px] tracking-widest',
    },
    sm: {
      icon: 'w-8 h-8 sm:w-9 sm:h-9',
      imgSize: 36,
      title: 'text-base sm:text-lg tracking-tight',
      sub: 'text-[9px] sm:text-[10px] tracking-widest',
    },
    md: {
      icon: 'w-10 h-10 sm:w-11 sm:h-11',
      imgSize: 44,
      title: 'text-lg sm:text-xl font-black tracking-tight',
      sub: 'text-[10px] sm:text-[11px] font-bold tracking-widest',
    },
    lg: {
      icon: 'w-16 h-16 sm:w-20 sm:h-20',
      imgSize: 80,
      title: 'text-2xl sm:text-3xl font-black tracking-tight',
      sub: 'text-xs sm:text-sm font-bold tracking-widest',
    },
  };

  const { icon, title, sub } = sizeMap[size];

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 select-none transition-transform active:scale-98 ${
        variant === 'stacked' ? 'flex-col text-center' : ''
      } ${className}`}
    >
      {/* Brand Emblem Icon with Golden Floral Hanger Silhouette */}
      <div
        className={`relative ${icon} rounded-[12px] bg-gradient-to-br from-[#0D5C2E] via-[#16803C] to-[#0A4723] p-1 flex items-center justify-center shrink-0 shadow-md ring-1 ring-black/5 overflow-hidden group`}
      >
        <img
          src="/icon-192.png"
          alt="Amarantus Logo Emblem"
          className="w-full h-full object-cover rounded-[8px] transform group-hover:scale-105 transition-transform"
        />
        {/* Subtle Golden Sheen Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/10 to-transparent pointer-events-none" />
      </div>

      {/* Typography */}
      {variant !== 'icon' && (
        <div className={`flex flex-col leading-none ${variant === 'stacked' ? 'items-center mt-1' : ''}`}>
          <div className="flex items-center gap-1">
            <span
              className={`font-black ${title} ${
                light ? 'text-white' : 'text-[#17211B]'
              }`}
            >
              AMARANTUS
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F28C28] inline-block mb-1 shadow-sm" />
          </div>

          {showSubtitle && (
            <span
              className={`uppercase font-extrabold ${sub} ${
                light ? 'text-[#FFDC73]' : 'text-[#16803C]'
              } mt-0.5`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block group focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}

'use client';

import * as React from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Move,
} from 'lucide-react';

export interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  title?: string;
  subtitle?: string;
}

export function ImageLightbox({
  isOpen,
  onClose,
  images = [],
  initialIndex = 0,
  title,
  subtitle,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [scale, setScale] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  // Touch gesture state (for pinch-to-zoom & mobile pan)
  const touchStartDist = React.useRef<number | null>(null);
  const touchStartScale = React.useRef<number>(1);
  const imageContainerRef = React.useRef<HTMLDivElement>(null);

  // Sync index on open or prop change
  React.useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      setScale(1);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex, images.length]);

  // Reset scale and position when slide index changes
  const changeIndex = React.useCallback(
    (newIndex: number) => {
      setCurrentIndex(newIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    },
    []
  );

  const handlePrev = React.useCallback(() => {
    if (images.length <= 1) return;
    changeIndex(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
  }, [images.length, currentIndex, changeIndex]);

  const handleNext = React.useCallback(() => {
    if (images.length <= 1) return;
    changeIndex(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
  }, [images.length, currentIndex, changeIndex]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Double click / tap toggle
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale > 1) {
      handleResetZoom();
    } else {
      // Zoom into click position
      setScale(2.5);
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left - rect.width / 2;
      const clickY = e.clientY - rect.top - rect.height / 2;
      setPosition({ x: -clickX * 1.2, y: -clickY * 1.2 });
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.25, 4));
    } else {
      setScale((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Drag / Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist.current = Math.hypot(dx, dy);
      touchStartScale.current = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan start
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = dist / touchStartDist.current;
      const nextScale = Math.min(Math.max(touchStartScale.current * factor, 1), 4);
      setScale(nextScale);
      if (nextScale === 1) setPosition({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartDist.current = null;
    setIsDragging(false);
  };

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0' || e.key === 'r') {
        handleResetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || images.length === 0) return null;

  const currentImageUrl = images[currentIndex] || images[0];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white select-none animate-fadeIn"
      onMouseUp={handleMouseUp}
    >
      {/* Top Header Controls Bar */}
      <div className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-black/40 backdrop-blur-md border-b border-white/10 shrink-0">
        {/* Left: Product Info & Image Counter */}
        <div className="min-w-0 pr-4">
          {title && (
            <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
              {title}
            </h3>
          )}
          <div className="flex items-center gap-2 text-xs text-white/70">
            {subtitle && <span>{subtitle}</span>}
            {images.length > 1 && (
              <>
                {subtitle && <span>•</span>}
                <span className="font-semibold text-white/90">
                  Photo {currentIndex + 1} of {images.length}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Zoom & Close Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom Level Indicator */}
          <span className="hidden sm:inline-flex px-2 py-1 rounded bg-white/10 text-[11px] font-mono font-bold text-white/90">
            {Math.round(scale * 100)}%
          </span>

          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all text-white"
            title="Zoom out (-)"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all text-white"
            title="Zoom in (+)"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Reset Zoom Button */}
          {scale > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-[#F28C28]"
              title="Reset zoom (0)"
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <div className="w-px h-5 bg-white/20 mx-1 hidden sm:block" />

          {/* Close Lightbox Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-red-500/80 active:scale-95 transition-all text-white"
            title="Close viewer (Esc)"
            aria-label="Close image viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Center Image Viewport */}
      <div
        ref={imageContainerRef}
        className={`relative flex-1 w-full h-full flex items-center justify-center overflow-hidden p-2 sm:p-6 ${
          scale > 1
            ? isDragging
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : 'cursor-zoom-in'
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <div
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.18s ease-out',
            transformOrigin: 'center center',
          }}
          className="relative max-w-full max-h-full flex items-center justify-center pointer-events-none select-none"
        >
          <img
            src={currentImageUrl}
            alt={title || 'Product Photo'}
            className="max-h-[75vh] sm:max-h-[82vh] max-w-[94vw] sm:max-w-[88vw] object-contain rounded-[8px] shadow-2xl drop-shadow-2xl select-none"
            draggable={false}
          />
        </div>

        {/* Previous Image Arrow */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 text-white flex items-center justify-center backdrop-blur-md border border-white/15 transition-all shadow-xl"
            title="Previous image (Left Arrow)"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Image Arrow */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 text-white flex items-center justify-center backdrop-blur-md border border-white/15 transition-all shadow-xl"
            title="Next image (Right Arrow)"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Footer: Thumbnails and Interaction Hints */}
      <div className="relative z-20 px-4 py-3 bg-black/50 backdrop-blur-md border-t border-white/10 flex flex-col items-center gap-2 shrink-0">
        {/* Thumbnails strip */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full px-2 py-1 scrollbar-thin">
            {images.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => changeIndex(idx)}
                className={`relative w-12 h-12 rounded-[6px] overflow-hidden shrink-0 border-2 transition-all ${
                  currentIndex === idx
                    ? 'border-[#16803C] ring-2 ring-[#16803C]/50 scale-105 opacity-100 shadow-md'
                    : 'border-white/20 opacity-50 hover:opacity-90'
                }`}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Helper Hint Pill */}
        <p className="text-[11px] text-white/60 font-medium text-center">
          {scale > 1 ? (
            <span className="inline-flex items-center gap-1.5 text-[#FFDC73]">
              <Move className="w-3 h-3" />
              <span>Drag or pan to inspect details • Double-click or click Reset to fit screen</span>
            </span>
          ) : (
            <span>Double-click, scroll or click (+) to zoom • Use arrows to browse photos</span>
          )}
        </p>
      </div>
    </div>
  );
}

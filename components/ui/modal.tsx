'use client';

import * as React from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  hideHeader?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
  hideHeader = false,
}: ModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    full: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${maxWidths[maxWidth]} max-h-[92vh] flex flex-col bg-white rounded-[18px] shadow-2xl border border-[#DDE5DF] overflow-hidden z-10`}
      >
        {!hideHeader ? (
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#F0F4F1] bg-white sticky top-0 z-10 shrink-0">
            <div>
              {title && <h3 className="text-base sm:text-lg font-bold text-[#17211B]">{title}</h3>}
              {description && (
                <p className="text-xs text-[#66736B] mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#66736B] hover:text-[#17211B] hover:bg-[#F0F4F1] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#17211B] shadow-md border border-[#DDE5DF] flex items-center justify-center transition-all hover:scale-105"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

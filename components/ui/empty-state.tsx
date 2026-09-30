import * as React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-[12px] border border-dashed border-[#DDE5DF] ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#EAF7EE] text-[#16803C] flex items-center justify-center mb-4">
        {icon || <PackageOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-bold text-[#17211B]">{title}</h3>
      <p className="text-xs sm:text-sm text-[#66736B] max-w-sm mt-1 mb-5">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

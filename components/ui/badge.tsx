import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'green'
    | 'orange'
    | 'red'
    | 'gray'
    | 'outline'
    | 'blue';
}

export function Badge({
  className = '',
  variant = 'green',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    green: 'bg-[#EAF7EE] text-[#16803C] border border-[#C5E9CE]',
    orange: 'bg-[#FFF1E2] text-[#D96F0B] border border-[#FCD9B8]',
    red: 'bg-red-50 text-red-700 border border-red-200',
    gray: 'bg-gray-100 text-gray-700 border border-gray-200',
    outline: 'bg-transparent text-[#17211B] border border-[#DDE5DF]',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

import * as React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-[#16803C] hover:bg-[#0F5C2E] text-white focus:ring-[#16803C] shadow-sm',
      secondary:
        'bg-[#F28C28] hover:bg-[#D96F0B] text-white focus:ring-[#F28C28] shadow-sm',
      outline:
        'border border-[#DDE5DF] bg-white text-[#17211B] hover:bg-[#F8FAF9] hover:border-[#B6C4B8] focus:ring-[#16803C]',
      ghost:
        'bg-transparent text-[#17211B] hover:bg-[#EAF7EE] hover:text-[#16803C] focus:ring-[#16803C]',
      danger:
        'bg-[#DC2626] hover:bg-red-700 text-white focus:ring-red-500 shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded-[10px] gap-1.5 h-8',
      md: 'text-sm px-4 py-2 rounded-[10px] gap-2 h-10',
      lg: 'text-base px-6 py-3 rounded-[12px] gap-2.5 h-12 font-semibold',
      icon: 'p-2 rounded-[10px] h-10 w-10 justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

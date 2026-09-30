import * as React from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs sm:text-sm font-medium text-[#17211B] mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-[10px]">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#66736B]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={`w-full rounded-[10px] border ${
              error ? 'border-red-500 focus:ring-red-400' : 'border-[#DDE5DF] focus:border-[#16803C] focus:ring-[#16803C]'
            } bg-white px-3.5 py-2.5 text-sm text-[#17211B] placeholder-[#8A968F] transition-colors focus:outline-none focus:ring-1 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#66736B]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {!error && helperText && (
          <p className="mt-1 text-xs text-[#66736B]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

import * as React from 'react';

export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-[8px] bg-[#E5EBE7] ${className}`}
      {...props}
    ></div>
  );
}

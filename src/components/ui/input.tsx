import React from 'react';
import clsx from 'clsx';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={clsx(
      'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      'placeholder-gray-400',
      'disabled:bg-gray-100 disabled:cursor-not-allowed',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

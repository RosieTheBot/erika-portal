import React from 'react';
import clsx from 'clsx';

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    className={clsx(
      'w-4 h-4 border border-gray-300 rounded',
      'focus:outline-none focus:ring-2 focus:ring-blue-500',
      'cursor-pointer',
      className
    )}
    {...props}
  />
));
Checkbox.displayName = 'Checkbox';

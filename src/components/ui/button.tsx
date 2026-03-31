import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'rounded-lg font-medium transition-colors',
          variant === 'default' && 'bg-blue-600 text-white hover:bg-blue-700',
          variant === 'outline' && 'border border-gray-300 text-gray-900 hover:bg-gray-50',
          variant === 'secondary' && 'bg-gray-200 text-gray-900 hover:bg-gray-300',
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2 text-base',
          size === 'lg' && 'px-6 py-3 text-lg',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

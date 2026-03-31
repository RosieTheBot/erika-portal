import React from 'react';
import clsx from 'clsx';

export const Select = ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (value: string) => void }) => {
  return <div data-select data-value={value} data-on-change={onValueChange}>{children}</div>;
};

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={clsx(
      'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-left bg-white',
      'focus:outline-none focus:ring-2 focus:ring-blue-500',
      className
    )}
    {...props}
  >
    {children}
  </button>
));
SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <span className="text-gray-500">{placeholder}</span>
);

export const SelectContent = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-lg bg-white shadow-lg z-50">
    {children}
  </div>
);

export const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <div className="px-3 py-2 hover:bg-blue-50 cursor-pointer">{children}</div>
);

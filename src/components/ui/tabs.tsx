import React from 'react';
import clsx from 'clsx';

export const Tabs = ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) => (
  <div>{children}</div>
);

export const TabsList = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={clsx('flex gap-2 border-b border-gray-200', className)}>{children}</div>
);

export const TabsTrigger = ({ value, children, onClick }: { value: string; children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-gray-300"
  >
    {children}
  </button>
);

export const TabsContent = ({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) => (
  <div className={clsx('mt-4', className)}>{children}</div>
);

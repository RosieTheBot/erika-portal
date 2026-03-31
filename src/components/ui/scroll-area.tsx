import React from 'react';
import clsx from 'clsx';

export const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={clsx('overflow-y-auto', className)} {...props} />
));
ScrollArea.displayName = 'ScrollArea';

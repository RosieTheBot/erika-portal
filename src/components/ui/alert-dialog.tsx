import React from 'react';

export const AlertDialog = ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
};

export const AlertDialogContent = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">{children}</div>
);

export const AlertDialogTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold mb-2">{children}</h2>
);

export const AlertDialogDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-gray-600 mb-4">{children}</p>
);

export const AlertDialogAction = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
  >
    {children}
  </button>
);

export const AlertDialogCancel = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
  >
    {children}
  </button>
);

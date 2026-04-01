'use client';

import { PropertyManagementDashboard } from '@/components/PropertyManagementDashboard';

export default function PropertiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-700">← Back to Dashboard</a>
        </div>
      </nav>

      {/* Properties Dashboard */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PropertyManagementDashboard />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Homebase Portal</h1>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-gray-900 font-medium">Dashboard</Link>
            <Link href="/properties" className="text-gray-600 hover:text-gray-900">Properties</Link>
            <Link href="/buyer" className="text-gray-600 hover:text-gray-900">Buyer Portal</Link>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">Admin</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Your Portal</h2>
        <p className="text-xl text-gray-600 mb-8">Manage real estate transactions seamlessly.</p>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Properties Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Property Management</h3>
            <p className="text-gray-600 mb-4">Upload, search, and manage properties</p>
            <Link href="/properties" className="text-blue-600 hover:text-blue-700 font-medium">
              Go to Properties →
            </Link>
          </div>

          {/* Buyer Portal Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Buyer Discovery</h3>
            <p className="text-gray-600 mb-4">Browse and engage with properties</p>
            <Link href="/buyer" className="text-blue-600 hover:text-blue-700 font-medium">
              View Properties →
            </Link>
          </div>

          {/* Admin Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Admin Dashboard</h3>
            <p className="text-gray-600 mb-4">Manage all transactions and users</p>
            <Link href="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
              Admin Panel →
            </Link>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">System Status</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Portal deployed to Vercel</li>
            <li>✅ Database schema complete (RLS enabled)</li>
            <li>✅ 14 API endpoints live</li>
            <li>⏳ Email notifications (pending Gmail setup)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

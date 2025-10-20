// src/app/legacy-dashboard/page.tsx
// Legacy dashboard - kept for backward compatibility
// Users are redirected to the enhanced dashboard

'use client'

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function LegacyDashboardContent() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to the enhanced dashboard after 5 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Warning Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Legacy Dashboard Deprecated
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-6">
            The legacy dashboard has been replaced with our enhanced version featuring real-time analytics, 
            improved performance, and a better user experience.
          </p>

          {/* Features List */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enhanced Dashboard Features:</h3>
            <ul className="text-left space-y-2 text-gray-700">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                Real-time pharmaceutical KPI calculations
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                Advanced role-based dashboard customization
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                Interactive widgets and drill-down capabilities
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                Mobile-optimized responsive design
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                Enhanced pharmaceutical BI integration
              </li>
            </ul>
          </div>

          {/* Auto-redirect notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Auto-redirect:</strong> You will be automatically redirected to the enhanced dashboard in 5 seconds.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Go to Enhanced Dashboard
            <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" />
          </button>

          {/* Footer Note */}
          <p className="mt-6 text-sm text-gray-500">
            If you encounter any issues with the enhanced dashboard, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LegacyDashboardPage() {
  return (
    <AuthWrapper allowedRoles={['rep', 'manager', 'admin']}>
      <LegacyDashboardContent />
    </AuthWrapper>
  );
}
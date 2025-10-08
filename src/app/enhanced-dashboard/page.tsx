// src/app/enhanced-dashboard/page.tsx
// Test page for the enhanced dashboard with KPI integration
// Demonstrates Phase 1 implementation of dashboard enhancements

'use client'

import React from 'react';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import EnhancedRoleBasedDashboard from '@/components/dashboard/EnhancedRoleBasedDashboard';
import { UserRole } from '@/lib/roles';
import { useAuth } from '@/hooks/useAuth';

function EnhancedDashboardContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading enhanced dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  const userRole = (user.profile?.role as UserRole) || UserRole.SALESMAN;

  console.log('Enhanced Dashboard - User role:', userRole, 'User profile:', user.profile);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Enhanced Dashboard (Beta)</h1>
              <p className="text-gray-600">Testing Phase 1: KPI Integration & Real-time Data</p>
            </div>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Phase 1 - Testing
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Dashboard */}
      <EnhancedRoleBasedDashboard 
        userRole={userRole}
        userId={user.id}
      />
    </div>
  );
}

export default function EnhancedDashboardPage() {
  return (
    <AuthWrapper allowedRoles={['rep', 'manager', 'admin']}>
      <EnhancedDashboardContent />
    </AuthWrapper>
  );
}
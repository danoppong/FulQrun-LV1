// src/app/pharmaceutical-bi/page.tsx
// Pharmaceutical BI Dashboard Page
// Main page for accessing pharmaceutical sales intelligence

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { AuthService } from '@/lib/auth-unified'
import PharmaceuticalDashboard from '@/components/bi/PharmaceuticalDashboard';
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function PharmaceuticalBIPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Temporarily bypass authentication for testing
        const mockUser = {
          profile: {
            id: 'test-user',
            organization_id: 'test-org',
            role: 'rep'
          }
        };
        setUser(mockUser);
        
        // Uncomment below for production authentication
        /*
        const currentUser = await AuthService.getCurrentUser();
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }
        setUser(currentUser);
        */
      } catch (err) {
        setError('Failed to load user data');
        console.error('User loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClockIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading pharmaceutical dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'User not found'}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <PharmaceuticalDashboard
      organizationId={user.profile.organization_id}
      userId={user.profile.id}
      role={user.profile.role}
    />
  );
}

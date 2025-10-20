'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth-unified';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({ children, redirectTo = '/auth/login' }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const user = await AuthService.getCurrentUser();
        
        if (!mounted) return;
        
        if (!user) {
          // SECURITY: No authenticated user - redirect immediately
          const currentPath = window.location.pathname;
          const redirectUrl = `${redirectTo}?next=${encodeURIComponent(currentPath)}`;
          router.replace(redirectUrl);
          setIsAuthenticated(false);
        } else if (!user.profile?.organization_id) {
          // SECURITY: User exists but no organization - redirect with error
          const redirectUrl = `${redirectTo}?error=missing-organization`;
          router.replace(redirectUrl);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch (_error) {
        console.error('Auth check failed:', _error);
        if (!mounted) return;
        
        // SECURITY: Auth check failed - redirect to login
        router.replace(redirectTo);
        setIsAuthenticated(false);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router, redirectTo]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show nothing while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
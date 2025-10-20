'use client';

import AuthGuard from '@/components/auth/AuthGuard';

interface DashboardClientWrapperProps {
  children: React.ReactNode;
}

export default function DashboardClientWrapper({ children }: DashboardClientWrapperProps) {
  return (
    <AuthGuard redirectTo="/auth/login">
      {children}
    </AuthGuard>
  );
}
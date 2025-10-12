'use client'
import React from 'react';

import { usePathname } from 'next/navigation'
import ClientLayout from './ClientLayout';

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Don't wrap auth pages with ClientLayout
  if (pathname === '/auth' || pathname.startsWith('/auth/')) {
    return <>{children}</>
  }

  // Do not wrap the public landing page with the app chrome (no sidebar)
  if (pathname === '/') {
    return <>{children}</>
  }
  
  // Wrap all other pages with ClientLayout
  return <ClientLayout>{children}</ClientLayout>
}

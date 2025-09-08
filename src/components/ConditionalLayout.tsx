'use client'

import { usePathname } from 'next/navigation'
import ClientLayout from './ClientLayout'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Don't wrap auth pages with ClientLayout
  if (pathname.startsWith('/auth/')) {
    return <>{children}</>
  }
  
  // Wrap all other pages with ClientLayout
  return <ClientLayout>{children}</ClientLayout>
}

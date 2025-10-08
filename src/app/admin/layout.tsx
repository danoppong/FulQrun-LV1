// Administration Module - Simplified Layout
// Uses main navigation system instead of separate sidebar

'use client';

import React from 'react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface AdminLayoutProps {
  children: React.ReactNode;
}

// =============================================================================
// ADMIN LAYOUT COMPONENT
// =============================================================================

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto focus:outline-none">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
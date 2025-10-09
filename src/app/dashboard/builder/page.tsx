'use client'

import React from 'react'
import { DashboardProvider } from '@/components/dashboard/DashboardContext'
import DashboardBuilder from '@/components/dashboard/builder/DashboardBuilder'

export default function DashboardBuilderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Custom Dashboard Builder</h1>
          <p className="text-gray-600 mt-1">Create and customize your dashboard layout. Add widgets, arrange them in a grid, and save your layout.</p>
        </div>

        <DashboardProvider>
          <DashboardBuilder />
        </DashboardProvider>
      </div>
    </div>
  )
}

'use client'

import React from 'react';

export default function LeadProgressionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lead Progression</h1>
        <p className="mt-2 text-gray-600">Track lead movement through your pipeline stages</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Lead Progression Tracking</h3>
          <p className="text-gray-500">Visualize and manage lead progression through qualification stages.</p>
        </div>
      </div>
    </div>
  )
}



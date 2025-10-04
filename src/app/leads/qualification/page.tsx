'use client'

import React from 'react'

export default function LeadQualificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lead Qualification</h1>
        <p className="mt-2 text-gray-600">Qualify and score leads using advanced criteria</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Lead Qualification</h3>
          <p className="text-gray-500">Score and qualify leads based on BANT, CHAMP, or custom criteria.</p>
        </div>
      </div>
    </div>
  )
}



'use client'

import React from 'react'

export default function MEDDPICCPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">MEDDPICC</h1>
        <p className="mt-2 text-gray-600">Qualify opportunities using the MEDDPICC framework</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">MEDDPICC Qualification</h3>
          <p className="text-gray-500">Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Identify Pain, Champion, Competition.</p>
          
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-2xl mx-auto">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-semibold text-blue-600 text-sm">M</div>
              <div className="text-xs text-gray-600 mt-1">Metrics</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-semibold text-blue-600 text-sm">E</div>
              <div className="text-xs text-gray-600 mt-1">Economic Buyer</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-semibold text-blue-600 text-sm">DD</div>
              <div className="text-xs text-gray-600 mt-1">Decision Criteria & Process</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-semibold text-blue-600 text-sm">P</div>
              <div className="text-xs text-gray-600 mt-1">Paper Process</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-semibold text-blue-600 text-sm">I</div>
              <div className="text-xs text-gray-600 mt-1">Identify Pain</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-semibold text-blue-600 text-sm">C</div>
              <div className="text-xs text-gray-600 mt-1">Champion</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-semibold text-blue-600 text-sm">C</div>
              <div className="text-xs text-gray-600 mt-1">Competition</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}






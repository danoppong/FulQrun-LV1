import React from 'react';

export default function NewOpportunityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Create New Opportunity</h1>
          <p className="text-gray-600 mb-8">Start a new sales opportunity and track its progress.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lead Information</h3>
              <p className="text-gray-600">Capture detailed lead and contact information.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Deal Value</h3>
              <p className="text-gray-600">Set deal value and probability estimates.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pipeline Stage</h3>
              <p className="text-gray-600">Track opportunity through sales pipeline stages.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
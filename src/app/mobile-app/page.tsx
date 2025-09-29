import React from 'react';

export default function MobileAppPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Mobile App</h1>
          <p className="text-gray-600 mb-8">Native mobile application for your sales team on the go.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Offline Access</h3>
              <p className="text-gray-600">Access your data even without internet connection.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Push Notifications</h3>
              <p className="text-gray-600">Stay updated with real-time notifications.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile CRM</h3>
              <p className="text-gray-600">Full CRM functionality optimized for mobile devices.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

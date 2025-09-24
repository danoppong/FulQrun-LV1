import React from 'react';

export default function LearningPlatformPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Learning Platform</h1>
          <p className="text-gray-600 mb-8">Comprehensive learning management system for your organization.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Management</h3>
              <p className="text-gray-600">Create and manage training courses and modules.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress Tracking</h3>
              <p className="text-gray-600">Track learner progress and completion rates.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Certifications</h3>
              <p className="text-gray-600">Issue and manage professional certifications.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

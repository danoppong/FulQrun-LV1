'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Phase 2 tables that should exist
const phase2Tables = [
  'pipeline_configurations',
  'workflow_automations', 
  'ai_insights',
  'learning_modules',
  'integration_connections',
  'performance_metrics',
  'user_learning_progress',
  'sharepoint_documents'
];

export default function TestDatabasePage() {
  const [results, setResults] = useState<Record<string, 'loading' | 'success' | 'error' | 'missing'>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    testPhase2Tables();
  }, []);

  const testPhase2Tables = async () => {
    setIsLoading(true);
    const testResults: Record<string, 'loading' | 'success' | 'error' | 'missing'> = {};
    const errorMessages: Record<string, string> = {};
    
    // Initialize all tables as loading
    phase2Tables.forEach(table => {
      testResults[table] = 'loading';
    });
    setResults(testResults);
    setErrors(errorMessages);

    let allTablesExist = true;

    for (const tableName of phase2Tables) {
      try {
        // Try to query the table (this will fail if table doesn't exist)
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`Error accessing ${tableName}:`, error);
          errorMessages[tableName] = error.message;
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            testResults[tableName] = 'missing';
            allTablesExist = false;
          } else {
            testResults[tableName] = 'error';
            allTablesExist = false;
          }
        } else {
          testResults[tableName] = 'success';
        }
      } catch (err) {
        testResults[tableName] = 'error';
        errorMessages[tableName] = err instanceof Error ? err.message : 'Unknown error';
        allTablesExist = false;
      }
      
      setResults({...testResults});
      setErrors({...errorMessages});
    }

    // Count successful tables
    const successCount = Object.values(testResults).filter(status => status === 'success').length;
    const totalTables = phase2Tables.length;
    
    // Only mark as success if ALL tables exist
    setOverallStatus(successCount === totalTables ? 'success' : 'error');
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading': return '⏳';
      case 'success': return '✅';
      case 'error': return '⚠️';
      case 'missing': return '❌';
      default: return '❓';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'loading': return 'Testing...';
      case 'success': return 'Table exists';
      case 'error': return 'Error accessing table';
      case 'missing': return 'Table does not exist';
      default: return 'Unknown status';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Phase 2 Database Verification
          </h1>
          
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Testing database tables...</p>
            </div>
          )}

          {!isLoading && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Table Status</h2>
                <div className="space-y-3">
                  {phase2Tables.map((tableName) => (
                    <div key={tableName} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-gray-700">{tableName}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getStatusIcon(results[tableName])}</span>
                          <span className="text-sm text-gray-600">{getStatusText(results[tableName])}</span>
                        </div>
                      </div>
                      {errors[tableName] && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          <strong>Error:</strong> {errors[tableName]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Overall Status</h2>
                <div className={`p-4 rounded-lg ${
                  overallStatus === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {overallStatus === 'success' ? '🎉' : '❌'}
                    </span>
                    <div>
                      <h3 className={`font-semibold ${
                        overallStatus === 'success' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {overallStatus === 'success' 
                          ? 'SUCCESS: All Phase 2 tables are present!' 
                          : 'FAILURE: Some Phase 2 tables are missing.'
                        }
                      </h3>
                      <p className={`text-sm mt-1 ${
                        overallStatus === 'success' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {overallStatus === 'success' 
                          ? 'Your Phase 2 migration was successful! You can now use all the new features.'
                          : 'Please check your database migration and ensure all tables were created.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {overallStatus === 'success' && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">🚀 Available Phase 2 Features:</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Advanced Pipeline Management</li>
                    <li>• AI-Driven Insights</li>
                    <li>• PEAK Process Integration</li>
                    <li>• Performance Management</li>
                    <li>• Integration Hub</li>
                    <li>• Learning Platform</li>
                    <li>• Advanced Analytics</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

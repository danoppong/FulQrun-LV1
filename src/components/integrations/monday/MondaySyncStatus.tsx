/**
 * Monday.com Sync Status Component
 * Shows connection status and sync information
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface MondayUser {
  id: string;
  name: string;
  email: string;
  photo_thumb?: string;
}

interface ConnectionInfo {
  success: boolean;
  user?: MondayUser;
  error?: string;
  connection?: {
    id: string;
    status: string;
    created_at: string;
  };
}

export function MondaySyncStatus() {
  const [status, setStatus] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations/monday/connection');
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        setStatus({
          success: false,
          error: 'No connection found'
        });
      }
    } catch (err) {
      setStatus({
        success: false,
        error: err instanceof Error ? err.message : 'Connection check failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      await checkConnection();
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-2 p-4 ${
      status?.success 
        ? 'border-green-200 bg-green-50' 
        : 'border-red-200 bg-red-50'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {status?.success ? (
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            ) : (
              <XCircleIcon className="h-6 w-6 text-red-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${
              status?.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {status?.success ? 'Connected to Monday.com' : 'Not Connected'}
            </h3>
            
            {status?.success && status?.user && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center text-sm text-green-700">
                  <UserIcon className="h-4 w-4 mr-2" />
                  <span className="font-medium">{status.user.name}</span>
                  <span className="mx-2">•</span>
                  <span className="text-green-600">{status.user.email}</span>
                </div>
                
                {status.connection && (
                  <div className="flex items-center text-xs text-green-600">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    <span>
                      Connected since {new Date(status.connection.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {!status?.success && status?.error && (
              <p className="mt-1 text-sm text-red-700">
                {status.error}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={testConnection}
          disabled={testing}
          className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded ${
            status?.success
              ? 'border-green-300 text-green-700 hover:bg-green-100'
              : 'border-red-300 text-red-700 hover:bg-red-100'
          } disabled:opacity-50`}
        >
          <ArrowPathIcon className={`h-3 w-3 mr-1 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
    </div>
  );
}

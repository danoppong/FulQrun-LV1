/**
 * Monday.com Connection Manager Component
 * Full-featured Monday.com integration interface
 */

'use client';

import React, { useState } from 'react';
import { MondaySyncStatus } from './MondaySyncStatus';
import { MondayBoardSelector } from './MondayBoardSelector';
import { MondayItemList } from './MondayItemList';
import {
  KeyIcon,
  LinkIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface MondayBoard {
  id: string;
  name: string;
  description?: string;
  state: string;
  board_kind: string;
  items_count?: number;
  columns?: Array<{
    id: string;
    title: string;
    type: string;
  }>;
}

export function MondayConnectionManager() {
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [apiToken, setApiToken] = useState('');
  const [connectionName, setConnectionName] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<MondayBoard | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'boards' | 'items'>('overview');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setConnecting(true);
      setConnectionError(null);

      const response = await fetch('/api/integrations/monday/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_token: apiToken,
          name: connectionName || 'Monday.com Connection',
          description: 'Monday.com GraphQL integration'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Connection failed');
      }

      setShowConnectionForm(false);
      setApiToken('');
      setConnectionName('');
      // Refresh the page or status
      window.location.reload();

    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Monday.com?')) return;

    try {
      const response = await fetch('/api/integrations/monday/connection', {
        method: 'DELETE'
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (err) {
      alert('Failed to disconnect');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monday.com Integration</h2>
          <p className="text-sm text-gray-600 mt-1">
            Connect your Monday.com workspace to sync boards, items, and automate workflows
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!showConnectionForm && (
            <>
              <button
                onClick={() => setShowConnectionForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Connect Account
              </button>
              <button
                onClick={handleDisconnect}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <MondaySyncStatus />

      {/* Connection Form Modal */}
      {showConnectionForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Connect to Monday.com
              </h3>
              <button
                onClick={() => setShowConnectionForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Token
                </label>
                <div className="relative">
                  <KeyIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    required
                    placeholder="Your Monday.com API token"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Get your API token from Monday.com → Profile → Admin → API
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Name (optional)
                </label>
                <input
                  type="text"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  placeholder="e.g., Production Workspace"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {connectionError && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">{connectionError}</p>
                </div>
              )}

              <div className="bg-blue-50 p-3 rounded-md">
                <div className="flex">
                  <DocumentTextIcon className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" />
                  <div className="text-xs text-blue-700">
                    <strong>How to get your API token:</strong>
                    <ol className="list-decimal ml-4 mt-1 space-y-1">
                      <li>Log in to Monday.com</li>
                      <li>Click your avatar → Admin → API</li>
                      <li>Click "Generate" or copy existing token</li>
                      <li>Paste token above</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowConnectionForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting || !apiToken}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Connect
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'boards', label: 'Boards' },
            { id: 'items', label: 'Items' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Workspace</h3>
                <p className="text-2xl font-bold text-gray-900">Connected</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Sync Status</h3>
                <p className="text-2xl font-bold text-green-600">Active</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-1">API Version</h3>
                <p className="text-2xl font-bold text-gray-900">2024-04</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Integration Features</h3>
              <ul className="space-y-2">
                {[
                  'Access all boards and items',
                  'Create and update items via API',
                  'Real-time webhook notifications',
                  'GraphQL query support',
                  'Column value transformations',
                  'Bi-directional sync capabilities'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-700">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'boards' && (
          <div className="space-y-4">
            <MondayBoardSelector
              onBoardSelect={setSelectedBoard}
              selectedBoardId={selectedBoard?.id}
            />
            {selectedBoard && (
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Selected Board Details</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Board ID</dt>
                    <dd className="font-mono text-gray-900">{selectedBoard.id}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Items Count</dt>
                    <dd className="text-gray-900">{selectedBoard.items_count || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Type</dt>
                    <dd className="text-gray-900">{selectedBoard.board_kind}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">State</dt>
                    <dd className="text-gray-900">{selectedBoard.state}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}

        {activeTab === 'items' && (
          <div>
            {!selectedBoard ? (
              <div className="text-center py-12 text-gray-500">
                Select a board from the Boards tab first
              </div>
            ) : (
              <MondayItemList
                boardId={selectedBoard.id}
                onItemClick={(item) => console.log('Item clicked:', item)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

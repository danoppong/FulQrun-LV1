'use client'
import React from 'react';

import { useState } from 'react';

export default function QuickBooksSetup() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false)
      setIsConnected(true)
    }, 2000)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">QuickBooks Integration</h3>
        <p className="text-gray-600">Connect your QuickBooks account to sync customer and financial data</p>
      </div>
      
      <div className="space-y-4">
        {!isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <span>⚠️</span>
              <span>QuickBooks integration is currently in development</span>
            </div>
            <div className="space-y-2">
              <label htmlFor="company-id" className="block text-sm font-medium text-gray-700">Company ID (Optional)</label>
              <input 
                id="company-id" 
                placeholder="Enter your QuickBooks Company ID"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect to QuickBooks'}
            </button>
            <p className="text-xs text-gray-500">
              This feature will be available in a future update. 
              <a 
                href="https://developer.intuit.com/app/developer/qbo/docs/get-started" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-blue-600 hover:underline"
              >
                Learn more →
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <span>✅</span>
              <span>Connected to QuickBooks</span>
            </div>
            <div className="text-sm text-gray-600">
              <p>• Customer data sync enabled</p>
              <p>• Invoice tracking available</p>
              <p>• Payment status updates</p>
            </div>
            <button 
              onClick={handleDisconnect}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
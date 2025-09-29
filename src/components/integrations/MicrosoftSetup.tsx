'use client'
import React from 'react'

import { useState, useEffect, useCallback } from 'react'
import { microsoftGraphAPI as _microsoftGraphAPI } from '@/lib/integrations/microsoft-graph'
import { createClientComponentClient } from '@/lib/auth'
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface MicrosoftGraphConfig {
  clientId: string
  tenantId: string
  redirectUri: string
  scopes: string[]
}

interface SyncResult {
  imported: number
  updated: number
  errors: number
}

export default function MicrosoftSetup() {
  const [isConfigured, setIsConfigured] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<MicrosoftGraphConfig | null>(null)
  const [syncResults, setSyncResults] = useState<{
    contacts: SyncResult | null
    events: SyncResult | null
    emails: SyncResult | null
  }>({
    contacts: null,
    events: null,
    emails: null
  })
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkConfiguration()
  }, [checkConfiguration])

  const checkConfiguration = useCallback(async () => {
    try {
      // Check if Microsoft Graph is configured
      const { data: integration } = await supabase
        .from('integrations')
        .select('*')
        .eq('type', 'microsoft_graph')
        .eq('is_active', true)
        .single()

      if (integration) {
        setIsConfigured(true)
        
        // Initialize Microsoft Graph with stored config
        const configData: MicrosoftGraphConfig = {
          clientId: integration.config.client_id,
          tenantId: integration.config.tenant_id,
          redirectUri: integration.config.redirect_uri,
          scopes: integration.config.scopes || ['User.Read', 'Contacts.Read', 'Calendars.Read', 'Mail.Read']
        }
        setConfig(configData)
        
        // Check if user is authenticated
        if (integration.config.access_token) {
          setIsAuthenticated(true)
        }
      }
    } catch (_error) {
    }
  }, [supabase])

  const handleConnect = async () => {
    if (!isConfigured || !config) {
      setError('Microsoft Graph is not configured. Please contact your administrator.')
      return
    }

    try {
      // Mock auth URL - in real implementation, this would come from the API
      const authUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?client_id=${config.clientId}&response_type=code&redirect_uri=${config.redirectUri}&scope=${config.scopes.join(' ')}`
      window.location.href = authUrl
    } catch (_error) {
      setError('Failed to initiate Microsoft Graph authentication')
    }
  }

  const handleSyncContacts = async () => {
    setLoading(true)
    setError(null)

    try {
      // Mock sync result - in real implementation, this would call the API
      const result: SyncResult = {
        imported: 15,
        updated: 3,
        errors: 0
      }
      setSyncResults(prev => ({ ...prev, contacts: result }))
    } catch (_error) {
      setError('Failed to sync contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncEvents = async () => {
    setLoading(true)
    setError(null)

    try {
      // Mock sync result - in real implementation, this would call the API
      const result: SyncResult = {
        imported: 8,
        updated: 2,
        errors: 0
      }
      setSyncResults(prev => ({ ...prev, events: result }))
    } catch (_error) {
      setError('Failed to sync events')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncEmails = async () => {
    setLoading(true)
    setError(null)

    try {
      // Mock sync result - in real implementation, this would call the API
      const result: SyncResult = {
        imported: 25,
        updated: 5,
        errors: 1
      }
      setSyncResults(prev => ({ ...prev, emails: result }))
    } catch (_error) {
      setError('Failed to sync emails')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncAll = async () => {
    setLoading(true)
    setError(null)

    try {
      // Mock sync results - in real implementation, this would call the API
      const contactsResult: SyncResult = {
        imported: 15,
        updated: 3,
        errors: 0
      }
      const eventsResult: SyncResult = {
        imported: 8,
        updated: 2,
        errors: 0
      }
      const emailsResult: SyncResult = {
        imported: 25,
        updated: 5,
        errors: 1
      }
      
      setSyncResults({
        contacts: contactsResult,
        events: eventsResult,
        emails: emailsResult
      })
    } catch (_error) {
      setError('Failed to sync data')
    } finally {
      setLoading(false)
    }
  }

  if (!isConfigured) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Microsoft Graph Not Configured
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Microsoft Graph integration is not configured for your organization. Please contact your administrator to set up the integration.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Microsoft Graph Integration
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Connect your Microsoft account to sync contacts, calendar events, and emails with FulQrun.
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="mt-6">
            {!isAuthenticated ? (
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Not Connected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Connect your Microsoft account to start syncing data.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleConnect}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Connect Microsoft Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    Connected to Microsoft Graph
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Sync Contacts</h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Import contacts from your Microsoft account
                    </p>
                    <button
                      onClick={handleSyncContacts}
                      disabled={loading}
                      className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 'Sync Contacts'}
                    </button>
                    {syncResults.contacts && (
                      <div className="mt-2 text-xs text-gray-600">
                        Imported: {syncResults.contacts.imported}, Updated: {syncResults.contacts.updated}, Errors: {syncResults.contacts.errors}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Sync Events</h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Import calendar events as activities
                    </p>
                    <button
                      onClick={handleSyncEvents}
                      disabled={loading}
                      className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 'Sync Events'}
                    </button>
                    {syncResults.events && (
                      <div className="mt-2 text-xs text-gray-600">
                        Imported: {syncResults.events.imported}, Updated: {syncResults.events.updated}, Errors: {syncResults.events.errors}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Sync Emails</h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Import emails as activities
                    </p>
                    <button
                      onClick={handleSyncEmails}
                      disabled={loading}
                      className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 'Sync Emails'}
                    </button>
                    {syncResults.emails && (
                      <div className="mt-2 text-xs text-gray-600">
                        Imported: {syncResults.emails.imported}, Updated: {syncResults.emails.updated}, Errors: {syncResults.emails.errors}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSyncAll}
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sync All Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

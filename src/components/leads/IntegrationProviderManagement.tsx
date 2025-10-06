'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Loader2, Settings, TestTube, CheckCircle, XCircle, AlertCircle, RefreshCw, Plus } from 'lucide-react'

interface IntegrationProvider {
  id: string
  provider: 'CLEARBIT' | 'ZOOMINFO' | 'OPPORTUNITY' | 'COMPLIANCE'
  config: {
    api_key?: string
    api_secret?: string
    base_url?: string
    enabled: boolean
    rate_limit?: number
    timeout?: number
    retry_attempts?: number
    custom_fields?: Record<string, any>
  }
  created_at: string
  updated_at: string
}

interface ProviderTestResult {
  provider: string
  test_result: {
    success: boolean
    message: string
    response_time?: number
    rate_limit_remaining?: number
    test_data?: any
    error?: string
  }
  tested_at: string
}

const PROVIDER_CONFIGS = {
  'CLEARBIT': {
    name: 'Clearbit',
    description: 'Company and contact data enrichment',
    icon: '🔍',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'base_url', label: 'Base URL', type: 'url', required: false, default: 'https://company.clearbit.com' },
      { key: 'rate_limit', label: 'Rate Limit (requests/min)', type: 'number', required: false, default: 1000 },
      { key: 'timeout', label: 'Timeout (seconds)', type: 'number', required: false, default: 30 }
    ]
  },
  'ZOOMINFO': {
    name: 'ZoomInfo',
    description: 'B2B contact and company database',
    icon: '🎯',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'api_secret', label: 'API Secret', type: 'password', required: true },
      { key: 'base_url', label: 'Base URL', type: 'url', required: false, default: 'https://api.zoominfo.com' },
      { key: 'rate_limit', label: 'Rate Limit (requests/min)', type: 'number', required: false, default: 500 }
    ]
  },
  'OPPORTUNITY': {
    name: 'Opportunity Provider',
    description: 'Custom opportunity data provider',
    icon: '💼',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'base_url', label: 'Base URL', type: 'url', required: true },
      { key: 'rate_limit', label: 'Rate Limit (requests/min)', type: 'number', required: false, default: 100 }
    ]
  },
  'COMPLIANCE': {
    name: 'Compliance Provider',
    description: 'Data compliance and validation services',
    icon: '🛡️',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'base_url', label: 'Base URL', type: 'url', required: true },
      { key: 'timeout', label: 'Timeout (seconds)', type: 'number', required: false, default: 60 }
    ]
  }
}

export function IntegrationProviderManagement() {
  const [providers, setProviders] = useState<IntegrationProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<string>('CLEARBIT')
  const [providerConfig, setProviderConfig] = useState<Record<string, any>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<ProviderTestResult[]>([])
  const [showAddProvider, setShowAddProvider] = useState(false)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/integration-providers')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.data || [])
        
        // Initialize config for selected provider
        const existingProvider = data.data.find((p: IntegrationProvider) => p.provider === selectedProvider)
        if (existingProvider) {
          setProviderConfig(existingProvider.config)
        } else {
          setProviderConfig({ enabled: true })
        }
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProvider = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/integration-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'configure',
          provider: selectedProvider,
          config: providerConfig
        })
      })

      if (response.ok) {
        await fetchProviders()
        setShowAddProvider(false)
      }
    } catch (error) {
      console.error('Error saving provider:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestProvider = async () => {
    setIsTesting(true)
    try {
      const response = await fetch('/api/integration-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          provider: selectedProvider,
          test_data: {
            domain: 'example.com',
            email: 'test@example.com',
            company_name: 'Example Company'
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTestResults(prev => [data.data, ...prev.slice(0, 4)])
      }
    } catch (error) {
      console.error('Error testing provider:', error)
    } finally {
      setIsTesting(false)
    }
  }

  const handleToggleProvider = async (provider: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/integration-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: enabled ? 'enable' : 'disable',
          provider
        })
      })

      if (response.ok) {
        await fetchProviders()
      }
    } catch (error) {
      console.error('Error toggling provider:', error)
    }
  }

  const getProviderStatus = (provider: string) => {
    const providerData = providers.find(p => p.provider === provider)
    return providerData?.config.enabled ? 'enabled' : 'disabled'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enabled':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'disabled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getTestResultIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integration Providers</h1>
          <p className="text-muted-foreground">
            Configure and manage external data providers
          </p>
        </div>
        
        <Button onClick={() => setShowAddProvider(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {/* Provider Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(PROVIDER_CONFIGS).map(([key, config]) => {
          const status = getProviderStatus(key as any)
          const providerData = providers.find(p => p.provider === key)
          
          return (
            <Card key={key} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {config.description}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusIcon(status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={status === 'enabled' ? 'success' : 'secondary'}>
                      {status}
                    </Badge>
                  </div>
                  
                  {providerData && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Rate Limit</span>
                        <span className="text-xs">
                          {providerData.config.rate_limit || 'N/A'} req/min
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Timeout</span>
                        <span className="text-xs">
                          {providerData.config.timeout || 'N/A'}s
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProvider(key)}
                      className="flex-1"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                    
                    <Switch
                      checked={status === 'enabled'}
                      onCheckedChange={(checked) => handleToggleProvider(key, checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Provider Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Configuration</CardTitle>
          <CardDescription>
            Configure settings for {PROVIDER_CONFIGS[selectedProvider as keyof typeof PROVIDER_CONFIGS]?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="settings" className="w-full">
            <TabsList>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="test">Test Connection</TabsTrigger>
              <TabsTrigger value="history">Test History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                {PROVIDER_CONFIGS[selectedProvider as keyof typeof PROVIDER_CONFIGS]?.fields.map((field) => (
                  <div key={field.key}>
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {field.type === 'password' ? (
                      <Input
                        id={field.key}
                        type="password"
                        value={providerConfig[field.key] || ''}
                        onChange={(e) => setProviderConfig({ ...providerConfig, [field.key]: e.target.value })}
                        placeholder={field.default ? `Default: ${field.default}` : ''}
                      />
                    ) : field.type === 'number' ? (
                      <Input
                        id={field.key}
                        type="number"
                        value={providerConfig[field.key] || field.default || ''}
                        onChange={(e) => setProviderConfig({ ...providerConfig, [field.key]: parseInt(e.target.value) || field.default })}
                      />
                    ) : (
                      <Input
                        id={field.key}
                        type={field.type}
                        value={providerConfig[field.key] || field.default || ''}
                        onChange={(e) => setProviderConfig({ ...providerConfig, [field.key]: e.target.value })}
                        placeholder={field.default ? `Default: ${field.default}` : ''}
                      />
                    )}
                  </div>
                ))}
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={providerConfig.enabled || false}
                    onCheckedChange={(checked) => setProviderConfig({ ...providerConfig, enabled: checked })}
                  />
                  <Label htmlFor="enabled">Enable Provider</Label>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-4">
                <Button onClick={handleSaveProvider} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Save Configuration
                </Button>
                
                <Button variant="outline" onClick={handleTestProvider} disabled={isTesting}>
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="test" className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Test the connection to {PROVIDER_CONFIGS[selectedProvider as keyof typeof PROVIDER_CONFIGS]?.name} 
                    using sample data to verify your configuration.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Test Domain</Label>
                    <Input defaultValue="example.com" />
                  </div>
                  <div>
                    <Label>Test Email</Label>
                    <Input defaultValue="test@example.com" />
                  </div>
                  <div>
                    <Label>Test Company</Label>
                    <Input defaultValue="Example Company" />
                  </div>
                </div>
                
                <Button onClick={handleTestProvider} disabled={isTesting} className="w-full">
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Run Test
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <div className="space-y-2">
                {testResults.length > 0 ? (
                  testResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTestResultIcon(result.test_result.success)}
                        <div>
                          <p className="text-sm font-medium">{result.provider}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(result.tested_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm">
                          {result.test_result.success ? 'Success' : 'Failed'}
                        </p>
                        {result.test_result.response_time && (
                          <p className="text-xs text-muted-foreground">
                            {result.test_result.response_time}ms
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No test results yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Run a test to see results here
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Provider Dialog */}
      {showAddProvider && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <CardContent className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Add Integration Provider</CardTitle>
              <CardDescription>
                Select a provider to configure
              </CardDescription>
            </CardHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROVIDER_CONFIGS).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center space-x-2">
                          <span>{config.icon}</span>
                          <span>{config.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {PROVIDER_CONFIGS[selectedProvider as keyof typeof PROVIDER_CONFIGS]?.description}
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddProvider(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowAddProvider(false)}>
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

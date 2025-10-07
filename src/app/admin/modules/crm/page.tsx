'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ;
  Settings, 
  CheckCircle, 
  XCircle, 
  Info,
  Save,
  RefreshCw
} from 'lucide-react'
import AuthWrapper from '@/components/auth/AuthWrapper';

const QUALIFICATION_FRAMEWORKS = [
  {
    id: 'BANT',
    name: 'BANT',
    fullName: 'Budget, Authority, Need, Timeline',
    description: 'Classic sales qualification framework focusing on budget, decision-making authority, business need, and timeline.',
    fields: ['budget', 'authority', 'need', 'timeline'],
    enabled: true
  },
  {
    id: 'CHAMP',
    name: 'CHAMP',
    fullName: 'Challenges, Authority, Money, Prioritization',
    description: 'Modern qualification approach focusing on customer challenges and prioritization.',
    fields: ['challenges', 'authority', 'money', 'prioritization'],
    enabled: true
  },
  {
    id: 'GPCTBA_C_I',
    name: 'GPCTBA/C&I',
    fullName: 'Goals, Plans, Challenges, Timeline, Budget, Authority, Consequences & Implications',
    description: 'Comprehensive framework covering all aspects of the buying process.',
    fields: ['goals', 'plans', 'challenges', 'timeline', 'budget', 'authority', 'consequences', 'implications'],
    enabled: true
  },
  {
    id: 'SPICED',
    name: 'SPICED',
    fullName: 'Situation, Pain, Impact, Consequence, Evidence, Decision',
    description: 'Pain-focused qualification methodology emphasizing customer challenges.',
    fields: ['situation', 'pain', 'impact', 'consequence', 'evidence', 'decision'],
    enabled: false
  },
  {
    id: 'ANUM',
    name: 'ANUM',
    fullName: 'Authority, Need, Urgency, Money',
    description: 'Streamlined qualification focusing on key decision factors.',
    fields: ['authority', 'need', 'urgency', 'money'],
    enabled: false
  },
  {
    id: 'FAINT',
    name: 'FAINT',
    fullName: 'Funds, Authority, Interest, Need, Timing',
    description: 'Traditional qualification framework with emphasis on timing.',
    fields: ['funds', 'authority', 'interest', 'need', 'timing'],
    enabled: false
  },
  {
    id: 'NEAT',
    name: 'NEAT',
    fullName: 'Need, Economic Impact, Access to Authority, Timeline',
    description: 'Value-focused qualification emphasizing economic impact.',
    fields: ['need', 'economic_impact', 'access_to_authority', 'timeline'],
    enabled: false
  },
  {
    id: 'PACT',
    name: 'PACT',
    fullName: 'Pain, Authority, Consequence, Timeline',
    description: 'Simplified qualification focusing on pain points and consequences.',
    fields: ['pain', 'authority', 'consequence', 'timeline'],
    enabled: false
  },
  {
    id: 'JTBD_FIT',
    name: 'JTBD-Fit',
    fullName: 'Jobs to be Done Framework',
    description: 'Customer-centric qualification based on jobs customers need to accomplish.',
    fields: ['job_to_be_done', 'outcome_expectations', 'constraints', 'success_metrics'],
    enabled: false
  },
  {
    id: 'FIVE_FIT',
    name: '5-Fit',
    fullName: 'Five-Fit Qualification Framework',
    description: 'Comprehensive qualification covering five key fit criteria.',
    fields: ['product_fit', 'market_fit', 'timing_fit', 'budget_fit', 'authority_fit'],
    enabled: false
  },
  {
    id: 'ABM',
    name: 'ABM',
    fullName: 'Account-Based Marketing Qualification',
    description: 'Strategic qualification for account-based marketing approaches.',
    fields: ['account_strategic_value', 'buying_committee', 'engagement_level', 'fit_score'],
    enabled: false
  },
  {
    id: 'TARGETING',
    name: 'Targeting',
    fullName: 'Advanced Targeting Framework',
    description: 'Data-driven qualification using advanced targeting criteria.',
    fields: ['demographic_fit', 'behavioral_fit', 'intent_signals', 'engagement_score'],
    enabled: false
  }
]

export default function CRMModuleAdmin() {
  const [frameworks, setFrameworks] = useState(QUALIFICATION_FRAMEWORKS)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const loadFrameworkSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/qualification-frameworks')
      if (response.ok) {
        const data = await response.json()
        const savedFrameworks = data.data?.frameworks || []
        
        // Merge with default frameworks, preserving saved settings
        const mergedFrameworks = QUALIFICATION_FRAMEWORKS.map(defaultFramework => {
          const saved = savedFrameworks.find((f: any) => f.framework_id === defaultFramework.id)
          return saved ? {
            ...defaultFramework,
            enabled: saved.enabled
          } : defaultFramework
        })
        
        setFrameworks(mergedFrameworks)
      } else if (response.status === 403) {
        setMessage({ type: 'error', text: 'Access denied. You need admin or super admin privileges to manage qualification frameworks.' })
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to load framework settings:', error)
      setMessage({ type: 'error', text: 'Failed to load framework settings. Please check your permissions.' })
    } finally {
      setLoading(false)
    }
  }

  const saveFrameworkSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/qualification-frameworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameworks })
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Qualification framework settings saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else if (response.status === 403) {
        setMessage({ type: 'error', text: 'Access denied. You need admin or super admin privileges to save framework settings.' })
      } else {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        console.error('API error response:', errorData)
        setMessage({ type: 'error', text: `Failed to save settings: ${errorData.error || response.statusText}` })
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to save framework settings:', error)
      if (!message) { // Only set message if not already set
        setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleFramework = (frameworkId: string) => {
    setFrameworks(prev => 
      prev.map(framework => 
        framework.id === frameworkId 
          ? { ...framework, enabled: !framework.enabled }
          : framework
      )
    )
  }

  const enableAllFrameworks = () => {
    setFrameworks(prev => 
      prev.map(framework => ({ ...framework, enabled: true }))
    )
  }

  const disableAllFrameworks = () => {
    setFrameworks(prev => 
      prev.map(framework => ({ ...framework, enabled: false }))
    )
  }

  useEffect(() => {
    loadFrameworkSettings()
  }, [])

  const enabledCount = frameworks.filter(f => f.enabled).length
  const disabledCount = frameworks.filter(f => !f.enabled).length

  return (
    <AuthWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">CRM Module Administration</h1>
            <p className="text-gray-600">
              Configure qualification frameworks and CRM settings
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className="bg-blue-100 text-blue-800">
              {enabledCount} Active
            </Badge>
            <Badge variant="outline">
              {disabledCount} Disabled
            </Badge>
          </div>
        </div>

        {/* Message */}
        {message && (
          <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Info Card */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Qualification Framework Management</p>
              <p className="text-sm">
                Enable or disable qualification frameworks for your organization. Only enabled frameworks 
                will be available for use in lead qualification. Each opportunity can only be assessed 
                with one framework at a time.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Bulk Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Bulk Actions</span>
            </CardTitle>
            <CardDescription>Quick actions for managing all frameworks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={enableAllFrameworks}
                disabled={loading || saving}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Enable All
              </Button>
              <Button 
                variant="outline" 
                onClick={disableAllFrameworks}
                disabled={loading || saving}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Disable All
              </Button>
              <Button 
                variant="outline" 
                onClick={loadFrameworkSettings}
                disabled={loading || saving}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Framework Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Qualification Frameworks</CardTitle>
            <CardDescription>
              Configure which qualification frameworks are available for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {frameworks.map((framework) => (
                <div key={framework.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0 pt-1">
                    <Switch
                      checked={framework.enabled}
                      onCheckedChange={() => toggleFramework(framework.id)}
                      disabled={loading || saving}
                    />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{framework.name}</h3>
                      <Badge variant={framework.enabled ? 'default' : 'secondary'}>
                        {framework.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-700">
                      {framework.fullName}
                    </p>
                    
                    <p className="text-sm text-gray-600">
                      {framework.description}
                    </p>
                    
                    <div className="flex items-center space-x-2">
                      <Label className="text-xs text-gray-500">Fields:</Label>
                      <div className="flex flex-wrap gap-1">
                        {framework.fields.map((field) => (
                          <Badge key={field} variant="outline" className="text-xs">
                            {field.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={saveFrameworkSettings}
            disabled={loading || saving}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </AuthWrapper>
  )
}
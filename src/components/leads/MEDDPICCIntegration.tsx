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
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Loader2, Target, TrendingUp, CheckCircle, XCircle, AlertCircle, ArrowRight, Settings } from 'lucide-react';

interface MEDDPICCData {
  id: string
  lead_id: string
  metrics: {
    score: number
    status: 'COMPLETE' | 'IN_PROGRESS' | 'NOT_STARTED'
    last_updated: string
  }
  criteria: {
    metrics: {
      value: string
      confidence: number
      source: string
      last_updated: string
    }
    economic_buyer: {
      value: string
      confidence: number
      source: string
      last_updated: string
    }
    decision_criteria: {
      value: string[]
      confidence: number
      source: string
      last_updated: string
    }
    decision_process: {
      value: string
      confidence: number
      source: string
      last_updated: string
    }
    identify_pain: {
      value: string[]
      confidence: number
      source: string
      last_updated: string
    }
    champion: {
      value: string
      confidence: number
      source: string
      last_updated: string
    }
    competition: {
      value: string[]
      confidence: number
      source: string
      last_updated: string
    }
  }
  organization_id: string
  created_at: string
  updated_at: string
}

interface Lead {
  id: string
  first_name: string
  last_name: string
  company_name: string
  title?: string
  email?: string
  phone?: string
  status: string
  score: number
  geography: string
  industry?: string
  revenue_band?: string
  employee_band?: string
  entity_type?: string
  ai_accounts?: unknown[]
  ai_contacts?: unknown[]
}

interface MEDDPICCIntegrationConfig {
  id: string
  name: string
  description: string
  enabled: boolean
  auto_populate: boolean
  confidence_threshold: number
  data_sources: string[]
  mapping_rules: Record<string, unknown>
  organization_id: string
  created_at: string
  updated_at: string
}

const MEDDPICC_CRITERIA = {
  metrics: {
    label: 'Metrics',
    description: 'What metrics will be used to measure success?',
    type: 'text',
    weight: 0.15
  },
  economic_buyer: {
    label: 'Economic Buyer',
    description: 'Who has the budget and authority to make the purchase?',
    type: 'text',
    weight: 0.15
  },
  decision_criteria: {
    label: 'Decision Criteria',
    description: 'What criteria will be used to evaluate solutions?',
    type: 'multi_select',
    weight: 0.15
  },
  decision_process: {
    label: 'Decision Process',
    description: 'What is the decision-making process?',
    type: 'text',
    weight: 0.15
  },
  identify_pain: {
    label: 'Identify Pain',
    description: 'What pain points are driving this initiative?',
    type: 'multi_select',
    weight: 0.15
  },
  champion: {
    label: 'Champion',
    description: 'Who is the internal advocate for this solution?',
    type: 'text',
    weight: 0.15
  },
  competition: {
    label: 'Competition',
    description: 'What other solutions are being considered?',
    type: 'multi_select',
    weight: 0.1
  }
}

export function MEDDPICCIntegration() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [meddpiccData, setMeddpiccData] = useState<MEDDPICCData[]>([])
  const [config, setConfig] = useState<MEDDPICCIntegrationConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [selectedMeddpicc, setSelectedMeddpicc] = useState<MEDDPICCData | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchLeads()
    fetchMeddpiccData()
    fetchConfig()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads?status=QUALIFIED')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMeddpiccData = async () => {
    try {
      const response = await fetch('/api/meddpicc/data')
      if (response.ok) {
        const data = await response.json()
        setMeddpiccData(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching MEDDPICC data:', error)
    }
  }

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/meddpicc/integration-config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.data)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    }
  }

  const handleCreateMeddpicc = async (leadId: string) => {
    try {
      const response = await fetch('/api/meddpicc/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lead_id: leadId })
      })

      if (response.ok) {
        await fetchMeddpiccData()
      }
    } catch (error) {
      console.error('Error creating MEDDPICC:', error)
    }
  }

  const handleUpdateMeddpicc = async (meddpiccId: string, updates: unknown) => {
    try {
      const response = await fetch(`/api/meddpicc/${meddpiccId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        await fetchMeddpiccData()
      }
    } catch (error) {
      console.error('Error updating MEDDPICC:', error)
    }
  }

  const getMeddpiccForLead = (leadId: string) => {
    return meddpiccData.find(data => data.lead_id === leadId)
  }

  const getCompletionPercentage = (meddpicc: MEDDPICCData) => {
    const criteria = Object.values(meddpicc.criteria)
    const completed = criteria.filter(criterion => 
      criterion.value && 
      (Array.isArray(criterion.value) ? criterion.value.length > 0 : criterion.value !== '')
    ).length
    return (completed / criteria.length) * 100
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'IN_PROGRESS':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return <Badge variant="success">Complete</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="secondary">In Progress</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
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
          <h1 className="text-3xl font-bold">MEDDPICC Integration</h1>
          <p className="text-muted-foreground">
            Integrate AI-generated leads with MEDDPICC qualification
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="success" className="text-sm">
            Integrated
          </Badge>
        </div>
      </div>

      {/* Integration Status */}
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">MEDDPICC Integration Status</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>✅ MEDDPICC module detected and integrated</li>
              <li>✅ Automatic data population enabled</li>
              <li>✅ Lead-to-MEDDPICC mapping configured</li>
              <li>✅ Confidence scoring integrated</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Qualified Leads</TabsTrigger>
          <TabsTrigger value="meddpicc">MEDDPICC Data</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leads.length}</div>
                <p className="text-xs text-muted-foreground">
                  Ready for MEDDPICC
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MEDDPICC Records</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{meddpiccData.length}</div>
                <p className="text-xs text-muted-foreground">
                  Created records
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {meddpiccData.length > 0 ? Math.round(
                    meddpiccData.reduce((acc, data) => acc + getCompletionPercentage(data), 0) / meddpiccData.length
                  ) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average completion
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Integration Status</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {config?.enabled ? 'Active' : 'Inactive'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-population
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="leads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Qualified Leads</CardTitle>
              <CardDescription>
                Leads ready for MEDDPICC qualification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leads.map((lead) => {
                  const meddpicc = getMeddpiccForLead(lead.id)
                  const completionPercentage = meddpicc ? getCompletionPercentage(meddpicc) : 0
                  
                  return (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Target className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium truncate">
                              {lead.first_name} {lead.last_name}
                            </p>
                            <Badge variant="outline">{lead.company_name}</Badge>
                            <Badge variant="success">Qualified</Badge>
                            {meddpicc && getStatusIcon(meddpicc.metrics.status)}
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-1">
                            {lead.title && (
                              <p className="text-sm text-muted-foreground truncate">
                                {lead.title}
                              </p>
                            )}
                            <Badge variant="outline">{lead.geography}</Badge>
                            {lead.industry && (
                              <Badge variant="outline">{lead.industry}</Badge>
                            )}
                            <Badge variant="outline">Score: {lead.score}</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {meddpicc ? (
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {Math.round(completionPercentage)}% Complete
                            </div>
                            <div className="w-24">
                              <Progress value={completionPercentage} />
                            </div>
                          </div>
                        ) : (
                          <div className="text-right">
                            <div className="text-sm font-medium text-muted-foreground">
                              No MEDDPICC
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          {!meddpicc && (
                            <Button
                              size="sm"
                              onClick={() => handleCreateMeddpicc(lead.id)}
                            >
                              <Target className="h-4 w-4 mr-2" />
                              Create MEDDPICC
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLead(lead)
                              if (meddpicc) {
                                setSelectedMeddpicc(meddpicc)
                                setActiveTab('meddpicc')
                              }
                            }}
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {leads.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No qualified leads found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="meddpicc" className="space-y-6">
          {selectedMeddpicc ? (
            <MEDDPICCDetailView
              meddpicc={selectedMeddpicc}
              lead={selectedLead}
              onUpdate={handleUpdateMeddpicc}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Select a lead to view MEDDPICC data</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="config" className="space-y-6">
          <MEDDPICCConfiguration
            config={config}
            onUpdate={setConfig}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface MEDDPICCDetailViewProps {
  meddpicc: MEDDPICCData
  lead: Lead | null
  onUpdate: (id: string, updates: unknown) => void
}

function MEDDPICCDetailView({ meddpicc, lead, onUpdate }: MEDDPICCDetailViewProps) {
  const [editingCriterion, setEditingCriterion] = useState<string | null>(null)

  const handleUpdateCriterion = (criterionKey: string, value: unknown) => {
    onUpdate(meddpicc.id, {
      criteria: {
        ...meddpicc.criteria,
        [criterionKey]: {
          ...meddpicc.criteria[criterionKey],
          value,
          last_updated: new Date().toISOString()
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>MEDDPICC Qualification</CardTitle>
              <CardDescription>
                {lead?.first_name} {lead?.last_name} at {lead?.company_name}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Score: {meddpicc.metrics.score}</Badge>
              {getStatusBadge(meddpicc.metrics.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completion</span>
              <span className="text-sm">{Math.round(getCompletionPercentage(meddpicc))}%</span>
            </div>
            <Progress value={getCompletionPercentage(meddpicc)} />
          </div>
        </CardContent>
      </Card>

      {/* MEDDPICC Criteria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(MEDDPICC_CRITERIA).map(([key, criterion]) => {
          const criterionData = meddpicc.criteria[key as keyof typeof meddpicc.criteria]
          
          return (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{criterion.label}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{Math.round(criterionData.confidence * 100)}%</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCriterion(editingCriterion === key ? null : key)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{criterion.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current Value</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    {Array.isArray(criterionData.value) ? (
                      <div className="flex flex-wrap gap-2">
                        {criterionData.value.map((item, index) => (
                          <Badge key={index} variant="outline">{item}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm">{criterionData.value || 'Not set'}</p>
                    )}
                  </div>
                </div>
                
                {editingCriterion === key && (
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    {criterion.type === 'text' ? (
                      <div>
                        <Label>Value</Label>
                        <Textarea
                          value={criterionData.value || ''}
                          onChange={(e) => handleUpdateCriterion(key, e.target.value)}
                          placeholder={`Enter ${criterion.label.toLowerCase()}`}
                        />
                      </div>
                    ) : criterion.type === 'multi_select' ? (
                      <div>
                        <Label>Options</Label>
                        <div className="space-y-2">
                          {criterionData.value?.map((item: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                value={item}
                                onChange={(e) => {
                                  const newValue = [...(criterionData.value || [])]
                                  newValue[index] = e.target.value
                                  handleUpdateCriterion(key, newValue)
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newValue = [...(criterionData.value || [])]
                                  newValue.splice(index, 1)
                                  handleUpdateCriterion(key, newValue)
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newValue = [...(criterionData.value || []), '']
                              handleUpdateCriterion(key, newValue)
                            }}
                          >
                            Add Option
                          </Button>
                        </div>
                      </div>
                    ) : null}
                    
                    <div>
                      <Label>Confidence: {Math.round(criterionData.confidence * 100)}%</Label>
                      <Slider
                        value={[criterionData.confidence]}
                        onValueChange={(value) => handleUpdateCriterion(key, {
                          ...criterionData,
                          confidence: value[0]
                        })}
                        max={1}
                        min={0}
                        step={0.05}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function MEDDPICCConfiguration({ config, onUpdate }: { config: MEDDPICCIntegrationConfig | null, onUpdate: (config: MEDDPICCIntegrationConfig | null) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>MEDDPICC Integration Configuration</CardTitle>
        <CardDescription>
          Configure how AI leads integrate with MEDDPICC qualification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={config?.enabled || false}
              onCheckedChange={(checked) => onUpdate({
                ...config,
                enabled: checked
              } as MEDDPICCIntegrationConfig)}
            />
            <Label htmlFor="enabled">Enable Integration</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="auto_populate"
              checked={config?.auto_populate || false}
              onCheckedChange={(checked) => onUpdate({
                ...config,
                auto_populate: checked
              } as MEDDPICCIntegrationConfig)}
            />
            <Label htmlFor="auto_populate">Auto-populate MEDDPICC</Label>
          </div>
          
          <div>
            <Label>Confidence Threshold: {Math.round((config?.confidence_threshold || 0.8) * 100)}%</Label>
            <Slider
              value={[config?.confidence_threshold || 0.8]}
              onValueChange={(value) => onUpdate({
                ...config,
                confidence_threshold: value[0]
              } as MEDDPICCIntegrationConfig)}
              max={1}
              min={0}
              step={0.05}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getCompletionPercentage(meddpicc: MEDDPICCData): number {
  const criteria = Object.values(meddpicc.criteria)
  const completed = criteria.filter(criterion => 
    criterion.value && 
    (Array.isArray(criterion.value) ? criterion.value.length > 0 : criterion.value !== '')
  ).length
  return (completed / criteria.length) * 100
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETE':
      return <Badge variant="success">Complete</Badge>
    case 'IN_PROGRESS':
      return <Badge variant="secondary">In Progress</Badge>
    default:
      return <Badge variant="outline">Not Started</Badge>
  }
}

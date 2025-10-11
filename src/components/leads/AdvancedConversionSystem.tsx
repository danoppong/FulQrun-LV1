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
import { Loader2, ArrowRight, Building, Users, DollarSign, Calendar, Eye, CheckCircle, XCircle, AlertCircle, Settings, Zap, Target, TrendingUp } from 'lucide-react';

interface ConversionTemplate {
  id: string
  name: string
  description: string
  opportunity_settings: {
    name_template: string
    stage: string
    probability: number
    value_estimation: {
      method: 'fixed' | 'calculated' | 'ai_estimated'
      value?: number
      calculation_rules?: Record<string, unknown>
    }
    close_date_estimation: {
      method: 'fixed' | 'calculated' | 'ai_estimated'
      days?: number
      calculation_rules?: Record<string, unknown>
    }
    description_template: string
  }
  handoff_settings: {
    assign_to_user: boolean
    user_selection_method: 'auto' | 'manual' | 'round_robin' | 'workload_based'
    notification_settings: {
      notify_assigned_user: boolean
      notify_manager: boolean
      notify_stakeholders: boolean
      email_template?: string
    }
    follow_up_settings: {
      create_follow_up_task: boolean
      follow_up_days: number
      task_template?: string
    }
  }
  meddpicc_integration: {
    auto_populate: boolean
    confidence_threshold: number
    mapping_rules: Record<string, unknown>
  }
  organization_id: string
  created_at: string
  updated_at: string
}

interface ConversionJob {
  id: string
  lead_id: string
  template_id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK'
  opportunity_id?: string
  assigned_user_id?: string
  conversion_data: {
    opportunity_name: string
    stage: string
    probability: number
    estimated_value?: number
    close_date?: string
    description: string
  meddpicc_data?: unknown
  }
  handoff_data: {
  assigned_user?: unknown
    notifications_sent: string[]
    follow_up_task_id?: string
  }
  created_at: string
  updated_at: string
  completed_at?: string
  error_message?: string
}

interface QualifiedLead {
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
  qualification_data?: unknown
  meddpicc_data?: unknown
  ai_accounts?: unknown[]
  ai_contacts?: unknown[]
}

interface ConversionAnalytics {
  total_conversions: number
  successful_conversions: number
  failed_conversions: number
  conversion_rate: number
  avg_conversion_time: number
  avg_opportunity_value: number
  by_template: Record<string, {
    count: number
    success_rate: number
    avg_value: number
  }>
  by_user: Record<string, {
    count: number
    success_rate: number
    avg_value: number
  }>
  trends: {
    daily_conversions: Array<{ date: string; count: number; value: number }>
    weekly_rates: Array<{ week: string; rate: number }>
  }
}

export function AdvancedConversionSystem() {
  const [leads, setLeads] = useState<QualifiedLead[]>([])
  const [templates, setTemplates] = useState<ConversionTemplate[]>([])
  const [jobs, setJobs] = useState<ConversionJob[]>([])
  const [analytics, setAnalytics] = useState<ConversionAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isConverting, setIsConverting] = useState(false)
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Partial<ConversionTemplate>>({})
  const [activeTab, setActiveTab] = useState('conversion')

  useEffect(() => {
    fetchLeads()
    fetchTemplates()
    fetchJobs()
    fetchAnalytics()
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

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/conversion/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/conversion/jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/conversion/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const handleConvertLeads = async () => {
    if (selectedLeads.length === 0 || !selectedTemplate) return

    setIsConverting(true)
    try {
      const response = await fetch('/api/conversion/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_ids: selectedLeads,
          template_id: selectedTemplate
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Conversion successful:', data)
        
        // Poll for conversion job status
        if (data.data.conversions.length > 0) {
          const jobIds = data.data.conversions.map((conv: unknown) => conv.job_id)
          pollConversionJobs(jobIds)
        }
        
        setSelectedLeads([])
        setSelectedTemplate('')
        await fetchLeads()
        await fetchJobs()
        await fetchAnalytics()
      }
    } catch (error) {
      console.error('Error converting leads:', error)
    } finally {
      setIsConverting(false)
    }
  }

  const pollConversionJobs = async (jobIds: string[]) => {
    const pollInterval = setInterval(async () => {
      try {
        const allCompleted = await Promise.all(
          jobIds.map(async (jobId) => {
            const response = await fetch(`/api/conversion/jobs/${jobId}`)
            if (response.ok) {
              const data = await response.json()
              return data.data.status === 'COMPLETED' || data.data.status === 'FAILED'
            }
            return false
          })
        )

        if (allCompleted.every(completed => completed)) {
          clearInterval(pollInterval)
          await fetchJobs()
          await fetchAnalytics()
        }
      } catch (error) {
        console.error('Error polling conversion jobs:', error)
        clearInterval(pollInterval)
      }
    }, 2000)

    // Clear interval after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000)
  }

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/conversion/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingTemplate)
      })

      if (response.ok) {
        await fetchTemplates()
        setShowCreateTemplate(false)
        setEditingTemplate({})
      }
    } catch (error) {
      console.error('Error creating template:', error)
    }
  }

  const getConversionStatus = (leadId: string) => {
    const job = jobs.find(job => job.lead_id === leadId)
    return job?.status || null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'IN_PROGRESS':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case 'PENDING':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="secondary">In Progress</Badge>
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">Not Converted</Badge>
    }
  }

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    )
  }

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map(lead => lead.id))
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
          <h1 className="text-3xl font-bold">Advanced Conversion System</h1>
          <p className="text-muted-foreground">
            Convert qualified leads to opportunities with intelligent handoff
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowCreateTemplate(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="conversion" className="space-y-6">
          {/* Conversion Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Convert Qualified Leads</CardTitle>
              <CardDescription>
                Select leads and template for conversion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label>Conversion Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select conversion template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedLeads.length === leads.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedLeads.length} selected
                  </span>
                </div>
              </div>
              
              <Button
                onClick={handleConvertLeads}
                disabled={isConverting || selectedLeads.length === 0 || !selectedTemplate}
                className="w-full"
              >
                {isConverting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Convert {selectedLeads.length} Leads to Opportunities
              </Button>
            </CardContent>
          </Card>

          {/* Qualified Leads */}
          <Card>
            <CardHeader>
              <CardTitle>Qualified Leads</CardTitle>
              <CardDescription>
                {leads.length} qualified leads ready for conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leads.map((lead) => {
                  const conversionStatus = getConversionStatus(lead.id)
                  const isSelected = selectedLeads.includes(lead.id)
                  
                  return (
                    <div
                      key={lead.id}
                      className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectLead(lead.id)}
                          className="rounded"
                          disabled={!!conversionStatus}
                        />
                        
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Building className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium truncate">
                              {lead.first_name} {lead.last_name}
                            </p>
                            <Badge variant="outline">{lead.company_name}</Badge>
                            <Badge variant="success">Qualified</Badge>
                            {conversionStatus && getStatusIcon(conversionStatus)}
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
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {lead.revenue_band || 'Unknown Revenue'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {lead.employee_band || 'Unknown Size'}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {conversionStatus && getStatusBadge(conversionStatus)}
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
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
        
        <TabsContent value="templates" className="space-y-6">
          <ConversionTemplateManager
            templates={templates}
            onTemplateCreated={fetchTemplates}
          />
        </TabsContent>
        
        <TabsContent value="jobs" className="space-y-6">
          <ConversionJobMonitor
            jobs={jobs}
            onJobUpdate={fetchJobs}
          />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <ConversionAnalyticsDashboard analytics={analytics} />
        </TabsContent>
      </Tabs>

      {/* Create Template Dialog */}
      {showCreateTemplate && (
        <ConversionTemplateDialog
          template={editingTemplate}
          onChange={setEditingTemplate}
          onSave={handleCreateTemplate}
          onCancel={() => setShowCreateTemplate(false)}
        />
      )}
    </div>
  )
}

interface ConversionTemplateManagerProps {
  templates: ConversionTemplate[]
  onTemplateCreated: () => void
}

function ConversionTemplateManager({ templates, onTemplateCreated }: ConversionTemplateManagerProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Initial Stage</span>
                  <Badge variant="outline">{template.opportunity_settings.stage}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Probability</span>
                  <span className="text-sm">{template.opportunity_settings.probability}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Value Method</span>
                  <Badge variant="outline">{template.opportunity_settings.value_estimation.method}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto Assign</span>
                  <Badge variant={template.handoff_settings.assign_to_user ? 'success' : 'secondary'}>
                    {template.handoff_settings.assign_to_user ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {templates.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No conversion templates created</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface ConversionJobMonitorProps {
  jobs: ConversionJob[]
  onJobUpdate: () => void
}

function ConversionJobMonitor({ jobs, onJobUpdate }: ConversionJobMonitorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Jobs</CardTitle>
        <CardDescription>
          Monitor conversion job progress and status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">{job.conversion_data.opportunity_name}</p>
                    <Badge variant="outline">{job.conversion_data.stage}</Badge>
                    <Badge variant={job.status === 'COMPLETED' ? 'success' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-muted-foreground">
                      Created: {new Date(job.created_at).toLocaleString()}
                    </span>
                    {job.conversion_data.estimated_value && (
                      <span className="text-xs text-muted-foreground">
                        Value: ${job.conversion_data.estimated_value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium">
                  {job.conversion_data.probability}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Probability
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {jobs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No conversion jobs yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ConversionAnalyticsDashboard({ analytics }: { analytics: ConversionAnalytics | null }) {
  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_conversions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Lead conversions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversion_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Success rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.avg_opportunity_value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Average opportunity value
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.avg_conversion_time)}h</div>
            <p className="text-xs text-muted-foreground">
              Average conversion time
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface ConversionTemplateDialogProps {
  template: Partial<ConversionTemplate>
  onChange: (template: Partial<ConversionTemplate>) => void
  onSave: () => void
  onCancel: () => void
}

function ConversionTemplateDialog({ template, onChange, onSave, onCancel }: ConversionTemplateDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create Conversion Template</CardTitle>
          <CardDescription>
            Define conversion settings and handoff rules
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={template.name || ''}
                  onChange={(e) => onChange({ ...template, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={template.description || ''}
                  onChange={(e) => onChange({ ...template, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
            </div>
          </div>

          {/* Opportunity Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Opportunity Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name_template">Name Template</Label>
                <Input
                  id="name_template"
                  value={template.opportunity_settings?.name_template || ''}
                  onChange={(e) => onChange({
                    ...template,
                    opportunity_settings: {
                      ...template.opportunity_settings,
                      name_template: e.target.value
                    }
                  })}
                  placeholder="e.g., {company_name} - {contact_title}"
                />
              </div>
              
              <div>
                <Label htmlFor="stage">Initial Stage</Label>
                <Select
                  value={template.opportunity_settings?.stage || 'prospecting'}
                  onValueChange={(value) => onChange({
                    ...template,
                    opportunity_settings: {
                      ...template.opportunity_settings,
                      stage: value
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospecting">Prospecting</SelectItem>
                    <SelectItem value="qualifying">Qualifying</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="probability">Initial Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={template.opportunity_settings?.probability || 0}
                  onChange={(e) => onChange({
                    ...template,
                    opportunity_settings: {
                      ...template.opportunity_settings,
                      probability: parseInt(e.target.value) || 0
                    }
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="value_method">Value Estimation Method</Label>
                <Select
                  value={template.opportunity_settings?.value_estimation?.method || 'fixed'}
                  onValueChange={(value: unknown) => onChange({
                    ...template,
                    opportunity_settings: {
                      ...template.opportunity_settings,
                      value_estimation: {
                        ...template.opportunity_settings?.value_estimation,
                        method: value
                      }
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Value</SelectItem>
                    <SelectItem value="calculated">Calculated</SelectItem>
                    <SelectItem value="ai_estimated">AI Estimated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Handoff Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Handoff Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="assign_to_user"
                  checked={template.handoff_settings?.assign_to_user || false}
                  onCheckedChange={(checked) => onChange({
                    ...template,
                    handoff_settings: {
                      ...template.handoff_settings,
                      assign_to_user: checked,
                      user_selection_method: template.handoff_settings?.user_selection_method || 'auto',
                      notification_settings: template.handoff_settings?.notification_settings || {
                        notify_assigned_user: true,
                        notify_manager: false,
                        notify_stakeholders: false
                      },
                      follow_up_settings: template.handoff_settings?.follow_up_settings || {
                        create_follow_up_task: true,
                        follow_up_days: 7
                      }
                    }
                  })}
                />
                <Label htmlFor="assign_to_user">Auto Assign to User</Label>
              </div>
              
              {template.handoff_settings?.assign_to_user && (
                <div>
                  <Label htmlFor="user_selection">User Selection Method</Label>
                  <Select
                    value={template.handoff_settings?.user_selection_method || 'auto'}
                    onValueChange={(value: unknown) => onChange({
                      ...template,
                      handoff_settings: {
                        ...template.handoff_settings,
                        user_selection_method: value
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="workload_based">Workload Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        <div className="flex items-center justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            <Settings className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </Card>
    </div>
  )
}

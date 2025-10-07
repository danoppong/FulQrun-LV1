'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Loader2, Play, Pause, Settings, Target, TrendingUp, CheckCircle, XCircle, AlertCircle, Zap } from 'lucide-react';

interface AutomatedQualificationConfig {
  id: string
  name: string
  description: string
  enabled: boolean
  template_id: string
  auto_run_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  batch_size: number
  scoring_rules: {
    use_ml_scoring: boolean
    confidence_threshold: number
    fallback_to_rules: boolean
  }
  notification_settings: {
    notify_on_completion: boolean
    notify_on_errors: boolean
    email_recipients: string[]
  }
  organization_id: string
  created_at: string
  updated_at: string
}

interface QualificationJob {
  id: string
  config_id: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED'
  lead_count: number
  processed_count: number
  qualified_count: number
  disqualified_count: number
  error_count: number
  started_at: string
  completed_at?: string
  error_message?: string
  progress_percentage: number
}

interface QualificationResult {
  lead_id: string
  framework: string
  status: 'QUALIFIED' | 'DISQUALIFIED' | 'IN_PROGRESS'
  score: number
  confidence: number
  criteria_scores: Record<string, number>
  evidence: Array<{
    field: string
    value: any
    confidence: number
    source: string
  }>
  ml_prediction?: {
    score: number
    confidence: number
    factors: string[]
  }
}

export function AutomatedQualificationSystem() {
  const [configs, setConfigs] = useState<AutomatedQualificationConfig[]>([])
  const [jobs, setJobs] = useState<QualificationJob[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConfig, setSelectedConfig] = useState<AutomatedQualificationConfig | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingConfig, setEditingConfig] = useState<Partial<AutomatedQualificationConfig>>({})
  const [activeTab, setActiveTab] = useState('configs')

  useEffect(() => {
    fetchConfigs()
    fetchJobs()
    fetchTemplates()
  }, [])

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/qualification/automation/configs')
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching configs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/qualification/automation/jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/qualification/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleCreateConfig = async () => {
    try {
      const response = await fetch('/api/qualification/automation/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingConfig)
      })

      if (response.ok) {
        await fetchConfigs()
        setShowCreateDialog(false)
        setEditingConfig({})
      }
    } catch (error) {
      console.error('Error creating config:', error)
    }
  }

  const handleRunJob = async (configId: string) => {
    try {
      const response = await fetch('/api/qualification/automation/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config_id: configId })
      })

      if (response.ok) {
        await fetchJobs()
      }
    } catch (error) {
      console.error('Error running job:', error)
    }
  }

  const handleToggleConfig = async (configId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/qualification/automation/configs/${configId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled })
      })

      if (response.ok) {
        await fetchConfigs()
      }
    } catch (error) {
      console.error('Error toggling config:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'RUNNING':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case 'PAUSED':
        return <Pause className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      case 'RUNNING':
        return <Badge variant="secondary">Running</Badge>
      case 'PAUSED':
        return <Badge variant="outline">Paused</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
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
          <h1 className="text-3xl font-bold">Automated Qualification</h1>
          <p className="text-muted-foreground">
            Configure and manage automated lead qualification
          </p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Zap className="h-4 w-4 mr-2" />
          Create Automation
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="configs">Configurations</TabsTrigger>
          <TabsTrigger value="jobs">Job History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="configs" className="space-y-6">
          {/* Configurations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map((config) => (
              <Card key={config.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={(checked) => handleToggleConfig(config.id, checked)}
                      />
                      <Badge variant={config.enabled ? 'success' : 'secondary'}>
                        {config.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Frequency</span>
                      <Badge variant="outline">{config.auto_run_frequency}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Batch Size</span>
                      <span className="text-sm">{config.batch_size}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">ML Scoring</span>
                      <Badge variant={config.scoring_rules.use_ml_scoring ? 'success' : 'secondary'}>
                        {config.scoring_rules.use_ml_scoring ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedConfig(config)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRunJob(config.id)}
                      disabled={!config.enabled}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {configs.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No automation configurations</p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Create Your First Automation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="jobs" className="space-y-6">
          {/* Job History */}
          <Card>
            <CardHeader>
              <CardTitle>Qualification Jobs</CardTitle>
              <CardDescription>
                Recent automated qualification job executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">Job #{job.id.slice(-8)}</p>
                          {getStatusBadge(job.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Started: {new Date(job.started_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {job.processed_count} / {job.lead_count}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {job.qualified_count} qualified, {job.disqualified_count} disqualified
                        </div>
                      </div>
                      
                      <div className="w-24">
                        <Progress value={job.progress_percentage} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {jobs.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No jobs executed yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <QualificationAnalytics />
        </TabsContent>
      </Tabs>

      {/* Create Configuration Dialog */}
      {showCreateDialog && (
        <AutomationConfigDialog
          config={editingConfig}
          onChange={setEditingConfig}
          onSave={handleCreateConfig}
          onCancel={() => setShowCreateDialog(false)}
          templates={templates}
        />
      )}
    </div>
  )
}

interface AutomationConfigDialogProps {
  config: Partial<AutomatedQualificationConfig>
  onChange: (config: Partial<AutomatedQualificationConfig>) => void
  onSave: () => void
  onCancel: () => void
  templates: unknown[]
}

function AutomationConfigDialog({ config, onChange, onSave, onCancel, templates }: AutomationConfigDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4">
        <CardHeader>
          <CardTitle>Create Automation Configuration</CardTitle>
          <CardDescription>
            Configure automated lead qualification settings
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Configuration Name</Label>
                <Input
                  id="name"
                  value={config.name || ''}
                  onChange={(e) => onChange({ ...config, name: e.target.value })}
                  placeholder="Enter configuration name"
                />
              </div>
              
              <div>
                <Label htmlFor="template">Qualification Template</Label>
                <Select
                  value={config.template_id || ''}
                  onValueChange={(value) => onChange({ ...config, template_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.framework})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={config.description || ''}
                onChange={(e) => onChange({ ...config, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
          </div>

          {/* Automation Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Automation Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency">Run Frequency</Label>
                <Select
                  value={config.auto_run_frequency || 'daily'}
                  onValueChange={(value: any) => onChange({ ...config, auto_run_frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="batch_size">Batch Size</Label>
                <Input
                  id="batch_size"
                  type="number"
                  min="1"
                  max="1000"
                  value={config.batch_size || 100}
                  onChange={(e) => onChange({ ...config, batch_size: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>
          </div>

          {/* Scoring Rules */}
          <div className="space-y-4">
            <h3 className="font-medium">Scoring Rules</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use_ml_scoring"
                  checked={config.scoring_rules?.use_ml_scoring || false}
                  onCheckedChange={(checked) => onChange({
                    ...config,
                    scoring_rules: {
                      ...config.scoring_rules,
                      use_ml_scoring: checked,
                      confidence_threshold: config.scoring_rules?.confidence_threshold || 0.8,
                      fallback_to_rules: config.scoring_rules?.fallback_to_rules || true
                    }
                  })}
                />
                <Label htmlFor="use_ml_scoring">Use ML Scoring</Label>
              </div>
              
              {config.scoring_rules?.use_ml_scoring && (
                <div>
                  <Label>Confidence Threshold: {Math.round((config.scoring_rules?.confidence_threshold || 0.8) * 100)}%</Label>
                  <Slider
                    value={[config.scoring_rules?.confidence_threshold || 0.8]}
                    onValueChange={(value) => onChange({
                      ...config,
                      scoring_rules: {
                        ...config.scoring_rules,
                        confidence_threshold: value[0]
                      }
                    })}
                    max={1}
                    min={0}
                    step={0.05}
                    className="w-full"
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="fallback_to_rules"
                  checked={config.scoring_rules?.fallback_to_rules || true}
                  onCheckedChange={(checked) => onChange({
                    ...config,
                    scoring_rules: {
                      ...config.scoring_rules,
                      fallback_to_rules: checked
                    }
                  })}
                />
                <Label htmlFor="fallback_to_rules">Fallback to Rules</Label>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Notification Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="notify_on_completion"
                  checked={config.notification_settings?.notify_on_completion || false}
                  onCheckedChange={(checked) => onChange({
                    ...config,
                    notification_settings: {
                      ...config.notification_settings,
                      notify_on_completion: checked,
                      notify_on_errors: config.notification_settings?.notify_on_errors || false,
                      email_recipients: config.notification_settings?.email_recipients || []
                    }
                  })}
                />
                <Label htmlFor="notify_on_completion">Notify on Completion</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="notify_on_errors"
                  checked={config.notification_settings?.notify_on_errors || false}
                  onCheckedChange={(checked) => onChange({
                    ...config,
                    notification_settings: {
                      ...config.notification_settings,
                      notify_on_errors: checked
                    }
                  })}
                />
                <Label htmlFor="notify_on_errors">Notify on Errors</Label>
              </div>
            </div>
          </div>
        </CardContent>
        
        <div className="flex items-center justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            <Zap className="h-4 w-4 mr-2" />
            Create Configuration
          </Button>
        </div>
      </Card>
    </div>
  )
}

function QualificationAnalytics() {
  const [analytics, setAnalytics] = useState({
    total_jobs: 0,
    successful_jobs: 0,
    failed_jobs: 0,
    total_leads_processed: 0,
    qualification_rate: 0,
    avg_processing_time: 0,
    ml_accuracy: 0
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.total_jobs}</div>
          <p className="text-xs text-muted-foreground">
            Automated qualification jobs
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analytics.total_jobs > 0 ? Math.round((analytics.successful_jobs / analytics.total_jobs) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            Job success rate
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leads Processed</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.total_leads_processed.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Total leads qualified
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ML Accuracy</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(analytics.ml_accuracy * 100)}%</div>
          <p className="text-xs text-muted-foreground">
            Machine learning accuracy
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

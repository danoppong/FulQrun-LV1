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
import { Loader2, Play, Pause, Settings, ArrowRight, CheckCircle, XCircle, AlertCircle, Zap, Clock, Calendar, Users } from 'lucide-react';

interface ConversionAutomationRule {
  id: string
  name: string
  description: string
  trigger_conditions: {
    lead_score_min: number
    qualification_status: string[]
    industry_filters?: string[]
    geography_filters?: string[]
    revenue_band_filters?: string[]
    time_since_qualification_hours?: number
  }
  conversion_settings: {
    template_id: string
    auto_assign: boolean
    assignment_method: 'auto' | 'round_robin' | 'workload_based' | 'skill_based'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    delay_hours: number
  }
  notification_settings: {
    notify_assigned_user: boolean
    notify_manager: boolean
    notify_stakeholders: boolean
    email_template: string
    slack_notification: boolean
    slack_channel?: string
  }
  follow_up_settings: {
    create_follow_up_task: boolean
    follow_up_days: number
    task_template: string
    reminder_settings: {
      enabled: boolean
      reminder_days: number[]
      escalation_enabled: boolean
    }
  }
  enabled: boolean
  organization_id: string
  created_at: string
  updated_at: string
}

interface AutomationExecution {
  id: string
  rule_id: string
  lead_id: string
  opportunity_id?: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED'
  triggered_at: string
  completed_at?: string
  assigned_user_id?: string
  notifications_sent: string[]
  follow_up_task_id?: string
  error_message?: string
  execution_time_ms: number
}

interface AutomationAnalytics {
  total_executions: number
  successful_executions: number
  failed_executions: number
  skipped_executions: number
  avg_execution_time: number
  conversion_rate: number
  by_rule: Record<string, {
    executions: number
    success_rate: number
    avg_time: number
  }>
  trends: {
    daily_executions: Array<{ date: string; count: number }>
    success_rate_trends: Array<{ date: string; rate: number }>
  }
  performance_metrics: {
    leads_converted: number
    opportunities_created: number
    avg_conversion_time: number
    total_value_generated: number
  }
}

export function ConversionAutomation() {
  const [rules, setRules] = useState<ConversionAutomationRule[]>([])
  const [executions, setExecutions] = useState<AutomationExecution[]>([])
  const [analytics, setAnalytics] = useState<AutomationAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRule, setSelectedRule] = useState<ConversionAutomationRule | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<Partial<ConversionAutomationRule>>({})
  const [activeTab, setActiveTab] = useState('rules')

  useEffect(() => {
    fetchRules()
    fetchExecutions()
    fetchAnalytics()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/conversion/automation/rules')
      if (response.ok) {
        const data = await response.json()
        setRules(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExecutions = async () => {
    try {
      const response = await fetch('/api/conversion/automation/executions')
      if (response.ok) {
        const data = await response.json()
        setExecutions(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching executions:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/conversion/automation/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const handleCreateRule = async () => {
    try {
      const response = await fetch('/api/conversion/automation/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingRule)
      })

      if (response.ok) {
        await fetchRules()
        setShowCreateDialog(false)
        setEditingRule({})
      }
    } catch (error) {
      console.error('Error creating rule:', error)
    }
  }

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/conversion/automation/rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled })
      })

      if (response.ok) {
        await fetchRules()
      }
    } catch (error) {
      console.error('Error toggling rule:', error)
    }
  }

  const handleTestRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/conversion/automation/rules/${ruleId}/test`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchExecutions()
      }
    } catch (error) {
      console.error('Error testing rule:', error)
    }
  }

  const handleRunAutomation = async () => {
    try {
      const response = await fetch('/api/conversion/automation/run', {
        method: 'POST'
      })

      if (response.ok) {
        await fetchExecutions()
        await fetchAnalytics()
      }
    } catch (error) {
      console.error('Error running automation:', error)
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
      case 'SKIPPED':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
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
      case 'SKIPPED':
        return <Badge variant="outline">Skipped</Badge>
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
          <h1 className="text-3xl font-bold">Conversion Automation</h1>
          <p className="text-muted-foreground">
            Automate lead-to-opportunity conversion processes
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRunAutomation}>
            <Play className="h-4 w-4 mr-2" />
            Run Automation
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Zap className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rules" className="space-y-6">
          {/* Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rules.map((rule) => (
              <Card key={rule.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                      />
                      <Badge variant={rule.enabled ? 'success' : 'secondary'}>
                        {rule.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{rule.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Min Score</span>
                      <span className="text-sm">{rule.trigger_conditions.lead_score_min}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Assignment</span>
                      <Badge variant="outline">{rule.conversion_settings.assignment_method}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Priority</span>
                      <Badge variant={
                        rule.conversion_settings.priority === 'urgent' ? 'destructive' :
                        rule.conversion_settings.priority === 'high' ? 'secondary' :
                        'outline'
                      }>
                        {rule.conversion_settings.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Delay</span>
                      <span className="text-sm">{rule.conversion_settings.delay_hours}h</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRule(rule)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestRule(rule.id)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {rules.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No automation rules created</p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Create Your First Rule
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="executions" className="space-y-6">
          {/* Execution History */}
          <Card>
            <CardHeader>
              <CardTitle>Automation Executions</CardTitle>
              <CardDescription>
                Recent automation rule executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(execution.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">Execution #{execution.id.slice(-8)}</p>
                          {getStatusBadge(execution.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Triggered: {new Date(execution.triggered_at).toLocaleString()}
                        </p>
                        {execution.assigned_user_id && (
                          <p className="text-xs text-muted-foreground">
                            Assigned to: {execution.assigned_user_id}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {execution.execution_time_ms}ms
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Execution time
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {execution.notifications_sent.length} notifications
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {executions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No executions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <AutomationAnalyticsDashboard analytics={analytics} />
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      {showCreateDialog && (
        <AutomationRuleDialog
          rule={editingRule}
          onChange={setEditingRule}
          onSave={handleCreateRule}
          onCancel={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  )
}

function AutomationAnalyticsDashboard({ analytics }: { analytics: AutomationAnalytics | null }) {
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
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_executions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Automation executions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.total_executions > 0 ? Math.round((analytics.successful_executions / analytics.total_executions) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Execution success rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversion_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Lead conversion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.avg_execution_time)}ms</div>
            <p className="text-xs text-muted-foreground">
              Average execution time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            Overall automation performance and impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analytics.performance_metrics.leads_converted.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Leads Converted</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analytics.performance_metrics.opportunities_created.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Opportunities Created</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {Math.round(analytics.performance_metrics.avg_conversion_time)}h
              </div>
              <div className="text-sm text-muted-foreground">Avg Conversion Time</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                ${analytics.performance_metrics.total_value_generated.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Value Generated</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rule Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Performance</CardTitle>
          <CardDescription>
            Performance metrics by automation rule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analytics.by_rule)
              .sort(([,a], [,b]) => b.success_rate - a.success_rate)
              .map(([ruleId, data]) => (
              <div key={ruleId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Rule #{ruleId.slice(-8)}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.executions} executions
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {data.success_rate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Success Rate
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(data.avg_time)}ms avg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface AutomationRuleDialogProps {
  rule: Partial<ConversionAutomationRule>
  onChange: (rule: Partial<ConversionAutomationRule>) => void
  onSave: () => void
  onCancel: () => void
}

function AutomationRuleDialog({ rule, onChange, onSave, onCancel }: AutomationRuleDialogProps) {
  const [activeStep, setActiveStep] = useState(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create Automation Rule</CardTitle>
          <CardDescription>
            Define automated conversion rules and triggers
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Basic Information */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={rule.name || ''}
                    onChange={(e) => onChange({ ...rule, name: e.target.value })}
                    placeholder="Enter rule name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={rule.description || ''}
                    onChange={(e) => onChange({ ...rule, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={rule.enabled || false}
                  onCheckedChange={(checked) => onChange({ ...rule, enabled: checked })}
                />
                <Label htmlFor="enabled">Enable Rule</Label>
              </div>
            </div>
          )}

          {/* Step 2: Trigger Conditions */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium">Trigger Conditions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_score">Minimum Lead Score</Label>
                  <Input
                    id="min_score"
                    type="number"
                    min="0"
                    max="100"
                    value={rule.trigger_conditions?.lead_score_min || 70}
                    onChange={(e) => onChange({
                      ...rule,
                      trigger_conditions: {
                        ...rule.trigger_conditions,
                        lead_score_min: parseInt(e.target.value) || 70,
                        qualification_status: rule.trigger_conditions?.qualification_status || ['QUALIFIED']
                      }
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="qualification_status">Qualification Status</Label>
                  <Select
                    value={rule.trigger_conditions?.qualification_status?.[0] || 'QUALIFIED'}
                    onValueChange={(value) => onChange({
                      ...rule,
                      trigger_conditions: {
                        ...rule.trigger_conditions,
                        qualification_status: [value]
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QUALIFIED">Qualified</SelectItem>
                      <SelectItem value="HIGHLY_QUALIFIED">Highly Qualified</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Conversion Settings */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium">Conversion Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template">Conversion Template</Label>
                  <Select
                    value={rule.conversion_settings?.template_id || ''}
                    onValueChange={(value) => onChange({
                      ...rule,
                      conversion_settings: {
                        ...rule.conversion_settings,
                        template_id: value,
                        auto_assign: rule.conversion_settings?.auto_assign || false,
                        assignment_method: rule.conversion_settings?.assignment_method || 'auto',
                        priority: rule.conversion_settings?.priority || 'medium',
                        delay_hours: rule.conversion_settings?.delay_hours || 0
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="template1">Standard Template</SelectItem>
                      <SelectItem value="template2">Premium Template</SelectItem>
                      <SelectItem value="template3">Enterprise Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="assignment_method">Assignment Method</Label>
                  <Select
                    value={rule.conversion_settings?.assignment_method || 'auto'}
                    onValueChange={(value: any) => onChange({
                      ...rule,
                      conversion_settings: {
                        ...rule.conversion_settings,
                        assignment_method: value
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="workload_based">Workload Based</SelectItem>
                      <SelectItem value="skill_based">Skill Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={rule.conversion_settings?.priority || 'medium'}
                    onValueChange={(value: any) => onChange({
                      ...rule,
                      conversion_settings: {
                        ...rule.conversion_settings,
                        priority: value
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="delay_hours">Delay Hours</Label>
                  <Input
                    id="delay_hours"
                    type="number"
                    min="0"
                    max="168"
                    value={rule.conversion_settings?.delay_hours || 0}
                    onChange={(e) => onChange({
                      ...rule,
                      conversion_settings: {
                        ...rule.conversion_settings,
                        delay_hours: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Notifications */}
          {activeStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-medium">Notification Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notify_user"
                    checked={rule.notification_settings?.notify_assigned_user || false}
                    onCheckedChange={(checked) => onChange({
                      ...rule,
                      notification_settings: {
                        ...rule.notification_settings,
                        notify_assigned_user: checked,
                        notify_manager: rule.notification_settings?.notify_manager || false,
                        notify_stakeholders: rule.notification_settings?.notify_stakeholders || false,
                        email_template: rule.notification_settings?.email_template || '',
                        slack_notification: rule.notification_settings?.slack_notification || false
                      }
                    })}
                  />
                  <Label htmlFor="notify_user">Notify Assigned User</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notify_manager"
                    checked={rule.notification_settings?.notify_manager || false}
                    onCheckedChange={(checked) => onChange({
                      ...rule,
                      notification_settings: {
                        ...rule.notification_settings,
                        notify_manager: checked
                      }
                    })}
                  />
                  <Label htmlFor="notify_manager">Notify Manager</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="slack_notification"
                    checked={rule.notification_settings?.slack_notification || false}
                    onCheckedChange={(checked) => onChange({
                      ...rule,
                      notification_settings: {
                        ...rule.notification_settings,
                        slack_notification: checked
                      }
                    })}
                  />
                  <Label htmlFor="slack_notification">Slack Notification</Label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {activeStep > 1 && (
                <Button variant="outline" onClick={() => setActiveStep(activeStep - 1)}>
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {activeStep < 4 ? (
                <Button onClick={() => setActiveStep(activeStep + 1)}>
                  Next
                </Button>
              ) : (
                <Button onClick={onSave}>
                  <Zap className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              )}
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

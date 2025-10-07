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
import { Loader2, Play, Pause, Settings, Target, TrendingUp, CheckCircle, XCircle, AlertCircle, Zap, Clock, Users } from 'lucide-react';

interface WorkflowRule {
  id: string
  name: string
  description: string
  conditions: {
    field: string
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
    value: unknown
  }[]
  actions: {
    type: 'assign_framework' | 'auto_qualify' | 'auto_disqualify' | 'send_notification' | 'create_task'
    parameters: Record<string, unknown>
  }[]
  priority: number
  enabled: boolean
  organization_id: string
  created_at: string
  updated_at: string
}

interface WorkflowExecution {
  id: string
  rule_id: string
  lead_id: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED'
  triggered_at: string
  completed_at?: string
  actions_executed: string[]
  error_message?: string
  execution_time_ms: number
}

interface WorkflowAnalytics {
  total_executions: number
  successful_executions: number
  failed_executions: number
  skipped_executions: number
  avg_execution_time: number
  most_triggered_rules: Array<{ rule_name: string; count: number }>
  execution_trends: Array<{ date: string; count: number }>
}

export function QualificationWorkflowAutomation() {
  const [rules, setRules] = useState<WorkflowRule[]>([])
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [analytics, setAnalytics] = useState<WorkflowAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRule, setSelectedRule] = useState<WorkflowRule | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<Partial<WorkflowRule>>({})
  const [activeTab, setActiveTab] = useState('rules')

  useEffect(() => {
    fetchRules()
    fetchExecutions()
    fetchAnalytics()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/qualification/workflow/rules')
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
      const response = await fetch('/api/qualification/workflow/executions')
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
      const response = await fetch('/api/qualification/workflow/analytics')
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
      const response = await fetch('/api/qualification/workflow/rules', {
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

  const handleUpdateRule = async (ruleId: string, updates: Partial<WorkflowRule>) => {
    try {
      const response = await fetch(`/api/qualification/workflow/rules/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        await fetchRules()
      }
    } catch (error) {
      console.error('Error updating rule:', error)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/qualification/workflow/rules/${ruleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchRules()
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    await handleUpdateRule(ruleId, { enabled })
  }

  const handleTestRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/qualification/workflow/rules/${ruleId}/test`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchExecutions()
      }
    } catch (error) {
      console.error('Error testing rule:', error)
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
          <h1 className="text-3xl font-bold">Workflow Automation</h1>
          <p className="text-muted-foreground">
            Automate qualification workflows with intelligent rules
          </p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Zap className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
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
                      <span className="text-sm font-medium">Priority</span>
                      <Badge variant="outline">{rule.priority}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Conditions</span>
                      <span className="text-sm">{rule.conditions.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Actions</span>
                      <span className="text-sm">{rule.actions.length}</span>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Delete
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
                  <p className="text-muted-foreground">No workflow rules created</p>
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
              <CardTitle>Rule Executions</CardTitle>
              <CardDescription>
                Recent workflow rule executions
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
                          <p className="text-sm font-medium">Rule #{execution.rule_id.slice(-8)}</p>
                          {getStatusBadge(execution.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Triggered: {new Date(execution.triggered_at).toLocaleString()}
                        </p>
                        {execution.actions_executed.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Actions: {execution.actions_executed.join(', ')}
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
          <QualificationWorkflowAnalytics analytics={analytics} />
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      {showCreateDialog && (
        <WorkflowRuleDialog
          rule={editingRule}
          onChange={setEditingRule}
          onSave={handleCreateRule}
          onCancel={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  )
}

interface WorkflowRuleDialogProps {
  rule: Partial<WorkflowRule>
  onChange: (rule: Partial<WorkflowRule>) => void
  onSave: () => void
  onCancel: () => void
}

function WorkflowRuleDialog({ rule, onChange, onSave, onCancel }: WorkflowRuleDialogProps) {
  const [activeStep, setActiveStep] = useState(1)

  const handleAddCondition = () => {
    const newCondition = {
      field: 'score',
      operator: 'greater_than' as const,
      value: 70
    }

    onChange({
      ...rule,
      conditions: [...(rule.conditions || []), newCondition]
    })
  }

  const handleAddAction = () => {
    const newAction = {
      type: 'assign_framework' as const,
      parameters: { framework: 'BANT' }
    }

    onChange({
      ...rule,
      actions: [...(rule.actions || []), newAction]
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create Workflow Rule</CardTitle>
          <CardDescription>
            Define conditions and actions for automated qualification
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
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="100"
                    value={rule.priority || 1}
                    onChange={(e) => onChange({ ...rule, priority: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={rule.description || ''}
                  onChange={(e) => onChange({ ...rule, description: e.target.value })}
                  placeholder="Enter rule description"
                />
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

          {/* Step 2: Conditions */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Conditions</h3>
                <Button onClick={handleAddCondition}>
                  <Target className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>
              
              <div className="space-y-3">
                {(rule.conditions || []).map((condition, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Field</Label>
                        <Select
                          value={condition.field}
                          onValueChange={(value) => {
                            const newConditions = [...(rule.conditions || [])]
                            newConditions[index] = { ...condition, field: value }
                            onChange({ ...rule, conditions: newConditions })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="score">Score</SelectItem>
                            <SelectItem value="industry">Industry</SelectItem>
                            <SelectItem value="geography">Geography</SelectItem>
                            <SelectItem value="revenue_band">Revenue Band</SelectItem>
                            <SelectItem value="employee_band">Employee Band</SelectItem>
                            <SelectItem value="entity_type">Entity Type</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Operator</Label>
                        <Select
                          value={condition.operator}
                          onValueChange={(value: unknown) => {
                            const newConditions = [...(rule.conditions || [])]
                            newConditions[index] = { ...condition, operator: value }
                            onChange({ ...rule, conditions: newConditions })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                            <SelectItem value="in">In</SelectItem>
                            <SelectItem value="not_in">Not In</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Value</Label>
                        <Input
                          value={condition.value}
                          onChange={(e) => {
                            const newConditions = [...(rule.conditions || [])]
                            newConditions[index] = { ...condition, value: e.target.value }
                            onChange({ ...rule, conditions: newConditions })
                          }}
                          placeholder="Enter value"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Actions */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Actions</h3>
                <Button onClick={handleAddAction}>
                  <Zap className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </div>
              
              <div className="space-y-3">
                {(rule.actions || []).map((action, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Action Type</Label>
                        <Select
                          value={action.type}
                          onValueChange={(value: unknown) => {
                            const newActions = [...(rule.actions || [])]
                            newActions[index] = { ...action, type: value, parameters: {} }
                            onChange({ ...rule, actions: newActions })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assign_framework">Assign Framework</SelectItem>
                            <SelectItem value="auto_qualify">Auto Qualify</SelectItem>
                            <SelectItem value="auto_disqualify">Auto Disqualify</SelectItem>
                            <SelectItem value="send_notification">Send Notification</SelectItem>
                            <SelectItem value="create_task">Create Task</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Parameters</Label>
                        <Input
                          value={JSON.stringify(action.parameters)}
                          onChange={(e) => {
                            try {
                              const newActions = [...(rule.actions || [])]
                              newActions[index] = { ...action, parameters: JSON.parse(e.target.value) }
                              onChange({ ...rule, actions: newActions })
                            } catch (error) {
                              // Invalid JSON, ignore
                            }
                          }}
                          placeholder="JSON parameters"
                        />
                      </div>
                    </div>
                  </div>
                ))}
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
              {activeStep < 3 ? (
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

function QualificationWorkflowAnalytics({ analytics }: { analytics: WorkflowAnalytics | null }) {
  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.total_executions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Workflow executions
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
            {analytics.total_executions > 0 ? Math.round((analytics.successful_executions / analytics.total_executions) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            Execution success rate
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
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed Executions</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.failed_executions}</div>
          <p className="text-xs text-muted-foreground">
            Failed executions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

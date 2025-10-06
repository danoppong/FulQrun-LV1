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
import { Loader2, Users, UserCheck, Mail, Calendar, CheckCircle, XCircle, AlertCircle, ArrowRight, Settings, Zap, Target } from 'lucide-react'

interface HandoffWorkflow {
  id: string
  name: string
  description: string
  trigger_conditions: {
    lead_score_min: number
    qualification_status: string[]
    industry_filters?: string[]
    geography_filters?: string[]
    revenue_band_filters?: string[]
  }
  assignment_rules: {
    method: 'auto' | 'manual' | 'round_robin' | 'workload_based' | 'skill_based'
    user_pool: string[]
    skill_requirements?: string[]
    workload_threshold?: number
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
  escalation_settings: {
    enabled: boolean
    escalation_days: number
    escalation_users: string[]
    escalation_template: string
  }
  enabled: boolean
  organization_id: string
  created_at: string
  updated_at: string
}

interface HandoffExecution {
  id: string
  workflow_id: string
  lead_id: string
  opportunity_id: string
  assigned_user_id: string
  status: 'PENDING' | 'ASSIGNED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED'
  assigned_at: string
  acknowledged_at?: string
  completed_at?: string
  escalated_at?: string
  notifications_sent: string[]
  follow_up_task_id?: string
  escalation_reason?: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  skills: string[]
  current_workload: number
  max_workload: number
  availability_status: 'available' | 'busy' | 'unavailable'
}

interface HandoffAnalytics {
  total_handoffs: number
  successful_handoffs: number
  escalated_handoffs: number
  avg_acknowledgment_time: number
  avg_completion_time: number
  by_user: Record<string, {
    handoffs: number
    acknowledgment_rate: number
    completion_rate: number
    avg_completion_time: number
  }>
  by_workflow: Record<string, {
    executions: number
    success_rate: number
    avg_completion_time: number
  }>
  trends: {
    daily_handoffs: Array<{ date: string; count: number }>
    acknowledgment_trends: Array<{ date: string; rate: number }>
  }
}

export function ConversionHandoffWorkflows() {
  const [workflows, setWorkflows] = useState<HandoffWorkflow[]>([])
  const [executions, setExecutions] = useState<HandoffExecution[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [analytics, setAnalytics] = useState<HandoffAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWorkflow, setSelectedWorkflow] = useState<HandoffWorkflow | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Partial<HandoffWorkflow>>({})
  const [activeTab, setActiveTab] = useState('workflows')

  useEffect(() => {
    fetchWorkflows()
    fetchExecutions()
    fetchUsers()
    fetchAnalytics()
  }, [])

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/conversion/handoff/workflows')
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExecutions = async () => {
    try {
      const response = await fetch('/api/conversion/handoff/executions')
      if (response.ok) {
        const data = await response.json()
        setExecutions(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching executions:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/conversion/handoff/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const handleCreateWorkflow = async () => {
    try {
      const response = await fetch('/api/conversion/handoff/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingWorkflow)
      })

      if (response.ok) {
        await fetchWorkflows()
        setShowCreateDialog(false)
        setEditingWorkflow({})
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
    }
  }

  const handleToggleWorkflow = async (workflowId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/conversion/handoff/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled })
      })

      if (response.ok) {
        await fetchWorkflows()
      }
    } catch (error) {
      console.error('Error toggling workflow:', error)
    }
  }

  const handleTestWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/conversion/handoff/workflows/${workflowId}/test`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchExecutions()
      }
    } catch (error) {
      console.error('Error testing workflow:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'ESCALATED':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'IN_PROGRESS':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case 'ACKNOWLEDGED':
        return <UserCheck className="h-4 w-4 text-green-600" />
      case 'ASSIGNED':
        return <Users className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>
      case 'ESCALATED':
        return <Badge variant="destructive">Escalated</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="secondary">In Progress</Badge>
      case 'ACKNOWLEDGED':
        return <Badge variant="success">Acknowledged</Badge>
      case 'ASSIGNED':
        return <Badge variant="outline">Assigned</Badge>
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
          <h1 className="text-3xl font-bold">Conversion Handoff Workflows</h1>
          <p className="text-muted-foreground">
            Automate lead-to-opportunity handoff processes
          </p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Zap className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="workflows" className="space-y-6">
          {/* Workflows Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={workflow.enabled}
                        onCheckedChange={(checked) => handleToggleWorkflow(workflow.id, checked)}
                      />
                      <Badge variant={workflow.enabled ? 'success' : 'secondary'}>
                        {workflow.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{workflow.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Assignment Method</span>
                      <Badge variant="outline">{workflow.assignment_rules.method}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Min Score</span>
                      <span className="text-sm">{workflow.trigger_conditions.lead_score_min}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Follow-up Task</span>
                      <Badge variant={workflow.follow_up_settings.create_follow_up_task ? 'success' : 'secondary'}>
                        {workflow.follow_up_settings.create_follow_up_task ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Escalation</span>
                      <Badge variant={workflow.escalation_settings.enabled ? 'destructive' : 'secondary'}>
                        {workflow.escalation_settings.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWorkflow(workflow)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestWorkflow(workflow.id)}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {workflows.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No handoff workflows created</p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Create Your First Workflow
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
              <CardTitle>Handoff Executions</CardTitle>
              <CardDescription>
                Recent handoff workflow executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.map((execution) => {
                  const assignedUser = users.find(user => user.id === execution.assigned_user_id)
                  
                  return (
                    <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(execution.status)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">Handoff #{execution.id.slice(-8)}</p>
                            {getStatusBadge(execution.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Assigned to: {assignedUser?.name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Assigned: {new Date(execution.assigned_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {execution.notifications_sent.length} notifications
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {execution.follow_up_task_id ? 'Follow-up task created' : 'No follow-up task'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {executions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No executions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle>User Workload & Availability</CardTitle>
              <CardDescription>
                Monitor user capacity and availability for handoff assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => {
                  const workloadPercentage = (user.current_workload / user.max_workload) * 100
                  
                  return (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">{user.name}</p>
                            <Badge variant="outline">{user.role}</Badge>
                            <Badge variant={
                              user.availability_status === 'available' ? 'success' :
                              user.availability_status === 'busy' ? 'secondary' :
                              'destructive'
                            }>
                              {user.availability_status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Skills: {user.skills.join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {user.current_workload}/{user.max_workload}
                        </div>
                        <div className="w-24">
                          <Progress value={workloadPercentage} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(workloadPercentage)}% capacity
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <HandoffAnalyticsDashboard analytics={analytics} />
        </TabsContent>
      </Tabs>

      {/* Create Workflow Dialog */}
      {showCreateDialog && (
        <HandoffWorkflowDialog
          workflow={editingWorkflow}
          onChange={setEditingWorkflow}
          onSave={handleCreateWorkflow}
          onCancel={() => setShowCreateDialog(false)}
          users={users}
        />
      )}
    </div>
  )
}

function HandoffAnalyticsDashboard({ analytics }: { analytics: HandoffAnalytics | null }) {
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
            <CardTitle className="text-sm font-medium">Total Handoffs</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_handoffs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Handoff executions
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
              {analytics.total_handoffs > 0 ? Math.round((analytics.successful_handoffs / analytics.total_handoffs) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Successful handoffs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Acknowledgment</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.avg_acknowledgment_time)}h</div>
            <p className="text-xs text-muted-foreground">
              Average acknowledgment time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalations</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.escalated_handoffs}</div>
            <p className="text-xs text-muted-foreground">
              Escalated handoffs
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface HandoffWorkflowDialogProps {
  workflow: Partial<HandoffWorkflow>
  onChange: (workflow: Partial<HandoffWorkflow>) => void
  onSave: () => void
  onCancel: () => void
  users: User[]
}

function HandoffWorkflowDialog({ workflow, onChange, onSave, onCancel, users }: HandoffWorkflowDialogProps) {
  const [activeStep, setActiveStep] = useState(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create Handoff Workflow</CardTitle>
          <CardDescription>
            Define automated handoff rules and assignment logic
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Basic Information */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Workflow Name</Label>
                  <Input
                    id="name"
                    value={workflow.name || ''}
                    onChange={(e) => onChange({ ...workflow, name: e.target.value })}
                    placeholder="Enter workflow name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={workflow.description || ''}
                    onChange={(e) => onChange({ ...workflow, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={workflow.enabled || false}
                  onCheckedChange={(checked) => onChange({ ...workflow, enabled: checked })}
                />
                <Label htmlFor="enabled">Enable Workflow</Label>
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
                    value={workflow.trigger_conditions?.lead_score_min || 70}
                    onChange={(e) => onChange({
                      ...workflow,
                      trigger_conditions: {
                        ...workflow.trigger_conditions,
                        lead_score_min: parseInt(e.target.value) || 70,
                        qualification_status: workflow.trigger_conditions?.qualification_status || ['QUALIFIED']
                      }
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="qualification_status">Qualification Status</Label>
                  <Select
                    value={workflow.trigger_conditions?.qualification_status?.[0] || 'QUALIFIED'}
                    onValueChange={(value) => onChange({
                      ...workflow,
                      trigger_conditions: {
                        ...workflow.trigger_conditions,
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

          {/* Step 3: Assignment Rules */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium">Assignment Rules</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignment_method">Assignment Method</Label>
                  <Select
                    value={workflow.assignment_rules?.method || 'auto'}
                    onValueChange={(value: any) => onChange({
                      ...workflow,
                      assignment_rules: {
                        ...workflow.assignment_rules,
                        method: value,
                        user_pool: workflow.assignment_rules?.user_pool || []
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
                
                <div>
                  <Label htmlFor="user_pool">User Pool</Label>
                  <Select
                    value="all"
                    onValueChange={(value) => {
                      const selectedUsers = value === 'all' ? users.map(u => u.id) : []
                      onChange({
                        ...workflow,
                        assignment_rules: {
                          ...workflow.assignment_rules,
                          user_pool: selectedUsers
                        }
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="sales">Sales Team</SelectItem>
                      <SelectItem value="custom">Custom Selection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Notifications & Follow-up */}
          {activeStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-medium">Notifications & Follow-up</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notify_user"
                    checked={workflow.notification_settings?.notify_assigned_user || false}
                    onCheckedChange={(checked) => onChange({
                      ...workflow,
                      notification_settings: {
                        ...workflow.notification_settings,
                        notify_assigned_user: checked,
                        notify_manager: workflow.notification_settings?.notify_manager || false,
                        notify_stakeholders: workflow.notification_settings?.notify_stakeholders || false,
                        email_template: workflow.notification_settings?.email_template || '',
                        slack_notification: workflow.notification_settings?.slack_notification || false
                      }
                    })}
                  />
                  <Label htmlFor="notify_user">Notify Assigned User</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="create_follow_up"
                    checked={workflow.follow_up_settings?.create_follow_up_task || false}
                    onCheckedChange={(checked) => onChange({
                      ...workflow,
                      follow_up_settings: {
                        ...workflow.follow_up_settings,
                        create_follow_up_task: checked,
                        follow_up_days: workflow.follow_up_settings?.follow_up_days || 7,
                        task_template: workflow.follow_up_settings?.task_template || '',
                        reminder_settings: workflow.follow_up_settings?.reminder_settings || {
                          enabled: true,
                          reminder_days: [3, 7],
                          escalation_enabled: false
                        }
                      }
                    })}
                  />
                  <Label htmlFor="create_follow_up">Create Follow-up Task</Label>
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
                  Create Workflow
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

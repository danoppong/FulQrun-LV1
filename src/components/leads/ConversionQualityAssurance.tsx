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
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, CheckCircle, XCircle, AlertCircle, Shield, Target, Users, BarChart3, RefreshCw, Eye, Edit } from 'lucide-react'

interface QualityCheck {
  id: string
  name: string
  description: string
  category: 'data_quality' | 'process_compliance' | 'accuracy' | 'completeness' | 'timeliness'
  criteria: {
    field: string
    condition: 'required' | 'format' | 'range' | 'pattern' | 'reference'
    value?: any
    weight: number
  }[]
  enabled: boolean
  organization_id: string
  created_at: string
  updated_at: string
}

interface QualityAudit {
  id: string
  check_id: string
  lead_id: string
  opportunity_id?: string
  status: 'PASSED' | 'FAILED' | 'WARNING' | 'SKIPPED'
  score: number
  issues: Array<{
    field: string
    issue: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    suggestion: string
  }>
  audit_data: Record<string, any>
  audited_at: string
  audited_by: string
}

interface QualityMetrics {
  total_audits: number
  passed_audits: number
  failed_audits: number
  warning_audits: number
  overall_quality_score: number
  by_category: Record<string, {
    audits: number
    pass_rate: number
    avg_score: number
  }>
  by_check: Record<string, {
    audits: number
    pass_rate: number
    avg_score: number
    common_issues: string[]
  }>
  trends: {
    daily_scores: Array<{ date: string; score: number }>
    weekly_pass_rates: Array<{ week: string; rate: number }>
  }
  top_issues: Array<{
    issue: string
    count: number
    severity: string
    category: string
  }>
}

interface QualityReport {
  id: string
  name: string
  description: string
  report_type: 'summary' | 'detailed' | 'trend' | 'compliance'
  filters: {
    date_range: [string, string]
    categories?: string[]
    checks?: string[]
    status?: string[]
  }
  generated_at: string
  generated_by: string
  data: any
}

export function ConversionQualityAssurance() {
  const [checks, setChecks] = useState<QualityCheck[]>([])
  const [audits, setAudits] = useState<QualityAudit[]>([])
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null)
  const [reports, setReports] = useState<QualityReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCheck, setSelectedCheck] = useState<QualityCheck | null>(null)
  const [showCreateCheck, setShowCreateCheck] = useState(false)
  const [editingCheck, setEditingCheck] = useState<Partial<QualityCheck>>({})
  const [activeTab, setActiveTab] = useState('checks')

  useEffect(() => {
    fetchChecks()
    fetchAudits()
    fetchMetrics()
    fetchReports()
  }, [])

  const fetchChecks = async () => {
    try {
      const response = await fetch('/api/conversion/quality/checks')
      if (response.ok) {
        const data = await response.json()
        setChecks(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching checks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAudits = async () => {
    try {
      const response = await fetch('/api/conversion/quality/audits')
      if (response.ok) {
        const data = await response.json()
        setAudits(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching audits:', error)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/conversion/quality/metrics')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.data)
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/conversion/quality/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

  const handleCreateCheck = async () => {
    try {
      const response = await fetch('/api/conversion/quality/checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingCheck)
      })

      if (response.ok) {
        await fetchChecks()
        setShowCreateCheck(false)
        setEditingCheck({})
      }
    } catch (error) {
      console.error('Error creating check:', error)
    }
  }

  const handleToggleCheck = async (checkId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/conversion/quality/checks/${checkId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled })
      })

      if (response.ok) {
        await fetchChecks()
      }
    } catch (error) {
      console.error('Error toggling check:', error)
    }
  }

  const handleRunAudit = async () => {
    try {
      const response = await fetch('/api/conversion/quality/audit', {
        method: 'POST'
      })

      if (response.ok) {
        await fetchAudits()
        await fetchMetrics()
      }
    } catch (error) {
      console.error('Error running audit:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'WARNING':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED':
        return <Badge variant="success">Passed</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      case 'WARNING':
        return <Badge variant="secondary">Warning</Badge>
      default:
        return <Badge variant="outline">Skipped</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>
      case 'high':
        return <Badge variant="destructive">High</Badge>
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>
      case 'low':
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
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
          <h1 className="text-3xl font-bold">Conversion Quality Assurance</h1>
          <p className="text-muted-foreground">
            Ensure conversion quality and compliance
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRunAudit}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Run Audit
          </Button>
          <Button onClick={() => setShowCreateCheck(true)}>
            <Shield className="h-4 w-4 mr-2" />
            Create Check
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="checks">Quality Checks</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="checks" className="space-y-6">
          {/* Quality Checks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {checks.map((check) => (
              <Card key={check.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{check.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={check.enabled}
                        onCheckedChange={(checked) => handleToggleCheck(check.id, checked)}
                      />
                      <Badge variant={check.enabled ? 'success' : 'secondary'}>
                        {check.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{check.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Category</span>
                      <Badge variant="outline">{check.category.replace('_', ' ')}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Criteria</span>
                      <span className="text-sm">{check.criteria.length}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCheck(check)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCheck(check)
                        setEditingCheck(check)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {checks.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No quality checks created</p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowCreateCheck(true)}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Create Your First Check
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="audits" className="space-y-6">
          {/* Audit Results */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Audit Results</CardTitle>
              <CardDescription>
                Recent quality audit results and issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {audits.map((audit) => (
                  <div key={audit.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(audit.status)}
                        <h4 className="font-medium">Audit #{audit.id.slice(-8)}</h4>
                        {getStatusBadge(audit.status)}
                        <Badge variant="outline">Score: {audit.score}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(audit.audited_at).toLocaleString()}
                      </div>
                    </div>
                    
                    {audit.issues.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Issues Found:</h5>
                        {audit.issues.map((issue, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">{issue.field}</span>
                                {getSeverityBadge(issue.severity)}
                              </div>
                              <p className="text-xs text-muted-foreground">{issue.issue}</p>
                              <p className="text-xs text-muted-foreground">Suggestion: {issue.suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {audits.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No audits performed yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metrics" className="space-y-6">
          <QualityMetricsDashboard metrics={metrics} />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          {/* Quality Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Reports</CardTitle>
              <CardDescription>
                Generated quality reports and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{report.name}</h4>
                          <Badge variant="outline">{report.report_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {report.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Generated: {new Date(report.generated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {reports.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No reports generated yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Check Dialog */}
      {showCreateCheck && (
        <QualityCheckDialog
          check={editingCheck}
          onChange={setEditingCheck}
          onSave={handleCreateCheck}
          onCancel={() => setShowCreateCheck(false)}
        />
      )}
    </div>
  )
}

function QualityMetricsDashboard({ metrics }: { metrics: QualityMetrics | null }) {
  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No metrics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_audits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Quality audits performed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.total_audits > 0 ? Math.round((metrics.passed_audits / metrics.total_audits) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall pass rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.overall_quality_score)}</div>
            <p className="text-xs text-muted-foreground">
              Overall quality score
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Audits</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.failed_audits}</div>
            <p className="text-xs text-muted-foreground">
              Failed audits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quality by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Quality by Category</CardTitle>
          <CardDescription>
            Quality metrics broken down by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.by_category).map(([category, data]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{category.replace('_', ' ')}</span>
                    <Badge variant="outline">{data.audits} audits</Badge>
                  </div>
                  <span className="text-sm font-medium">{data.pass_rate.toFixed(1)}%</span>
                </div>
                <Progress value={data.pass_rate} className="w-full" />
                <div className="text-xs text-muted-foreground">
                  Avg Score: {Math.round(data.avg_score)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Top Quality Issues</CardTitle>
          <CardDescription>
            Most common quality issues and their severity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.top_issues.map((issue, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium">{issue.issue}</div>
                    <div className="text-sm text-muted-foreground">
                      {issue.category} • {issue.count} occurrences
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {getSeverityBadge(issue.severity)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'critical':
      return <Badge variant="destructive">Critical</Badge>
    case 'high':
      return <Badge variant="destructive">High</Badge>
    case 'medium':
      return <Badge variant="secondary">Medium</Badge>
    case 'low':
      return <Badge variant="outline">Low</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

interface QualityCheckDialogProps {
  check: Partial<QualityCheck>
  onChange: (check: Partial<QualityCheck>) => void
  onSave: () => void
  onCancel: () => void
}

function QualityCheckDialog({ check, onChange, onSave, onCancel }: QualityCheckDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create Quality Check</CardTitle>
          <CardDescription>
            Define quality criteria and validation rules
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Check Name</Label>
                <Input
                  id="name"
                  value={check.name || ''}
                  onChange={(e) => onChange({ ...check, name: e.target.value })}
                  placeholder="Enter check name"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={check.category || 'data_quality'}
                  onValueChange={(value: any) => onChange({ ...check, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data_quality">Data Quality</SelectItem>
                    <SelectItem value="process_compliance">Process Compliance</SelectItem>
                    <SelectItem value="accuracy">Accuracy</SelectItem>
                    <SelectItem value="completeness">Completeness</SelectItem>
                    <SelectItem value="timeliness">Timeliness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={check.description || ''}
                onChange={(e) => onChange({ ...check, description: e.target.value })}
                placeholder="Enter check description"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={check.enabled || false}
                onCheckedChange={(checked) => onChange({ ...check, enabled: checked })}
              />
              <Label htmlFor="enabled">Enable Check</Label>
            </div>
          </div>
        </CardContent>
        
        <div className="flex items-center justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            <Shield className="h-4 w-4 mr-2" />
            Create Check
          </Button>
        </div>
      </Card>
    </div>
  )
}

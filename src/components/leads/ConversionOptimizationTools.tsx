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
import { Loader2, TrendingUp, Target, CheckCircle, XCircle, AlertCircle, Settings, Zap, BarChart3, Lightbulb, RefreshCw } from 'lucide-react';

interface ConversionOptimizationRule {
  id: string
  name: string
  description: string
  type: 'scoring_adjustment' | 'template_selection' | 'timing_optimization' | 'assignment_optimization'
  conditions: {
    lead_score_range?: [number, number]
    industry?: string[]
    geography?: string[]
    revenue_band?: string[]
    qualification_framework?: string[]
    conversion_history?: {
      min_attempts: number
      success_rate_threshold: number
    }
  }
  actions: {
    score_adjustment?: number
    template_override?: string
    timing_delay_hours?: number
    assignment_preference?: string[]
    notification_template?: string
  }
  performance_metrics: {
    conversion_rate_improvement: number
    avg_value_improvement: number
    time_to_conversion_improvement: number
    applications_count: number
    success_rate: number
  }
  enabled: boolean
  organization_id: string
  created_at: string
  updated_at: string
}

interface ConversionInsight {
  id: string
  type: 'pattern' | 'anomaly' | 'recommendation' | 'warning'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  data_points: {
    metric: string
    value: number
    trend: 'up' | 'down' | 'stable'
    comparison: number
  }[]
  recommendations: string[]
  related_rules?: string[]
}

interface ConversionExperiment {
  id: string
  name: string
  description: string
  hypothesis: string
  control_group: {
    template_id: string
    assignment_method: string
    timing: string
  }
  test_group: {
    template_id: string
    assignment_method: string
    timing: string
  }
  status: 'draft' | 'running' | 'completed' | 'paused'
  start_date: string
  end_date?: string
  results?: {
    control_conversion_rate: number
    test_conversion_rate: number
    improvement: number
    statistical_significance: number
    sample_size: number
  }
  organization_id: string
  created_at: string
  updated_at: string
}

interface OptimizationAnalytics {
  total_rules: number
  active_rules: number
  total_insights: number
  high_impact_insights: number
  experiments_running: number
  avg_conversion_improvement: number
  top_performing_rules: Array<{
    rule_name: string
    improvement: number
    applications: number
  }>
  conversion_trends: Array<{
    date: string
    conversion_rate: number
    avg_value: number
  }>
  optimization_impact: {
    conversion_rate_lift: number
    value_lift: number
    time_reduction: number
  }
}

export function ConversionOptimizationTools() {
  const [rules, setRules] = useState<ConversionOptimizationRule[]>([])
  const [insights, setInsights] = useState<ConversionInsight[]>([])
  const [experiments, setExperiments] = useState<ConversionExperiment[]>([])
  const [analytics, setAnalytics] = useState<OptimizationAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRule, setSelectedRule] = useState<ConversionOptimizationRule | null>(null)
  const [showCreateRule, setShowCreateRule] = useState(false)
  const [editingRule, setEditingRule] = useState<Partial<ConversionOptimizationRule>>({})
  const [activeTab, setActiveTab] = useState('insights')

  useEffect(() => {
    fetchRules()
    fetchInsights()
    fetchExperiments()
    fetchAnalytics()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/conversion/optimization/rules')
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

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/conversion/optimization/insights')
      if (response.ok) {
        const data = await response.json()
        setInsights(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
    }
  }

  const fetchExperiments = async () => {
    try {
      const response = await fetch('/api/conversion/optimization/experiments')
      if (response.ok) {
        const data = await response.json()
        setExperiments(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching experiments:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/conversion/optimization/analytics')
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
      const response = await fetch('/api/conversion/optimization/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingRule)
      })

      if (response.ok) {
        await fetchRules()
        setShowCreateRule(false)
        setEditingRule({})
      }
    } catch (error) {
      console.error('Error creating rule:', error)
    }
  }

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/conversion/optimization/rules/${ruleId}`, {
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

  const handleRunOptimization = async () => {
    try {
      const response = await fetch('/api/conversion/optimization/run', {
        method: 'POST'
      })

      if (response.ok) {
        await fetchInsights()
        await fetchAnalytics()
      }
    } catch (error) {
      console.error('Error running optimization:', error)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern':
        return <BarChart3 className="h-4 w-4 text-blue-600" />
      case 'anomaly':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'recommendation':
        return <Lightbulb className="h-4 w-4 text-green-600" />
      case 'warning':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Target className="h-4 w-4 text-gray-600" />
    }
  }

  const getInsightBadge = (type: string) => {
    switch (type) {
      case 'pattern':
        return <Badge variant="outline">Pattern</Badge>
      case 'anomaly':
        return <Badge variant="secondary">Anomaly</Badge>
      case 'recommendation':
        return <Badge variant="success">Recommendation</Badge>
      case 'warning':
        return <Badge variant="destructive">Warning</Badge>
      default:
        return <Badge variant="outline">Insight</Badge>
    }
  }

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge variant="destructive">High Impact</Badge>
      case 'medium':
        return <Badge variant="secondary">Medium Impact</Badge>
      case 'low':
        return <Badge variant="outline">Low Impact</Badge>
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
          <h1 className="text-3xl font-bold">Conversion Optimization</h1>
          <p className="text-muted-foreground">
            AI-powered conversion optimization and insights
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRunOptimization}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Run Optimization
          </Button>
          <Button onClick={() => setShowCreateRule(true)}>
            <Zap className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="insights" className="space-y-6">
          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle>AI Conversion Insights</CardTitle>
              <CardDescription>
                Intelligent insights and recommendations for conversion optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="p-4 border rounded-lg">
                    <div className="flex items-start space-x-4">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{insight.title}</h4>
                          {getInsightBadge(insight.type)}
                          {getImpactBadge(insight.impact)}
                          <Badge variant="outline">
                            {Math.round(insight.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {insight.description}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          {insight.data_points.map((point, index) => (
                            <div key={index} className="text-center">
                              <div className="text-sm font-medium">{point.metric}</div>
                              <div className="text-lg font-bold">{point.value}</div>
                              <div className={`text-xs ${
                                point.trend === 'up' ? 'text-green-600' :
                                point.trend === 'down' ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {point.trend === 'up' ? '↗' : point.trend === 'down' ? '↘' : '→'} {point.comparison}%
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {insight.recommendations.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">Recommendations:</h5>
                            <ul className="text-sm space-y-1 list-disc list-inside">
                              {insight.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {insights.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No insights available</p>
                  <Button
                    className="mt-4"
                    onClick={handleRunOptimization}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Insights
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rules" className="space-y-6">
          {/* Optimization Rules */}
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
                      <span className="text-sm font-medium">Type</span>
                      <Badge variant="outline">{rule.type.replace('_', ' ')}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Applications</span>
                      <span className="text-sm">{rule.performance_metrics.applications_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Success Rate</span>
                      <span className="text-sm">{Math.round(rule.performance_metrics.success_rate * 100)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Improvement</span>
                      <span className="text-sm text-green-600">
                        +{Math.round(rule.performance_metrics.conversion_rate_improvement * 100)}%
                      </span>
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
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analyze
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
                  <p className="text-muted-foreground">No optimization rules created</p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowCreateRule(true)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Create Your First Rule
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="experiments" className="space-y-6">
          {/* A/B Testing Experiments */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Experiments</CardTitle>
              <CardDescription>
                A/B testing for conversion optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {experiments.map((experiment) => (
                  <div key={experiment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{experiment.name}</h4>
                        <Badge variant={
                          experiment.status === 'running' ? 'success' :
                          experiment.status === 'completed' ? 'secondary' :
                          experiment.status === 'paused' ? 'destructive' :
                          'outline'
                        }>
                          {experiment.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(experiment.start_date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {experiment.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium mb-2">Control Group</h5>
                        <div className="text-xs space-y-1">
                          <div>Template: {experiment.control_group.template_id}</div>
                          <div>Assignment: {experiment.control_group.assignment_method}</div>
                          <div>Timing: {experiment.control_group.timing}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-2">Test Group</h5>
                        <div className="text-xs space-y-1">
                          <div>Template: {experiment.test_group.template_id}</div>
                          <div>Assignment: {experiment.test_group.assignment_method}</div>
                          <div>Timing: {experiment.test_group.timing}</div>
                        </div>
                      </div>
                    </div>
                    
                    {experiment.results && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <h5 className="text-sm font-medium mb-2">Results</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-sm font-medium">Control Rate</div>
                            <div className="text-lg font-bold">{experiment.results.control_conversion_rate.toFixed(1)}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">Test Rate</div>
                            <div className="text-lg font-bold">{experiment.results.test_conversion_rate.toFixed(1)}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">Improvement</div>
                            <div className="text-lg font-bold text-green-600">
                              +{experiment.results.improvement.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {experiments.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No experiments running</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <OptimizationAnalyticsDashboard analytics={analytics} />
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      {showCreateRule && (
        <OptimizationRuleDialog
          rule={editingRule}
          onChange={setEditingRule}
          onSave={handleCreateRule}
          onCancel={() => setShowCreateRule(false)}
        />
      )}
    </div>
  )
}

function OptimizationAnalyticsDashboard({ analytics }: { analytics: OptimizationAnalytics | null }) {
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
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.active_rules}</div>
            <p className="text-xs text-muted-foreground">
              of {analytics.total_rules} total rules
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Impact Insights</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.high_impact_insights}</div>
            <p className="text-xs text-muted-foreground">
              of {analytics.total_insights} total insights
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{analytics.avg_conversion_improvement.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Conversion rate improvement
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Experiments</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.experiments_running}</div>
            <p className="text-xs text-muted-foreground">
              Active A/B tests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Impact</CardTitle>
          <CardDescription>
            Overall impact of optimization efforts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                +{analytics.optimization_impact.conversion_rate_lift.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Conversion Rate Lift</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                +{analytics.optimization_impact.value_lift.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Value Lift</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                -{analytics.optimization_impact.time_reduction.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Time Reduction</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Rules</CardTitle>
          <CardDescription>
            Most effective optimization rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.top_performing_rules.map((rule, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium">{rule.rule_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {rule.applications} applications
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    +{rule.improvement.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Improvement
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

interface OptimizationRuleDialogProps {
  rule: Partial<ConversionOptimizationRule>
  onChange: (rule: Partial<ConversionOptimizationRule>) => void
  onSave: () => void
  onCancel: () => void
}

function OptimizationRuleDialog({ rule, onChange, onSave, onCancel }: OptimizationRuleDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create Optimization Rule</CardTitle>
          <CardDescription>
            Define AI-powered conversion optimization rules
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
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
                <Label htmlFor="type">Rule Type</Label>
                <Select
                  value={rule.type || 'scoring_adjustment'}
                  onValueChange={(value: any) => onChange({ ...rule, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scoring_adjustment">Scoring Adjustment</SelectItem>
                    <SelectItem value="template_selection">Template Selection</SelectItem>
                    <SelectItem value="timing_optimization">Timing Optimization</SelectItem>
                    <SelectItem value="assignment_optimization">Assignment Optimization</SelectItem>
                  </SelectContent>
                </Select>
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
        </CardContent>
        
        <div className="flex items-center justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            <Zap className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </Card>
    </div>
  )
}

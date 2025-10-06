'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, Users, Building, Target, BarChart3, PieChart, Activity, Download, RefreshCw } from 'lucide-react'

interface AnalyticsData {
  overview: {
    total_leads: number
    qualified_leads: number
    converted_leads: number
    avg_score: number
    qualification_rate: number
    conversion_rate: number
  }
  by_geography: Record<string, number>
  by_industry: Record<string, number>
  by_status: Record<string, number>
  by_segment: Record<string, number>
  score_distribution: {
    hot: number
    warm: number
    lukewarm: number
    cold: number
  }
  conversion_funnel: {
    generated: number
    enriched: number
    qualified: number
    converted: number
  }
  trends: {
    daily_generation: Array<{ date: string; count: number }>
    daily_qualification: Array<{ date: string; count: number }>
    daily_conversion: Array<{ date: string; count: number }>
  }
  top_performing: {
    icp_profiles: Array<{ name: string; count: number; rate: number }>
    frameworks: Array<{ name: string; count: number; rate: number }>
    sources: Array<{ name: string; count: number; rate: number }>
  }
}

export function AILeadAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<string>('30d')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/leads/analytics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/leads/analytics/export?range=${timeRange}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ai-lead-analytics-${timeRange}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting analytics:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Lead Analytics</h1>
          <p className="text-muted-foreground">
            Insights and performance metrics for AI-generated leads
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={fetchAnalytics} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.total_leads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              AI-generated leads
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.qualified_leads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.qualification_rate.toFixed(1)}% qualification rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.converted_leads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.conversion_rate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analyticsData.overview.avg_score)}</div>
            <p className="text-xs text-muted-foreground">
              Average lead score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Geography Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Leads by Geography</CardTitle>
                <CardDescription>
                  Distribution of leads across regions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analyticsData.by_geography).map(([geography, count]) => (
                    <div key={geography} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{geography}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{count}</span>
                        <Progress 
                          value={(count / analyticsData.overview.total_leads) * 100} 
                          className="w-20" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Industry Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Leads by Industry</CardTitle>
                <CardDescription>
                  Top industries for generated leads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analyticsData.by_industry)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([industry, count]) => (
                    <div key={industry} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{industry}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{count}</span>
                        <Progress 
                          value={(count / analyticsData.overview.total_leads) * 100} 
                          className="w-20" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>
                Lead progression through the AI generation process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(analyticsData.conversion_funnel).map(([stage, count], index) => {
                  const previousCount = index > 0 ? Object.values(analyticsData.conversion_funnel)[index - 1] : count
                  const conversionRate = previousCount > 0 ? (count / previousCount) * 100 : 100
                  
                  return (
                    <div key={stage} className="flex items-center space-x-4">
                      <div className="w-32">
                        <Badge variant="outline" className="capitalize">
                          {stage}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{count.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">
                            {index > 0 && `${conversionRate.toFixed(1)}%`}
                          </span>
                        </div>
                        <Progress value={(count / analyticsData.conversion_funnel.generated) * 100} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>
                  Lead segmentation by score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analyticsData.score_distribution).map(([segment, count]) => (
                    <div key={segment} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={segment === 'hot' ? 'destructive' : 
                                  segment === 'warm' ? 'default' : 
                                  segment === 'lukewarm' ? 'secondary' : 'outline'}
                          className="capitalize"
                        >
                          {segment}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{count}</span>
                        <Progress 
                          value={(count / analyticsData.overview.total_leads) * 100} 
                          className="w-20" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>
                  Current status of all leads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analyticsData.by_status).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="capitalize">
                          {status.toLowerCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{count}</span>
                        <Progress 
                          value={(count / analyticsData.overview.total_leads) * 100} 
                          className="w-20" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top ICP Profiles */}
            <Card>
              <CardHeader>
                <CardTitle>Top ICP Profiles</CardTitle>
                <CardDescription>
                  Best performing ideal customer profiles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.top_performing.icp_profiles.map((profile, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{profile.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{profile.count}</div>
                        <div className="text-xs text-muted-foreground">
                          {profile.rate.toFixed(1)}% qualified
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Top Frameworks */}
            <Card>
              <CardHeader>
                <CardTitle>Top Frameworks</CardTitle>
                <CardDescription>
                  Most effective qualification frameworks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.top_performing.frameworks.map((framework, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{framework.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{framework.count}</div>
                        <div className="text-xs text-muted-foreground">
                          {framework.rate.toFixed(1)}% success
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Top Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Top Sources</CardTitle>
                <CardDescription>
                  Best performing lead sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.top_performing.sources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{source.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{source.count}</div>
                        <div className="text-xs text-muted-foreground">
                          {source.rate.toFixed(1)}% conversion
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Insights */}
      <Alert>
        <BarChart3 className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Key Insights:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>
                Qualification rate of {analyticsData.overview.qualification_rate.toFixed(1)}% 
                is {analyticsData.overview.qualification_rate > 60 ? 'above' : 'below'} industry average
              </li>
              <li>
                Top geography: {Object.entries(analyticsData.by_geography)
                  .sort(([,a], [,b]) => b - a)[0]?.[0]} 
                with {Object.entries(analyticsData.by_geography)
                  .sort(([,a], [,b]) => b - a)[0]?.[1]} leads
              </li>
              <li>
                Average lead score of {Math.round(analyticsData.overview.avg_score)} 
                indicates {analyticsData.overview.avg_score > 70 ? 'high' : 'moderate'} quality leads
              </li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

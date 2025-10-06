'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, Target, CheckCircle, XCircle, BarChart3, PieChart, Activity, Download, RefreshCw } from 'lucide-react'

interface QualificationPerformanceData {
  overview: {
    total_leads: number
    qualified_leads: number
    disqualified_leads: number
    in_progress_leads: number
    qualification_rate: number
    avg_qualification_time: number
    avg_score: number
  }
  by_framework: Record<string, {
    total: number
    qualified: number
    disqualified: number
    rate: number
    avg_score: number
    avg_time: number
  }>
  by_industry: Record<string, {
    total: number
    qualified: number
    rate: number
    avg_score: number
  }>
  by_geography: Record<string, {
    total: number
    qualified: number
    rate: number
    avg_score: number
  }>
  trends: {
    daily_qualifications: Array<{ date: string; qualified: number; disqualified: number }>
    weekly_rates: Array<{ week: string; rate: number }>
    monthly_scores: Array<{ month: string; avg_score: number }>
  }
  top_performers: {
    frameworks: Array<{ name: string; rate: number; count: number }>
    industries: Array<{ name: string; rate: number; count: number }>
    geographies: Array<{ name: string; rate: number; count: number }>
  }
  bottlenecks: Array<{
    stage: string
    count: number
    avg_time: number
    description: string
  }>
}

export function QualificationPerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState<QualificationPerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<string>('30d')
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchPerformanceData()
  }, [timeRange])

  const fetchPerformanceData = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/qualification/performance?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setPerformanceData(data.data)
      }
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/qualification/performance/export?range=${timeRange}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `qualification-performance-${timeRange}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting performance data:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!performanceData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No performance data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Qualification Performance</h1>
          <p className="text-muted-foreground">
            Analyze qualification performance and identify optimization opportunities
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
          
          <Button variant="outline" onClick={fetchPerformanceData} disabled={refreshing}>
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
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.overview.total_leads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Qualified leads
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualification Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.overview.qualification_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Success rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(performanceData.overview.avg_score)}</div>
            <p className="text-xs text-muted-foreground">
              Average qualification score
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(performanceData.overview.avg_qualification_time)}h</div>
            <p className="text-xs text-muted-foreground">
              Average qualification time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Framework Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Framework Performance</CardTitle>
                <CardDescription>
                  Qualification rates by framework
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(performanceData.by_framework)
                    .sort(([,a], [,b]) => b.rate - a.rate)
                    .map(([framework, data]) => (
                    <div key={framework} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{framework}</Badge>
                          <span className="text-sm font-medium">{data.rate.toFixed(1)}%</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {data.qualified}/{data.total}
                        </span>
                      </div>
                      <Progress value={data.rate} className="w-full" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Avg Score: {Math.round(data.avg_score)}</span>
                        <span>Avg Time: {Math.round(data.avg_time)}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Industry Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Industry Performance</CardTitle>
                <CardDescription>
                  Qualification rates by industry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(performanceData.by_industry)
                    .sort(([,a], [,b]) => b.rate - a.rate)
                    .slice(0, 5)
                    .map(([industry, data]) => (
                    <div key={industry} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{industry}</span>
                          <span className="text-sm">{data.rate.toFixed(1)}%</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {data.qualified}/{data.total}
                        </span>
                      </div>
                      <Progress value={data.rate} className="w-full" />
                      <div className="text-xs text-muted-foreground">
                        Avg Score: {Math.round(data.avg_score)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="frameworks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Performing Frameworks */}
            <Card>
              <CardHeader>
                <CardTitle>Top Frameworks</CardTitle>
                <CardDescription>
                  Best performing qualification frameworks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData.top_performers.frameworks.map((framework, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{framework.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{framework.rate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">{framework.count} leads</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Top Industries */}
            <Card>
              <CardHeader>
                <CardTitle>Top Industries</CardTitle>
                <CardDescription>
                  Best performing industries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData.top_performers.industries.map((industry, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{industry.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{industry.rate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">{industry.count} leads</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Top Geographies */}
            <Card>
              <CardHeader>
                <CardTitle>Top Geographies</CardTitle>
                <CardDescription>
                  Best performing geographies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData.top_performers.geographies.map((geography, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{geography.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{geography.rate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">{geography.count} leads</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Qualification Trends</CardTitle>
                <CardDescription>
                  Daily qualified vs disqualified leads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData.trends.daily_qualifications.slice(-7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="text-sm font-medium">{day.date}</div>
                        <div className="text-xs text-muted-foreground">
                          {day.qualified + day.disqualified} total leads
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          {day.qualified} qualified
                        </div>
                        <div className="text-sm text-red-600">
                          {day.disqualified} disqualified
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Weekly Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Qualification Rates</CardTitle>
                <CardDescription>
                  Qualification rate trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData.trends.weekly_rates.slice(-4).map((week, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{week.week}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{week.rate.toFixed(1)}%</span>
                        <Progress value={week.rate} className="w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="bottlenecks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Qualification Bottlenecks</CardTitle>
              <CardDescription>
                Identify areas where qualification process slows down
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.bottlenecks.map((bottleneck, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <Activity className="h-5 w-5 text-yellow-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{bottleneck.stage}</h4>
                          <Badge variant="outline">{bottleneck.count} leads</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {bottleneck.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {Math.round(bottleneck.avg_time)}h avg
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Processing time
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {performanceData.bottlenecks.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No bottlenecks identified</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights */}
      <Alert>
        <BarChart3 className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Performance Insights:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>
                Overall qualification rate of {performanceData.overview.qualification_rate.toFixed(1)}% 
                is {performanceData.overview.qualification_rate > 60 ? 'above' : 'below'} industry average
              </li>
              <li>
                Top performing framework: {Object.entries(performanceData.by_framework)
                  .sort(([,a], [,b]) => b.rate - a.rate)[0]?.[0]} 
                with {Object.entries(performanceData.by_framework)
                  .sort(([,a], [,b]) => b.rate - a.rate)[0]?.[1].rate.toFixed(1)}% success rate
              </li>
              <li>
                Average qualification time of {Math.round(performanceData.overview.avg_qualification_time)} hours
                {performanceData.overview.avg_qualification_time > 24 ? ' indicates potential bottlenecks' : ' is within optimal range'}
              </li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

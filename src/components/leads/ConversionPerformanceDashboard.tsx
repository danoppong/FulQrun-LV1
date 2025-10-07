'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, ArrowRight, Building, DollarSign, Calendar, Users, Target, CheckCircle, BarChart3, Download, RefreshCw } from 'lucide-react';

interface ConversionPerformanceData {
  overview: {
    total_conversions: number
    successful_conversions: number
    failed_conversions: number
    conversion_rate: number
    avg_conversion_time: number
    avg_opportunity_value: number
    total_opportunity_value: number
  }
  by_template: Record<string, {
    conversions: number
    success_rate: number
    avg_value: number
    avg_time: number
  }>
  by_user: Record<string, {
    conversions: number
    success_rate: number
    avg_value: number
    avg_time: number
  }>
  by_industry: Record<string, {
    conversions: number
    success_rate: number
    avg_value: number
  }>
  by_geography: Record<string, {
    conversions: number
    success_rate: number
    avg_value: number
  }>
  trends: {
    daily_conversions: Array<{ date: string; count: number; value: number }>
    weekly_rates: Array<{ week: string; rate: number }>
    monthly_values: Array<{ month: string; avg_value: number; total_value: number }>
  }
  bottlenecks: Array<{
    stage: string
    count: number
    avg_time: number
    description: string
  }>
  top_performers: {
    templates: Array<{ name: string; rate: number; count: number }>
    users: Array<{ name: string; rate: number; count: number }>
    industries: Array<{ name: string; rate: number; count: number }>
  }
}

export function ConversionPerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState<ConversionPerformanceData | null>(null)
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
      const response = await fetch(`/api/conversion/performance?range=${timeRange}`)
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
      const response = await fetch(`/api/conversion/performance/export?range=${timeRange}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `conversion-performance-${timeRange}.csv`
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
          <h1 className="text-3xl font-bold">Conversion Performance</h1>
          <p className="text-muted-foreground">
            Analyze conversion performance and identify optimization opportunities
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
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.overview.total_conversions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Lead to opportunity conversions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.overview.conversion_rate.toFixed(1)}%</div>
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
            <div className="text-2xl font-bold">${performanceData.overview.avg_opportunity_value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Average opportunity value
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${performanceData.overview.total_opportunity_value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total opportunity value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Industry Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Industry</CardTitle>
                <CardDescription>
                  Conversion rates and values by industry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(performanceData.by_industry)
                    .sort(([,a], [,b]) => b.success_rate - a.success_rate)
                    .slice(0, 5)
                    .map(([industry, data]) => (
                    <div key={industry} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{industry}</span>
                          <Badge variant="outline">{data.conversions} conversions</Badge>
                        </div>
                        <span className="text-sm font-medium">{data.success_rate.toFixed(1)}%</span>
                      </div>
                      <Progress value={data.success_rate} className="w-full" />
                      <div className="text-xs text-muted-foreground">
                        Avg Value: ${data.avg_value.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Geography Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Geography</CardTitle>
                <CardDescription>
                  Conversion rates and values by geography
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(performanceData.by_geography)
                    .sort(([,a], [,b]) => b.success_rate - a.success_rate)
                    .map(([geography, data]) => (
                    <div key={geography} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{geography}</span>
                          <Badge variant="outline">{data.conversions} conversions</Badge>
                        </div>
                        <span className="text-sm font-medium">{data.success_rate.toFixed(1)}%</span>
                      </div>
                      <Progress value={data.success_rate} className="w-full" />
                      <div className="text-xs text-muted-foreground">
                        Avg Value: ${data.avg_value.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Performance</CardTitle>
              <CardDescription>
                Conversion performance by template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(performanceData.by_template)
                  .sort(([,a], [,b]) => b.success_rate - a.success_rate)
                  .map(([template, data]) => (
                  <div key={template} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{template}</h4>
                          <Badge variant="outline">{data.conversions} conversions</Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            Success Rate: {data.success_rate.toFixed(1)}%
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Avg Time: {Math.round(data.avg_time)}h
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        ${data.avg_value.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg Value
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Performance</CardTitle>
              <CardDescription>
                Conversion performance by user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(performanceData.by_user)
                  .sort(([,a], [,b]) => b.success_rate - a.success_rate)
                  .map(([user, data]) => (
                  <div key={user} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{user}</h4>
                          <Badge variant="outline">{data.conversions} conversions</Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            Success Rate: {data.success_rate.toFixed(1)}%
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Avg Time: {Math.round(data.avg_time)}h
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        ${data.avg_value.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg Value
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Conversion Trends</CardTitle>
                <CardDescription>
                  Daily conversions and values over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData.trends.daily_conversions.slice(-7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="text-sm font-medium">{day.date}</div>
                        <div className="text-xs text-muted-foreground">
                          {day.count} conversions
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          ${day.value.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Value
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
                <CardTitle>Weekly Conversion Rates</CardTitle>
                <CardDescription>
                  Conversion rate trends over time
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
              <CardTitle>Conversion Bottlenecks</CardTitle>
              <CardDescription>
                Identify areas where conversion process slows down
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.bottlenecks.map((bottleneck, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{bottleneck.stage}</h4>
                          <Badge variant="outline">{bottleneck.count} occurrences</Badge>
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
                Overall conversion rate of {performanceData.overview.conversion_rate.toFixed(1)}% 
                is {performanceData.overview.conversion_rate > 60 ? 'above' : 'below'} industry average
              </li>
              <li>
                Top performing template: {Object.entries(performanceData.by_template)
                  .sort(([,a], [,b]) => b.success_rate - a.success_rate)[0]?.[0]} 
                with {Object.entries(performanceData.by_template)
                  .sort(([,a], [,b]) => b.success_rate - a.success_rate)[0]?.[1].success_rate.toFixed(1)}% success rate
              </li>
              <li>
                Average conversion time of {Math.round(performanceData.overview.avg_conversion_time)} hours
                {performanceData.overview.avg_conversion_time > 24 ? ' indicates potential bottlenecks' : ' is within optimal range'}
              </li>
              <li>
                Total opportunity value of ${performanceData.overview.total_opportunity_value.toLocaleString()}
                represents significant revenue potential
              </li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3, 
  Target, 
  Bell, 
  TrendingUp,
  Users,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';
import { KPIDashboard } from './KPIDashboard'
import { KPIBenchmarking } from './KPIBenchmarking'
import { KPIAlerting } from './KPIAlerting';

interface KPIModuleProps {
  organizationId: string;
  userId?: string;
  territoryId?: string;
}

export function KPIModule({ organizationId, userId, territoryId }: KPIModuleProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const exportKPIData = async () => {
    try {
      const params = new URLSearchParams({
        organizationId,
        format: 'csv',
        includeTrends: 'true',
        includeBenchmarks: 'true'
      });

      if (userId) params.append('userId', userId);
      if (territoryId) params.append('territoryId', territoryId);

      const response = await fetch(`/api/kpis/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to export KPI data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kpi-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Performance KPIs</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive performance metrics, benchmarking, and alerting system
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportKPIData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active KPIs</p>
                <p className="text-2xl font-bold text-gray-900">10</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alert Rules</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
              <Bell className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Benchmarks</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Performance</p>
                <Badge className="bg-green-100 text-green-800">Excellent</Badge>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="benchmarking" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Benchmarking
          </TabsTrigger>
          <TabsTrigger value="alerting" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerting
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <KPIDashboard 
            key={refreshKey}
            organizationId={organizationId}
            userId={userId}
            territoryId={territoryId}
          />
        </TabsContent>

        <TabsContent value="benchmarking" className="space-y-4">
          <KPIBenchmarking 
            key={refreshKey}
            organizationId={organizationId}
          />
        </TabsContent>

        <TabsContent value="alerting" className="space-y-4">
          <KPIAlerting 
            key={refreshKey}
            organizationId={organizationId}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KPI Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  KPI Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Calculation Settings</h4>
                  <p className="text-sm text-blue-800">
                    Configure how KPIs are calculated, including data sources, 
                    calculation methods, and update frequencies.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Auto-refresh interval</span>
                    <Select defaultValue="5">
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 min</SelectItem>
                        <SelectItem value="5">5 min</SelectItem>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Data retention</span>
                    <Select defaultValue="365">
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">6 months</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="730">2 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Integration Status</h4>
                  <p className="text-sm text-green-800">
                    Monitor the status of your data source integrations and 
                    ensure data accuracy for KPI calculations.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">CRM System</span>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Sales Activities</span>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Marketing Data</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Financial System</span>
                    <Badge className="bg-red-100 text-red-800">Disconnected</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <h4 className="font-medium text-blue-900 mb-1">Top Performing KPI</h4>
                    <p className="text-2xl font-bold text-blue-600">Win Rate</p>
                    <p className="text-sm text-blue-800">35.2%</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <h4 className="font-medium text-green-900 mb-1">Most Improved</h4>
                    <p className="text-2xl font-bold text-green-600">Revenue Growth</p>
                    <p className="text-sm text-green-800">+18.5%</p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <h4 className="font-medium text-orange-900 mb-1">Needs Attention</h4>
                    <p className="text-2xl font-bold text-orange-600">Sales Cycle</p>
                    <p className="text-sm text-orange-800">95 days</p>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Focus on shortening sales cycle length through better qualification</li>
                    <li>• Maintain current win rate performance with additional training</li>
                    <li>• Leverage revenue growth momentum for territory expansion</li>
                    <li>• Review CAC optimization opportunities in underperforming segments</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

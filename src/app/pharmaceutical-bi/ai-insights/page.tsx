// src/app/pharmaceutical-bi/ai-insights/page.tsx
// Phase 2.7 AI-Powered Insights Main Page
// Integrated dashboard for AI insights, smart alerts, and predictive analytics

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Bell, 
  TrendingUp, 
  Zap, 
  Activity,
  Settings,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { AIInsightsDashboard } from '@/components/dashboard/AIInsightsDashboard';
import { SmartAlertsManager } from '@/components/dashboard/SmartAlertsManager';
import { PredictiveAnalytics } from '@/components/dashboard/PredictiveAnalytics';

export default function AIInsightsPage() {
  // Mock user data - in real app, get from auth context
  const organizationId = 'org_123';
  const userId = 'user_456';

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">AI-Powered Insights</h1>
          <p className="text-muted-foreground">
            Advanced pharmaceutical analytics powered by artificial intelligence
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Phase 2.7 Complete
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Brain className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">24</div>
            <p className="text-xs text-purple-600">
              Active intelligence insights
            </p>
            <div className="mt-2">
              <Badge className="bg-purple-100 text-purple-800 text-xs">
                3 High Priority
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Smart Alerts</CardTitle>
            <Bell className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">12</div>
            <p className="text-xs text-orange-600">
              Active monitoring alerts
            </p>
            <div className="mt-2">
              <Badge className="bg-orange-100 text-orange-800 text-xs">
                2 Triggered
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predictions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">8</div>
            <p className="text-xs text-green-600">
              Active forecasting models
            </p>
            <div className="mt-2">
              <Badge className="bg-green-100 text-green-800 text-xs">
                87% Accuracy
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Performance</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">94%</div>
            <p className="text-xs text-blue-600">
              Overall system health
            </p>
            <div className="mt-2">
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                All Systems Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Features Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            <span>Phase 2.7: AI-Powered Intelligence Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-purple-700 flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>AI Insights Engine</span>
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Automated pattern recognition</li>
                <li>• Performance anomaly detection</li>
                <li>• Opportunity identification</li>
                <li>• Risk assessment & mitigation</li>
                <li>• Intelligent recommendations</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-orange-700 flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <span>Smart Alert System</span>
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Configurable trigger conditions</li>
                <li>• Multi-channel notifications</li>
                <li>• Pharmaceutical KPI monitoring</li>
                <li>• Automated escalation rules</li>
                <li>• Historical alert tracking</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-green-700 flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Predictive Analytics</span>
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• TRx/NRx forecasting models</li>
                <li>• Market share predictions</li>
                <li>• Scenario analysis (What-if)</li>
                <li>• Confidence intervals</li>
                <li>• Model performance tracking</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  ✅ Phase 2.7 Complete
                </Badge>
                <span className="text-sm text-gray-600">
                  All AI-powered features implemented and operational
                </span>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Documentation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main AI Insights Interface */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>AI Intelligence Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="insights" className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>AI Insights</span>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <span>Smart Alerts</span>
              </TabsTrigger>
              <TabsTrigger value="predictions" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Predictive Analytics</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="insights" className="mt-6">
              <AIInsightsDashboard 
                organizationId={organizationId}
                userId={userId}
                timeframe="30_days"
                filters={{
                  territories: ['North', 'South', 'East', 'West'],
                  products: ['Product-A', 'Product-B', 'Product-C'],
                  segments: ['Primary Care', 'Specialty', 'Hospital']
                }}
              />
            </TabsContent>
            
            <TabsContent value="alerts" className="mt-6">
              <SmartAlertsManager 
                organizationId={organizationId}
                userId={userId}
                onAlertTriggered={(alert) => {
                  console.log('Alert triggered:', alert);
                  // Handle alert trigger in parent component
                }}
              />
            </TabsContent>
            
            <TabsContent value="predictions" className="mt-6">
              <PredictiveAnalytics 
                organizationId={organizationId}
                userId={userId}
                timeframe="30_days"
                filters={{
                  territories: ['North', 'South', 'East', 'West'],
                  products: ['Product-A', 'Product-B', 'Product-C'],
                  segments: ['Primary Care', 'Specialty', 'Hospital']
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Technical Implementation Notes */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm text-gray-700">Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <h4 className="font-medium mb-2">AI Engine Components:</h4>
              <ul className="space-y-1">
                <li>• AI Insights Engine (`/lib/ai/ai-insights-engine.ts`)</li>
                <li>• TypeScript AI Types (`/lib/types/ai-insights.ts`)</li>
                <li>• Singleton Pattern for Performance</li>
                <li>• Caching & Optimization</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Dashboard Architecture:</h4>
              <ul className="space-y-1">
                <li>• React Server Components by Default</li>
                <li>• Client Components for Interactivity</li>
                <li>• Modular Component Structure</li>
                <li>• Type-Safe Pharmaceutical Data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
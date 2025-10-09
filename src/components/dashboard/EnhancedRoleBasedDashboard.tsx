// src/components/dashboard/EnhancedRoleBasedDashboard.tsx
// Enhanced Role-Based Dashboard with KPI Integration
// Uses DashboardContext for real-time KPI calculations

'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { UserRole, getUserPermissions } from '@/lib/roles'
import { DashboardWidget, WidgetType, DEFAULT_WIDGETS, WIDGET_TEMPLATES } from '@/lib/dashboard-widgets'
import { PharmaKPICardData, TerritoryPerformanceData, ProductPerformanceData, SampleDistributionData, FormularyAccessData, KPICardData } from '@/lib/types/dashboard'
import { supabase } from '@/lib/supabase'
import RoleSelector from '@/components/RoleSelector'
import { useDashboard, DashboardProvider } from '@/components/dashboard/DashboardContext'
import { PHARMACEUTICAL_DASHBOARD_CONFIGS } from '@/lib/pharmaceutical-dashboard-config'

// Import pharmaceutical widget components
import { PharmaKPICardWidget } from '@/components/dashboard/widgets/PharmaKPICardWidget'
import { TerritoryPerformanceWidget } from '@/components/dashboard/widgets/TerritoryPerformanceWidget'
import { ProductPerformanceWidget } from '@/components/dashboard/widgets/ProductPerformanceWidget'
import { SampleDistributionWidget } from '@/components/dashboard/widgets/SampleDistributionWidget'
import { FormularyAccessWidget } from '@/components/dashboard/widgets/FormularyAccessWidget'
import { KPICard } from '@/components/bi/KPICard'
import { RefreshCw, TrendingUp, Users, Target } from 'lucide-react'
import { useDrillDown } from '@/hooks/useDrillDown'
import { DrillDownModal } from '@/components/dashboard/widgets/DrillDownModal'

interface EnhancedRoleBasedDashboardProps {
  userRole: UserRole
  userId: string
  organizationNameSSR?: string | null
}

// Small header controls component backed by DashboardContext
function DashboardControls() {
  const dashboard = useDashboard()
  return (
    <div className="flex items-center gap-3 bg-white/80 border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                  totalSales: 2400000,
                  monthlyGrowth: 8.5
                }
              };
              drillDown.openDrillDown(mockKPIData, widget.id, dashboard.organizationId || 'default-org');
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
              <div className="flex items-center space-x-2 text-green-600">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">+8.5% vs last month</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">$2.4M</div>
                <div className="text-sm text-gray-500">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">156</div>
                <div className="text-sm text-gray-500">Deals Closed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">$15.4K</div>
                <div className="text-sm text-gray-500">Avg Deal Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">23 days</div>
                <div className="text-sm text-gray-500">Avg Sales Cycle</div>
              </div>
            </div>

            {/* Mini Chart Simulation */}
            <div className="h-20 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg flex items-end justify-between px-4 py-2">
              <div className="bg-blue-500 w-3 rounded-t" style={{height: '60%'}}></div>
              <div className="bg-blue-500 w-3 rounded-t" style={{height: '75%'}}></div>
              <div className="bg-blue-500 w-3 rounded-t" style={{height: '45%'}}></div>
              <div className="bg-blue-500 w-3 rounded-t" style={{height: '85%'}}></div>
              <div className="bg-blue-500 w-3 rounded-t" style={{height: '70%'}}></div>
              <div className="bg-green-500 w-3 rounded-t" style={{height: '90%'}}></div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">Click for detailed sales analytics and forecasting</p>
            </div>
          </div>
        );

      // Team Performance Widget
      case WidgetType.TEAM_PERFORMANCE:
        return (
          <div 
            className="bg-white p-6 rounded-lg shadow border cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              const mockKPIData: PharmaKPICardData = {
                kpiId: widget.id,
                kpiName: widget.title,
                value: 85,
                confidence: 88,
                trend: 'up',
                format: 'percentage',
                metadata: {
                  teamSize: 12,
                  avgPerformance: 85,
                  topPerformer: 'Sarah Johnson',
                  improvementArea: 'HCP Engagement'
                }
              };
              drillDown.openDrillDown(mockKPIData, widget.id, dashboard.organizationId || 'default-org');
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
              <div className="flex items-center space-x-2 text-green-600">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">12 Team Members</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">85%</div>
                <div className="text-sm text-gray-500">Avg Performance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">9/12</div>
                <div className="text-sm text-gray-500">Above Target</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">$1.8M</div>
                <div className="text-sm text-gray-500">Team Revenue</div>
              </div>
            </div>

            {/* Team Member Performance Bars */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Sarah Johnson</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '95%'}}></div>
                  </div>
                  <span className="text-sm text-green-600 font-medium">95%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">John Smith</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '87%'}}></div>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">87%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Mike Davis</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{width: '78%'}}></div>
                  </div>
                  <span className="text-sm text-orange-600 font-medium">78%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">Click for detailed team analytics and individual performance</p>
            </div>
          </div>
        );

      // Pipeline Overview Widget
      case WidgetType.PIPELINE_OVERVIEW:
        return (
          <div 
            className="bg-white p-6 rounded-lg shadow border cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              const mockKPIData: PharmaKPICardData = {
                kpiId: widget.id,
                kpiName: widget.title,
                value: 1960000,
                confidence: 90,
                trend: 'up',
                format: 'currency',
                metadata: {
                  totalOpportunities: 28,
                  pipelineValue: 1960000,
                  conversionRate: 23.4,
                  avgDealSize: 70000
                }
              };
              drillDown.openDrillDown(mockKPIData, widget.id, dashboard.organizationId || 'default-org');
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
              <div className="flex items-center space-x-2 text-blue-600">
                <Target className="w-5 h-5" />
                <span className="text-sm font-medium">PEAK Pipeline</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="text-2xl font-bold text-blue-600">$1.96M</div>
                <div className="text-sm text-gray-500">Total Pipeline Value</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">23.4%</div>
                <div className="text-sm text-gray-500">Conversion Rate</div>
              </div>
            </div>

            {/* PEAK Pipeline Stages */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div>
                  <div className="font-medium text-blue-900">Prospecting</div>
                  <div className="text-sm text-blue-600">12 opportunities</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-700">$420K</div>
                  <div className="text-xs text-blue-500">21% of pipeline</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <div>
                  <div className="font-medium text-yellow-900">Engaging</div>
                  <div className="text-sm text-yellow-600">8 opportunities</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-700">$540K</div>
                  <div className="text-xs text-yellow-500">28% of pipeline</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                <div>
                  <div className="font-medium text-orange-900">Advancing</div>
                  <div className="text-sm text-orange-600">5 opportunities</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-700">$680K</div>
                  <div className="text-xs text-orange-500">35% of pipeline</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div>
                  <div className="font-medium text-green-900">Key Decision</div>
                  <div className="text-sm text-green-600">3 opportunities</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-700">$320K</div>
                  <div className="text-xs text-green-500">16% of pipeline</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600">
                <strong>PEAK Insights:</strong> 51% of pipeline value in Engaging/Advancing stages. 
                Key Decision stage shows strong close probability.
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">Click for detailed PEAK pipeline analysis and forecasting</p>
            </div>
          </div>
        );

      // Recent Activity Widget
      case WidgetType.RECENT_ACTIVITY:
        return (
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
              <div className="text-sm text-gray-500">Last 24 hours</div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">$</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">New opportunity created</div>
                  <div className="text-sm text-gray-600">Pharma Corp - Enterprise Deal ($250K)</div>
                  <div className="text-xs text-gray-400">2 hours ago by Sarah Johnson</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">📅</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Meeting scheduled</div>
                  <div className="text-sm text-gray-600">Dr. Smith - Product demonstration</div>
                  <div className="text-xs text-gray-400">4 hours ago by John Smith</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">📦</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Sample order processed</div>
                  <div className="text-sm text-gray-600">250 units shipped to Metro Hospital</div>
                  <div className="text-xs text-gray-400">6 hours ago by Mike Davis</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">📊</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Territory analysis completed</div>
                  <div className="text-sm text-gray-600">Q4 performance report generated</div>
                  <div className="text-xs text-gray-400">8 hours ago by System</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">👤</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">New HCP contact added</div>
                  <div className="text-sm text-gray-600">Dr. Emma Wilson - Cardiologist</div>
                  <div className="text-xs text-gray-400">12 hours ago by Sarah Johnson</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <button className="text-blue-600 text-sm hover:text-blue-800 font-medium">
                View all activities →
              </button>
            </div>
          </div>
        );

      // Quota Tracker Widget
      case WidgetType.QUOTA_TRACKER:
        return (
          <div 
            className="bg-white p-6 rounded-lg shadow border cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              const mockKPIData: PharmaKPICardData = {
                kpiId: widget.id,
                kpiName: widget.title,
                value: 78,
                confidence: 91,
                trend: 'up',
                format: 'percentage',
                metadata: {
                  currentValue: 1950000,
                  targetValue: 2500000,
                  daysRemaining: 22,
                  dailyTarget: 25000,
                  monthlyProgress: 78
                }
              };
              drillDown.openDrillDown(mockKPIData, widget.id, dashboard.organizationId || 'default-org');
            }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{widget.title}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Progress</span>
                <span className="text-sm font-medium">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>$1.95M / $2.5M</span>
                <span>22 days left</span>
              </div>
              <p className="text-xs text-blue-600 mt-2">Click for detailed analysis</p>
            </div>
          </div>
        );

      // Pharmaceutical specific widgets
      case WidgetType.PHARMA_KPI_CARD:
        return (
          <PharmaKPICardWidget 
            widget={widget} 
            data={(widget.data as PharmaKPICardData) || {
              kpiId: 'trx', kpiName: widget.title, value: 0, confidence: 0.9, trend: 'stable', format: 'number', metadata: {}
            }}
            onDrillDown={drillDown.openDrillDown}
            onUpdateMetadata={handleUpdateWidgetMetadata}
            {...sharedProps}
          />
        );
      case WidgetType.TERRITORY_PERFORMANCE:
        return <TerritoryPerformanceWidget widget={widget} data={widget.data as TerritoryPerformanceData} />
      case WidgetType.PRODUCT_PERFORMANCE:
        return <ProductPerformanceWidget widget={widget} data={widget.data as ProductPerformanceData} />
      case WidgetType.HCP_ENGAGEMENT:
        return <div>HCP Engagement Widget - Coming Soon</div>
      case WidgetType.SAMPLE_DISTRIBUTION:
        return <SampleDistributionWidget widget={widget} data={widget.data as SampleDistributionData} />
      case WidgetType.FORMULARY_ACCESS:
        return <FormularyAccessWidget widget={widget} data={widget.data as FormularyAccessData} />
      
      // MEDDPICC Scoring Widget
      case WidgetType.MEDDPICC_SCORING:
        return (
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
              <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Overall: 82%
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Metrics</div>
                    <div className="text-sm text-gray-600">ROI targets identified</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '90%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">90%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">E</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Economic Buyer</div>
                    <div className="text-sm text-gray-600">Decision maker identified</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">85%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">D</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Decision Criteria</div>
                    <div className="text-sm text-gray-600">Requirements mapped</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{width: '75%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">75%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">D</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Decision Process</div>
                    <div className="text-sm text-gray-600">Timeline established</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{width: '80%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">80%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Paper Process</div>
                    <div className="text-sm text-gray-600">Approval workflow</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{width: '70%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">70%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">I</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Implicate Pain</div>
                    <div className="text-sm text-gray-600">Business impact clear</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{width: '88%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">88%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">C</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Champion</div>
                    <div className="text-sm text-gray-600">Internal advocate</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-teal-500 h-2 rounded-full" style={{width: '92%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">92%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">C</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Competition</div>
                    <div className="text-sm text-gray-600">Competitive position</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-pink-500 h-2 rounded-full" style={{width: '78%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">78%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800">
                Recommendation: High-probability deal. Focus on improving Paper Process and Competition analysis.
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-white p-6 rounded-lg shadow border h-32 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500">Widget type: {widget.type}</p>
              <p className="text-sm text-gray-400">Implementation pending</p>
            </div>
          </div>
        )
    }
  }

  useEffect(() => {
    loadDashboardLayout()
  }, [loadDashboardLayout])

  if (dashboard.isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {userRole.replace('_', ' ').toUpperCase()} Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                {permissions.canViewTeamData ? 'Team & Regional View' : 'Personal View'}
              </p>
              {dashboard.organizationId && (
                <p className="text-sm text-gray-500">Organization: {organizationName || dashboard.organizationId}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative z-50">
                <RoleSelector 
                  currentRole={userRole} 
                  onRoleChange={setUserRole} 
                />
              </div>
              
              {/* Dashboard Controls */}
              <div className="relative">
                <DashboardControls />
              </div>
              
              {permissions.canCustomizeDashboard && (
                <button
                  onClick={() => {
                    // When toggling off edit mode, persist the current layout
                    if (isEditMode) {
                      try {
                        void saveDashboardLayout(widgets)
                      } catch (_e) {
                        // no-op
                      }
                    }
                    setIsEditMode(!isEditMode)
                  }}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                    isEditMode 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                      : 'bg-white/80 text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  {isEditMode ? 'Save Layout' : 'Customize'}
                </button>
              )}
              <button
                onClick={() => supabase.auth.signOut()}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-6 rounded-xl hover:from-red-600 hover:to-pink-600 shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Widget Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 auto-rows-min">
            {getRoleSpecificWidgets().map((widget) => (
              <div
                key={widget.id}
                className={`${widget.position.w === 12 ? 'col-span-1 lg:col-span-12' : `col-span-1 lg:col-span-${widget.position.w}`} bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]`}
                style={{
                  gridRow: `span ${widget.position.h}`,
                  minHeight: `${widget.position.h * 120}px`
                }}
              >
                {/* Widget Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {widget.title}
                  </h3>
                  {isEditMode && (
                    <button
                      onClick={() => removeWidget(widget.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Widget Content */}
                <div className="h-full">
                  {renderWidget(widget)}
                </div>
              </div>
            ))}
          </div>

          {/* Add Widget Panel */}
          {isEditMode && (
            <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Widget</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(WIDGET_TEMPLATES).map(([type, template]) => (
                  <button
                    key={type}
                    onClick={() => addWidget(type as WidgetType)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="text-2xl mb-2">{template.icon}</div>
                    <div className="font-medium text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-500">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drill-down Modal */}
      {drillDown.isOpen && drillDown.kpiData && drillDown.kpiId && drillDown.organizationId && (
        <DrillDownModal
          isOpen={drillDown.isOpen}
          onClose={drillDown.closeDrillDown}
          kpiData={drillDown.kpiData}
          kpiId={drillDown.kpiId}
          organizationId={drillDown.organizationId}
          productId={drillDown.productId}
          territoryId={drillDown.territoryId}
        />
      )}
    </div>
  )
}

// Main component with provider wrapper
export default function EnhancedRoleBasedDashboard(props: EnhancedRoleBasedDashboardProps) {
  return (
    <DashboardProvider 
      initialSettings={{
        autoRefresh: true,
        refreshInterval: 15,
        defaultPeriodDays: 30
      }}
    >
      <DashboardContent {...props} />
    </DashboardProvider>
  );
}

  const saveDashboardLayout = useCallback(async (newWidgets: DashboardWidget[]) => {
    try {
      const payload = {
        name: 'My Dashboard',
        layout: newWidgets.map(w => ({
          id: w.id,
          type: w.type,
          title: w.title,
          x: w.position.x,
          y: w.position.y,
          w: w.position.w,
          h: w.position.h,
          // Only persist lightweight metadata; avoid large data blobs
          ...(w.data && typeof w.data === 'object' && (w.data as { metadata?: Record<string, unknown> }).metadata
            ? { metadata: (w.data as { metadata?: Record<string, unknown> }).metadata as Record<string, unknown> }
            : {})
        }))
      }
      await fetch('/api/dashboard/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (_e) {
      // Silent fail on UI; could surface toast in future
    }
  }, []);

  // Load organization name for display (skip if SSR already provided it)
  useEffect(() => {
    let isActive = true
    const loadOrg = async () => {
      try {
        if (!dashboard.organizationId) {
          setOrganizationName(null)
          return
        }
        const { data, error } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', dashboard.organizationId)
          .single()
        if (!isActive) return
        if (error) {
          setOrganizationName(null)
          return
        }
        setOrganizationName((data as { name?: string } | null)?.name ?? null)
      } catch (_e) {
        if (isActive) setOrganizationName(null)
      }
    }
    if (!organizationNameSSR) {
      loadOrg()
    }
    return () => { isActive = false }
  }, [dashboard.organizationId, organizationNameSSR])

  // Hoisted handler to update and persist widget-level metadata (Pharma-only for type safety)
  const handleUpdateWidgetMetadata = useCallback((widgetId: string, metadata: Record<string, unknown>) => {
    const nextWidgets: DashboardWidget[] = widgets.map(w => {
      if (w.id !== widgetId) return w
      if (w.type !== WidgetType.PHARMA_KPI_CARD) return w
      const current = (w.data as PharmaKPICardData | undefined) || {
        kpiId: 'trx',
        kpiName: w.title,
        value: 0,
        confidence: 0,
        trend: 'stable' as const,
        format: 'number' as const,
        metadata: {},
      }
      const merged: PharmaKPICardData = {
        ...current,
        metadata: { ...(current.metadata || {}), ...metadata },
      }
      return { ...w, data: merged }
    })
    setWidgets(nextWidgets)
    void saveDashboardLayout(nextWidgets)
  }, [widgets, saveDashboardLayout])

  // Add a new widget using template defaults and persist layout
  const addWidget = (widgetType: WidgetType) => {
    const template = WIDGET_TEMPLATES[widgetType]
    const newWidget: DashboardWidget = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      title: template.name,
      position: {
        x: 0,
        y: 0,
        w: template.defaultSize.w,
        h: template.defaultSize.h,
      },
    }
    const next = [...widgets, newWidget]
    setWidgets(next)
    void saveDashboardLayout(next)
  }

  // Remove a widget and persist layout
  const removeWidget = (widgetId: string) => {
    const next = widgets.filter(w => w.id !== widgetId)
    setWidgets(next)
    void saveDashboardLayout(next)
  }

  // Filter widgets available for the current role
  const getRoleSpecificWidgets = () => {
    return widgets.filter(widget => {
      switch (userRole) {
        case UserRole.SALESMAN:
          return ['kpi_card', 'sales_chart', 'quota_tracker', 'recent_activity', 'pharma_kpi_card', 'product_performance'].includes(widget.type)
        case UserRole.SALES_MANAGER:
          return ['kpi_card', 'sales_chart', 'team_performance', 'pipeline_overview', 'recent_activity', 'pharma_kpi_card', 'territory_performance', 'hcp_engagement'].includes(widget.type)
        case UserRole.REGIONAL_SALES_DIRECTOR:
          return ['kpi_card', 'sales_chart', 'team_performance', 'pipeline_overview', 'regional_map', 'conversion_funnel', 'pharma_kpi_card', 'territory_performance', 'formulary_access'].includes(widget.type)
        case UserRole.GLOBAL_SALES_LEAD:
        case UserRole.BUSINESS_UNIT_HEAD:
        case UserRole.ADMIN:
        case UserRole.SUPER_ADMIN:
          return true
        default:
          return true
      }
    })
  }

  const renderWidget = (widget: DashboardWidget) => {
    const sharedProps = {
      organizationId: dashboard.organizationId || undefined,
      autoRefresh: dashboard.autoRefresh,
      refreshInterval: dashboard.refreshInterval,
      territoryId: dashboard.territoryId || undefined,
      productId: dashboard.productId || undefined,
    };


    switch (widget.type) {
      // Standard KPI Cards
      case WidgetType.KPI_CARD:
        const kpiData = widget.data as KPICardData | undefined;
        return (
          <div className="bg-white p-6 rounded-lg shadow border">
            <KPICard
              title={widget.title}
              value={typeof kpiData?.value === 'number' ? kpiData.value : parseInt(String(kpiData?.value || 0))}
              trend={kpiData?.trend === 'up' || kpiData?.trend === 'down' ? kpiData.trend : 'stable'}
              color="blue"
              confidence={85}
              format={widget.title.includes('$') || widget.title.includes('Value') ? 'currency' : 'number'}
              clickable={true}
              onClick={() => {
                // Create mock PharmaKPICardData for drill-down
                const mockKPIData: PharmaKPICardData = {
                  kpiId: widget.id,
                  kpiName: widget.title,
                  value: typeof kpiData?.value === 'number' ? kpiData.value : parseInt(String(kpiData?.value || 0)),
                  confidence: 85,
                  trend: kpiData?.trend === 'up' || kpiData?.trend === 'down' ? kpiData.trend : 'stable',
                  format: widget.title.includes('$') || widget.title.includes('Value') ? 'currency' : 'number',
                  metadata: {
                    productId: 'mock-product',
                    territoryId: 'mock-territory',
                    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    periodEnd: new Date().toISOString(),
                    totalHCPs: 150,
                    engagedHCPs: 89,
                    totalCalls: 245,
                    uniqueHCPs: 78
                  }
                };
                drillDown.openDrillDown(
                  mockKPIData,
                  widget.id,
                  dashboard.organizationId || 'default-org'
                );
              }}
            />
          </div>
        );

      // Sales Chart Widget
      case WidgetType.SALES_CHART:
        return (
          <div 
            className="bg-white p-6 rounded-lg shadow border cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              const mockKPIData: PharmaKPICardData = {
                kpiId: widget.id,
                kpiName: widget.title,
                value: 2400000,
                confidence: 92,
                trend: 'up',
                format: 'currency',
                metadata: {
                  chartType: 'sales_trend',
                  periodStart: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                  periodEnd: new Date().toISOString(),
                  totalSales: 2400000,
                  monthlyGrowth: 8.5
                }
              };
              drillDown.openDrillDown(mockKPIData, widget.id, dashboard.organizationId || 'default-org');
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
              <div className="flex items-center space-x-2 text-green-600">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">+8.5% vs last month</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">$2.4M</div>
                <div className="text-sm text-gray-500">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">156</div>
                <div className="text-sm text-gray-500">Deals Closed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">$15.4K</div>
                <div className="text-sm text-gray-500">Avg Deal Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">23 days</div>
                <div className="text-sm text-gray-500">Avg Sales Cycle</div>
              </div>
            </div>

            {/* Mini Chart Simulation */}
            <div className="h-20 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg flex items-end justify-between px-4 py-2">
              <div className="bg-blue-500 w-3 rounded-t" style={{height: '60%'}}></div>
              <div className="bg-blue-500 w-3 rounded-t" style={{height: '75%'}}></div>
              <div className="bg-blue-500 w-3 rounded-t" style={{height: '45%'}}></div>
              <div className="bg-blue-500 w-3 rounded-t" style={{height: '85%'}}></div>
              <div className="bg-blue-500 w-3 rounded-t" style={{height: '70%'}}></div>
              <div className="bg-green-500 w-3 rounded-t" style={{height: '90%'}}></div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">Click for detailed sales analytics and forecasting</p>
            </div>
          </div>
        );

      // Team Performance Widget
      case WidgetType.TEAM_PERFORMANCE:
        return (
          <div 
            className="bg-white p-6 rounded-lg shadow border cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              const mockKPIData: PharmaKPICardData = {
                kpiId: widget.id,
                kpiName: widget.title,
                value: 85,
                confidence: 88,
                trend: 'up',
                format: 'percentage',
                metadata: {
                  teamSize: 12,
                  avgPerformance: 85,
                  topPerformer: 'Sarah Johnson',
                  improvementArea: 'HCP Engagement'
                }
              };
              drillDown.openDrillDown(mockKPIData, widget.id, dashboard.organizationId || 'default-org');
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
              <div className="flex items-center space-x-2 text-green-600">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">12 Team Members</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">85%</div>
                <div className="text-sm text-gray-500">Avg Performance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">9/12</div>
                <div className="text-sm text-gray-500">Above Target</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">$1.8M</div>
                <div className="text-sm text-gray-500">Team Revenue</div>
              </div>
            </div>

            {/* Team Member Performance Bars */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Sarah Johnson</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '95%'}}></div>
                  </div>
                  <span className="text-sm text-green-600 font-medium">95%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">John Smith</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '87%'}}></div>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">87%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Mike Davis</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{width: '78%'}}></div>
                  </div>
                  <span className="text-sm text-orange-600 font-medium">78%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">Click for detailed team analytics and individual performance</p>
            </div>
          </div>
        );

      // Pipeline Overview Widget
      case WidgetType.PIPELINE_OVERVIEW:
        return (
          <div 
            className="bg-white p-6 rounded-lg shadow border cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              const mockKPIData: PharmaKPICardData = {
                kpiId: widget.id,
                kpiName: widget.title,
                value: 1960000,
                confidence: 90,
                trend: 'up',
                format: 'currency',
                metadata: {
                  totalOpportunities: 28,
                  pipelineValue: 1960000,
                  conversionRate: 23.4,
                  avgDealSize: 70000
                }
              };
              drillDown.openDrillDown(mockKPIData, widget.id, dashboard.organizationId || 'default-org');
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
              <div className="flex items-center space-x-2 text-blue-600">
                <Target className="w-5 h-5" />
                <span className="text-sm font-medium">PEAK Pipeline</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="text-2xl font-bold text-blue-600">$1.96M</div>
                <div className="text-sm text-gray-500">Total Pipeline Value</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">23.4%</div>
                <div className="text-sm text-gray-500">Conversion Rate</div>
              </div>
            </div>

            {/* PEAK Pipeline Stages */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div>
                  <div className="font-medium text-blue-900">Prospecting</div>
                  <div className="text-sm text-blue-600">12 opportunities</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-700">$420K</div>
                  <div className="text-xs text-blue-500">21% of pipeline</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <div>
                  <div className="font-medium text-yellow-900">Engaging</div>
                  <div className="text-sm text-yellow-600">8 opportunities</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-700">$540K</div>
                  <div className="text-xs text-yellow-500">28% of pipeline</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                <div>
                  <div className="font-medium text-orange-900">Advancing</div>
                  <div className="text-sm text-orange-600">5 opportunities</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-700">$680K</div>
                  <div className="text-xs text-orange-500">35% of pipeline</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div>
                  <div className="font-medium text-green-900">Key Decision</div>
                  <div className="text-sm text-green-600">3 opportunities</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-700">$320K</div>
                  <div className="text-xs text-green-500">16% of pipeline</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600">
                <strong>PEAK Insights:</strong> 51% of pipeline value in Engaging/Advancing stages. 
                Key Decision stage shows strong close probability.
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">Click for detailed PEAK pipeline analysis and forecasting</p>
            </div>
          </div>
        );

      // Recent Activity Widget
      case WidgetType.RECENT_ACTIVITY:
        return (
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
              <div className="text-sm text-gray-500">Last 24 hours</div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">$</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">New opportunity created</div>
                  <div className="text-sm text-gray-600">Pharma Corp - Enterprise Deal ($250K)</div>
                  <div className="text-xs text-gray-400">2 hours ago by Sarah Johnson</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">📅</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Meeting scheduled</div>
                  <div className="text-sm text-gray-600">Dr. Smith - Product demonstration</div>
                  <div className="text-xs text-gray-400">4 hours ago by John Smith</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">📦</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Sample order processed</div>
                  <div className="text-sm text-gray-600">250 units shipped to Metro Hospital</div>
                  <div className="text-xs text-gray-400">6 hours ago by Mike Davis</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">📊</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Territory analysis completed</div>
                  <div className="text-sm text-gray-600">Q4 performance report generated</div>
                  <div className="text-xs text-gray-400">8 hours ago by System</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">👤</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">New HCP contact added</div>
                  <div className="text-sm text-gray-600">Dr. Emma Wilson - Cardiologist</div>
                  <div className="text-xs text-gray-400">12 hours ago by Sarah Johnson</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <button className="text-blue-600 text-sm hover:text-blue-800 font-medium">
                View all activities →
              </button>
            </div>
          </div>
        );

      // Quota Tracker Widget
      case WidgetType.QUOTA_TRACKER:
        return (
          <div 
            className="bg-white p-6 rounded-lg shadow border cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              const mockKPIData: PharmaKPICardData = {
                kpiId: widget.id,
                kpiName: widget.title,
                value: 78,
                confidence: 91,
                trend: 'up',
                format: 'percentage',
                metadata: {
                  currentValue: 1950000,
                  targetValue: 2500000,
                  daysRemaining: 22,
                  dailyTarget: 25000,
                  monthlyProgress: 78
                }
              };
              drillDown.openDrillDown(mockKPIData, widget.id, dashboard.organizationId || 'default-org');
            }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{widget.title}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Progress</span>
                <span className="text-sm font-medium">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>$1.95M / $2.5M</span>
                <span>22 days left</span>
              </div>
              <p className="text-xs text-blue-600 mt-2">Click for detailed analysis</p>
            </div>
          </div>
        );

      // Pharmaceutical specific widgets
      case WidgetType.PHARMA_KPI_CARD:
        return (
          <PharmaKPICardWidget 
            widget={widget} 
            data={(widget.data as PharmaKPICardData) || {
              kpiId: 'trx', kpiName: widget.title, value: 0, confidence: 0.9, trend: 'stable', format: 'number', metadata: {}
            }}
            onDrillDown={drillDown.openDrillDown}
            onUpdateMetadata={handleUpdateWidgetMetadata}
            {...sharedProps}
          />
        );
      case WidgetType.TERRITORY_PERFORMANCE:
        return <TerritoryPerformanceWidget widget={widget} data={widget.data as TerritoryPerformanceData} />
      case WidgetType.PRODUCT_PERFORMANCE:
        return <ProductPerformanceWidget widget={widget} data={widget.data as ProductPerformanceData} />
      case WidgetType.HCP_ENGAGEMENT:
        return <div>HCP Engagement Widget - Coming Soon</div>
      case WidgetType.SAMPLE_DISTRIBUTION:
        return <SampleDistributionWidget widget={widget} data={widget.data as SampleDistributionData} />
      case WidgetType.FORMULARY_ACCESS:
        return <FormularyAccessWidget widget={widget} data={widget.data as FormularyAccessData} />
      
      // MEDDPICC Scoring Widget
      case WidgetType.MEDDPICC_SCORING:
        return (
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
              <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Overall: 82%
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Metrics</div>
                    <div className="text-sm text-gray-600">ROI targets identified</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '90%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">90%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">E</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Economic Buyer</div>
                    <div className="text-sm text-gray-600">Decision maker identified</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">85%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">D</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Decision Criteria</div>
                    <div className="text-sm text-gray-600">Requirements mapped</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{width: '75%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">75%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">D</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Decision Process</div>
                    <div className="text-sm text-gray-600">Timeline established</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{width: '80%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">80%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Paper Process</div>
                    <div className="text-sm text-gray-600">Approval workflow</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{width: '70%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">70%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">I</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Implicate Pain</div>
                    <div className="text-sm text-gray-600">Business impact clear</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{width: '88%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">88%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">C</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Champion</div>
                    <div className="text-sm text-gray-600">Internal advocate</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-teal-500 h-2 rounded-full" style={{width: '92%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">92%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">C</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Competition</div>
                    <div className="text-sm text-gray-600">Competitive position</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-pink-500 h-2 rounded-full" style={{width: '78%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">78%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800">
                Recommendation: High-probability deal. Focus on improving Paper Process and Competition analysis.
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-white p-6 rounded-lg shadow border h-32 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500">Widget type: {widget.type}</p>
              <p className="text-sm text-gray-400">Implementation pending</p>
            </div>
          </div>
        )
    }
  }

  useEffect(() => {
    loadDashboardLayout()
  }, [loadDashboardLayout])

  if (dashboard.isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {userRole.replace('_', ' ').toUpperCase()} Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                {permissions.canViewTeamData ? 'Team & Regional View' : 'Personal View'}
              </p>
              {dashboard.organizationId && (
                <p className="text-sm text-gray-500">Organization: {organizationName || dashboard.organizationId}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative z-50">
                <RoleSelector 
                  currentRole={userRole} 
                  onRoleChange={setUserRole} 
                />
              </div>
              
              {/* Dashboard Controls */}
              <div className="relative">
                <DashboardControls />
              </div>
              
              {permissions.canCustomizeDashboard && (
                <button
                  onClick={() => {
                    // When toggling off edit mode, persist the current layout
                    if (isEditMode) {
                      try {
                        // Save current widgets layout via API; failures are silently ignored
                        // (builder has local fallback, and API layer already handles auth/RLS)
                        void saveDashboardLayout(widgets)
                      } catch (_e) {
                        // no-op
                      }
                    }
                    setIsEditMode(!isEditMode)
                  }}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                    isEditMode 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                      : 'bg-white/80 text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  {isEditMode ? 'Save Layout' : 'Customize'}
                </button>
              )}
              <button
                onClick={() => supabase.auth.signOut()}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-6 rounded-xl hover:from-red-600 hover:to-pink-600 shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Widget Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 auto-rows-min">
            {getRoleSpecificWidgets().map((widget) => (
              <div
                key={widget.id}
                className={`${widget.position.w === 12 ? 'col-span-1 lg:col-span-12' : `col-span-1 lg:col-span-${widget.position.w}`} bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]`}
                style={{
                  gridRow: `span ${widget.position.h}`,
                  minHeight: `${widget.position.h * 120}px`
                }}
              >
                {/* Widget Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {widget.title}
                  </h3>
                  {isEditMode && (
                    <button
                      onClick={() => removeWidget(widget.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Widget Content */}
                <div className="h-full">
                  {renderWidget(widget)}
                </div>
              </div>
            ))}
          </div>

          {/* Add Widget Panel */}
          {isEditMode && (
            <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Widget</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(WIDGET_TEMPLATES).map(([type, template]) => (
                  <button
                    key={type}
                    onClick={() => addWidget(type as WidgetType)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="text-2xl mb-2">{template.icon}</div>
                    <div className="font-medium text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-500">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drill-down Modal */}
      {drillDown.isOpen && drillDown.kpiData && drillDown.kpiId && drillDown.organizationId && (
        <DrillDownModal
          isOpen={drillDown.isOpen}
          onClose={drillDown.closeDrillDown}
          kpiData={drillDown.kpiData}
          kpiId={drillDown.kpiId}
          organizationId={drillDown.organizationId}
          productId={drillDown.productId}
          territoryId={drillDown.territoryId}
        />
      )}
    </div>
  )
}

// Main component with provider wrapper
export default function EnhancedRoleBasedDashboard(props: EnhancedRoleBasedDashboardProps) {
  return (
    <DashboardProvider 
      initialSettings={{
        autoRefresh: true,
        refreshInterval: 15,
        defaultPeriodDays: 30
      }}
    >
      <DashboardContent {...props} />
    </DashboardProvider>
  );
}
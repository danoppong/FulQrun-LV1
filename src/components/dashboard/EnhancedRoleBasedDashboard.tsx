// src/components/dashboard/EnhancedRoleBasedDashboard.tsx
// Enhanced Role-Based Dashboard with KPI Integration
// Uses DashboardContext for real-time KPI calculations

'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { UserRole, getUserPermissions } from '@/lib/roles'
import { DashboardWidget, WidgetType, DEFAULT_WIDGETS, WIDGET_TEMPLATES } from '@/lib/dashboard-widgets'
import { PharmaKPICardData, TerritoryPerformanceData, ProductPerformanceData, SampleDistributionData, FormularyAccessData } from '@/lib/types/dashboard'
import { supabase } from '@/lib/supabase'
import RoleSelector from '@/components/RoleSelector';
import { useDashboard, DashboardProvider } from '@/components/dashboard/DashboardContext';
import { PHARMACEUTICAL_DASHBOARD_CONFIGS } from '@/lib/pharmaceutical-dashboard-config';

// Import pharmaceutical widget components
import { PharmaKPICardWidget } from '@/components/dashboard/widgets/PharmaKPICardWidget'
import { TerritoryPerformanceWidget } from '@/components/dashboard/widgets/TerritoryPerformanceWidget'
import { ProductPerformanceWidget } from '@/components/dashboard/widgets/ProductPerformanceWidget'
import { SampleDistributionWidget } from '@/components/dashboard/widgets/SampleDistributionWidget'
import { FormularyAccessWidget } from '@/components/dashboard/widgets/FormularyAccessWidget';
import { RefreshCw, Settings, Eye, EyeOff } from 'lucide-react';

interface EnhancedRoleBasedDashboardProps {
  userRole: UserRole
  userId: string
}

// Dashboard Controls Component
function DashboardControls() {
  const dashboard = useDashboard();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex items-center space-x-2">
      {/* Live Data Indicator */}
      {dashboard.autoRefresh && (
        <div className="flex items-center text-sm text-green-600">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
          <span>Live</span>
        </div>
      )}

      {/* Refresh All Button */}
      <button
        onClick={() => dashboard.refreshAllKPIs()}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Refresh all KPIs"
      >
        <RefreshCw className="h-4 w-4 text-gray-600" />
      </button>

      {/* Settings Toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Dashboard settings"
      >
        <Settings className="h-4 w-4 text-gray-600" />
      </button>

      {/* Auto-refresh Toggle */}
      <button
        onClick={() => dashboard.updateSettings({ autoRefresh: !dashboard.autoRefresh })}
        className={`p-2 rounded-lg transition-colors ${
          dashboard.autoRefresh 
            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
            : 'hover:bg-gray-100 text-gray-600'
        }`}
        title={dashboard.autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
      >
        {dashboard.autoRefresh ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-64">
          <h3 className="font-medium text-gray-900 mb-3">Dashboard Settings</h3>
          
          <div className="space-y-3">
            {/* Auto-refresh setting */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Auto-refresh</label>
              <input
                type="checkbox"
                checked={dashboard.autoRefresh}
                onChange={(e) => dashboard.updateSettings({ autoRefresh: e.target.checked })}
                className="rounded border-gray-300"
              />
            </div>

            {/* Refresh interval */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Refresh interval (min)</label>
              <select
                value={dashboard.refreshInterval}
                onChange={(e) => dashboard.updateSettings({ refreshInterval: Number(e.target.value) })}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={5}>5 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
              </select>
            </div>

            {/* Default period */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Default period (days)</label>
              <select
                value={dashboard.defaultPeriodDays}
                onChange={(e) => dashboard.updateSettings({ defaultPeriodDays: Number(e.target.value) })}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>

            {/* Clear cache button */}
            <button
              onClick={() => {
                dashboard.clearKPICache();
                setShowSettings(false);
              }}
              className="w-full text-sm bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100"
            >
              Clear Cache
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Internal Dashboard Component (uses context)
function DashboardContent({ userRole: initialUserRole, userId }: EnhancedRoleBasedDashboardProps) {
  const dashboard = useDashboard();
  const [userRole, setUserRole] = useState<UserRole>(initialUserRole || UserRole.SALESMAN)
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS)
  const [isEditMode, setIsEditMode] = useState(false)

  // Debug logging
  console.log('DashboardContent - Initial user role:', initialUserRole, 'Current user role:', userRole);

  // Ensure we always have valid permissions
  const permissions = getUserPermissions(userRole) || {
    canViewOwnData: true,
    canViewTeamData: false,
    canViewRegionalData: false,
    canViewGlobalData: false,
    canManageUsers: false,
    canCustomizeDashboard: false,
    canExportData: false
  };

  // Debug logging for permissions
  console.log('DashboardContent - Permissions:', permissions);

  // Load role-specific pharmaceutical dashboard configuration
  useEffect(() => {
    const roleConfig = PHARMACEUTICAL_DASHBOARD_CONFIGS[userRole];
    if (roleConfig) {
      setWidgets(roleConfig.widgets);
    }
  }, [userRole]);

  const loadDashboardLayout = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_dashboard_layouts')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (data && !error) {
        setWidgets((data as { widgets?: DashboardWidget[] }).widgets || DEFAULT_WIDGETS)
      } else if (error) {
        // Handle various error codes gracefully
        if (error.code === 'PGRST116') {
          console.info('No saved dashboard layout found, using defaults');
        } else if (error.code === '406' || error.message.includes('406')) {
          console.info('Dashboard layout access restricted by RLS, using defaults');
        } else {
          console.warn('Dashboard layout loading error:', error);
        }
        // Use defaults for any error
        setWidgets(DEFAULT_WIDGETS);
      }
    } catch (error) {
      console.warn('Dashboard layout loading error:', error);
      setWidgets(DEFAULT_WIDGETS);
    }
  }, [userId]);

  const saveDashboardLayout = useCallback(async (newWidgets: DashboardWidget[]) => {
    // TODO: Fix database table schema for user_dashboard_layouts
    console.log('Would save dashboard layout:', newWidgets);
    // Temporarily disabled due to schema issues
    /*
    try {
      const { error } = await supabase
        .from('user_dashboard_layouts')
        .upsert({
          user_id: userId,
          widgets: newWidgets
        } as { user_id: string; widgets: DashboardWidget[] })

      if (error) {
        console.warn('Dashboard layout saving error:', error)
      }
    } catch (error) {
      console.warn('Dashboard layout saving error:', error)
    }
    */
  }, []);

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
        h: template.defaultSize.h
      }
    }
    const newWidgets = [...widgets, newWidget]
    setWidgets(newWidgets)
    saveDashboardLayout(newWidgets)
  }

  const removeWidget = (widgetId: string) => {
    const newWidgets = widgets.filter(widget => widget.id !== widgetId)
    setWidgets(newWidgets)
    saveDashboardLayout(newWidgets)
  }

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
          return true // All widgets available
        default:
          return true
      }
    })
  }

  const renderWidget = (widget: DashboardWidget) => {
    const sharedProps = {
      organizationId: dashboard.organizationId || undefined,
      autoRefresh: dashboard.autoRefresh,
      refreshInterval: dashboard.refreshInterval
    };

    switch (widget.type) {
      case WidgetType.PHARMA_KPI_CARD:
        return (
          <PharmaKPICardWidget 
            widget={widget} 
            data={widget.data as PharmaKPICardData}
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
      
      default:
        return <div>Unknown widget type</div>
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
      <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50">
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
                <p className="text-sm text-gray-500">Organization: {dashboard.organizationId}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <RoleSelector 
                currentRole={userRole} 
                onRoleChange={setUserRole} 
              />
              
              {/* Dashboard Controls */}
              <div className="relative">
                <DashboardControls />
              </div>
              
              {permissions.canCustomizeDashboard && (
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6 auto-rows-min">
            {getRoleSpecificWidgets().map((widget) => (
              <div
                key={widget.id}
                className={`col-span-1 sm:col-span-2 lg:col-span-${widget.position.w} bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]`}
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
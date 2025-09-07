'use client'
import { useState, useEffect } from 'react'
import { UserRole, getUserPermissions, canUserAccessLevel } from '@/lib/roles'
import { DashboardWidget, WidgetType, DEFAULT_WIDGETS, WIDGET_TEMPLATES } from '@/lib/dashboard-widgets'
import { createClientComponentClient } from '@/lib/auth'
import RoleSelector from '@/components/RoleSelector'

interface RoleBasedDashboardProps {
  userRole: UserRole
  userId: string
}

const RoleBasedDashboard = ({ userRole: initialUserRole, userId }: RoleBasedDashboardProps) => {
  const [userRole, setUserRole] = useState<UserRole>(initialUserRole)
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS)
  const [isEditMode, setIsEditMode] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const permissions = getUserPermissions(userRole)

  useEffect(() => {
    // Load user's custom dashboard layout
    loadDashboardLayout()
  }, [userId])

  const loadDashboardLayout = async () => {
    try {
      const { data, error } = await supabase
        .from('user_dashboard_layouts')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (data && !error) {
        setWidgets(data.widgets || DEFAULT_WIDGETS)
      }
    } catch (error) {
      // Handle dashboard layout loading error
    }
  }

  const saveDashboardLayout = async (newWidgets: DashboardWidget[]) => {
    try {
      const { error } = await supabase
        .from('user_dashboard_layouts')
        .upsert({
          user_id: userId,
          widgets: newWidgets,
          updated_at: new Date().toISOString()
        })

      if (error) {
        // Handle dashboard layout saving error
      }
    } catch (error) {
      // Handle dashboard layout saving error
    }
  }

  const handleWidgetMove = (widgetId: string, newPosition: { x: number; y: number }) => {
    const newWidgets = widgets.map(widget =>
      widget.id === widgetId ? { ...widget, position: { ...widget.position, ...newPosition } } : widget
    )
    setWidgets(newWidgets)
    saveDashboardLayout(newWidgets)
  }

  const handleWidgetResize = (widgetId: string, newSize: { w: number; h: number }) => {
    const newWidgets = widgets.map(widget =>
      widget.id === widgetId ? { ...widget, position: { ...widget.position, ...newSize } } : widget
    )
    setWidgets(newWidgets)
    saveDashboardLayout(newWidgets)
  }

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
    // Filter widgets based on user role and permissions
    return widgets.filter(widget => {
      switch (userRole) {
        case UserRole.SALESMAN:
          return ['kpi_card', 'sales_chart', 'quota_tracker', 'recent_activity'].includes(widget.type)
        case UserRole.SALES_MANAGER:
          return ['kpi_card', 'sales_chart', 'team_performance', 'pipeline_overview', 'recent_activity'].includes(widget.type)
        case UserRole.REGIONAL_SALES_DIRECTOR:
          return ['kpi_card', 'sales_chart', 'team_performance', 'pipeline_overview', 'regional_map', 'conversion_funnel'].includes(widget.type)
        case UserRole.GLOBAL_SALES_LEAD:
        case UserRole.BUSINESS_UNIT_HEAD:
          return true // All widgets available
        default:
          return true
      }
    })
  }

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case WidgetType.KPI_CARD:
        return <KPICardWidget widget={widget} />
      case WidgetType.SALES_CHART:
        return <SalesChartWidget widget={widget} />
      case WidgetType.TEAM_PERFORMANCE:
        return <TeamPerformanceWidget widget={widget} />
      case WidgetType.PIPELINE_OVERVIEW:
        return <PipelineOverviewWidget widget={widget} />
      case WidgetType.RECENT_ACTIVITY:
        return <RecentActivityWidget widget={widget} />
      case WidgetType.MEDDPICC_SCORING:
        return <MEDDPICCScoringWidget widget={widget} />
      default:
        return <div>Unknown widget type</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {userRole.replace('_', ' ').toUpperCase()} Dashboard
              </h1>
              <p className="text-gray-600">
                {permissions.canViewTeamData ? 'Team & Regional View' : 'Personal View'}
              </p>
            </div>
            <div className="flex space-x-4">
              <RoleSelector 
                currentRole={userRole} 
                onRoleChange={setUserRole} 
              />
              {permissions.canCustomizeDashboard && (
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-4 py-2 rounded-md ${
                    isEditMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {isEditMode ? 'Save Layout' : 'Customize'}
                </button>
              )}
              <button
                onClick={() => supabase.auth.signOut()}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Widget Grid */}
          <div className="grid grid-cols-12 gap-4 auto-rows-min">
            {getRoleSpecificWidgets().map((widget) => (
              <div
                key={widget.id}
                className={`${
                  widget.position.w === 3 ? 'col-span-3' :
                  widget.position.w === 4 ? 'col-span-4' :
                  widget.position.w === 6 ? 'col-span-6' :
                  widget.position.w === 9 ? 'col-span-9' :
                  widget.position.w === 12 ? 'col-span-12' : 'col-span-3'
                } ${
                  widget.position.h === 2 ? 'row-span-2' :
                  widget.position.h === 3 ? 'row-span-3' :
                  widget.position.h === 4 ? 'row-span-4' : 'row-span-2'
                } ${
                  isEditMode ? 'cursor-move' : ''
                }`}
                draggable={isEditMode}
                onDragStart={() => setDraggedWidget(widget.id)}
                onDragEnd={() => setDraggedWidget(null)}
              >
                <div className="bg-white rounded-lg shadow p-4 h-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{widget.title}</h3>
                    {isEditMode && (
                      <button
                        onClick={() => removeWidget(widget.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {renderWidget(widget)}
                </div>
              </div>
            ))}
          </div>

          {/* Add Widget Panel */}
          {isEditMode && (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Widgets</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(WIDGET_TEMPLATES).map(([type, template]) => (
                  <button
                    key={type}
                    onClick={() => addWidget(type as WidgetType)}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all"
                  >
                    <span className="text-2xl mb-2">{template.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{template.name}</span>
                    <span className="text-xs text-gray-500 text-center">{template.description}</span>
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

// Widget Components
const KPICardWidget = ({ widget }: { widget: DashboardWidget }) => (
  <div className="text-center">
    <div className="text-3xl font-bold text-gray-900">{widget.data?.value}</div>
    <div className={`text-sm ${widget.data?.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
      {widget.data?.change}
    </div>
  </div>
)

const SalesChartWidget = ({ widget }: { widget: DashboardWidget }) => (
  <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
    <div className="text-center">
      <div className="text-4xl mb-2">📈</div>
      <div className="text-gray-600">Sales Chart</div>
      <div className="text-sm text-gray-500">Interactive chart would go here</div>
    </div>
  </div>
)

const TeamPerformanceWidget = ({ widget }: { widget: DashboardWidget }) => (
  <div className="space-y-3">
    {widget.data?.teamMembers?.map((member: any, index: number) => (
      <div key={index} className="flex items-center justify-between">
        <div>
          <div className="font-medium text-gray-900">{member.name}</div>
          <div className="text-sm text-gray-500">${member.achieved.toLocaleString()} / ${member.quota.toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">{member.percentage}%</div>
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full" 
              style={{ width: `${member.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    ))}
  </div>
)

const PipelineOverviewWidget = ({ widget }: { widget: DashboardWidget }) => (
  <div className="space-y-3">
    {widget.data?.stages?.map((stage: any, index: number) => (
      <div key={index} className="flex items-center justify-between">
        <div className="font-medium text-gray-900">{stage.name}</div>
        <div className="text-right">
          <div className="text-sm text-gray-500">{stage.count} deals</div>
          <div className="font-medium text-gray-900">${stage.value.toLocaleString()}</div>
        </div>
      </div>
    ))}
  </div>
)

const RecentActivityWidget = ({ widget }: { widget: DashboardWidget }) => (
  <div className="space-y-2">
    {widget.data?.activities?.map((activity: any, index: number) => (
      <div key={index} className="flex items-start space-x-3">
        <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
        <div className="flex-1">
          <div className="text-sm text-gray-900">{activity.message}</div>
          <div className="text-xs text-gray-500">{activity.time}</div>
        </div>
      </div>
    ))}
  </div>
)

const MEDDPICCScoringWidget = ({ widget }: { widget: DashboardWidget }) => (
  <div className="space-y-3">
    {widget.data?.opportunities?.map((opp: any, index: number) => (
      <div key={index} className="flex items-center justify-between">
        <div className="font-medium text-gray-900">{opp.name}</div>
        <div className="text-right">
          <div className={`text-sm font-medium ${
            opp.status === 'High' ? 'text-green-600' : 
            opp.status === 'Medium' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {opp.score} - {opp.status}
          </div>
        </div>
      </div>
    ))}
  </div>
)

export default RoleBasedDashboard

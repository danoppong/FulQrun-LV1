// Administration Module - Dashboard
// Main dashboard for the admin console with system health indicators

'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UsersIcon, 
  CogIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ServerIcon,
  CircleStackIcon,
  CloudIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { ConfigurationService } from '@/lib/admin/services/ConfigurationService';
import { getSupabaseClient } from '@/lib/supabase-client';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  lastChecked: Date;
}

interface SystemMetrics {
  activeUsers: number;
  totalUsers: number;
  databaseConnections: number;
  apiResponseTime: number;
  storageUsed: number;
  storageLimit: number;
  integrationsActive: number;
  integrationsTotal: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  user: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

// =============================================================================
// SYSTEM HEALTH CARD COMPONENT
// =============================================================================

function SystemHealthCard({ health }: { health: SystemHealth }) {
  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
          <p className="text-sm text-gray-500 mt-1">{health.message}</p>
        </div>
        <div className={`p-3 rounded-full ${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Last checked: {health.lastChecked.toLocaleTimeString()}
      </div>
    </div>
  );
}

// =============================================================================
// METRICS CARD COMPONENT
// =============================================================================

function MetricsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'blue',
  trend 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}) {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'text-green-600 bg-green-100';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-100';
      case 'red':
        return 'text-red-600 bg-red-100';
      case 'purple':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`text-sm mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}% from last month
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${getColorClasses()}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// RECENT ACTIVITY COMPONENT
// =============================================================================

function RecentActivityCard({ activities }: { activities: RecentActivity[] }) {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div key={activity.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.description}
                </p>
                <p className="text-sm text-gray-500">
                  {activity.user} • {activity.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <div className={`px-2 py-1 text-xs rounded-full ${getRiskColor(activity.riskLevel)}`}>
                {activity.riskLevel}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// ALERTS COMPONENT
// =============================================================================

function AlertsCard({ alerts }: { alerts: Alert[] }) {
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'success':
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5" />;
      default:
        return <BellIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">System Alerts</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {alerts.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No active alerts</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="px-6 py-4">
              <div className="flex items-start">
                <div className={`p-2 rounded-full ${getAlertColor(alert.type)}`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {alert.title}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {alert.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// =============================================================================
// QUICK ACTIONS COMPONENT
// =============================================================================

function QuickActionsCard() {
  const quickActions = [
    {
      name: 'Add User',
      href: '/admin/users/new',
      icon: UsersIcon,
      color: 'blue'
    },
    {
      name: 'Configure Module',
      href: '/admin/modules',
      icon: CogIcon,
      color: 'green'
    },
    {
      name: 'View Audit Logs',
      href: '/admin/security/audit-logs',
      icon: ShieldCheckIcon,
      color: 'purple'
    },
    {
      name: 'System Settings',
      href: '/admin/system/configuration',
      icon: ServerIcon,
      color: 'yellow'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className={`p-2 rounded-full text-${action.color}-600 bg-${action.color}-100`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                {action.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

export default function AdminDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    message: 'All systems operational',
    lastChecked: new Date()
  });

  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeUsers: 0,
    totalUsers: 0,
    databaseConnections: 0,
    apiResponseTime: 0,
    storageUsed: 0,
    storageLimit: 0,
    integrationsActive: 0,
    integrationsTotal: 0
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Set up periodic refresh
    const interval = setInterval(loadDashboardData, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load system metrics
      await loadSystemMetrics();
      
      // Load recent activities
      await loadRecentActivities();
      
      // Load alerts
      await loadAlerts();
      
      // Check system health
      await checkSystemHealth();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      // Get user counts
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get active users (logged in within last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login_at', yesterday.toISOString());

      // Get integration counts
      const { count: integrationsTotal } = await supabase
        .from('integration_connections')
        .select('*', { count: 'exact', head: true });

      const { count: integrationsActive } = await supabase
        .from('integration_connections')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setMetrics(prev => ({
        ...prev,
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        integrationsTotal: integrationsTotal || 0,
        integrationsActive: integrationsActive || 0,
        databaseConnections: Math.floor(Math.random() * 50) + 10, // Mock data
        apiResponseTime: Math.floor(Math.random() * 100) + 50, // Mock data
        storageUsed: Math.floor(Math.random() * 100) + 50, // Mock data
        storageLimit: 1000 // Mock data
      }));
    } catch (error) {
      console.error('Error loading system metrics:', error);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_action_logs')
        .select(`
          *,
          users!admin_action_logs_admin_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        // If table doesn't exist, show mock data
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          console.warn('Admin action logs table not found, using mock data');
          const mockActivities: RecentActivity[] = [
            {
              id: '1',
              type: 'config_change',
              description: 'System configuration updated',
              timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
              user: 'Admin User',
              riskLevel: 'low'
            },
            {
              id: '2',
              type: 'user_create',
              description: 'New user account created',
              timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
              user: 'Admin User',
              riskLevel: 'medium'
            },
            {
              id: '3',
              type: 'module_enable',
              description: 'CRM module enabled',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
              user: 'System',
              riskLevel: 'low'
            }
          ];
          setRecentActivities(mockActivities);
          return;
        }
        throw error;
      }

      const activities: RecentActivity[] = data.map(item => ({
        id: item.id,
        type: item.action_type,
        description: item.action_description,
        timestamp: new Date(item.created_at),
        user: item.users?.full_name || 'System',
        riskLevel: item.risk_level
      }));

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error loading recent activities:', error);
      // Set empty array on error to prevent UI issues
      setRecentActivities([]);
    }
  };

  const loadAlerts = async () => {
    // Mock alerts for now - in real implementation, this would come from a monitoring system
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'info',
        title: 'System Update Available',
        message: 'A new version of FulQrun is available for installation.',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        acknowledged: false
      }
    ];

    setAlerts(mockAlerts);
  };

  const checkSystemHealth = async () => {
    try {
      // Check database connectivity
      const { error: dbError } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);

      if (dbError) {
        setSystemHealth({
          status: 'critical',
          message: 'Database connectivity issues detected',
          lastChecked: new Date()
        });
        return;
      }

      // Check API response time
      const startTime = Date.now();
      await supabase.from('users').select('id').limit(1);
      const responseTime = Date.now() - startTime;

      if (responseTime > 1000) {
        setSystemHealth({
          status: 'warning',
          message: 'Slow API response times detected',
          lastChecked: new Date()
        });
      } else {
        setSystemHealth({
          status: 'healthy',
          message: 'All systems operational',
          lastChecked: new Date()
        });
      }
    } catch (error) {
      setSystemHealth({
        status: 'critical',
        message: 'System health check failed',
        lastChecked: new Date()
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor system health and manage your FulQrun instance
        </p>
      </div>

      {/* System Health */}
      <SystemHealthCard health={systemHealth} />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Active Users"
          value={metrics.activeUsers}
          subtitle={`of ${metrics.totalUsers} total users`}
          icon={UsersIcon}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <MetricsCard
          title="API Response Time"
          value={`${metrics.apiResponseTime}ms`}
          subtitle="Average response time"
          icon={ChartBarIcon}
          color="green"
          trend={{ value: -5, isPositive: true }}
        />
        <MetricsCard
          title="Storage Used"
          value={`${metrics.storageUsed}GB`}
          subtitle={`of ${metrics.storageLimit}GB limit`}
          icon={CircleStackIcon}
          color="purple"
          trend={{ value: 8, isPositive: false }}
        />
        <MetricsCard
          title="Active Integrations"
          value={metrics.integrationsActive}
          subtitle={`of ${metrics.integrationsTotal} total`}
          icon={CloudIcon}
          color="yellow"
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivityCard activities={recentActivities} />
        </div>

        {/* Alerts */}
        <div>
          <AlertsCard alerts={alerts} />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActionsCard />
    </div>
  );
}

// src/components/dashboard/SmartAlertsManager.tsx
// Smart Alerts Management for Phase 2.7 Implementation
// Configurable pharmaceutical alerts with AI-powered triggers

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Bell, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit,
  AlertTriangle,
  CheckCircle,
  Mail,
  Smartphone,
  Monitor,
  TrendingDown,
  TrendingUp,
  Target,
  Calendar,
  BarChart3
} from 'lucide-react';
import { SmartAlert } from '@/lib/types/ai-insights';

interface SmartAlertsManagerProps {
  organizationId: string;
  userId: string;
  onAlertTriggered?: (alert: SmartAlert) => void;
}

interface AlertFormData {
  name: string;
  description: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'percentage_change';
  threshold: number;
  timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly';
  channels: ('dashboard' | 'email' | 'sms')[];
  recipients: string[];
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
}

const defaultAlertForm: AlertFormData = {
  name: '',
  description: '',
  metric: 'trx',
  condition: 'less_than',
  threshold: 0,
  timeframe: 'daily',
  channels: ['dashboard'],
  recipients: [],
  frequency: 'immediate'
};

const availableMetrics = [
  { value: 'trx', label: 'Total Prescriptions (TRx)', icon: '💊' },
  { value: 'nrx', label: 'New Prescriptions (NRx)', icon: '🆕' },
  { value: 'market_share', label: 'Market Share (%)', icon: '📊' },
  { value: 'calls', label: 'HCP Calls', icon: '📞' },
  { value: 'samples', label: 'Sample Distribution', icon: '📦' },
  { value: 'territory_performance', label: 'Territory Performance', icon: '🗺️' },
  { value: 'competition_share', label: 'Competition Share', icon: '⚔️' },
  { value: 'revenue', label: 'Revenue ($)', icon: '💰' }
];

const conditionLabels = {
  greater_than: 'Greater than',
  less_than: 'Less than',
  equals: 'Equals',
  percentage_change: 'Percentage change'
};

export function SmartAlertsManager({
  organizationId: _organizationId,
  userId,
  onAlertTriggered: _onAlertTriggered
}: SmartAlertsManagerProps) {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [_isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [_editingAlert, _setEditingAlert] = useState<SmartAlert | null>(null);
  const [alertForm, setAlertForm] = useState<AlertFormData>(defaultAlertForm);
  const [selectedView, setSelectedView] = useState<'active' | 'triggered' | 'history'>('active');

  // Load existing alerts
  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Mock alerts for demonstration
      const mockAlerts: SmartAlert[] = [
        {
          id: 'alert_001',
          name: 'TRx Decline Alert',
          description: 'Alert when total prescriptions drop below threshold',
          trigger: {
            metric: 'trx',
            condition: 'less_than',
            threshold: 1000,
            timeframe: 'daily'
          },
          filters: {
            territories: ['North', 'South'],
            products: ['Product-A']
          },
          notification: {
            channels: ['dashboard', 'email'],
            recipients: [userId],
            template: 'trx_decline_template',
            frequency: 'immediate'
          },
          actions: {
            suggested_actions: [
              {
                id: 'investigate_decline',
                type: 'navigate',
                label: 'Investigate Decline',
                target: { type: 'dashboard', value: '/analytics' }
              }
            ]
          },
          status: 'active',
          history: [
            {
              triggered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              value: 950,
              threshold: 1000,
              resolved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
              acknowledged_by: userId
            }
          ],
          metadata: {
            created_by: userId,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            priority: 1,
            tags: ['performance', 'trx']
          }
        },
        {
          id: 'alert_002',
          name: 'Market Share Growth',
          description: 'Alert when market share increases significantly',
          trigger: {
            metric: 'market_share',
            condition: 'greater_than',
            threshold: 20,
            timeframe: 'weekly'
          },
          filters: {
            territories: ['East'],
            products: ['Product-B']
          },
          notification: {
            channels: ['dashboard'],
            recipients: [userId],
            template: 'market_share_growth',
            frequency: 'daily'
          },
          actions: {
            suggested_actions: []
          },
          status: 'active',
          history: [],
          metadata: {
            created_by: userId,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            priority: 2,
            tags: ['opportunity', 'market_share']
          }
        }
      ];
      
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleCreateAlert = async () => {
    try {
      const newAlert: SmartAlert = {
        id: `alert_${Date.now()}`,
        name: alertForm.name,
        description: alertForm.description,
        trigger: {
          metric: alertForm.metric,
          condition: alertForm.condition,
          threshold: alertForm.threshold,
          timeframe: alertForm.timeframe
        },
        filters: {},
        notification: {
          channels: alertForm.channels,
          recipients: alertForm.recipients,
          template: `${alertForm.metric}_${alertForm.condition}_template`,
          frequency: alertForm.frequency
        },
        actions: {
          suggested_actions: []
        },
        status: 'active',
        history: [],
        metadata: {
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          priority: 1,
          tags: [alertForm.metric]
        }
      };

      setAlerts(prev => [...prev, newAlert]);
      setAlertForm(defaultAlertForm);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const handleToggleAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            status: alert.status === 'active' ? 'paused' : 'active',
            metadata: {
              ...alert.metadata,
              updated_at: new Date().toISOString()
            }
          }
        : alert
    ));
  };

  const handleDeleteAlert = async (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertIcon = (metric: string) => {
    const metricConfig = availableMetrics.find(m => m.value === metric);
    return metricConfig?.icon || '📊';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'paused':
        return <Badge className="bg-gray-100 text-gray-800">Paused</Badge>;
      case 'triggered':
        return <Badge className="bg-red-100 text-red-800">Triggered</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'greater_than':
        return <TrendingUp className="h-4 w-4" />;
      case 'less_than':
        return <TrendingDown className="h-4 w-4" />;
      case 'equals':
        return <Target className="h-4 w-4" />;
      case 'percentage_change':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const alertsByView = {
    active: alerts.filter(alert => alert.status === 'active'),
    triggered: alerts.filter(alert => 
      alert.history.some(h => h.triggered_at && !h.resolved_at)
    ),
    history: alerts.filter(alert => alert.history.length > 0)
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Smart Alerts</h1>
            <p className="text-gray-600">AI-powered pharmaceutical alerts and notifications</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Smart Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Alert Name</Label>
                  <Input
                    id="name"
                    value={alertForm.name}
                    onChange={(e) => setAlertForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., TRx Decline Alert"
                  />
                </div>
                <div>
                  <Label htmlFor="metric">Metric</Label>
                  <Select 
                    value={alertForm.metric} 
                    onValueChange={(value) => setAlertForm(prev => ({ ...prev, metric: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMetrics.map(metric => (
                        <SelectItem key={metric.value} value={metric.value}>
                          {metric.icon} {metric.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={alertForm.description}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe when this alert should trigger..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Select 
                    value={alertForm.condition} 
                    onValueChange={(value) => setAlertForm(prev => ({ ...prev, condition: value as AlertFormData['condition'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(conditionLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="threshold">Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={alertForm.threshold}
                    onChange={(e) => setAlertForm(prev => ({ ...prev, threshold: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select 
                    value={alertForm.timeframe} 
                    onValueChange={(value) => setAlertForm(prev => ({ ...prev, timeframe: value as AlertFormData['timeframe'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Notification Channels</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={alertForm.channels.includes('dashboard')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAlertForm(prev => ({ 
                            ...prev, 
                            channels: [...prev.channels, 'dashboard'] 
                          }));
                        } else {
                          setAlertForm(prev => ({ 
                            ...prev, 
                            channels: prev.channels.filter(c => c !== 'dashboard') 
                          }));
                        }
                      }}
                    />
                    <Monitor className="h-4 w-4" />
                    <span className="text-sm">Dashboard</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={alertForm.channels.includes('email')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAlertForm(prev => ({ 
                            ...prev, 
                            channels: [...prev.channels, 'email'] 
                          }));
                        } else {
                          setAlertForm(prev => ({ 
                            ...prev, 
                            channels: prev.channels.filter(c => c !== 'email') 
                          }));
                        }
                      }}
                    />
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Email</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={alertForm.channels.includes('sms')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAlertForm(prev => ({ 
                            ...prev, 
                            channels: [...prev.channels, 'sms'] 
                          }));
                        } else {
                          setAlertForm(prev => ({ 
                            ...prev, 
                            channels: prev.channels.filter(c => c !== 'sms') 
                          }));
                        }
                      }}
                    />
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm">SMS</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="frequency">Notification Frequency</Label>
                <Select 
                  value={alertForm.frequency} 
                  onValueChange={(value) => setAlertForm(prev => ({ ...prev, frequency: value as AlertFormData['frequency'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAlert} disabled={!alertForm.name || !alertForm.description}>
                  Create Alert
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold">{alertsByView.active.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Triggered</p>
                <p className="text-2xl font-bold">{alertsByView.triggered.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold">
                  {alerts.reduce((count, alert) => 
                    count + alert.history.filter(h => 
                      new Date(h.triggered_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length, 0
                  )}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as typeof selectedView)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active ({alertsByView.active.length})
          </TabsTrigger>
          <TabsTrigger value="triggered">
            Triggered ({alertsByView.triggered.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({alertsByView.history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {alertsByView.active.map((alert) => (
            <Card key={alert.id} className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getAlertIcon(alert.trigger.metric)}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{alert.name}</h3>
                      <p className="text-gray-600">{alert.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(alert.status)}
                    <Badge variant="outline" className="text-xs">
                      Priority {alert.metadata.priority}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-xs text-gray-500">Metric</span>
                    <div className="text-sm font-medium flex items-center space-x-1">
                      {getConditionIcon(alert.trigger.condition)}
                      <span>{alert.trigger.metric.toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Condition</span>
                    <div className="text-sm font-medium">
                      {conditionLabels[alert.trigger.condition]} {alert.trigger.threshold}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Timeframe</span>
                    <div className="text-sm font-medium">{alert.trigger.timeframe}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Channels</span>
                    <div className="flex items-center space-x-1">
                      {alert.notification.channels.map(channel => (
                        <span key={channel} className="text-xs">
                          {channel === 'dashboard' && <Monitor className="h-3 w-3" />}
                          {channel === 'email' && <Mail className="h-3 w-3" />}
                          {channel === 'sms' && <Smartphone className="h-3 w-3" />}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleAlert(alert.id)}
                  >
                    {alert.status === 'active' ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDeleteAlert(alert.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {alertsByView.active.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active alerts</h3>
                <p className="text-gray-600 mb-4">Create your first smart alert to get started.</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="triggered" className="space-y-4">
          {alertsByView.triggered.map((alert) => (
            <Card key={alert.id} className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <div>
                      <h3 className="font-semibold text-lg">{alert.name}</h3>
                      <p className="text-gray-600">{alert.description}</p>
                    </div>
                  </div>
                  <Badge className="bg-red-100 text-red-800">Triggered</Badge>
                </div>

                {alert.history.filter(h => h.triggered_at && !h.resolved_at).map((trigger, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Value: {trigger.value} (Threshold: {trigger.threshold})
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(trigger.triggered_at).toLocaleString()}
                        </p>
                      </div>
                      <Button size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Acknowledge
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          
          {alertsByView.triggered.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No triggered alerts</h3>
                <p className="text-gray-600">All alerts are within normal parameters.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {alertsByView.history.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{alert.name}</h3>
                  <Badge variant="outline">
                    {alert.history.length} trigger{alert.history.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {alert.history.slice(-5).map((trigger, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">
                          Value: {trigger.value} | Threshold: {trigger.threshold}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(trigger.triggered_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {trigger.triggered_at ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {trigger.acknowledged_by && (
                          <Badge className="text-xs bg-blue-100 text-blue-800">
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
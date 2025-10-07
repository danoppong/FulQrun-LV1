'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  Save,
  Trash2,
  Plus,
  Mail,
  MessageSquare,
  Smartphone
} from 'lucide-react';

interface AlertRule {
  id: string;
  kpi_name: string;
  display_name: string;
  condition: 'above' | 'below' | 'equals' | 'change_percentage';
  threshold_value: number;
  is_enabled: boolean;
  notification_channels: ('email' | 'sms' | 'in_app')[];
  recipients: string[];
  frequency: 'immediate' | 'daily' | 'weekly';
  created_at: string;
  last_triggered?: string;
}

interface AlertHistory {
  id: string;
  alert_rule_id: string;
  kpi_name: string;
  triggered_value: number;
  threshold_value: number;
  message: string;
  triggered_at: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

interface KPIAlertingProps {
  organizationId: string;
}

export function KPIAlerting({ organizationId }: KPIAlertingProps) {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  
  const [newRule, setNewRule] = useState({
    kpi_name: '',
    display_name: '',
    condition: 'below' as const,
    threshold_value: 0,
    is_enabled: true,
    notification_channels: ['email'] as ('email' | 'sms' | 'in_app')[],
    recipients: [] as string[],
    frequency: 'immediate' as const
  });

  const KPI_OPTIONS = [
    { value: 'win_rate', label: 'Win Rate' },
    { value: 'revenue_growth', label: 'Revenue Growth' },
    { value: 'avg_deal_size', label: 'Average Deal Size' },
    { value: 'sales_cycle_length', label: 'Sales Cycle Length' },
    { value: 'lead_conversion_rate', label: 'Lead Conversion Rate' },
    { value: 'cac', label: 'Customer Acquisition Cost' },
    { value: 'quota_attainment', label: 'Quota Attainment' },
    { value: 'clv', label: 'Customer Lifetime Value' },
    { value: 'pipeline_coverage', label: 'Pipeline Coverage' },
    { value: 'activities_per_rep', label: 'Activities per Rep' }
  ];

  useEffect(() => {
    fetchAlertRules();
    fetchAlertHistory();
  }, [organizationId]);

  const fetchAlertRules = async () => {
    try {
      const response = await fetch(`/api/kpis/alerts/rules?organizationId=${organizationId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch alert rules');
      }

      setAlertRules(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchAlertHistory = async () => {
    try {
      const response = await fetch(`/api/kpis/alerts/history?organizationId=${organizationId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch alert history');
      }

      setAlertHistory(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createAlertRule = async () => {
    try {
      const response = await fetch('/api/kpis/alerts/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          ...newRule
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create alert rule');
      }

      setShowCreateForm(false);
      setNewRule({
        kpi_name: '',
        display_name: '',
        condition: 'below',
        threshold_value: 0,
        is_enabled: true,
        notification_channels: ['email'],
        recipients: [],
        frequency: 'immediate'
      });
      await fetchAlertRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert rule');
    }
  };

  const updateAlertRule = async (ruleId: string, updates: Partial<AlertRule>) => {
    try {
      const response = await fetch(`/api/kpis/alerts/rules/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update alert rule');
      }

      setEditingRule(null);
      await fetchAlertRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alert rule');
    }
  };

  const deleteAlertRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/kpis/alerts/rules/${ruleId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete alert rule');
      }

      await fetchAlertRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete alert rule');
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/kpis/alerts/history/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acknowledged: true }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to acknowledge alert');
      }

      await fetchAlertHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge alert');
    }
  };

  const getSeverityColor = (kpiName: string, value: number, threshold: number, condition: string) => {
    const isAlert = condition === 'below' ? value < threshold : value > threshold;
    return isAlert ? 'text-red-600' : 'text-green-600';
  };

  const getSeverityIcon = (kpiName: string, value: number, threshold: number, condition: string) => {
    const isAlert = condition === 'below' ? value < threshold : value > threshold;
    return isAlert ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Alerting</h1>
          <p className="text-gray-600">Monitor performance thresholds and get notified of important changes</p>
        </div>
        
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Alert Rule
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="history">Alert History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Alert Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          {/* Create Alert Rule Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create Alert Rule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kpi_name">KPI</Label>
                    <Select value={newRule.kpi_name} onValueChange={(value) => setNewRule({ ...newRule, kpi_name: value, display_name: KPI_OPTIONS.find(opt => opt.value === value)?.label || '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select KPI" />
                      </SelectTrigger>
                      <SelectContent>
                        {KPI_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="condition">Condition</Label>
                    <Select value={newRule.condition} onValueChange={(value: any) => setNewRule({ ...newRule, condition: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="below">Below Threshold</SelectItem>
                        <SelectItem value="above">Above Threshold</SelectItem>
                        <SelectItem value="equals">Equals Threshold</SelectItem>
                        <SelectItem value="change_percentage">Change Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="threshold_value">Threshold Value</Label>
                    <Input
                      type="number"
                      value={newRule.threshold_value}
                      onChange={(e) => setNewRule({ ...newRule, threshold_value: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={newRule.frequency} onValueChange={(value: any) => setNewRule({ ...newRule, frequency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Notification Channels</Label>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newRule.notification_channels.includes('email')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewRule({ ...newRule, notification_channels: [...newRule.notification_channels, 'email'] });
                          } else {
                            setNewRule({ ...newRule, notification_channels: newRule.notification_channels.filter(c => c !== 'email') });
                          }
                        }}
                      />
                      <Label className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newRule.notification_channels.includes('sms')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewRule({ ...newRule, notification_channels: [...newRule.notification_channels, 'sms'] });
                          } else {
                            setNewRule({ ...newRule, notification_channels: newRule.notification_channels.filter(c => c !== 'sms') });
                          }
                        }}
                      />
                      <Label className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        SMS
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newRule.notification_channels.includes('in_app')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewRule({ ...newRule, notification_channels: [...newRule.notification_channels, 'in_app'] });
                          } else {
                            setNewRule({ ...newRule, notification_channels: newRule.notification_channels.filter(c => c !== 'in_app') });
                          }
                        }}
                      />
                      <Label className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        In-App
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={createAlertRule}>
                    <Save className="h-4 w-4 mr-2" />
                    Create Rule
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alert Rules List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alertRules.map((rule) => (
              <Card key={rule.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{rule.display_name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_enabled}
                        onCheckedChange={(checked) => updateAlertRule(rule.id, { is_enabled: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRule(rule.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAlertRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Condition</span>
                    <Badge variant="outline">
                      {rule.condition.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Threshold</span>
                    <span className="font-medium">{rule.threshold_value}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Frequency</span>
                    <Badge variant="secondary">
                      {rule.frequency}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Channels</span>
                    <div className="flex gap-1">
                      {rule.notification_channels.map((channel) => (
                        <Badge key={channel} variant="outline" className="text-xs">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {rule.last_triggered && (
                    <div className="text-xs text-gray-500">
                      Last triggered: {new Date(rule.last_triggered).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alert History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertHistory.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(alert.kpi_name, alert.triggered_value, alert.threshold_value, 'below')}
                      <div>
                        <h4 className="font-medium">{alert.kpi_name.replace('_', ' ').toUpperCase()}</h4>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(alert.triggered_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${getSeverityColor(alert.kpi_name, alert.triggered_value, alert.threshold_value, 'below')}`}>
                        {alert.triggered_value}
                      </span>
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {alert.acknowledged && (
                        <Badge variant="secondary">Acknowledged</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Notification Preferences</h4>
                <p className="text-sm text-blue-800">
                  Configure how you want to receive KPI alerts. You can choose from email, SMS, 
                  or in-app notifications. Each alert rule can have different notification preferences.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Alert Frequency</h4>
                <p className="text-sm text-green-800">
                  Set how often you want to receive alerts for each KPI. Immediate alerts are sent 
                  as soon as a threshold is breached, while daily/weekly alerts provide summaries.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Threshold Management</h4>
                <p className="text-sm text-yellow-800">
                  Regularly review and update your alert thresholds based on changing business 
                  conditions, seasonal patterns, and performance improvements.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

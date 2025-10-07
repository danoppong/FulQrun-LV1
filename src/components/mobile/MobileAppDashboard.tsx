'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ;
  DevicePhoneMobileIcon, 
  MicrophoneIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  WifiIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import * as MobileAppAPI from '@/lib/api/mobile-app';
import { MobileSession, DeviceInfo as _DeviceInfo, VoiceNote, MobileAnalytics } from '@/lib/mobile/mobile-app';

interface MobileAppDashboardProps {
  organizationId: string;
  userId?: string;
}

export default function MobileAppDashboard({ organizationId, userId }: MobileAppDashboardProps) {
  const [_sessions, _setSessions] = useState<MobileSession[]>([]);
  const [_voiceNotes, _setVoiceNotes] = useState<VoiceNote[]>([]);
  const [_analytics, setAnalytics] = useState<MobileAnalytics | null>(null);
  const [health, setHealth] = useState<{ deviceId: string; complianceStatus: string; lastChecked: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'sessions' | 'voice' | 'analytics' | 'health'>('sessions');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [healthData, analyticsData] = await Promise.all([
        MobileAppAPI.getMobileAppHealth(organizationId),
        MobileAppAPI.getMobileAnalytics(organizationId, userId)
      ]);
      
      setHealth(healthData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading mobile app data:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, userId]);

  const handleSync = async () => {
    try {
      setSyncStatus('syncing');
      await MobileAppAPI.syncOfflineData('current-session');
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
      loadData();
    } catch (_error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing': return <ArrowPathIcon className="h-4 w-4 animate-spin" />;
      case 'success': return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'error': return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
      default: return <ArrowPathIcon className="h-4 w-4" />;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mobile App Management</h1>
          <p className="text-gray-600">Manage mobile sessions, offline data, and voice features</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSync}
            disabled={syncStatus === 'syncing'}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {getSyncStatusIcon()}
            <span>Sync Data</span>
          </button>
          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Health Status */}
      {health && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">App Health Status</h2>
            <div className="flex items-center space-x-2">
              {getHealthStatusIcon(health.status)}
              <span className={`font-medium ${getHealthStatusColor(health.status)}`}>
                {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <DevicePhoneMobileIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Active Sessions</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{health.activeSessions}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700">Sync Errors</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{health.syncErrors}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <WifiIcon className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">Offline Sessions</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{health.offlineSessions}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Total Events</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{health.totalEvents}</p>
            </div>
          </div>

          {health.issues.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Issues</h3>
              <ul className="space-y-1">
                {health.issues.map((issue: string, index: number) => (
                  <li key={index} className="flex items-center space-x-2 text-sm text-red-600">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {health.recommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h3>
              <ul className="space-y-1">
                {health.recommendations.map((recommendation: string, index: number) => (
                  <li key={index} className="flex items-center space-x-2 text-sm text-blue-600">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'sessions', label: 'Sessions', icon: DevicePhoneMobileIcon },
              { id: 'voice', label: 'Voice Notes', icon: MicrophoneIcon },
              { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
              { id: 'health', label: 'Health', icon: ShieldCheckIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as string)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'sessions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Mobile Sessions</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">Session management features will be displayed here</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center space-x-3">
                      <DevicePhoneMobileIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">iPhone 15 Pro</p>
                        <p className="text-sm text-gray-500">iOS 17.0 • v1.2.3</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <WifiIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'voice' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Voice Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">Voice-to-text features will be displayed here</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center space-x-3">
                      <MicrophoneIcon className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Meeting Notes</p>
                        <p className="text-sm text-gray-500">2:34 • 95% confidence</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <PlayIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-600">Play</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'analytics' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Mobile Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <ChartBarIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">App Opens</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">1,234</p>
                  <p className="text-sm text-green-600">+12% from last week</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DevicePhoneMobileIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Active Users</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">456</p>
                  <p className="text-sm text-green-600">+8% from last week</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <ClockIcon className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Avg Session</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">4:32</p>
                  <p className="text-sm text-red-600">-2% from last week</p>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'health' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Device Health</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">Device compliance and security status</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center space-x-3">
                      <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Device Compliance</p>
                        <p className="text-sm text-gray-500">All policies enforced</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Compliant</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

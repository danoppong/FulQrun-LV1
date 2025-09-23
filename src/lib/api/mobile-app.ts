// Mobile App API Layer
// API functions for mobile app management and offline-first features

import { createClient } from '@supabase/supabase-js';
import { 
  MobileSession, 
  DeviceInfo, 
  OfflineData, 
  VoiceNote, 
  MobileAnalytics 
} from '@/lib/mobile/mobile-app';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Session Management
export async function createMobileSession(
  userId: string,
  deviceId: string,
  deviceType: 'ios' | 'android' | 'web',
  deviceInfo: DeviceInfo,
  appVersion: string,
  organizationId: string
): Promise<MobileSession> {
  try {
    return await MobileAppAPI.createMobileSession(
      userId,
      deviceId,
      deviceType,
      deviceInfo,
      appVersion,
      organizationId
    );
  } catch (error) {
    console.error('Error creating mobile session:', error);
    throw error;
  }
}

export async function getMobileSession(userId: string, deviceId: string): Promise<MobileSession | null> {
  try {
    return await MobileAppAPI.getMobileSession(userId, deviceId);
  } catch (error) {
    console.error('Error fetching mobile session:', error);
    throw error;
  }
}

export async function updateMobileSession(
  sessionId: string,
  updates: Partial<MobileSession>
): Promise<MobileSession> {
  try {
    const updateData: any = {};
    if (updates.deviceInfo) updateData.device_info = updates.deviceInfo;
    if (updates.appVersion) updateData.app_version = updates.appVersion;
    if (updates.offlineData) updateData.offline_data = updates.offlineData;
    if (updates.syncStatus) updateData.sync_status = updates.syncStatus;

    const { data, error } = await supabase
      .from('mobile_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      deviceId: data.device_id,
      deviceType: data.device_type,
      deviceInfo: data.device_info,
      appVersion: data.app_version,
      lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : undefined,
      offlineData: data.offline_data,
      syncStatus: data.sync_status,
      organizationId: data.organization_id,
      createdAt: new Date(data.created_at)
    };
  } catch (error) {
    console.error('Error updating mobile session:', error);
    throw error;
  }
}

export async function deleteMobileSession(sessionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('mobile_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting mobile session:', error);
    throw error;
  }
}

// Offline Data Management
export async function syncOfflineData(sessionId: string): Promise<any> {
  try {
    return await MobileAppAPI.syncOfflineData(sessionId);
  } catch (error) {
    console.error('Error syncing offline data:', error);
    throw error;
  }
}

export async function storeOfflineData(
  sessionId: string,
  entityType: string,
  data: any[]
): Promise<void> {
  try {
    await MobileAppAPI.storeOfflineData(sessionId, entityType, data);
  } catch (error) {
    console.error('Error storing offline data:', error);
    throw error;
  }
}

export async function getOfflineData(sessionId: string, entityType: string): Promise<any[]> {
  try {
    return await MobileAppAPI.getOfflineData(sessionId, entityType);
  } catch (error) {
    console.error('Error fetching offline data:', error);
    throw error;
  }
}

export async function addPendingChange(
  sessionId: string,
  entityType: string,
  entityId: string,
  operation: 'create' | 'update' | 'delete',
  data: any
): Promise<void> {
  try {
    const { data: session } = await supabase
      .from('mobile_sessions')
      .select('offline_data')
      .eq('id', sessionId)
      .single();

    if (!session) throw new Error('Session not found');

    const pendingChange = {
      id: crypto.randomUUID(),
      entityType,
      entityId,
      operation,
      data,
      timestamp: new Date(),
      retryCount: 0
    };

    const updatedOfflineData = {
      ...session.offline_data,
      pendingChanges: [...session.offline_data.pendingChanges, pendingChange]
    };

    await supabase
      .from('mobile_sessions')
      .update({ offline_data: updatedOfflineData })
      .eq('id', sessionId);
  } catch (error) {
    console.error('Error adding pending change:', error);
    throw error;
  }
}

export async function getPendingChanges(sessionId: string): Promise<any[]> {
  try {
    const { data: session } = await supabase
      .from('mobile_sessions')
      .select('offline_data')
      .eq('id', sessionId)
      .single();

    if (!session) throw new Error('Session not found');

    return session.offline_data.pendingChanges || [];
  } catch (error) {
    console.error('Error fetching pending changes:', error);
    throw error;
  }
}

// Voice-to-Text Features
export async function createVoiceNote(
  userId: string,
  entityType: string,
  entityId: string,
  audioFile: string,
  transcription: string,
  confidence: number,
  duration: number,
  language: string,
  organizationId: string
): Promise<VoiceNote> {
  try {
    return await MobileAppAPI.createVoiceNote(
      userId,
      entityType,
      entityId,
      audioFile,
      transcription,
      confidence,
      duration,
      language,
      organizationId
    );
  } catch (error) {
    console.error('Error creating voice note:', error);
    throw error;
  }
}

export async function getVoiceNotes(
  userId: string,
  entityType?: string,
  entityId?: string
): Promise<VoiceNote[]> {
  try {
    return await MobileAppAPI.getVoiceNotes(userId, entityType, entityId);
  } catch (error) {
    console.error('Error fetching voice notes:', error);
    throw error;
  }
}

export async function deleteVoiceNote(voiceNoteId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('voice_notes')
      .delete()
      .eq('id', voiceNoteId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting voice note:', error);
    throw error;
  }
}

// Mobile Analytics
export async function trackMobileEvent(
  userId: string,
  sessionId: string,
  eventType: string,
  eventData: any,
  deviceInfo: DeviceInfo,
  networkType: string,
  appVersion: string,
  organizationId: string
): Promise<void> {
  try {
    await MobileAppAPI.trackMobileEvent(
      userId,
      sessionId,
      eventType,
      eventData,
      deviceInfo,
      networkType,
      appVersion,
      organizationId
    );
  } catch (error) {
    console.error('Error tracking mobile event:', error);
    // Don't throw error for analytics failures
  }
}

export async function getMobileAnalytics(
  organizationId: string,
  userId?: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<MobileAnalytics[]> {
  try {
    return await MobileAppAPI.getMobileAnalytics(organizationId, userId, dateFrom, dateTo);
  } catch (error) {
    console.error('Error fetching mobile analytics:', error);
    throw error;
  }
}

export async function getMobileAnalyticsSummary(organizationId: string): Promise<any> {
  try {
    const { data: analytics } = await supabase
      .from('mobile_analytics')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    const summary = {
      totalEvents: analytics?.length || 0,
      uniqueUsers: new Set(analytics?.map(a => a.user_id)).size,
      uniqueSessions: new Set(analytics?.map(a => a.session_id)).size,
      deviceTypes: {} as Record<string, number>,
      eventTypes: {} as Record<string, number>,
      appVersions: {} as Record<string, number>,
      networkTypes: {} as Record<string, number>
    };

    analytics?.forEach(event => {
      // Device types
      const deviceType = event.device_info?.platform || 'unknown';
      summary.deviceTypes[deviceType] = (summary.deviceTypes[deviceType] || 0) + 1;

      // Event types
      summary.eventTypes[event.event_type] = (summary.eventTypes[event.event_type] || 0) + 1;

      // App versions
      summary.appVersions[event.app_version] = (summary.appVersions[event.app_version] || 0) + 1;

      // Network types
      summary.networkTypes[event.network_type] = (summary.networkTypes[event.network_type] || 0) + 1;
    });

    return summary;
  } catch (error) {
    console.error('Error getting mobile analytics summary:', error);
    throw error;
  }
}

// Push Notifications
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    await MobileAppAPI.sendPushNotification(userId, title, body, data);
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

export async function registerPushToken(
  userId: string,
  deviceId: string,
  pushToken: string,
  platform: 'ios' | 'android'
): Promise<void> {
  try {
    await MobileAppAPI.registerPushToken(userId, deviceId, pushToken, platform);
  } catch (error) {
    console.error('Error registering push token:', error);
    throw error;
  }
}

export async function getPushTokens(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching push tokens:', error);
    throw error;
  }
}

// Mobile App Configuration
export async function getMobileAppConfig(organizationId: string): Promise<any> {
  try {
    return await MobileAppAPI.getMobileAppConfig(organizationId);
  } catch (error) {
    console.error('Error fetching mobile app config:', error);
    throw error;
  }
}

export async function updateMobileAppConfig(
  organizationId: string,
  config: any
): Promise<void> {
  try {
    await MobileAppAPI.updateMobileAppConfig(organizationId, config);
  } catch (error) {
    console.error('Error updating mobile app config:', error);
    throw error;
  }
}

// Device Management
export async function getDeviceCompliance(
  organizationId: string,
  deviceId: string
): Promise<any> {
  try {
    return await MobileAppAPI.getDeviceCompliance(organizationId, deviceId);
  } catch (error) {
    console.error('Error fetching device compliance:', error);
    throw error;
  }
}

export async function enforceDevicePolicy(
  organizationId: string,
  deviceId: string,
  policy: any
): Promise<void> {
  try {
    await MobileAppAPI.enforceDevicePolicy(organizationId, deviceId, policy);
  } catch (error) {
    console.error('Error enforcing device policy:', error);
    throw error;
  }
}

export async function getDevicePolicies(organizationId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('device_policies')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching device policies:', error);
    throw error;
  }
}

// Conflict Resolution
export async function resolveDataConflict(
  sessionId: string,
  entityType: string,
  entityId: string,
  localData: any,
  serverData: any,
  resolutionStrategy: 'local_wins' | 'server_wins' | 'merge' | 'manual'
): Promise<any> {
  try {
    return await MobileAppAPI.resolveDataConflict(
      sessionId,
      entityType,
      entityId,
      localData,
      serverData,
      resolutionStrategy
    );
  } catch (error) {
    console.error('Error resolving data conflict:', error);
    throw error;
  }
}

export async function getDataConflicts(sessionId: string): Promise<any[]> {
  try {
    const { data: session } = await supabase
      .from('mobile_sessions')
      .select('offline_data')
      .eq('id', sessionId)
      .single();

    if (!session) throw new Error('Session not found');

    return session.offline_data.conflicts || [];
  } catch (error) {
    console.error('Error fetching data conflicts:', error);
    throw error;
  }
}

// Mobile App Health
export async function getMobileAppHealth(organizationId: string): Promise<any> {
  try {
    const { data: sessions } = await supabase
      .from('mobile_sessions')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    const { data: analytics } = await supabase
      .from('mobile_analytics')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const health = {
      status: 'healthy',
      activeSessions: sessions?.length || 0,
      syncErrors: sessions?.filter(s => s.sync_status === 'error').length || 0,
      offlineSessions: sessions?.filter(s => s.sync_status === 'offline').length || 0,
      totalEvents: analytics?.length || 0,
      crashReports: analytics?.filter(a => a.event_type === 'crash').length || 0,
      issues: [] as string[],
      recommendations: [] as string[]
    };

    // Check for issues
    if (health.syncErrors > 0) {
      health.issues.push(`${health.syncErrors} sessions have sync errors`);
    }

    if (health.offlineSessions > health.activeSessions * 0.5) {
      health.issues.push('More than 50% of sessions are offline');
    }

    if (health.crashReports > 0) {
      health.issues.push(`${health.crashReports} crash reports in the last 24 hours`);
    }

    // Determine overall health status
    if (health.issues.length > 0) {
      health.status = 'warning';
      if (health.issues.length > 3) {
        health.status = 'critical';
      }
    }

    // Generate recommendations
    if (health.syncErrors > 0) {
      health.recommendations.push('Investigate sync errors and improve offline data handling');
    }

    if (health.offlineSessions > health.activeSessions * 0.3) {
      health.recommendations.push('Improve network connectivity and sync reliability');
    }

    if (health.crashReports > 0) {
      health.recommendations.push('Review crash reports and fix stability issues');
    }

    return health;
  } catch (error) {
    console.error('Error getting mobile app health:', error);
    throw error;
  }
}


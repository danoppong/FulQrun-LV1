// Mobile App with Offline-First Architecture
// Native mobile apps (iOS/Android), offline-first architecture, voice-to-text logging, and enterprise mobile device management

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types for mobile app features
export interface MobileSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceType: 'ios' | 'android' | 'web';
  deviceInfo: DeviceInfo;
  appVersion: string;
  lastSyncAt?: Date;
  offlineData: OfflineData;
  syncStatus: 'synced' | 'pending' | 'error' | 'offline';
  organizationId: string;
  createdAt: Date;
}

export interface DeviceInfo {
  platform: string;
  version: string;
  model: string;
  manufacturer?: string;
  screenSize: string;
  orientation: 'portrait' | 'landscape';
  networkType: 'wifi' | 'cellular' | 'offline';
  batteryLevel?: number;
  storageAvailable?: number;
}

export interface OfflineData {
  entities: {
    contacts: any[];
    companies: any[];
    opportunities: any[];
    leads: any[];
    activities: any[];
  };
  lastSyncTimestamp: Date;
  pendingChanges: PendingChange[];
  syncQueue: SyncOperation[];
}

export interface PendingChange {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  retryCount: number;
}

export interface SyncOperation {
  id: string;
  type: 'upload' | 'download' | 'conflict_resolution';
  entityType: string;
  entityId: string;
  data: any;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface VoiceNote {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  audioFile: string;
  transcription: string;
  confidence: number;
  duration: number;
  language: string;
  createdAt: Date;
  organizationId: string;
}

export interface MobileAnalytics {
  id: string;
  userId: string;
  sessionId: string;
  eventType: string;
  eventData: any;
  timestamp: Date;
  deviceInfo: DeviceInfo;
  networkType: string;
  appVersion: string;
  organizationId: string;
}

// Mobile App API
export class MobileAppAPI {
  // Session Management
  static async createMobileSession(
    userId: string,
    deviceId: string,
    deviceType: 'ios' | 'android' | 'web',
    deviceInfo: DeviceInfo,
    appVersion: string,
    organizationId: string
  ): Promise<MobileSession> {
    try {
      const sessionId = crypto.randomUUID();
      
      const session: MobileSession = {
        id: sessionId,
        userId,
        deviceId,
        deviceType,
        deviceInfo,
        appVersion,
        offlineData: {
          entities: {
            contacts: [],
            companies: [],
            opportunities: [],
            leads: [],
            activities: []
          },
          lastSyncTimestamp: new Date(),
          pendingChanges: [],
          syncQueue: []
        },
        syncStatus: 'synced',
        organizationId,
        createdAt: new Date()
      };

      const { data, error } = await supabase
        .from('mobile_sessions')
        .insert({
          id: session.id,
          user_id: session.userId,
          device_id: session.deviceId,
          device_type: session.deviceType,
          device_info: session.deviceInfo,
          app_version: session.appVersion,
          offline_data: session.offlineData,
          sync_status: session.syncStatus,
          organization_id: session.organizationId
        })
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
      console.error('Error creating mobile session:', error);
      throw error;
    }
  }

  static async getMobileSession(userId: string, deviceId: string): Promise<MobileSession | null> {
    try {
      const { data, error } = await supabase
        .from('mobile_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }

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
      console.error('Error fetching mobile session:', error);
      throw error;
    }
  }

  // Offline Data Management
  static async syncOfflineData(sessionId: string): Promise<SyncResult> {
    try {
      const { data: session } = await supabase
        .from('mobile_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!session) throw new Error('Session not found');

      const result: SyncResult = {
        success: true,
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        errors: 0,
        operations: []
      };

      // Upload pending changes
      for (const change of session.offline_data.pendingChanges) {
        try {
          await this.uploadPendingChange(change);
          result.uploaded++;
          result.operations.push({
            type: 'upload',
            entityType: change.entityType,
            entityId: change.entityId,
            success: true
          });
        } catch (error) {
          result.errors++;
          result.operations.push({
            type: 'upload',
            entityType: change.entityType,
            entityId: change.entityId,
            success: false,
            error: error.message
          });
        }
      }

      // Download latest data
      const lastSync = session.offline_data.lastSyncTimestamp;
      const entities = ['contacts', 'companies', 'opportunities', 'leads', 'activities'];
      
      for (const entityType of entities) {
        try {
          const { data: entities } = await supabase
            .from(entityType)
            .select('*')
            .eq('organization_id', session.organization_id)
            .gte('updated_at', lastSync.toISOString());

          if (entities) {
            result.downloaded += entities.length;
            result.operations.push({
              type: 'download',
              entityType,
              entityId: 'batch',
              success: true,
              count: entities.length
            });
          }
        } catch (error) {
          result.errors++;
          result.operations.push({
            type: 'download',
            entityType,
            entityId: 'batch',
            success: false,
            error: error.message
          });
        }
      }

      // Update session with sync results
      await supabase
        .from('mobile_sessions')
        .update({
          last_sync_at: new Date().toISOString(),
          sync_status: result.errors > 0 ? 'error' : 'synced',
          offline_data: {
            ...session.offline_data,
            lastSyncTimestamp: new Date(),
            pendingChanges: [], // Clear uploaded changes
            syncQueue: [] // Clear processed queue
          }
        })
        .eq('id', sessionId);

      return result;
    } catch (error) {
      console.error('Error syncing offline data:', error);
      throw error;
    }
  }

  private static async uploadPendingChange(change: PendingChange): Promise<void> {
    switch (change.operation) {
      case 'create':
        const { error: createError } = await supabase
          .from(change.entityType)
          .insert(change.data);
        if (createError) throw createError;
        break;
      
      case 'update':
        const { error: updateError } = await supabase
          .from(change.entityType)
          .update(change.data)
          .eq('id', change.entityId);
        if (updateError) throw updateError;
        break;
      
      case 'delete':
        const { error: deleteError } = await supabase
          .from(change.entityType)
          .delete()
          .eq('id', change.entityId);
        if (deleteError) throw deleteError;
        break;
    }
  }

  // Voice-to-Text Features
  static async createVoiceNote(
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
      const voiceNoteId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('voice_notes')
        .insert({
          id: voiceNoteId,
          user_id: userId,
          entity_type: entityType,
          entity_id: entityId,
          audio_file: audioFile,
          transcription: transcription,
          confidence: confidence,
          duration: duration,
          language: language,
          organization_id: organizationId
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        entityType: data.entity_type,
        entityId: data.entity_id,
        audioFile: data.audio_file,
        transcription: data.transcription,
        confidence: data.confidence,
        duration: data.duration,
        language: data.language,
        createdAt: new Date(data.created_at),
        organizationId: data.organization_id
      };
    } catch (error) {
      console.error('Error creating voice note:', error);
      throw error;
    }
  }

  static async getVoiceNotes(
    userId: string,
    entityType?: string,
    entityId?: string
  ): Promise<VoiceNote[]> {
    try {
      let query = supabase
        .from('voice_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(note => ({
        id: note.id,
        userId: note.user_id,
        entityType: note.entity_type,
        entityId: note.entity_id,
        audioFile: note.audio_file,
        transcription: note.transcription,
        confidence: note.confidence,
        duration: note.duration,
        language: note.language,
        createdAt: new Date(note.created_at),
        organizationId: note.organization_id
      }));
    } catch (error) {
      console.error('Error fetching voice notes:', error);
      throw error;
    }
  }

  // Mobile Analytics
  static async trackMobileEvent(
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
      await supabase
        .from('mobile_analytics')
        .insert({
          user_id: userId,
          session_id: sessionId,
          event_type: eventType,
          event_data: eventData,
          device_info: deviceInfo,
          network_type: networkType,
          app_version: appVersion,
          organization_id: organizationId
        });
    } catch (error) {
      console.error('Error tracking mobile event:', error);
      // Don't throw error for analytics failures
    }
  }

  static async getMobileAnalytics(
    organizationId: string,
    userId?: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<MobileAnalytics[]> {
    try {
      let query = supabase
        .from('mobile_analytics')
        .select('*')
        .eq('organization_id', organizationId)
        .order('timestamp', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      if (dateFrom) {
        query = query.gte('timestamp', dateFrom.toISOString());
      }
      
      if (dateTo) {
        query = query.lte('timestamp', dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(analytics => ({
        id: analytics.id,
        userId: analytics.user_id,
        sessionId: analytics.session_id,
        eventType: analytics.event_type,
        eventData: analytics.event_data,
        timestamp: new Date(analytics.timestamp),
        deviceInfo: analytics.device_info,
        networkType: analytics.network_type,
        appVersion: analytics.app_version,
        organizationId: analytics.organization_id
      }));
    } catch (error) {
      console.error('Error fetching mobile analytics:', error);
      throw error;
    }
  }

  // Offline Storage Management
  static async storeOfflineData(
    sessionId: string,
    entityType: string,
    data: any[]
  ): Promise<void> {
    try {
      const { data: session } = await supabase
        .from('mobile_sessions')
        .select('offline_data')
        .eq('id', sessionId)
        .single();

      if (!session) throw new Error('Session not found');

      const updatedOfflineData = {
        ...session.offline_data,
        entities: {
          ...session.offline_data.entities,
          [entityType]: data
        }
      };

      await supabase
        .from('mobile_sessions')
        .update({ offline_data: updatedOfflineData })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error storing offline data:', error);
      throw error;
    }
  }

  static async getOfflineData(sessionId: string, entityType: string): Promise<any[]> {
    try {
      const { data: session } = await supabase
        .from('mobile_sessions')
        .select('offline_data')
        .eq('id', sessionId)
        .single();

      if (!session) throw new Error('Session not found');

      return session.offline_data.entities[entityType] || [];
    } catch (error) {
      console.error('Error fetching offline data:', error);
      throw error;
    }
  }

  // Conflict Resolution
  static async resolveDataConflict(
    sessionId: string,
    entityType: string,
    entityId: string,
    localData: any,
    serverData: any,
    resolutionStrategy: 'local_wins' | 'server_wins' | 'merge' | 'manual'
  ): Promise<any> {
    try {
      let resolvedData: any;

      switch (resolutionStrategy) {
        case 'local_wins':
          resolvedData = localData;
          break;
        case 'server_wins':
          resolvedData = serverData;
          break;
        case 'merge':
          resolvedData = this.mergeData(localData, serverData);
          break;
        case 'manual':
          // In a real implementation, this would prompt the user for manual resolution
          resolvedData = serverData; // Default to server for now
          break;
      }

      // Update the entity with resolved data
      const { error } = await supabase
        .from(entityType)
        .update(resolvedData)
        .eq('id', entityId);

      if (error) throw error;

      return resolvedData;
    } catch (error) {
      console.error('Error resolving data conflict:', error);
      throw error;
    }
  }

  private static mergeData(localData: any, serverData: any): any {
    // Simple merge strategy - in a real implementation, this would be more sophisticated
    return {
      ...serverData,
      ...localData,
      updated_at: new Date().toISOString(),
      conflict_resolved: true
    };
  }

  // Push Notifications
  static async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // In a real implementation, this would integrate with push notification services
      console.log('Sending push notification:', { userId, title, body, data });
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  static async registerPushToken(
    userId: string,
    deviceId: string,
    pushToken: string,
    platform: 'ios' | 'android'
  ): Promise<void> {
    try {
      await supabase
        .from('push_tokens')
        .upsert({
          user_id: userId,
          device_id: deviceId,
          push_token: pushToken,
          platform: platform,
          is_active: true,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  }

  // Mobile App Configuration
  static async getMobileAppConfig(organizationId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('mobile_app_config')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Return default config if none exists
          return {
            offlineModeEnabled: true,
            syncIntervalMinutes: 15,
            maxOfflineStorageMB: 100,
            voiceNotesEnabled: true,
            pushNotificationsEnabled: true,
            analyticsEnabled: true,
            crashReportingEnabled: true
          };
        }
        throw error;
      }

      return data.config;
    } catch (error) {
      console.error('Error fetching mobile app config:', error);
      throw error;
    }
  }

  static async updateMobileAppConfig(
    organizationId: string,
    config: any
  ): Promise<void> {
    try {
      await supabase
        .from('mobile_app_config')
        .upsert({
          organization_id: organizationId,
          config: config,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating mobile app config:', error);
      throw error;
    }
  }

  // Mobile Device Management (MDM)
  static async getDeviceCompliance(
    organizationId: string,
    deviceId: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('device_compliance')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('device_id', deviceId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            isCompliant: true,
            complianceScore: 100,
            issues: [],
            lastChecked: new Date()
          };
        }
        throw error;
      }

      return {
        isCompliant: data.is_compliant,
        complianceScore: data.compliance_score,
        issues: data.issues,
        lastChecked: new Date(data.last_checked)
      };
    } catch (error) {
      console.error('Error fetching device compliance:', error);
      throw error;
    }
  }

  static async enforceDevicePolicy(
    organizationId: string,
    deviceId: string,
    policy: any
  ): Promise<void> {
    try {
      // In a real implementation, this would enforce MDM policies
      console.log('Enforcing device policy:', { organizationId, deviceId, policy });
    } catch (error) {
      console.error('Error enforcing device policy:', error);
      throw error;
    }
  }
}

// Types for sync results
interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  conflicts: number;
  errors: number;
  operations: SyncOperation[];
}

interface SyncOperation {
  type: 'upload' | 'download';
  entityType: string;
  entityId: string;
  success: boolean;
  error?: string;
  count?: number;
}

export default MobileAppAPI;

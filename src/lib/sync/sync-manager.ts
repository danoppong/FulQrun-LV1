// src/lib/sync/sync-manager.ts
// Phase 2.8 Sync Manager
// Orchestrates real-time sync, offline actions, and conflict resolution

import { RealTimeSyncEngine } from './real-time-sync-engine';
import { OfflineManager } from '../offline/offline-manager';
import { ConflictResolver, type DataConflict, type MergeResult } from './conflict-resolver';
import { WebSocketHandler, type ConnectionState, type WebSocketMessage } from './websocket-handler';
import { AuthService } from '@/lib/auth-unified';

export interface SyncManagerConfig {
  enableRealTimeSync: boolean;
  enableOfflineMode: boolean;
  enableConflictResolution: boolean;
  syncInterval: number;
  maxRetryAttempts: number;
  batchSize: number;
}

export interface SyncStatus {
  isOnline: boolean;
  connectionState: ConnectionState;
  pendingActions: number;
  lastSyncTime: string | null;
  conflictsCount: number;
  errorCount: number;
}

export interface SyncEvent {
  type: 'sync_started' | 'sync_completed' | 'sync_failed' | 'conflict_detected' | 'offline_detected' | 'online_detected';
  timestamp: string;
  data?: unknown;
}

export class SyncManager {
  private static instance: SyncManager;
  private config: SyncManagerConfig;
  private realTimeEngine: RealTimeSyncEngine;
  private offlineManager: OfflineManager;
  private conflictResolver: ConflictResolver;
  private websocketHandler: WebSocketHandler;
  private eventHandlers: Set<(event: SyncEvent) => void> = new Set();
  private syncTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private lastSyncTime: string | null = null;
  private errorCount = 0;

  static getInstance(config?: Partial<SyncManagerConfig>): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager(config);
    }
    return SyncManager.instance;
  }

  private constructor(config: Partial<SyncManagerConfig> = {}) {
    this.config = {
      enableRealTimeSync: config.enableRealTimeSync ?? true,
      enableOfflineMode: config.enableOfflineMode ?? true,
      enableConflictResolution: config.enableConflictResolution ?? true,
      syncInterval: config.syncInterval ?? 30000, // 30 seconds
      maxRetryAttempts: config.maxRetryAttempts ?? 3,
      batchSize: config.batchSize ?? 10,
      ...config
    };

    this.realTimeEngine = RealTimeSyncEngine.getInstance();
    this.offlineManager = OfflineManager.getInstance();
    this.conflictResolver = ConflictResolver.getInstance();
    this.websocketHandler = new WebSocketHandler();

    this.setupEventHandlers();
  }

  // Initialize the sync manager
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('[SyncManager] Initializing...');

      // Initialize offline manager first
      if (this.config.enableOfflineMode) {
        await this.offlineManager.initialize();
      }

      // Initialize real-time sync if enabled
      if (this.config.enableRealTimeSync) {
        await this.realTimeEngine.initialize();
        await this.websocketHandler.connect();
      }

      // Start periodic sync
      this.startPeriodicSync();

      // Listen for online/offline events
      this.setupNetworkDetection();

      this.isInitialized = true;
      this.emitEvent({ type: 'sync_started', timestamp: new Date().toISOString() });

      console.log('[SyncManager] Initialized successfully');
    } catch (error) {
      console.error('[SyncManager] Failed to initialize:', error);
      throw error;
    }
  }

  // Start synchronization
  async startSync(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('[SyncManager] Starting sync process...');

      // Process offline actions first
      if (this.config.enableOfflineMode) {
        await this.processOfflineActions();
      }

      // Sync real-time data
      if (this.config.enableRealTimeSync && navigator.onLine) {
        await this.syncRealTimeData();
      }

      this.lastSyncTime = new Date().toISOString();
      this.errorCount = 0;

      this.emitEvent({
        type: 'sync_completed',
        timestamp: this.lastSyncTime,
        data: { pendingActions: await this.offlineManager.getPendingActionsCount() }
      });

      console.log('[SyncManager] Sync completed successfully');
    } catch (error) {
      this.errorCount++;
      console.error('[SyncManager] Sync failed:', error);
      
      this.emitEvent({
        type: 'sync_failed',
        timestamp: new Date().toISOString(),
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      // Retry with exponential backoff
      if (this.errorCount < this.config.maxRetryAttempts) {
        const delay = Math.pow(2, this.errorCount) * 1000;
        setTimeout(() => this.startSync(), delay);
      }
    }
  }

  // Stop synchronization
  async stopSync(): Promise<void> {
    console.log('[SyncManager] Stopping sync...');

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    if (this.config.enableRealTimeSync) {
      await this.realTimeEngine.disconnect();
      this.websocketHandler.disconnect();
    }

    console.log('[SyncManager] Sync stopped');
  }

  // Process offline actions
  private async processOfflineActions(): Promise<void> {
    try {
      const pendingActions = await this.offlineManager.getPendingActions();
      
      if (pendingActions.length === 0) {
        return;
      }

      console.log(`[SyncManager] Processing ${pendingActions.length} offline actions`);

      // Process actions in batches
      for (let i = 0; i < pendingActions.length; i += this.config.batchSize) {
        const batch = pendingActions.slice(i, i + this.config.batchSize);
        
        await Promise.allSettled(
          batch.map(action => this.processOfflineAction(action))
        );
      }
    } catch (error) {
      console.error('[SyncManager] Failed to process offline actions:', error);
      throw error;
    }
  }

  // Process individual offline action
  private async processOfflineAction(action: any): Promise<void> {
    try {
      // Execute the offline action
      const result = await this.offlineManager.executeAction(action);

      // Check for conflicts if enabled
      if (this.config.enableConflictResolution && result.hasConflict) {
        await this.handleConflict(result.conflict);
      }

      console.log(`[SyncManager] Processed offline action: ${action.id}`);
    } catch (error) {
      console.error(`[SyncManager] Failed to process action ${action.id}:`, error);
      
      // Mark action as failed for retry
      await this.offlineManager.markActionFailed(action.id, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Handle data conflict
  private async handleConflict(conflict: DataConflict): Promise<void> {
    try {
      console.log(`[SyncManager] Handling conflict for ${conflict.entityType}:${conflict.entityId}`);

      this.emitEvent({
        type: 'conflict_detected',
        timestamp: new Date().toISOString(),
        data: conflict
      });

      // Resolve conflict using conflict resolver
      const resolution: MergeResult = this.conflictResolver.resolveConflict(conflict);

      // Apply resolved data
      await this.applyConflictResolution(conflict, resolution);

      console.log(`[SyncManager] Conflict resolved: ${resolution.conflictsResolved} conflicts resolved`);
    } catch (error) {
      console.error('[SyncManager] Failed to handle conflict:', error);
      throw error;
    }
  }

  // Apply conflict resolution
  private async applyConflictResolution(conflict: DataConflict, resolution: MergeResult): Promise<void> {
    try {
      // Update local data with resolved version
      await this.offlineManager.updateCachedData(
        conflict.entityType,
        conflict.entityId,
        resolution.data
      );

      // Send resolved data to server if online
      if (navigator.onLine) {
        await this.sendResolvedData(conflict, resolution);
      }
    } catch (error) {
      console.error('[SyncManager] Failed to apply conflict resolution:', error);
      throw error;
    }
  }

  // Send resolved data to server
  private async sendResolvedData(conflict: DataConflict, resolution: MergeResult): Promise<void> {
    try {
      const endpoint = `/api/${conflict.entityType}/${conflict.entityId}`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: resolution.data,
          resolution_metadata: resolution.mergeMetadata
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send resolved data: ${response.status}`);
      }
    } catch (error) {
      console.error('[SyncManager] Failed to send resolved data:', error);
      throw error;
    }
  }

  // Sync real-time data
  private async syncRealTimeData(): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user?.profile?.organization_id) {
        throw new Error('User organization not found');
      }

      // Subscribe to relevant events
      await this.websocketHandler.subscribe([
        'opportunity_updated',
        'kpi_calculated',
        'activity_completed',
        'contact_updated'
      ]);

      console.log('[SyncManager] Real-time sync established');
    } catch (error) {
      console.error('[SyncManager] Failed to sync real-time data:', error);
      throw error;
    }
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    // WebSocket event handlers
    this.websocketHandler.setHandlers({
      onMessage: (message: WebSocketMessage) => {
        this.handleRealtimeMessage(message);
      },
      onConnectionStatusChange: (status: ConnectionState) => {
        this.handleConnectionStatusChange(status);
      },
      onError: (event) => {
        console.error('[SyncManager] WebSocket error:', event);
      }
    });

    // Real-time sync event handlers
    this.realTimeEngine.subscribe('data_updated', (event) => {
      this.handleDataUpdate(event);
    });

    this.realTimeEngine.subscribe('sync_conflict', (event) => {
      this.handleSyncConflict(event);
    });
  }

  // Handle real-time message
  private handleRealtimeMessage(message: WebSocketMessage): void {
    console.log('[SyncManager] Received real-time message:', message.type);

    // Update local cache if offline mode is enabled
    if (this.config.enableOfflineMode) {
      this.updateLocalCache(message);
    }

    // Emit sync event
    this.emitEvent({
      type: 'sync_completed',
      timestamp: new Date().toISOString(),
      data: message
    });
  }

  // Handle connection status change
  private handleConnectionStatusChange(status: ConnectionState): void {
    console.log('[SyncManager] Connection status changed:', status);

    if (status === 'connected' && !navigator.onLine) {
      // Trigger sync when coming back online
      this.startSync();
    }
  }

  // Handle data update
  private handleDataUpdate(event: any): void {
    console.log('[SyncManager] Data updated:', event);
    
    // Process data update through offline manager if enabled
    if (this.config.enableOfflineMode) {
      this.offlineManager.handleDataUpdate(event);
    }
  }

  // Handle sync conflict
  private handleSyncConflict(event: any): void {
    console.log('[SyncManager] Sync conflict detected:', event);
    
    if (this.config.enableConflictResolution) {
      this.handleConflict(event.conflict);
    }
  }

  // Update local cache
  private updateLocalCache(message: WebSocketMessage): void {
    try {
      // Extract entity information from message
      const { type, payload } = message;
      
      if (type.endsWith('_updated') && payload && typeof payload === 'object') {
        const entityType = type.replace('_updated', '');
        const data = payload as Record<string, unknown>;
        
        if (data.id) {
          this.offlineManager.updateCachedData(entityType, data.id as string, data);
        }
      }
    } catch (error) {
      console.error('[SyncManager] Failed to update local cache:', error);
    }
  }

  // Setup network detection
  private setupNetworkDetection(): void {
    const handleOnline = () => {
      console.log('[SyncManager] Network online');
      this.emitEvent({
        type: 'online_detected',
        timestamp: new Date().toISOString()
      });
      this.startSync();
    };

    const handleOffline = () => {
      console.log('[SyncManager] Network offline');
      this.emitEvent({
        type: 'offline_detected',
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  // Start periodic sync
  private startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (navigator.onLine) {
        this.startSync();
      }
    }, this.config.syncInterval);
  }

  // Emit sync event
  private emitEvent(event: SyncEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('[SyncManager] Event handler error:', error);
      }
    });
  }

  // Public API methods

  // Add event listener
  addEventListener(handler: (event: SyncEvent) => void): void {
    this.eventHandlers.add(handler);
  }

  // Remove event listener
  removeEventListener(handler: (event: SyncEvent) => void): void {
    this.eventHandlers.delete(handler);
  }

  // Get sync status
  async getStatus(): Promise<SyncStatus> {
    const pendingActions = this.config.enableOfflineMode 
      ? await this.offlineManager.getPendingActionsCount()
      : 0;

    const conflictsCount = this.config.enableOfflineMode
      ? await this.offlineManager.getConflictsCount()
      : 0;

    return {
      isOnline: navigator.onLine,
      connectionState: this.websocketHandler.getStatus(),
      pendingActions,
      lastSyncTime: this.lastSyncTime,
      conflictsCount,
      errorCount: this.errorCount
    };
  }

  // Force sync
  async forceSync(): Promise<void> {
    await this.startSync();
  }

  // Update configuration
  updateConfig(config: Partial<SyncManagerConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart periodic sync with new interval
    if (config.syncInterval) {
      this.startPeriodicSync();
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    if (this.config.enableOfflineMode) {
      await this.offlineManager.clearAllData();
    }
    
    this.lastSyncTime = null;
    this.errorCount = 0;
  }
}

// Export singleton instance
export const syncManager = SyncManager.getInstance();
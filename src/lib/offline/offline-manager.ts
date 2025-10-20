// src/lib/offline/offline-manager.ts
// Offline Support Manager for Phase 2.8
// Handles offline storage, synchronization queue, and progressive web app features

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { realTimeSyncEngine, SyncEvent, SyncEventType } from '@/lib/sync/real-time-sync-engine';
import { AuthService } from '@/lib/auth-unified';

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  timestamp: string;
  userId: string;
  organizationId: string;
  attempts: number;
  lastAttempt?: string;
  error?: string;
}

export interface OfflineData {
  id: string;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  version: number;
  lastSync: string;
  isDirty: boolean;
  organizationId: string;
}

export interface CacheEntry {
  id: string;
  key: string;
  data: unknown;
  timestamp: string;
  ttl: number; // Time to live in milliseconds
  size: number; // Size in bytes
}

export interface OfflineMetrics {
  totalSize: number;
  entryCount: number;
  pendingActions: number;
  lastSync: Date | null;
  syncErrors: number;
  cacheHitRate: number;
  offlineTime: number; // Total time spent offline
}

interface OfflineDB extends DBSchema {
  offline_actions: {
    key: string;
    value: OfflineAction;
    indexes: {
      'by-timestamp': string;
      'by-entity': string;
      'by-type': string;
    };
  };
  offline_data: {
    key: string;
    value: OfflineData;
    indexes: {
      'by-entity': string;
      'by-organization': string;
      'by-last-sync': string;
    };
  };
  cache_entries: {
    key: string;
    value: CacheEntry;
    indexes: {
      'by-timestamp': string;
      'by-ttl': number;
    };
  };
  sync_metadata: {
    key: string;
    value: {
      id: string;
      lastSync: string;
      syncVersion: number;
      organizationId: string;
    };
  };
}

export class OfflineManager {
  private static instance: OfflineManager;
  private db: IDBPDatabase<OfflineDB> | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncQueue: OfflineAction[] = [];
  private syncInProgress: boolean = false;
  private metrics: OfflineMetrics = {
    totalSize: 0,
    entryCount: 0,
    pendingActions: 0,
    lastSync: null,
    syncErrors: 0,
    cacheHitRate: 0,
    offlineTime: 0
  };
  private offlineStartTime: Date | null = null;
  private cacheHits = 0;
  private cacheRequests = 0;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds
  private maxCacheSize = 50 * 1024 * 1024; // 50 MB
  private defaultTTL = 24 * 60 * 60 * 1000; // 24 hours

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private constructor() {
    this.setupNetworkListeners();
    this.initializeDatabase();
  }

  // Initialize IndexedDB database
  private async initializeDatabase(): Promise<void> {
    try {
      this.db = await openDB<OfflineDB>('fulqrun-offline', 1, {
        upgrade(db) {
          // Offline actions store
          const actionsStore = db.createObjectStore('offline_actions', {
            keyPath: 'id'
          });
          actionsStore.createIndex('by-timestamp', 'timestamp');
          actionsStore.createIndex('by-entity', 'entityId');
          actionsStore.createIndex('by-type', 'type');

          // Offline data store
          const dataStore = db.createObjectStore('offline_data', {
            keyPath: 'id'
          });
          dataStore.createIndex('by-entity', 'entityId');
          dataStore.createIndex('by-organization', 'organizationId');
          dataStore.createIndex('by-last-sync', 'lastSync');

          // Cache entries store
          const cacheStore = db.createObjectStore('cache_entries', {
            keyPath: 'id'
          });
          cacheStore.createIndex('by-timestamp', 'timestamp');
          cacheStore.createIndex('by-ttl', 'ttl');

          // Sync metadata store
          db.createObjectStore('sync_metadata', {
            keyPath: 'id'
          });
        }
      });

      await this.loadSyncQueue();
      await this.cleanupExpiredCache();
      
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
    }
  }

  // Setup network connectivity listeners
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('Network connectivity restored');
      this.isOnline = true;
      
      if (this.offlineStartTime) {
        this.metrics.offlineTime += Date.now() - this.offlineStartTime.getTime();
        this.offlineStartTime = null;
      }
      
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      console.log('Network connectivity lost');
      this.isOnline = false;
      this.offlineStartTime = new Date();
    });
  }

  // Store data for offline access
  async storeOfflineData(
    entityType: string,
    entityId: string,
    data: Record<string, unknown>,
    organizationId: string
  ): Promise<void> {
    if (!this.db) return;

    const offlineData: OfflineData = {
      id: `${entityType}_${entityId}`,
      entityType,
      entityId,
      data,
      version: Date.now(),
      lastSync: new Date().toISOString(),
      isDirty: false,
      organizationId
    };

    await this.db.put('offline_data', offlineData);
    this.updateMetrics();
  }

  // Retrieve data from offline storage
  async getOfflineData(entityType: string, entityId: string): Promise<OfflineData | null> {
    if (!this.db) return null;

    const id = `${entityType}_${entityId}`;
    return await this.db.get('offline_data', id) || null;
  }

  // Queue action for synchronization
  async queueAction(
    type: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string,
    data: Record<string, unknown>,
    organizationId?: string
  ): Promise<void> {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const action: OfflineAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      entityType,
      entityId,
      data,
      timestamp: new Date().toISOString(),
      userId: user.id,
      organizationId: organizationId || 'default_org',
      attempts: 0
    };

    if (this.db) {
      await this.db.put('offline_actions', action);
    }
    
    this.syncQueue.push(action);
    this.metrics.pendingActions++;

    // If online, try to sync immediately
    if (this.isOnline && !this.syncInProgress) {
      this.processSyncQueue();
    }
  }

  // Process synchronization queue
  async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      const actionsToProcess = [...this.syncQueue];
      
      for (const action of actionsToProcess) {
        try {
          await this.syncAction(action);
          
          // Remove from queue and database
          this.syncQueue = this.syncQueue.filter(a => a.id !== action.id);
          if (this.db) {
            await this.db.delete('offline_actions', action.id);
          }
          this.metrics.pendingActions--;
          
        } catch (error) {
          await this.handleSyncError(action, error as Error);
        }
      }

      this.metrics.lastSync = new Date();
      
    } catch (error) {
      console.error('Error processing sync queue:', error);
      this.metrics.syncErrors++;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Synchronize individual action
  private async syncAction(action: OfflineAction): Promise<void> {
    // Convert offline action to sync event
    const syncEvent: Omit<SyncEvent, 'id' | 'timestamp' | 'version'> = {
      type: this.mapActionToEventType(action.type, action.entityType),
      entityType: action.entityType,
      entityId: action.entityId,
      data: action.data,
      userId: action.userId,
      organizationId: action.organizationId
    };

    // Publish through real-time sync engine
    await realTimeSyncEngine.publishEvent(syncEvent);
  }

  // Map action type to sync event type
  private mapActionToEventType(actionType: string, entityType: string): SyncEventType {
    switch (entityType) {
      case 'opportunity':
        return 'opportunity_change';
      case 'kpi':
        return 'kpi_update';
      case 'alert':
        return 'alert_trigger';
      default:
        return 'user_activity';
    }
  }

  // Handle synchronization errors
  private async handleSyncError(action: OfflineAction, error: Error): Promise<void> {
    action.attempts++;
    action.lastAttempt = new Date().toISOString();
    action.error = error.message;

    if (action.attempts < this.maxRetries) {
      // Update action in database
      if (this.db) {
        await this.db.put('offline_actions', action);
      }
      
      // Schedule retry
      setTimeout(() => {
        if (this.isOnline) {
          this.processSyncQueue();
        }
      }, this.retryDelay * action.attempts);
      
    } else {
      // Max retries reached, remove from queue
      console.error(`Max retries reached for action ${action.id}:`, error);
      this.syncQueue = this.syncQueue.filter(a => a.id !== action.id);
      if (this.db) {
        await this.db.delete('offline_actions', action.id);
      }
      this.metrics.pendingActions--;
      this.metrics.syncErrors++;
    }
  }

  // Load sync queue from database
  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return;

    const actions = await this.db.getAll('offline_actions');
    this.syncQueue = actions.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    this.metrics.pendingActions = this.syncQueue.length;
  }

  // Cache management
  async setCache(key: string, data: unknown, ttl?: number): Promise<void> {
    if (!this.db) return;

    const cacheEntry: CacheEntry = {
      id: `cache_${key}`,
      key,
      data,
      timestamp: new Date().toISOString(),
      ttl: ttl || this.defaultTTL,
      size: this.estimateSize(data)
    };

    // Check cache size limits
    await this.enforcesCacheLimit();

    await this.db.put('cache_entries', cacheEntry);
    this.updateMetrics();
  }

  async getCache(key: string): Promise<unknown | null> {
    if (!this.db) return null;

    this.cacheRequests++;

    const entry = await this.db.get('cache_entries', `cache_${key}`);
    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    const entryTime = new Date(entry.timestamp).getTime();
    if (now - entryTime > entry.ttl) {
      await this.db.delete('cache_entries', entry.id);
      return null;
    }

    this.cacheHits++;
    this.metrics.cacheHitRate = this.cacheHits / this.cacheRequests;
    return entry.data;
  }

  // Clean up expired cache entries
  private async cleanupExpiredCache(): Promise<void> {
    if (!this.db) return;

    const now = Date.now();
    const tx = this.db.transaction('cache_entries', 'readwrite');
    const store = tx.objectStore('cache_entries');
    const entries = await store.getAll();

    for (const entry of entries) {
      const entryTime = new Date(entry.timestamp).getTime();
      if (now - entryTime > entry.ttl) {
        await store.delete(entry.id);
      }
    }

    await tx.done;
    this.updateMetrics();
  }

  // Enforce cache size limits
  private async enforcesCacheLimit(): Promise<void> {
    if (!this.db) return;

    const entries = await this.db.getAll('cache_entries');
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);

    if (totalSize > this.maxCacheSize) {
      // Remove oldest entries first
      const sortedEntries = entries.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      let currentSize = totalSize;
      for (const entry of sortedEntries) {
        if (currentSize <= this.maxCacheSize * 0.8) break; // Remove to 80% of limit
        
        await this.db.delete('cache_entries', entry.id);
        currentSize -= entry.size;
      }
    }
  }

  // Estimate object size in bytes
  private estimateSize(obj: unknown): number {
    const jsonString = JSON.stringify(obj);
    return new Blob([jsonString]).size;
  }

  // Update metrics
  private async updateMetrics(): Promise<void> {
    if (!this.db) return;

    const cacheEntries = await this.db.getAll('cache_entries');
    this.metrics.totalSize = cacheEntries.reduce((sum, entry) => sum + entry.size, 0);
    this.metrics.entryCount = cacheEntries.length;
  }

  // Get current metrics
  getMetrics(): OfflineMetrics {
    return { ...this.metrics };
  }

  // Check if currently online
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Force synchronization
  async forceSynchronization(): Promise<void> {
    if (this.isOnline) {
      await this.processSyncQueue();
    } else {
      throw new Error('Cannot synchronize while offline');
    }
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    if (!this.db) return;

    await this.db.clear('offline_actions');
    await this.db.clear('offline_data');
    await this.db.clear('cache_entries');
    await this.db.clear('sync_metadata');

    this.syncQueue = [];
    this.metrics = {
      totalSize: 0,
      entryCount: 0,
      pendingActions: 0,
      lastSync: null,
      syncErrors: 0,
      cacheHitRate: 0,
      offlineTime: 0
    };
  }

  // Export offline data for debugging
  async exportOfflineData(): Promise<{
    actions: OfflineAction[];
    data: OfflineData[];
    cache: CacheEntry[];
    metrics: OfflineMetrics;
  }> {
    if (!this.db) {
      return { actions: [], data: [], cache: [], metrics: this.metrics };
    }

    const actions = await this.db.getAll('offline_actions');
    const data = await this.db.getAll('offline_data');
    const cache = await this.db.getAll('cache_entries');

    return {
      actions,
      data,
      cache,
      metrics: this.metrics
    };
  }
}

// Export singleton instance
export const offlineManager = OfflineManager.getInstance();
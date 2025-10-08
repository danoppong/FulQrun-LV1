// src/lib/sync/real-time-sync-engine.ts
// Real-time Data Synchronization Engine for Phase 2.8
// Handles WebSocket connections, data streaming, and conflict resolution

import { EventEmitter } from 'events';
import { AuthService } from '@/lib/auth-unified';

export type SyncEventType = 
  | 'kpi_update' 
  | 'opportunity_change' 
  | 'ai_insight' 
  | 'alert_trigger'
  | 'user_activity'
  | 'system_notification';

export interface SyncEvent {
  id: string;
  type: SyncEventType;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  userId: string;
  organizationId: string;
  timestamp: string;
  version: number;
  checksum?: string;
}

export interface SyncSubscription {
  id: string;
  eventTypes: SyncEventType[];
  entityFilters?: Record<string, unknown>;
  callback: (event: SyncEvent) => void;
  organizationId: string;
}

export interface ConnectionStatus {
  connected: boolean;
  latency: number;
  lastHeartbeat: Date;
  reconnectAttempts: number;
  lastError?: string;
}

export interface SyncMetrics {
  messagesReceived: number;
  messagesSent: number;
  eventsProcessed: number;
  averageLatency: number;
  errorCount: number;
  connectionUptime: number;
}

export interface WebSocketMessage {
  type: 'event' | 'heartbeat' | 'error' | 'subscription_confirmed' | 'subscribe' | 'unsubscribe' | 'publish';
  event?: SyncEvent;
  error?: string;
  subscriptionId?: string;
  eventTypes?: SyncEventType[];
  entityFilters?: Record<string, unknown>;
  organizationId?: string;
  timestamp?: string;
}

export class RealTimeSyncEngine extends EventEmitter {
  private static instance: RealTimeSyncEngine;
  private websocket: WebSocket | null = null;
  private subscriptions: Map<string, SyncSubscription> = new Map();
  private connectionStatus: ConnectionStatus = {
    connected: false,
    latency: 0,
    lastHeartbeat: new Date(),
    reconnectAttempts: 0
  };
  private metrics: SyncMetrics = {
    messagesReceived: 0,
    messagesSent: 0,
    eventsProcessed: 0,
    averageLatency: 0,
    errorCount: 0,
    connectionUptime: 0
  };
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pendingEvents: SyncEvent[] = [];
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private heartbeatInterval_ms = 30000; // 30 seconds
  private connectionStartTime: Date | null = null;

  static getInstance(): RealTimeSyncEngine {
    if (!RealTimeSyncEngine.instance) {
      RealTimeSyncEngine.instance = new RealTimeSyncEngine();
    }
    return RealTimeSyncEngine.instance;
  }

  private constructor() {
    super();
    this.setupErrorHandling();
  }

  // Initialize connection with authentication
  async connect(): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (this.websocket?.readyState === WebSocket.OPEN) {
        console.warn('WebSocket already connected');
        return;
      }

      const wsUrl = this.buildWebSocketUrl(user.id);
      this.websocket = new WebSocket(wsUrl);
      this.connectionStartTime = new Date();

      this.setupWebSocketHandlers();
      this.startHeartbeat();

    } catch (error) {
      console.error('Failed to connect to real-time sync:', error);
      this.handleConnectionError(error);
      throw error;
    }
  }

  // Disconnect and cleanup
  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.websocket) {
      this.websocket.close(1000, 'Manual disconnect');
      this.websocket = null;
    }

    this.connectionStatus.connected = false;
    this.connectionStartTime = null;
    this.emit('disconnected');
  }

  // Subscribe to real-time events
  subscribe(subscription: Omit<SyncSubscription, 'id'>): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullSubscription: SyncSubscription = {
      id: subscriptionId,
      ...subscription
    };

    this.subscriptions.set(subscriptionId, fullSubscription);

    // Send subscription to server if connected
    if (this.connectionStatus.connected) {
      this.sendMessage({
        type: 'subscribe',
        subscriptionId,
        eventTypes: subscription.eventTypes,
        entityFilters: subscription.entityFilters,
        organizationId: subscription.organizationId
      });
    }

    return subscriptionId;
  }

  // Unsubscribe from events
  unsubscribe(subscriptionId: string): void {
    if (this.subscriptions.has(subscriptionId)) {
      this.subscriptions.delete(subscriptionId);

      if (this.connectionStatus.connected) {
        this.sendMessage({
          type: 'unsubscribe',
          subscriptionId
        });
      }
    }
  }

  // Publish an event to all subscribers
  async publishEvent(event: Omit<SyncEvent, 'id' | 'timestamp' | 'version'>): Promise<void> {
    const fullEvent: SyncEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      version: 1,
      ...event
    };

    // Calculate checksum for data integrity
    fullEvent.checksum = await this.calculateChecksum(fullEvent.data);

    if (this.connectionStatus.connected) {
      this.sendMessage({
        type: 'publish',
        event: fullEvent
      });
    } else {
      // Queue for later if offline
      this.pendingEvents.push(fullEvent);
    }
  }

  // Get current connection status
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  // Get synchronization metrics
  getMetrics(): SyncMetrics {
    const uptime = this.connectionStartTime 
      ? Date.now() - this.connectionStartTime.getTime()
      : 0;

    return {
      ...this.metrics,
      connectionUptime: uptime
    };
  }

  // Force synchronization of pending events
  async forceSynchronization(): Promise<void> {
    if (!this.connectionStatus.connected) {
      throw new Error('Not connected to real-time sync');
    }

    // Send all pending events
    for (const event of this.pendingEvents) {
      this.sendMessage({
        type: 'publish',
        event
      });
    }

    this.pendingEvents = [];
    this.emit('synchronization_complete');
  }

  // Build WebSocket URL with authentication
  private buildWebSocketUrl(userId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', 'wss://').replace('http://', 'ws://');
    const params = new URLSearchParams({
      userId,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      vsn: '1.0.0'
    });

    return `${baseUrl}/realtime/v1/websocket?${params.toString()}`;
  }

  // Setup WebSocket event handlers
  private setupWebSocketHandlers(): void {
    if (!this.websocket) return;

    this.websocket.onopen = () => {
      console.log('Real-time sync connected');
      this.connectionStatus.connected = true;
      this.connectionStatus.reconnectAttempts = 0;
      this.connectionStatus.lastError = undefined;

      // Resubscribe to all existing subscriptions
      this.resubscribeAll();

      // Send pending events
      this.forceSynchronization().catch(console.error);

      this.emit('connected');
    };

    this.websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleIncomingMessage(message);
        this.metrics.messagesReceived++;
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        this.metrics.errorCount++;
      }
    };

    this.websocket.onclose = (event) => {
      console.log('Real-time sync disconnected:', event.code, event.reason);
      this.connectionStatus.connected = false;
      this.emit('disconnected', { code: event.code, reason: event.reason });

      // Auto-reconnect if not manually closed
      if (event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleConnectionError(error);
    };
  }

  // Handle incoming messages from WebSocket
  private handleIncomingMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'event':
        this.processIncomingEvent(message.event);
        break;
      
      case 'heartbeat':
        this.handleHeartbeat(message);
        break;
      
      case 'error':
        console.error('Server error:', message.error);
        this.metrics.errorCount++;
        break;
      
      case 'subscription_confirmed':
        console.log('Subscription confirmed:', message.subscriptionId);
        break;
      
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  // Process incoming sync events
  private processIncomingEvent(event: SyncEvent): void {
    this.metrics.eventsProcessed++;

    // Find matching subscriptions
    for (const subscription of this.subscriptions.values()) {
      if (this.eventMatchesSubscription(event, subscription)) {
        try {
          subscription.callback(event);
        } catch (error) {
          console.error('Error in subscription callback:', error);
          this.metrics.errorCount++;
        }
      }
    }

    this.emit('event_received', event);
  }

  // Check if event matches subscription criteria
  private eventMatchesSubscription(event: SyncEvent, subscription: SyncSubscription): boolean {
    // Check event type
    if (!subscription.eventTypes.includes(event.type)) {
      return false;
    }

    // Check organization match
    if (subscription.organizationId !== event.organizationId) {
      return false;
    }

    // Check entity filters if provided
    if (subscription.entityFilters) {
      for (const [key, value] of Object.entries(subscription.entityFilters)) {
        if (event.data[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  // Send message through WebSocket
  private sendMessage(message: WebSocketMessage): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
      this.metrics.messagesSent++;
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  // Handle heartbeat response
  private handleHeartbeat(message: WebSocketMessage): void {
    const now = new Date();
    this.connectionStatus.lastHeartbeat = now;
    
    if (message.timestamp) {
      const serverTime = new Date(message.timestamp);
      this.connectionStatus.latency = now.getTime() - serverTime.getTime();
      
      // Update average latency
      this.metrics.averageLatency = 
        (this.metrics.averageLatency + this.connectionStatus.latency) / 2;
    }
  }

  // Start heartbeat monitoring
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.connectionStatus.connected) {
        this.sendMessage({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        });
      }
    }, this.heartbeatInterval_ms);
  }

  // Schedule reconnection with exponential backoff
  private scheduleReconnect(): void {
    if (this.connectionStatus.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnects_reached');
      return;
    }

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.connectionStatus.reconnectAttempts),
      this.maxReconnectDelay
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.connectionStatus.reconnectAttempts + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connectionStatus.reconnectAttempts++;
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
        this.scheduleReconnect();
      });
    }, delay);
  }

  // Resubscribe to all existing subscriptions
  private resubscribeAll(): void {
    for (const subscription of this.subscriptions.values()) {
      this.sendMessage({
        type: 'subscribe',
        subscriptionId: subscription.id,
        eventTypes: subscription.eventTypes,
        entityFilters: subscription.entityFilters,
        organizationId: subscription.organizationId
      });
    }
  }

  // Handle connection errors
  private handleConnectionError(error: Error | Event): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.connectionStatus.lastError = errorMessage;
    this.metrics.errorCount++;
    this.emit('error', error);
  }

  // Setup global error handling
  private setupErrorHandling(): void {
    this.on('error', (error) => {
      console.error('RealTimeSyncEngine error:', error);
    });
  }

  // Calculate checksum for data integrity
  private async calculateChecksum(data: Record<string, unknown>): Promise<string> {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback simple hash for server environments
      let hash = 0;
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    }
  }
}

// Export singleton instance
export const realTimeSyncEngine = RealTimeSyncEngine.getInstance();
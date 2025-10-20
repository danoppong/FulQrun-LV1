// src/lib/sync/websocket-handler.ts
// WebSocket Handler for Phase 2.8
// Manages real-time WebSocket connections with automatic reconnection

import { AuthService } from '@/lib/auth-unified';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: string;
  messageId: string;
  organizationId?: string;
  userId?: string;
}

export interface WebSocketEventHandler {
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onReconnect?: (attempt: number) => void;
  onConnectionStatusChange?: (status: ConnectionState) => void;
}

export class WebSocketHandler {
  private socket: WebSocket | null = null;
  private config: WebSocketConfig;
  private handlers: WebSocketEventHandler = {};
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private lastHeartbeat = 0;
  private isReconnecting = false;
  private currentStatus: ConnectionState = 'disconnected';
  private messageQueue: WebSocketMessage[] = [];
  private acknowledgments = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: config.url || this.getWebSocketUrl(),
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      connectionTimeout: config.connectionTimeout || 10000,
      ...config
    };
  }

  // Get WebSocket URL based on environment
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }

  // Connect to WebSocket server
  async connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    this.setConnectionStatus('connecting');

    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Simple WebSocket connection without token for now
      // TODO: Add proper authentication token when backend supports it
      const wsUrl = this.config.url;

      this.socket = new WebSocket(wsUrl);
      this.setupEventListeners();
      this.setupConnectionTimeout();

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.setConnectionStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    this.isReconnecting = false;
    this.clearTimers();
    
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
    
    this.setConnectionStatus('disconnected');
    this.clearAcknowledgments();
  }

  // Send message through WebSocket
  async sendMessage(type: string, payload: unknown, requireAck = false): Promise<unknown> {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId()
    };

    // Add user context
    try {
      const user = await AuthService.getCurrentUser();
      // Use organization_id from user profile
      if (user?.profile?.organization_id) {
        message.organizationId = user.profile.organization_id;
      }
      if (user?.id) {
        message.userId = user.id;
      }
    } catch (error) {
      console.warn('Could not add user context to message:', error);
    }

    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify(message));
          
          if (requireAck) {
            this.setupAcknowledgment(message.messageId, resolve, reject);
          } else {
            resolve(true);
          }
        } catch (error) {
          reject(error);
        }
      } else {
        // Queue message for later delivery
        this.messageQueue.push(message);
        
        if (requireAck) {
          this.setupAcknowledgment(message.messageId, resolve, reject);
        } else {
          resolve(true);
        }
        
        // Attempt to reconnect
        this.connect();
      }
    });
  }

  // Subscribe to server events
  async subscribe(eventTypes: string[]): Promise<void> {
    await this.sendMessage('subscribe', { eventTypes }, true);
  }

  // Unsubscribe from server events
  async unsubscribe(eventTypes: string[]): Promise<void> {
    await this.sendMessage('unsubscribe', { eventTypes }, true);
  }

  // Set event handlers
  setHandlers(handlers: WebSocketEventHandler): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  // Get current connection status
  getStatus(): ConnectionState {
    return this.currentStatus;
  }

  // Get connection statistics
  getStats() {
    return {
      status: this.currentStatus,
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat,
      queuedMessages: this.messageQueue.length,
      pendingAcknowledgments: this.acknowledgments.size
    };
  }

  // Setup WebSocket event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = (event) => {
      console.log('WebSocket connected');
      this.setConnectionStatus('connected');
      this.reconnectAttempts = 0;
      this.clearTimers();
      this.startHeartbeat();
      this.processMessageQueue();
      this.handlers.onOpen?.(event);
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.setConnectionStatus('disconnected');
      this.clearTimers();
      this.handlers.onClose?.(event);
      
      if (!this.isReconnecting && event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (event) => {
      console.error('WebSocket error:', event);
      this.setConnectionStatus('error');
      this.handlers.onError?.(event);
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }

  // Handle incoming WebSocket message
  private handleMessage(message: WebSocketMessage): void {
    // Handle heartbeat responses
    if (message.type === 'heartbeat_response') {
      this.lastHeartbeat = Date.now();
      return;
    }

    // Handle acknowledgments
    if (message.type === 'ack') {
      const ackData = message.payload as { messageId: string; success: boolean; error?: string };
      const pending = this.acknowledgments.get(ackData.messageId);
      
      if (pending) {
        clearTimeout(pending.timeout);
        this.acknowledgments.delete(ackData.messageId);
        
        if (ackData.success) {
          pending.resolve(ackData);
        } else {
          pending.reject(new Error(ackData.error || 'Message not acknowledged'));
        }
      }
      return;
    }

    // Handle regular messages
    this.handlers.onMessage?.(message);
  }

  // Setup connection timeout
  private setupConnectionTimeout(): void {
    this.connectionTimeout = setTimeout(() => {
      if (this.socket?.readyState === WebSocket.CONNECTING) {
        console.warn('WebSocket connection timeout');
        this.socket.close();
        this.scheduleReconnect();
      }
    }, this.config.connectionTimeout);
  }

  // Start heartbeat mechanism
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.sendMessage('heartbeat', { timestamp: Date.now() });
        
        // Check if we received a heartbeat response recently
        const now = Date.now();
        if (this.lastHeartbeat > 0 && now - this.lastHeartbeat > this.config.heartbeatInterval * 2) {
          console.warn('WebSocket heartbeat timeout, reconnecting...');
          this.socket.close();
          this.scheduleReconnect();
        }
      }
    }, this.config.heartbeatInterval);
  }

  // Schedule reconnection attempt
  private scheduleReconnect(): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      return;
    }

    this.isReconnecting = true;
    this.setConnectionStatus('reconnecting');

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.handlers.onReconnect?.(this.reconnectAttempts);
      this.isReconnecting = false;
      this.connect();
    }, delay);
  }

  // Process queued messages
  private processMessageQueue(): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messages) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send queued message:', error);
        this.messageQueue.push(message); // Re-queue on failure
      }
    }
  }

  // Setup acknowledgment tracking
  private setupAcknowledgment(
    messageId: string,
    resolve: (value: unknown) => void,
    reject: (error: Error) => void
  ): void {
    const timeout = setTimeout(() => {
      this.acknowledgments.delete(messageId);
      reject(new Error('Message acknowledgment timeout'));
    }, 10000); // 10 second timeout

    this.acknowledgments.set(messageId, { resolve, reject, timeout });
  }

  // Clear all acknowledgments
  private clearAcknowledgments(): void {
    for (const [_messageId, pending] of this.acknowledgments) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection closed'));
    }
    this.acknowledgments.clear();
  }

  // Clear all timers
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  // Set connection status and notify handlers
  private setConnectionStatus(status: ConnectionState): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.handlers.onConnectionStatusChange?.(status);
    }
  }

  // Generate unique message ID
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
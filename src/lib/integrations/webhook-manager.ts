// Webhook Manager
// Centralized webhook handling for all enterprise integrations

import { createClient } from '@supabase/supabase-js';
import { WebhookPayload } from './base-integration';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface WebhookConfig {
  id: string;
  integrationId: string;
  organizationId: string;
  webhookUrl: string;
  secretKey: string;
  events: string[];
  isActive: boolean;
  retryAttempts: number;
  retryDelayMs: number;
  timeoutMs: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  errorMessage?: string;
  responseCode?: number;
  responseBody?: string;
  createdAt: Date;
}

export class WebhookManager {
  private webhookConfigs: Map<string, WebhookConfig> = new Map();

  constructor() {
    this.loadWebhookConfigs();
  }

  /**
   * Process incoming webhook payload
   */
  async processWebhook(
    integrationId: string,
    payload: WebhookPayload
  ): Promise<void> {
    try {
      // Validate webhook signature if provided
      if (!this.validateWebhookSignature(payload)) {
        throw new Error('Invalid webhook signature');
      }

      // Log webhook receipt
      await this.logWebhookReceipt(integrationId, payload);

      // Process webhook based on integration type
      await this.routeWebhook(integrationId, payload);

      // Deliver webhook to configured endpoints
      await this.deliverWebhook(integrationId, payload);

    } catch (error) {
      console.error('Error processing webhook:', error);
      await this.logWebhookError(integrationId, payload, error);
    }
  }

  /**
   * Register webhook configuration
   */
  async registerWebhook(config: Omit<WebhookConfig, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('webhook_configurations')
        .insert({
          integration_id: config.integrationId,
          organization_id: config.organizationId,
          webhook_url: config.webhookUrl,
          secret_key: config.secretKey,
          events: config.events,
          is_active: config.isActive,
          retry_attempts: config.retryAttempts,
          retry_delay_ms: config.retryDelayMs,
          timeout_ms: config.timeoutMs,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local cache
      this.webhookConfigs.set(data.id, {
        id: data.id,
        integrationId: data.integration_id,
        organizationId: data.organization_id,
        webhookUrl: data.webhook_url,
        secretKey: data.secret_key,
        events: data.events,
        isActive: data.is_active,
        retryAttempts: data.retry_attempts,
        retryDelayMs: data.retry_delay_ms,
        timeoutMs: data.timeout_ms,
      });

      return data.id;
    } catch (error) {
      console.error('Error registering webhook:', error);
      throw error;
    }
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(webhookId: string, updates: Partial<WebhookConfig>): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.webhookUrl) updateData.webhook_url = updates.webhookUrl;
      if (updates.secretKey) updateData.secret_key = updates.secretKey;
      if (updates.events) updateData.events = updates.events;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.retryAttempts) updateData.retry_attempts = updates.retryAttempts;
      if (updates.retryDelayMs) updateData.retry_delay_ms = updates.retryDelayMs;
      if (updates.timeoutMs) updateData.timeout_ms = updates.timeoutMs;

      const { error } = await supabase
        .from('webhook_configurations')
        .update(updateData)
        .eq('id', webhookId);

      if (error) throw error;

      // Update local cache
      const existingConfig = this.webhookConfigs.get(webhookId);
      if (existingConfig) {
        this.webhookConfigs.set(webhookId, { ...existingConfig, ...updates });
      }
    } catch (error) {
      console.error('Error updating webhook:', error);
      throw error;
    }
  }

  /**
   * Delete webhook configuration
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('webhook_configurations')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;

      // Remove from local cache
      this.webhookConfigs.delete(webhookId);
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw error;
    }
  }

  /**
   * Get webhook delivery history
   */
  async getWebhookHistory(
    webhookId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<WebhookDelivery[]> {
    try {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data.map(delivery => ({
        id: delivery.id,
        webhookId: delivery.webhook_id,
        payload: delivery.payload,
        status: delivery.status,
        attempts: delivery.attempts,
        lastAttemptAt: delivery.last_attempt_at ? new Date(delivery.last_attempt_at) : undefined,
        nextRetryAt: delivery.next_retry_at ? new Date(delivery.next_retry_at) : undefined,
        errorMessage: delivery.error_message,
        responseCode: delivery.response_code,
        responseBody: delivery.response_body,
        createdAt: new Date(delivery.created_at),
      }));
    } catch (error) {
      console.error('Error fetching webhook history:', error);
      throw error;
    }
  }

  /**
   * Retry failed webhook deliveries
   */
  async retryFailedWebhooks(): Promise<void> {
    try {
      const { data: failedDeliveries, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .in('status', ['failed', 'retrying'])
        .lte('next_retry_at', new Date().toISOString())
        .lt('attempts', 5); // Max 5 attempts

      if (error) throw error;

      for (const delivery of failedDeliveries) {
        await this.retryWebhookDelivery(delivery);
      }
    } catch (error) {
      console.error('Error retrying failed webhooks:', error);
    }
  }

  // Private methods
  private async loadWebhookConfigs(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('webhook_configurations')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      for (const config of data) {
        this.webhookConfigs.set(config.id, {
          id: config.id,
          integrationId: config.integration_id,
          organizationId: config.organization_id,
          webhookUrl: config.webhook_url,
          secretKey: config.secret_key,
          events: config.events,
          isActive: config.is_active,
          retryAttempts: config.retry_attempts,
          retryDelayMs: config.retry_delay_ms,
          timeoutMs: config.timeout_ms,
        });
      }
    } catch (error) {
      console.error('Error loading webhook configs:', error);
    }
  }

  private validateWebhookSignature(_payload: WebhookPayload): boolean {
    // Implement webhook signature validation
    // This would typically involve HMAC validation
    return true; // Simplified for now
  }

  private async logWebhookReceipt(integrationId: string, payload: WebhookPayload): Promise<void> {
    try {
      await supabase
        .from('webhook_logs')
        .insert({
          integration_id: integrationId,
          organization_id: payload.organizationId,
          event_type: payload.eventType,
          entity_type: payload.entityType,
          entity_id: payload.entityId,
          payload: payload.data,
          status: 'received',
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error logging webhook receipt:', error);
    }
  }

  private async routeWebhook(integrationId: string, payload: WebhookPayload): Promise<void> {
    // Route webhook to appropriate integration handler
    // This would typically involve looking up the integration type
    // and calling the appropriate handler method
    console.log(`Routing webhook for integration ${integrationId}:`, payload);
  }

  private async deliverWebhook(integrationId: string, payload: WebhookPayload): Promise<void> {
    const webhookConfigs = Array.from(this.webhookConfigs.values())
      .filter(config => config.integrationId === integrationId && config.isActive);

    for (const config of webhookConfigs) {
      if (config.events.includes(payload.eventType)) {
        await this.deliverToEndpoint(config, payload);
      }
    }
  }

  private async deliverToEndpoint(config: WebhookConfig, payload: WebhookPayload): Promise<void> {
    try {
      const deliveryId = await this.createWebhookDelivery(config.id, payload);

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': this.generateSignature(payload, config.secretKey),
          'X-Webhook-Event': payload.eventType,
          'X-Webhook-Entity': payload.entityType,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(config.timeoutMs),
      });

      await this.updateWebhookDelivery(deliveryId, {
        status: response.ok ? 'delivered' : 'failed',
        responseCode: response.status,
        responseBody: await response.text(),
      });

    } catch (error) {
      console.error('Error delivering webhook:', error);
      await this.handleWebhookDeliveryError(config, payload, error);
    }
  }

  private async createWebhookDelivery(webhookId: string, payload: WebhookPayload): Promise<string> {
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .insert({
        webhook_id: webhookId,
        payload: payload,
        status: 'pending',
        attempts: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  private async updateWebhookDelivery(
    deliveryId: string,
    updates: Partial<WebhookDelivery>
  ): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.attempts) updateData.attempts = updates.attempts;
    if (updates.lastAttemptAt) updateData.last_attempt_at = updates.lastAttemptAt.toISOString();
    if (updates.nextRetryAt) updateData.next_retry_at = updates.nextRetryAt.toISOString();
    if (updates.errorMessage) updateData.error_message = updates.errorMessage;
    if (updates.responseCode) updateData.response_code = updates.responseCode;
    if (updates.responseBody) updateData.response_body = updates.responseBody;

    await supabase
      .from('webhook_deliveries')
      .update(updateData)
      .eq('id', deliveryId);
  }

  private async handleWebhookDeliveryError(
    config: WebhookConfig,
    payload: WebhookPayload,
    error: Error
  ): Promise<void> {
    const deliveryId = await this.createWebhookDelivery(config.id, payload);
    
    const attempts = 1;
    const nextRetryAt = new Date(Date.now() + config.retryDelayMs);
    
    await this.updateWebhookDelivery(deliveryId, {
      status: attempts < config.retryAttempts ? 'retrying' : 'failed',
      attempts,
      lastAttemptAt: new Date(),
      nextRetryAt,
      errorMessage: error.message,
    });
  }

  private async retryWebhookDelivery(delivery: WebhookDelivery): Promise<void> {
    try {
      const config = this.webhookConfigs.get(delivery.webhook_id);
      if (!config) return;

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': this.generateSignature(delivery.payload, config.secretKey),
          'X-Webhook-Event': delivery.payload.eventType,
          'X-Webhook-Entity': delivery.payload.entityType,
        },
        body: JSON.stringify(delivery.payload),
        signal: AbortSignal.timeout(config.timeoutMs),
      });

      const attempts = delivery.attempts + 1;
      const nextRetryAt = attempts < config.retryAttempts 
        ? new Date(Date.now() + config.retryDelayMs * attempts)
        : undefined;

      await this.updateWebhookDelivery(delivery.id, {
        status: response.ok ? 'delivered' : (attempts < config.retryAttempts ? 'retrying' : 'failed'),
        attempts,
        lastAttemptAt: new Date(),
        nextRetryAt,
        responseCode: response.status,
        responseBody: await response.text(),
      });

    } catch (error) {
      const attempts = delivery.attempts + 1;
      const nextRetryAt = attempts < delivery.retry_attempts 
        ? new Date(Date.now() + delivery.retry_delay_ms * attempts)
        : undefined;

      await this.updateWebhookDelivery(delivery.id, {
        status: attempts < delivery.retry_attempts ? 'retrying' : 'failed',
        attempts,
        lastAttemptAt: new Date(),
        nextRetryAt,
        errorMessage: (error as Error).message,
      });
    }
  }

  private generateSignature(payload: WebhookPayload, _secretKey: string): string {
    // Generate HMAC signature for webhook payload
    // This is a simplified implementation
    return `sha256=${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
  }

  private async logWebhookError(
    integrationId: string,
    payload: WebhookPayload,
    error: Error
  ): Promise<void> {
    try {
      await supabase
        .from('webhook_logs')
        .insert({
          integration_id: integrationId,
          organization_id: payload.organizationId,
          event_type: payload.eventType,
          entity_type: payload.entityType,
          entity_id: payload.entityId,
          payload: payload.data,
          status: 'error',
          error_message: error.message,
          timestamp: new Date().toISOString(),
        });
    } catch (logError) {
      console.error('Error logging webhook error:', logError);
    }
  }
}

// Singleton instance
export const webhookManager = new WebhookManager();

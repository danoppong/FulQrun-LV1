// Enterprise Integration Ecosystem - Legacy File
// This file has been refactored into modular components
// See: src/lib/integrations/ for the new modular structure

// Re-export all functionality from the new modular structure
export * from './index';

// Legacy compatibility - maintain existing API
export {
  BaseIntegration as EnterpriseIntegrationBase,
  SalesforceIntegration,
  WebhookManager,
  webhookManager,
  IntegrationFactory,
  IntegrationManager,
  integrationManager,
} from './index';

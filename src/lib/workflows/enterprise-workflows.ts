// Enterprise Workflow Automation - Legacy File
// This file has been refactored into modular components
// See: src/lib/workflows/ for the new modular structure

// Re-export all functionality from the new modular structure
export * from './index';

// Legacy compatibility - maintain existing API
export {
  WorkflowEngine as EnterpriseWorkflowEngine,
  ApprovalProcessManager,
  approvalProcessManager,
  WorkflowFactory,
  WorkflowManager,
  workflowManager,
} from './index';

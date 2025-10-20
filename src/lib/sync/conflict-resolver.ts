// src/lib/sync/conflict-resolver.ts
// Conflict Resolution System for Phase 2.8
// Handles data conflicts during synchronization with intelligent merge strategies

export type ConflictResolution = 'server_wins' | 'client_wins' | 'merge' | 'user_choice';

export interface DataConflict {
  id: string;
  entityType: string;
  entityId: string;
  clientVersion: ConflictData;
  serverVersion: ConflictData;
  conflictFields: string[];
  timestamp: string;
  userId: string;
  organizationId: string;
}

export interface ConflictData {
  data: Record<string, unknown>;
  version: number;
  lastModified: string;
  modifiedBy: string;
  checksum: string;
}

export interface ConflictRule {
  entityType: string;
  field: string;
  resolution: ConflictResolution;
  priority: number;
  customMerger?: (clientValue: unknown, serverValue: unknown) => unknown;
}

export interface MergeResult {
  data: Record<string, unknown>;
  conflictsResolved: number;
  conflictsRemaining: string[];
  resolutionStrategy: ConflictResolution;
  mergeMetadata: {
    mergedAt: string;
    mergedBy: string;
    clientVersion: number;
    serverVersion: number;
  };
}

export class ConflictResolver {
  private static instance: ConflictResolver;
  private rules: Map<string, ConflictRule[]> = new Map();
  private defaultResolution: ConflictResolution = 'server_wins';

  static getInstance(): ConflictResolver {
    if (!ConflictResolver.instance) {
      ConflictResolver.instance = new ConflictResolver();
    }
    return ConflictResolver.instance;
  }

  private constructor() {
    this.initializeDefaultRules();
  }

  // Initialize default conflict resolution rules
  private initializeDefaultRules(): void {
    // Opportunity-specific rules
    this.addRule({
      entityType: 'opportunity',
      field: 'deal_value',
      resolution: 'server_wins', // Financial data from server is authoritative
      priority: 1
    });

    this.addRule({
      entityType: 'opportunity',
      field: 'notes',
      resolution: 'merge', // Merge notes content
      priority: 2,
      customMerger: this.mergeNotes
    });

    this.addRule({
      entityType: 'opportunity',
      field: 'stage',
      resolution: 'server_wins', // Stage changes are critical
      priority: 1
    });

    this.addRule({
      entityType: 'opportunity',
      field: 'last_contact_date',
      resolution: 'client_wins', // Client has most recent contact info
      priority: 3
    });

    // KPI-specific rules
    this.addRule({
      entityType: 'kpi',
      field: 'value',
      resolution: 'server_wins', // KPI calculations are server-authoritative
      priority: 1
    });

    this.addRule({
      entityType: 'kpi',
      field: 'custom_notes',
      resolution: 'merge',
      priority: 2,
      customMerger: this.mergeNotes
    });

    // Activity-specific rules
    this.addRule({
      entityType: 'activity',
      field: 'completed_at',
      resolution: 'client_wins', // Client knows when activity was completed
      priority: 1
    });

    this.addRule({
      entityType: 'activity',
      field: 'outcome',
      resolution: 'merge',
      priority: 2,
      customMerger: this.mergeText
    });

    // Contact-specific rules
    this.addRule({
      entityType: 'contact',
      field: 'phone',
      resolution: 'client_wins', // Field updates from client
      priority: 2
    });

    this.addRule({
      entityType: 'contact',
      field: 'email',
      resolution: 'client_wins',
      priority: 2
    });
  }

  // Add a conflict resolution rule
  addRule(rule: ConflictRule): void {
    const rules = this.rules.get(rule.entityType) || [];
    
    // Remove existing rule for same field
    const filteredRules = rules.filter(r => r.field !== rule.field);
    filteredRules.push(rule);
    
    // Sort by priority (lower number = higher priority)
    filteredRules.sort((a, b) => a.priority - b.priority);
    
    this.rules.set(rule.entityType, filteredRules);
  }

  // Detect conflicts between client and server data
  detectConflicts(
    entityType: string,
    entityId: string,
    clientData: ConflictData,
    serverData: ConflictData,
    userId: string,
    organizationId: string
  ): DataConflict | null {
    const conflictFields: string[] = [];

    // Compare each field
    for (const [field, clientValue] of Object.entries(clientData.data)) {
      const serverValue = serverData.data[field];
      
      if (!this.valuesEqual(clientValue, serverValue)) {
        conflictFields.push(field);
      }
    }

    // Check for fields that exist only on server
    for (const [field, serverValue] of Object.entries(serverData.data)) {
      if (!(field in clientData.data) && serverValue !== null && serverValue !== undefined) {
        conflictFields.push(field);
      }
    }

    if (conflictFields.length === 0) {
      return null; // No conflicts
    }

    return {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityType,
      entityId,
      clientVersion: clientData,
      serverVersion: serverData,
      conflictFields,
      timestamp: new Date().toISOString(),
      userId,
      organizationId
    };
  }

  // Resolve conflicts using defined rules
  resolveConflict(conflict: DataConflict): MergeResult {
    const mergedData: Record<string, unknown> = {};
    const resolvedConflicts: string[] = [];
    const remainingConflicts: string[] = [];

    // Start with server data as base
    Object.assign(mergedData, conflict.serverVersion.data);

    // Apply conflict resolution for each conflicting field
    for (const field of conflict.conflictFields) {
      const rule = this.getRule(conflict.entityType, field);
      const clientValue = conflict.clientVersion.data[field];
      const serverValue = conflict.serverVersion.data[field];

      try {
        switch (rule.resolution) {
          case 'server_wins':
            mergedData[field] = serverValue;
            resolvedConflicts.push(field);
            break;

          case 'client_wins':
            mergedData[field] = clientValue;
            resolvedConflicts.push(field);
            break;

          case 'merge':
            if (rule.customMerger) {
              mergedData[field] = rule.customMerger(clientValue, serverValue);
              resolvedConflicts.push(field);
            } else {
              mergedData[field] = this.defaultMerge(clientValue, serverValue);
              resolvedConflicts.push(field);
            }
            break;

          case 'user_choice':
            // Leave as-is for manual resolution
            remainingConflicts.push(field);
            break;

          default:
            // Use default resolution
            mergedData[field] = serverValue;
            resolvedConflicts.push(field);
        }
      } catch (error) {
        console.error(`Error resolving conflict for field ${field}:`, error);
        remainingConflicts.push(field);
      }
    }

    return {
      data: mergedData,
      conflictsResolved: resolvedConflicts.length,
      conflictsRemaining: remainingConflicts,
      resolutionStrategy: this.getMajorityResolution(conflict),
      mergeMetadata: {
        mergedAt: new Date().toISOString(),
        mergedBy: conflict.userId,
        clientVersion: conflict.clientVersion.version,
        serverVersion: conflict.serverVersion.version
      }
    };
  }

  // Get resolution rule for entity type and field
  private getRule(entityType: string, field: string): ConflictRule {
    const rules = this.rules.get(entityType) || [];
    const rule = rules.find(r => r.field === field);
    
    if (rule) {
      return rule;
    }

    // Return default rule
    return {
      entityType,
      field,
      resolution: this.defaultResolution,
      priority: 999
    };
  }

  // Get majority resolution strategy for the conflict
  private getMajorityResolution(conflict: DataConflict): ConflictResolution {
    const resolutions: ConflictResolution[] = [];
    
    for (const field of conflict.conflictFields) {
      const rule = this.getRule(conflict.entityType, field);
      resolutions.push(rule.resolution);
    }

    // Count occurrences
    const counts = resolutions.reduce((acc, resolution) => {
      acc[resolution] = (acc[resolution] || 0) + 1;
      return acc;
    }, {} as Record<ConflictResolution, number>);

    // Return most common resolution
    return Object.entries(counts).reduce((a, b) => 
      counts[a[0] as ConflictResolution] > counts[b[0] as ConflictResolution] ? a : b
    )[0] as ConflictResolution;
  }

  // Check if two values are equal (deep comparison for objects)
  private valuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    
    if (a === null || b === null || a === undefined || b === undefined) {
      return a === b;
    }

    if (typeof a !== typeof b) return false;

    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    return false;
  }

  // Default merge strategy for simple values
  private defaultMerge(clientValue: unknown, serverValue: unknown): unknown {
    // For timestamps, use the more recent one
    if (this.isTimestamp(clientValue) && this.isTimestamp(serverValue)) {
      const clientTime = new Date(clientValue as string).getTime();
      const serverTime = new Date(serverValue as string).getTime();
      return clientTime > serverTime ? clientValue : serverValue;
    }

    // For numbers, use the larger value
    if (typeof clientValue === 'number' && typeof serverValue === 'number') {
      return Math.max(clientValue, serverValue);
    }

    // For strings, concatenate with separator
    if (typeof clientValue === 'string' && typeof serverValue === 'string') {
      return this.mergeText(clientValue, serverValue);
    }

    // Default to server value
    return serverValue;
  }

  // Custom merger for notes and text fields
  private mergeNotes = (clientValue: unknown, serverValue: unknown): string => {
    const client = (clientValue as string) || '';
    const server = (serverValue as string) || '';
    
    if (!client) return server;
    if (!server) return client;
    
    // Simple merge with timestamp
    const timestamp = new Date().toISOString();
    return `${server}\n\n--- Merged on ${timestamp} ---\n${client}`;
  };

  // Custom merger for general text fields
  private mergeText = (clientValue: unknown, serverValue: unknown): string => {
    const client = (clientValue as string) || '';
    const server = (serverValue as string) || '';
    
    if (!client) return server;
    if (!server) return client;
    
    // If values are very similar, keep the longer one
    if (this.textSimilarity(client, server) > 0.8) {
      return client.length > server.length ? client : server;
    }
    
    // Otherwise combine them
    return `${server} | ${client}`;
  };

  // Check if value looks like a timestamp
  private isTimestamp(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    
    const timestamp = new Date(value);
    return !isNaN(timestamp.getTime()) && value.includes('T');
  }

  // Calculate text similarity (simple Levenshtein-based)
  private textSimilarity(a: string, b: string): number {
    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(a, b);
    return (maxLength - distance) / maxLength;
  }

  // Calculate Levenshtein distance
  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[b.length][a.length];
  }

  // Set default resolution strategy
  setDefaultResolution(resolution: ConflictResolution): void {
    this.defaultResolution = resolution;
  }

  // Get all rules for an entity type
  getRules(entityType: string): ConflictRule[] {
    return this.rules.get(entityType) || [];
  }

  // Remove a rule
  removeRule(entityType: string, field: string): void {
    const rules = this.rules.get(entityType) || [];
    const filteredRules = rules.filter(r => r.field !== field);
    this.rules.set(entityType, filteredRules);
  }

  // Clear all rules
  clearRules(): void {
    this.rules.clear();
    this.initializeDefaultRules();
  }
}

// Export singleton instance
export const conflictResolver = ConflictResolver.getInstance();
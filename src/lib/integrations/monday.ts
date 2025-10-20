/**
 * Monday.com GraphQL Integration Client
 * Provides a comprehensive interface for interacting with Monday.com API
 */

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface MondayConfig {
  apiToken: string;
  apiVersion?: string;
  endpoint?: string;
}

export interface MondayBoard {
  id: string;
  name: string;
  description?: string;
  state: 'active' | 'archived' | 'deleted';
  board_kind: 'public' | 'private' | 'share';
  workspace_id?: string;
  columns?: MondayColumn[];
  items_count?: number;
}

export interface MondayColumn {
  id: string;
  title: string;
  type: string;
  settings_str?: string;
  description?: string;
}

export interface MondayItem {
  id: string;
  name: string;
  board?: {
    id: string;
    name: string;
  };
  group?: {
    id: string;
    title: string;
  };
  column_values?: MondayColumnValue[];
  state?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MondayColumnValue {
  id: string;
  title: string;
  type: string;
  text?: string;
  value?: string;
  additional_info?: Record<string, unknown>;
}

export interface MondayWorkspace {
  id: string;
  name: string;
  kind: string;
  description?: string;
}

export interface MondayUser {
  id: string;
  name: string;
  email: string;
  photo_thumb?: string;
  is_admin?: boolean;
  is_guest?: boolean;
}

export interface MondayWebhookConfig {
  board_id: string;
  url: string;
  event: 'create_item' | 'change_column_value' | 'change_status_column_value' | 'create_update' | 'item_deleted';
  config?: Record<string, unknown>;
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

const QUERIES = {
  // Get boards with columns
  GET_BOARDS: `
    query GetBoards($ids: [ID!], $limit: Int) {
      boards(ids: $ids, limit: $limit) {
        id
        name
        description
        state
        board_kind
        workspace_id
        items_count
        columns {
          id
          title
          type
          settings_str
          description
        }
      }
    }
  `,

  // Get items from a board
  GET_ITEMS: `
    query GetItems($board_id: ID!, $limit: Int, $page: Int) {
      boards(ids: [$board_id]) {
        items_page(limit: $limit, query_params: {page: $page}) {
          cursor
          items {
            id
            name
            state
            created_at
            updated_at
            group {
              id
              title
            }
            column_values {
              id
              title
              type
              text
              value
            }
          }
        }
      }
    }
  `,

  // Get specific item details
  GET_ITEM: `
    query GetItem($item_id: ID!) {
      items(ids: [$item_id]) {
        id
        name
        state
        created_at
        updated_at
        board {
          id
          name
        }
        group {
          id
          title
        }
        column_values {
          id
          title
          type
          text
          value
          additional_info
        }
      }
    }
  `,

  // Get workspaces
  GET_WORKSPACES: `
    query GetWorkspaces {
      workspaces {
        id
        name
        kind
        description
      }
    }
  `,

  // Get current user
  GET_ME: `
    query GetMe {
      me {
        id
        name
        email
        photo_thumb
        is_admin
        is_guest
      }
    }
  `,

  // Get account info
  GET_ACCOUNT: `
    query GetAccount {
      account {
        id
        name
        slug
        plan {
          max_users
          period
          tier
          version
        }
      }
    }
  `
};

// =============================================================================
// GRAPHQL MUTATIONS
// =============================================================================

const MUTATIONS = {
  // Create new item
  CREATE_ITEM: `
    mutation CreateItem($board_id: ID!, $item_name: String!, $group_id: String, $column_values: JSON) {
      create_item(
        board_id: $board_id
        item_name: $item_name
        group_id: $group_id
        column_values: $column_values
      ) {
        id
        name
        created_at
        column_values {
          id
          title
          text
          value
        }
      }
    }
  `,

  // Update item
  UPDATE_ITEM: `
    mutation UpdateItem($item_id: ID!, $board_id: ID!, $column_values: JSON) {
      change_multiple_column_values(
        item_id: $item_id
        board_id: $board_id
        column_values: $column_values
      ) {
        id
        name
        updated_at
        column_values {
          id
          title
          text
          value
        }
      }
    }
  `,

  // Update column value
  CHANGE_COLUMN_VALUE: `
    mutation ChangeColumnValue($board_id: ID!, $item_id: ID!, $column_id: String!, $value: JSON!) {
      change_column_value(
        board_id: $board_id
        item_id: $item_id
        column_id: $column_id
        value: $value
      ) {
        id
        name
      }
    }
  `,

  // Delete item
  DELETE_ITEM: `
    mutation DeleteItem($item_id: ID!) {
      delete_item(item_id: $item_id) {
        id
      }
    }
  `,

  // Archive item
  ARCHIVE_ITEM: `
    mutation ArchiveItem($item_id: ID!) {
      archive_item(item_id: $item_id) {
        id
      }
    }
  `,

  // Create board
  CREATE_BOARD: `
    mutation CreateBoard($board_name: String!, $board_kind: BoardKind!, $workspace_id: ID, $description: String) {
      create_board(
        board_name: $board_name
        board_kind: $board_kind
        workspace_id: $workspace_id
        description: $description
      ) {
        id
        name
        description
        state
      }
    }
  `,

  // Create webhook
  CREATE_WEBHOOK: `
    mutation CreateWebhook($board_id: ID!, $url: String!, $event: WebhookEventType!, $config: JSON) {
      create_webhook(
        board_id: $board_id
        url: $url
        event: $event
        config: $config
      ) {
        id
        board_id
      }
    }
  `,

  // Delete webhook
  DELETE_WEBHOOK: `
    mutation DeleteWebhook($id: ID!) {
      delete_webhook(id: $id) {
        id
      }
    }
  `
};

// =============================================================================
// MONDAY.COM CLIENT CLASS
// =============================================================================

export class MondayClient {
  private apiToken: string;
  private endpoint: string;
  private apiVersion: string;

  constructor(config: MondayConfig) {
    this.apiToken = config.apiToken;
    this.endpoint = config.endpoint || 'https://api.monday.com/v2';
    this.apiVersion = config.apiVersion || '2024-04';
  }

  /**
   * Execute a GraphQL query or mutation
   */
  private async execute<T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiToken,
          'API-Version': this.apiVersion
        },
        body: JSON.stringify({
          query,
          variables: variables || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Monday.com API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      return result.data as T;
    } catch (error) {
      console.error('Monday.com API execution error:', error);
      throw error;
    }
  }

  // ===========================================================================
  // QUERY METHODS
  // ===========================================================================

  /**
   * Get boards
   */
  async getBoards(ids?: string[], limit = 50): Promise<MondayBoard[]> {
    const data = await this.execute<{ boards: MondayBoard[] }>(
      QUERIES.GET_BOARDS,
      { ids, limit }
    );
    return data.boards || [];
  }

  /**
   * Get a specific board
   */
  async getBoard(boardId: string): Promise<MondayBoard | null> {
    const boards = await this.getBoards([boardId]);
    return boards[0] || null;
  }

  /**
   * Get items from a board
   */
  async getItems(boardId: string, limit = 50, page = 1): Promise<MondayItem[]> {
    const data = await this.execute<{ boards: Array<{ items_page: { items: MondayItem[] } }> }>(
      QUERIES.GET_ITEMS,
      { board_id: boardId, limit, page }
    );
    return data.boards?.[0]?.items_page?.items || [];
  }

  /**
   * Get a specific item
   */
  async getItem(itemId: string): Promise<MondayItem | null> {
    const data = await this.execute<{ items: MondayItem[] }>(
      QUERIES.GET_ITEM,
      { item_id: itemId }
    );
    return data.items?.[0] || null;
  }

  /**
   * Get workspaces
   */
  async getWorkspaces(): Promise<MondayWorkspace[]> {
    const data = await this.execute<{ workspaces: MondayWorkspace[] }>(
      QUERIES.GET_WORKSPACES
    );
    return data.workspaces || [];
  }

  /**
   * Get current user info
   */
  async getMe(): Promise<MondayUser | null> {
    const data = await this.execute<{ me: MondayUser }>(QUERIES.GET_ME);
    return data.me || null;
  }

  /**
   * Get account info
   */
  async getAccount(): Promise<{ id: string; name: string; slug: string } | null> {
    const data = await this.execute<{ account: { id: string; name: string; slug: string } }>(
      QUERIES.GET_ACCOUNT
    );
    return data.account || null;
  }

  // ===========================================================================
  // MUTATION METHODS
  // ===========================================================================

  /**
   * Create a new item on a board
   */
  async createItem(
    boardId: string,
    itemName: string,
    groupId?: string,
    columnValues?: Record<string, unknown>
  ): Promise<MondayItem> {
    const data = await this.execute<{ create_item: MondayItem }>(
      MUTATIONS.CREATE_ITEM,
      {
        board_id: boardId,
        item_name: itemName,
        group_id: groupId,
        column_values: columnValues ? JSON.stringify(columnValues) : undefined
      }
    );
    return data.create_item;
  }

  /**
   * Update multiple column values on an item
   */
  async updateItem(
    itemId: string,
    boardId: string,
    columnValues: Record<string, unknown>
  ): Promise<MondayItem> {
    const data = await this.execute<{ change_multiple_column_values: MondayItem }>(
      MUTATIONS.UPDATE_ITEM,
      {
        item_id: itemId,
        board_id: boardId,
        column_values: JSON.stringify(columnValues)
      }
    );
    return data.change_multiple_column_values;
  }

  /**
   * Change a single column value
   */
  async changeColumnValue(
    boardId: string,
    itemId: string,
    columnId: string,
    value: unknown
  ): Promise<{ id: string; name: string }> {
    const data = await this.execute<{ change_column_value: { id: string; name: string } }>(
      MUTATIONS.CHANGE_COLUMN_VALUE,
      {
        board_id: boardId,
        item_id: itemId,
        column_id: columnId,
        value
      }
    );
    return data.change_column_value;
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId: string): Promise<{ id: string }> {
    const data = await this.execute<{ delete_item: { id: string } }>(
      MUTATIONS.DELETE_ITEM,
      { item_id: itemId }
    );
    return data.delete_item;
  }

  /**
   * Archive an item
   */
  async archiveItem(itemId: string): Promise<{ id: string }> {
    const data = await this.execute<{ archive_item: { id: string } }>(
      MUTATIONS.ARCHIVE_ITEM,
      { item_id: itemId }
    );
    return data.archive_item;
  }

  /**
   * Create a new board
   */
  async createBoard(
    boardName: string,
    boardKind: 'public' | 'private' | 'share',
    workspaceId?: string,
    description?: string
  ): Promise<MondayBoard> {
    const data = await this.execute<{ create_board: MondayBoard }>(
      MUTATIONS.CREATE_BOARD,
      {
        board_name: boardName,
        board_kind: boardKind,
        workspace_id: workspaceId,
        description
      }
    );
    return data.create_board;
  }

  /**
   * Create a webhook
   */
  async createWebhook(config: MondayWebhookConfig): Promise<{ id: string; board_id: string }> {
    const data = await this.execute<{ create_webhook: { id: string; board_id: string } }>(
      MUTATIONS.CREATE_WEBHOOK,
      {
        board_id: config.board_id,
        url: config.url,
        event: config.event,
        config: config.config ? JSON.stringify(config.config) : undefined
      }
    );
    return data.create_webhook;
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<{ id: string }> {
    const data = await this.execute<{ delete_webhook: { id: string } }>(
      MUTATIONS.DELETE_WEBHOOK,
      { id: webhookId }
    );
    return data.delete_webhook;
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /**
   * Test the connection to Monday.com
   */
  async testConnection(): Promise<{ success: boolean; user?: MondayUser; error?: string }> {
    try {
      const user = await this.getMe();
      if (user) {
        return { success: true, user };
      }
      return { success: false, error: 'Unable to retrieve user information' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search items by name
   */
  async searchItems(boardId: string, searchTerm: string): Promise<MondayItem[]> {
    const items = await this.getItems(boardId, 100);
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  /**
   * Get column value as text
   */
  getColumnValueText(item: MondayItem, columnId: string): string | undefined {
    const columnValue = item.column_values?.find(cv => cv.id === columnId);
    return columnValue?.text || columnValue?.value;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a Monday.com client instance
 */
export function createMondayClient(apiToken: string, options?: Partial<MondayConfig>): MondayClient {
  return new MondayClient({
    apiToken,
    ...options
  });
}

/**
 * Format column values for Monday.com API
 */
export function formatColumnValues(values: Record<string, unknown>): Record<string, unknown> {
  const formatted: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) continue;
    
    // Handle different column types
    if (typeof value === 'string' || typeof value === 'number') {
      formatted[key] = value;
    } else if (typeof value === 'object') {
      formatted[key] = JSON.stringify(value);
    }
  }
  
  return formatted;
}

/**
 * Parse Monday.com column value
 */
export function parseColumnValue(columnValue: MondayColumnValue): unknown {
  if (!columnValue.value) return columnValue.text;
  
  try {
    return JSON.parse(columnValue.value);
  } catch {
    return columnValue.value;
  }
}

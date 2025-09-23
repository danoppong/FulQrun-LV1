export interface IntegrationConnectionData {
  id: string
  name: string
  type: string
  status: 'connected' | 'disconnected' | 'error'
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface IntegrationAPI {
  getConnections(): Promise<IntegrationConnectionData[]>
  createConnection(data: Partial<IntegrationConnectionData>): Promise<IntegrationConnectionData>
  updateConnection(id: string, data: Partial<IntegrationConnectionData>): Promise<IntegrationConnectionData>
  deleteConnection(id: string): Promise<void>
  testConnection(id: string): Promise<boolean>
}

class IntegrationAPIImpl implements IntegrationAPI {
  async getConnections(): Promise<IntegrationConnectionData[]> {
    // Mock implementation
    return []
  }

  async createConnection(data: Partial<IntegrationConnectionData>): Promise<IntegrationConnectionData> {
    // Mock implementation
    return {
      id: 'mock-id',
      name: data.name || 'Mock Integration',
      type: data.type || 'mock',
      status: 'connected',
      config: data.config || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  async updateConnection(id: string, data: Partial<IntegrationConnectionData>): Promise<IntegrationConnectionData> {
    // Mock implementation
    return {
      id,
      name: data.name || 'Mock Integration',
      type: data.type || 'mock',
      status: 'connected',
      config: data.config || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  async deleteConnection(id: string): Promise<void> {
    // Mock implementation
  }

  async testConnection(id: string): Promise<boolean> {
    // Mock implementation
    return true
  }
}

export const integrationAPI = new IntegrationAPIImpl()

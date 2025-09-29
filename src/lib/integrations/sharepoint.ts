// SharePoint integration for document management
export interface SharePointDocument {
  id: string
  opportunity_id: string | null
  stage_name: string
  document_name: string
  document_type: string
  sharepoint_url: string
  local_path: string | null
  file_size: number | null
  is_required: boolean
  is_completed: boolean
  uploaded_by: string | null
  uploaded_at: string | null
  organization_id: string
  created_at: string
  updated_at: string
}

export interface SharePointConfig {
  siteUrl: string
  tenantId: string
  clientId: string
  clientSecret: string
  accessToken?: string
}

export class SharePointIntegration {
  private config: SharePointConfig

  constructor(config: SharePointConfig | string) {
    if (typeof config === 'string') {
      // Handle case where only access token is passed
      this.config = {
        siteUrl: 'mock-site.sharepoint.com',
        tenantId: 'mock-tenant',
        clientId: 'mock-client',
        clientSecret: 'mock-secret',
        accessToken: config
      }
    } else {
      this.config = config
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      // Mock authentication - in real implementation, this would use OAuth 2.0
      console.log('Authenticating with SharePoint...')
      return true
    } catch (error) {
      console.error('SharePoint authentication failed:', error)
      return false
    }
  }

  async uploadDocument(
    document: File,
    opportunityId: string,
    stageName: string
  ): Promise<SharePointDocument | null> {
    try {
      // Mock upload - in real implementation, this would upload to SharePoint
      console.log('Uploading document to SharePoint:', document.name)
      
      const mockDocument: SharePointDocument = {
        id: `doc-${Date.now()}`,
        opportunity_id: opportunityId,
        stage_name: stageName,
        document_name: document.name,
        document_type: document.type,
        sharepoint_url: `https://${this.config.siteUrl}/documents/${document.name}`,
        local_path: null,
        file_size: document.size,
        is_required: false,
        is_completed: true,
        uploaded_by: 'current-user',
        uploaded_at: new Date().toISOString(),
        organization_id: 'default-org',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return mockDocument
    } catch (error) {
      console.error('SharePoint upload failed:', error)
      return null
    }
  }

  async getDocuments(opportunityId: string): Promise<SharePointDocument[]> {
    try {
      // Mock data - in real implementation, this would fetch from SharePoint
      console.log('Fetching documents for opportunity:', opportunityId)
      
      return [
        {
          id: 'doc-1',
          opportunity_id: opportunityId,
          stage_name: 'prospecting',
          document_name: 'Proposal.pdf',
          document_type: 'application/pdf',
          sharepoint_url: `https://${this.config.siteUrl}/documents/Proposal.pdf`,
          local_path: null,
          file_size: 1024000,
          is_required: true,
          is_completed: true,
          uploaded_by: 'user-1',
          uploaded_at: new Date().toISOString(),
          organization_id: 'default-org',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    } catch (error) {
      console.error('SharePoint fetch failed:', error)
      return []
    }
  }

  async deleteDocument(siteId: string, documentId: string): Promise<boolean> {
    try {
      // Mock deletion - in real implementation, this would delete from SharePoint
      console.log('Deleting document:', documentId, 'from site:', siteId)
      return true
    } catch (error) {
      console.error('SharePoint deletion failed:', error)
      return false
    }
  }

  async getPEAKDocuments(siteId: string, opportunityId: string): Promise<Array<{ id: string; name: string; url: string; size: number; modified: string }>> {
    try {
      // Mock PEAK documents - in real implementation, this would fetch from SharePoint
      console.log('Fetching PEAK documents for opportunity:', opportunityId, 'from site:', siteId)
      
      return [
        {
          id: `doc-peak-${opportunityId}`,
          name: 'PEAK Process Document.pdf',
          url: `https://${this.config.siteUrl}/documents/PEAK-${opportunityId}.pdf`,
          size: 2048000,
          lastModified: new Date().toISOString(),
          createdBy: 'System',
          webUrl: `https://${this.config.siteUrl}/documents/PEAK-${opportunityId}.pdf`,
          downloadUrl: `https://${this.config.siteUrl}/documents/PEAK-${opportunityId}.pdf`,
          thumbnailUrl: null
        }
      ]
    } catch (error) {
      console.error('SharePoint PEAK documents fetch failed:', error)
      return []
    }
  }

  async getDocumentsFromSite(siteId: string, folderPath: string): Promise<Array<{ id: string; name: string; url: string; size: number; modified: string }>> {
    try {
      // Mock documents - in real implementation, this would fetch from SharePoint
      console.log('Fetching documents from site:', siteId, 'folder:', folderPath)
      
      return [
        {
          id: `doc-${Date.now()}`,
          name: 'Sample Document.pdf',
          url: `https://${this.config.siteUrl}/documents/Sample.pdf`,
          size: 1024000,
          lastModified: new Date().toISOString(),
          createdBy: 'User',
          webUrl: `https://${this.config.siteUrl}/documents/Sample.pdf`,
          downloadUrl: `https://${this.config.siteUrl}/documents/Sample.pdf`,
          thumbnailUrl: null
        }
      ]
    } catch (error) {
      console.error('SharePoint documents fetch failed:', error)
      return []
    }
  }

  async uploadDocumentToSite(
    siteId: string,
    folderPath: string,
    fileName: string,
    _fileBuffer: ArrayBuffer,
    _mimeType: string
  ): Promise<{ success: boolean; documentId?: string; url?: string; error?: string }> {
    try {
      // Mock upload - in real implementation, this would upload to SharePoint
      console.log('Uploading document:', fileName, 'to site:', siteId, 'folder:', folderPath)
      
      const documentId = `doc-${Date.now()}`
      const url = `https://${this.config.siteUrl}/documents/${fileName}`
      
      return {
        success: true,
        documentId,
        url
      }
    } catch (error) {
      console.error('SharePoint upload failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async getFolders(siteId: string, folderPath: string): Promise<Array<{ id: string; name: string; url: string }>> {
    try {
      // Mock folders - in real implementation, this would fetch from SharePoint
      console.log('Fetching folders from site:', siteId, 'folder:', folderPath)
      
      return [
        {
          id: `folder-${Date.now()}`,
          name: 'PEAK Process',
          url: `https://${this.config.siteUrl}/folders/PEAK`,
          webUrl: `https://${this.config.siteUrl}/folders/PEAK`,
          lastModified: new Date().toISOString(),
          createdBy: 'System'
        },
        {
          id: `folder-${Date.now() + 1}`,
          name: 'Documents',
          url: `https://${this.config.siteUrl}/folders/Documents`,
          webUrl: `https://${this.config.siteUrl}/folders/Documents`,
          lastModified: new Date().toISOString(),
          createdBy: 'System'
        }
      ]
    } catch (error) {
      console.error('SharePoint folders fetch failed:', error)
      return []
    }
  }

  async createFolder(siteId: string, parentPath: string, folderName: string): Promise<{ success: boolean; folderId?: string; url?: string; error?: string }> {
    try {
      // Mock folder creation - in real implementation, this would create in SharePoint
      console.log('Creating folder:', folderName, 'in site:', siteId, 'parent:', parentPath)
      
      const folderId = `folder-${Date.now()}`
      const url = `https://${this.config.siteUrl}/folders/${folderName}`
      
      return {
        success: true,
        folderId,
        url
      }
    } catch (error) {
      console.error('SharePoint folder creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Folder creation failed'
      }
    }
  }

  async createPEAKFolderStructure(siteId: string, opportunityId: string, _opportunityName?: string): Promise<{ success: boolean; folders?: Record<string, string>; error?: string }> {
    try {
      // Mock PEAK folder structure creation - in real implementation, this would create in SharePoint
      console.log('Creating PEAK folder structure for opportunity:', opportunityId, 'in site:', siteId)
      
      const folders = {
        'prospecting': `folder-peak-prospecting-${opportunityId}`,
        'engaging': `folder-peak-engaging-${opportunityId}`,
        'advancing': `folder-peak-advancing-${opportunityId}`,
        'key_decision': `folder-peak-key-decision-${opportunityId}`
      }
      
      return {
        success: true,
        folders
      }
    } catch (error) {
      console.error('SharePoint PEAK folder structure creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PEAK folder structure creation failed'
      }
    }
  }

  async getSites(): Promise<Array<{ id: string; name: string; url: string; description?: string }>> {
    try {
      // Mock sites - in real implementation, this would fetch from SharePoint
      console.log('Fetching SharePoint sites')
      
      return [
        {
          id: 'site-1',
          name: 'Main Site',
          url: `https://${this.config.siteUrl}`,
          webUrl: `https://${this.config.siteUrl}`,
          lastModified: new Date().toISOString(),
          createdBy: 'System'
        }
      ]
    } catch (error) {
      console.error('SharePoint sites fetch failed:', error)
      return []
    }
  }
}

export const sharepointAPI = {
  createClient: (config: SharePointConfig) => new SharePointIntegration(config),
  
  // Mock functions for API routes
  uploadDocument: async (document: File, opportunityId: string, stageName: string) => {
    const client = new SharePointIntegration({
      siteUrl: 'mock-site.sharepoint.com',
      tenantId: 'mock-tenant',
      clientId: 'mock-client',
      clientSecret: 'mock-secret'
    })
    return client.uploadDocument(document, opportunityId, stageName)
  },

  getDocuments: async (opportunityId: string) => {
    const client = new SharePointIntegration({
      siteUrl: 'mock-site.sharepoint.com',
      tenantId: 'mock-tenant',
      clientId: 'mock-client',
      clientSecret: 'mock-secret'
    })
    return client.getDocuments(opportunityId)
  },

  deleteDocument: async (documentId: string, siteId?: string) => {
    const client = new SharePointIntegration({
      siteUrl: 'mock-site.sharepoint.com',
      tenantId: 'mock-tenant',
      clientId: 'mock-client',
      clientSecret: 'mock-secret'
    })
    return client.deleteDocument(siteId || 'mock-site', documentId)
  }
}

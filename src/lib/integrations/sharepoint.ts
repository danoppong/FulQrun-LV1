import { IntegrationConnectionData } from '@/lib/api/integrations'

export interface SharePointDocument {
  id: string
  name: string
  url: string
  size: number
  lastModified: string
  createdBy: string
  webUrl: string
  downloadUrl: string
  thumbnailUrl?: string
}

export interface SharePointFolder {
  id: string
  name: string
  url: string
  webUrl: string
  childCount: number
  lastModified: string
}

export interface SharePointSite {
  id: string
  displayName: string
  webUrl: string
  description?: string
  lastModified: string
}

export interface SharePointUploadResult {
  success: boolean
  documentId?: string
  url?: string
  error?: string
}

export class SharePointIntegration {
  private accessToken: string
  private baseUrl: string = 'https://graph.microsoft.com/v1.0'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * Get SharePoint sites accessible to the user
   */
  async getSites(): Promise<SharePointSite[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sites?search=*`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch sites: ${response.statusText}`)
      }

      const data = await response.json()
      return data.value.map((site: any) => ({
        id: site.id,
        displayName: site.displayName,
        webUrl: site.webUrl,
        description: site.description,
        lastModified: site.lastModifiedDateTime
      }))
    } catch (error) {
      console.error('SharePoint getSites error:', error)
      throw new Error('Failed to fetch SharePoint sites')
    }
  }

  /**
   * Get folders in a SharePoint site
   */
  async getFolders(siteId: string, folderPath: string = '/'): Promise<SharePointFolder[]> {
    try {
      const encodedPath = encodeURIComponent(folderPath)
      const response = await fetch(
        `${this.baseUrl}/sites/${siteId}/drive/root:${encodedPath}:/children?$filter=folder ne null`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch folders: ${response.statusText}`)
      }

      const data = await response.json()
      return data.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.webUrl,
        webUrl: item.webUrl,
        childCount: item.folder?.childCount || 0,
        lastModified: item.lastModifiedDateTime
      }))
    } catch (error) {
      console.error('SharePoint getFolders error:', error)
      throw new Error('Failed to fetch SharePoint folders')
    }
  }

  /**
   * Get documents in a SharePoint folder
   */
  async getDocuments(siteId: string, folderPath: string = '/'): Promise<SharePointDocument[]> {
    try {
      const encodedPath = encodeURIComponent(folderPath)
      const response = await fetch(
        `${this.baseUrl}/sites/${siteId}/drive/root:${encodedPath}:/children?$filter=folder eq null`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`)
      }

      const data = await response.json()
      return data.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.webUrl,
        size: item.size,
        lastModified: item.lastModifiedDateTime,
        createdBy: item.createdBy?.user?.displayName || 'Unknown',
        webUrl: item.webUrl,
        downloadUrl: item['@microsoft.graph.downloadUrl'],
        thumbnailUrl: item.thumbnails?.[0]?.medium?.url
      }))
    } catch (error) {
      console.error('SharePoint getDocuments error:', error)
      throw new Error('Failed to fetch SharePoint documents')
    }
  }

  /**
   * Create a folder in SharePoint
   */
  async createFolder(siteId: string, parentPath: string, folderName: string): Promise<SharePointFolder> {
    try {
      const encodedPath = encodeURIComponent(parentPath)
      const response = await fetch(
        `${this.baseUrl}/sites/${siteId}/drive/root:${encodedPath}:/children`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: folderName,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename'
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to create folder: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        id: data.id,
        name: data.name,
        url: data.webUrl,
        webUrl: data.webUrl,
        childCount: 0,
        lastModified: data.lastModifiedDateTime
      }
    } catch (error) {
      console.error('SharePoint createFolder error:', error)
      throw new Error('Failed to create SharePoint folder')
    }
  }

  /**
   * Upload a document to SharePoint
   */
  async uploadDocument(
    siteId: string,
    folderPath: string,
    fileName: string,
    fileContent: ArrayBuffer | Blob,
    contentType: string
  ): Promise<SharePointUploadResult> {
    try {
      const encodedPath = encodeURIComponent(`${folderPath}/${fileName}`)
      const response = await fetch(
        `${this.baseUrl}/sites/${siteId}/drive/root:${encodedPath}:/content`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': contentType
          },
          body: fileContent
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to upload document: ${response.statusText} - ${errorData.error?.message || ''}`)
      }

      const data = await response.json()
      return {
        success: true,
        documentId: data.id,
        url: data.webUrl
      }
    } catch (error) {
      console.error('SharePoint uploadDocument error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload document'
      }
    }
  }

  /**
   * Download a document from SharePoint
   */
  async downloadDocument(siteId: string, documentId: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(
        `${this.baseUrl}/sites/${siteId}/drive/items/${documentId}/content`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.statusText}`)
      }

      return await response.arrayBuffer()
    } catch (error) {
      console.error('SharePoint downloadDocument error:', error)
      throw new Error('Failed to download SharePoint document')
    }
  }

  /**
   * Delete a document from SharePoint
   */
  async deleteDocument(siteId: string, documentId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/sites/${siteId}/drive/items/${documentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      )

      return response.ok
    } catch (error) {
      console.error('SharePoint deleteDocument error:', error)
      return false
    }
  }

  /**
   * Search for documents in SharePoint
   */
  async searchDocuments(siteId: string, query: string): Promise<SharePointDocument[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/sites/${siteId}/drive/root/search(q='${encodeURIComponent(query)}')`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to search documents: ${response.statusText}`)
      }

      const data = await response.json()
      return data.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.webUrl,
        size: item.size,
        lastModified: item.lastModifiedDateTime,
        createdBy: item.createdBy?.user?.displayName || 'Unknown',
        webUrl: item.webUrl,
        downloadUrl: item['@microsoft.graph.downloadUrl'],
        thumbnailUrl: item.thumbnails?.[0]?.medium?.url
      }))
    } catch (error) {
      console.error('SharePoint searchDocuments error:', error)
      throw new Error('Failed to search SharePoint documents')
    }
  }

  /**
   * Get document metadata
   */
  async getDocumentMetadata(siteId: string, documentId: string): Promise<SharePointDocument> {
    try {
      const response = await fetch(
        `${this.baseUrl}/sites/${siteId}/drive/items/${documentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to get document metadata: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        id: data.id,
        name: data.name,
        url: data.webUrl,
        size: data.size,
        lastModified: data.lastModifiedDateTime,
        createdBy: data.createdBy?.user?.displayName || 'Unknown',
        webUrl: data.webUrl,
        downloadUrl: data['@microsoft.graph.downloadUrl'],
        thumbnailUrl: data.thumbnails?.[0]?.medium?.url
      }
    } catch (error) {
      console.error('SharePoint getDocumentMetadata error:', error)
      throw new Error('Failed to get document metadata')
    }
  }

  /**
   * Create PEAK process folder structure
   */
  async createPEAKFolderStructure(siteId: string, opportunityId: string, opportunityName: string): Promise<{
    success: boolean
    folders: Record<string, string>
    error?: string
  }> {
    try {
      const basePath = `/Opportunities/${opportunityName.replace(/[^a-zA-Z0-9]/g, '_')}_${opportunityId}`
      const folders: Record<string, string> = {}

      // Create main opportunity folder
      const mainFolder = await this.createFolder(siteId, '/Opportunities', `${opportunityName.replace(/[^a-zA-Z0-9]/g, '_')}_${opportunityId}`)
      folders['main'] = mainFolder.id

      // Create PEAK stage folders
      const peakStages = ['Prospecting', 'Engaging', 'Advancing', 'Key_Decision']
      for (const stage of peakStages) {
        const stageFolder = await this.createFolder(siteId, basePath, stage)
        folders[stage.toLowerCase()] = stageFolder.id
      }

      // Create subfolders for each stage
      const subfolders = {
        'prospecting': ['Research', 'Initial_Contact', 'Qualification'],
        'engaging': ['Discovery', 'Needs_Analysis', 'Champion_Development'],
        'advancing': ['Proposal', 'Demo', 'Negotiation'],
        'key_decision': ['Final_Presentation', 'Contract', 'Closing']
      }

      for (const [stage, subs] of Object.entries(subfolders)) {
        for (const sub of subs) {
          const subFolder = await this.createFolder(siteId, `${basePath}/${stage}`, sub)
          folders[`${stage}_${sub.toLowerCase()}`] = subFolder.id
        }
      }

      return {
        success: true,
        folders
      }
    } catch (error) {
      console.error('SharePoint createPEAKFolderStructure error:', error)
      return {
        success: false,
        folders: {},
        error: error instanceof Error ? error.message : 'Failed to create PEAK folder structure'
      }
    }
  }

  /**
   * Get PEAK process documents for an opportunity
   */
  async getPEAKDocuments(siteId: string, opportunityId: string, stage?: string): Promise<SharePointDocument[]> {
    try {
      const basePath = `/Opportunities`
      const searchQuery = opportunityId
      
      const documents = await this.searchDocuments(siteId, searchQuery)
      
      // Filter by stage if specified
      if (stage) {
        return documents.filter(doc => 
          doc.url.toLowerCase().includes(stage.toLowerCase())
        )
      }
      
      return documents
    } catch (error) {
      console.error('SharePoint getPEAKDocuments error:', error)
      throw new Error('Failed to get PEAK process documents')
    }
  }

  /**
   * Upload PEAK process document
   */
  async uploadPEAKDocument(
    siteId: string,
    opportunityId: string,
    stage: string,
    documentName: string,
    fileContent: ArrayBuffer | Blob,
    contentType: string
  ): Promise<SharePointUploadResult> {
    try {
      const folderPath = `/Opportunities/${opportunityId}/${stage}`
      return await this.uploadDocument(siteId, folderPath, documentName, fileContent, contentType)
    } catch (error) {
      console.error('SharePoint uploadPEAKDocument error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload PEAK document'
      }
    }
  }
}

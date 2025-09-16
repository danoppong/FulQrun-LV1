'use client'

import React, { useState, useEffect } from 'react'
import { SharePointIntegration, SharePointDocument } from '@/lib/integrations/sharepoint'

interface SharePointFolder {
  id: string
  name: string
  path: string
}

interface SharePointSite {
  id: string
  name: string
  url: string
}
import { IntegrationConnectionData } from '@/lib/api/integrations'

interface SharePointRepositoryProps {
  opportunityId: string
  opportunityName: string
  organizationId: string
  onDocumentSelect?: (document: SharePointDocument) => void
  onDocumentUpload?: (document: SharePointDocument) => void
}

export function SharePointRepository({
  opportunityId,
  opportunityName,
  organizationId,
  onDocumentSelect,
  onDocumentUpload
}: SharePointRepositoryProps) {
  const [sharepoint, setSharepoint] = useState<SharePointIntegration | null>(null)
  const [sites, setSites] = useState<SharePointSite[]>([])
  const [selectedSite, setSelectedSite] = useState<SharePointSite | null>(null)
  const [folders, setFolders] = useState<SharePointFolder[]>([])
  const [documents, setDocuments] = useState<SharePointDocument[]>([])
  const [currentPath, setCurrentPath] = useState<string>('/')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  useEffect(() => {
    initializeSharePoint()
  }, [organizationId])

  const initializeSharePoint = async () => {
    try {
      // Get SharePoint connection from integrations
      const response = await fetch(`/api/integrations/sharepoint/connection?organizationId=${organizationId}`)
      if (!response.ok) {
        throw new Error('SharePoint not connected')
      }

      const connection: any = await response.json()
      const accessToken = connection.credentials?.access_token
      
      if (!accessToken) {
        throw new Error('SharePoint access token not available')
      }

      const sp = new SharePointIntegration(accessToken)
      setSharepoint(sp)

      // Load sites
      const sitesData = await sp.getSites()
      setSites(sitesData)
      
      if (sitesData.length > 0) {
        setSelectedSite(sitesData[0])
        await loadFolderContents(sitesData[0].id, '/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize SharePoint')
    }
  }

  const loadFolderContents = async (siteId: string, path: string) => {
    if (!sharepoint) return

    try {
      setIsLoading(true)
      setError(null)

      const [foldersData, documentsData] = await Promise.all([
        sharepoint.getFolders(siteId, path),
        sharepoint.getDocumentsFromSite(siteId, path)
      ])

      setFolders(foldersData)
      setDocuments(documentsData)
      setCurrentPath(path)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder contents')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSiteChange = async (site: SharePointSite) => {
    setSelectedSite(site)
    await loadFolderContents(site.id, '/')
  }

  const handleFolderClick = async (folder: SharePointFolder) => {
    if (!selectedSite) return
    await loadFolderContents(selectedSite.id, `${currentPath}${folder.name}/`)
  }

  const handleDocumentClick = (document: SharePointDocument) => {
    onDocumentSelect?.(document)
  }

  const handleUpload = async () => {
    if (!sharepoint || !selectedSite || !uploadFile) return

    try {
      setIsLoading(true)
      setError(null)

      const fileBuffer = await uploadFile.arrayBuffer()
      const result = await sharepoint.uploadDocumentToSite(
        selectedSite.id,
        currentPath,
        uploadFile.name,
        fileBuffer,
        uploadFile.type
      )

      if (result.success) {
        // Refresh documents
        await loadFolderContents(selectedSite.id, currentPath)
        setShowUpload(false)
        setUploadFile(null)
        onDocumentUpload?.(result as any)
      } else {
        setError(result.error || 'Upload failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadFile(file)
    }
  }

  const createPEAKStructure = async () => {
    if (!sharepoint || !selectedSite) return

    try {
      setIsLoading(true)
      setError(null)

      const result = await sharepoint.createPEAKFolderStructure(
        selectedSite.id,
        opportunityId,
        opportunityName
      )

      if (result.success) {
        // Refresh folder contents
        await loadFolderContents(selectedSite.id, '/')
      } else {
        setError(result.error || 'Failed to create PEAK structure')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create PEAK structure')
    } finally {
      setIsLoading(false)
    }
  }

  if (error && !sharepoint) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-medium text-red-900 mb-2">SharePoint Not Connected</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.open('/settings?tab=integrations', '_blank')}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Connect SharePoint
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">SharePoint Repository</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={createPEAKStructure}
              disabled={isLoading}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              Create PEAK Structure
            </button>
            <button
              onClick={() => setShowUpload(true)}
              disabled={isLoading}
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* Site Selection */}
      <div className="px-6 py-4 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">SharePoint Site</label>
        <select
          value={selectedSite?.id || ''}
          onChange={(e) => {
            const site = sites.find(s => s.id === e.target.value)
            if (site) handleSiteChange(site)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sites.map(site => (
            <option key={site.id} value={site.id}>{site.name}</option>
          ))}
        </select>
      </div>

      {/* Breadcrumb */}
      <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <button
                onClick={() => loadFolderContents(selectedSite!.id, '/')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Root
              </button>
            </li>
            {currentPath.split('/').filter(Boolean).map((segment, index, array) => (
              <li key={index} className="flex items-center">
                <svg className="w-4 h-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4z" clipRule="evenodd" />
                </svg>
                <button
                  onClick={() => {
                    const path = '/' + array.slice(0, index + 1).join('/') + '/'
                    loadFolderContents(selectedSite!.id, path)
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {segment}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => loadFolderContents(selectedSite!.id, currentPath)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Folders */}
            {folders.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Folders</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {folders.map(folder => (
                    <div
                      key={folder.id}
                      onClick={() => handleFolderClick(folder)}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <svg className="w-8 h-8 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{folder.name}</p>
                          <p className="text-xs text-gray-500">Folder</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {documents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Documents</h4>
                <div className="space-y-2">
                  {documents.map(document => (
                    <div
                      key={document.id}
                      onClick={() => handleDocumentClick(document)}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{document.document_name}</p>
                          <p className="text-xs text-gray-500">
                            {Math.round((document.file_size || 0) / 1024)} KB • {document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={document.sharepoint_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {folders.length === 0 && documents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No folders or documents found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

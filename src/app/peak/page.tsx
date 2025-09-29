'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PEAKWorkflow } from '@/components/peak/PEAKWorkflow'
import { SharePointRepository } from '@/components/peak/SharePointRepository'
import { SharePointDocument } from '@/lib/integrations/sharepoint'

const PEAKProcessContent = () => {
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get('opportunityId') || ''
  const opportunityName = searchParams.get('opportunityName') || 'Sample Opportunity'
  const organizationId = searchParams.get('organizationId') || ''

  const [currentStage, setCurrentStage] = useState('prospecting')
  const [activeTab, setActiveTab] = useState<'workflow' | 'repository'>('workflow')
  const [_documents, setDocuments] = useState<Record<string, SharePointDocument[]>>({})
  const [selectedDocument, setSelectedDocument] = useState<SharePointDocument | null>(null)

  const loadOpportunityData = async () => {
    try {
      // Load opportunity data including current stage
      const response = await fetch(`/api/opportunities/${opportunityId}`)
      if (response.ok) {
        const opportunity = await response.json()
        setCurrentStage(opportunity.stage || 'prospecting')
      }
    } catch (_error) {
    }
  }

  const loadOpportunityDataCallback = useCallback(loadOpportunityData, [opportunityId])

  useEffect(() => {
    if (opportunityId) {
      loadOpportunityDataCallback()
    }
  }, [opportunityId, loadOpportunityDataCallback])

  const handleStageChange = async (newStage: string) => {
    try {
      // Update opportunity stage in database
      const response = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stage: newStage })
      })

      if (response.ok) {
        setCurrentStage(newStage)
      } else {
        throw new Error('Failed to update opportunity stage')
      }
    } catch (_error) {
    }
  }

  const handleDocumentUpload = (stage: string, document: SharePointDocument) => {
    setDocuments(prev => ({
      ...prev,
      [stage]: [...(prev[stage] || []), document]
    }))
  }

  const handleDocumentUploadWrapper = (document: SharePointDocument) => {
    handleDocumentUpload(currentStage, document)
  }

  const handleDocumentDelete = (documentId: string) => {
    setDocuments(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(stage => {
        updated[stage] = updated[stage].filter(doc => doc.id !== documentId)
      })
      return updated
    })
  }

  const handleDocumentOpen = (document: SharePointDocument) => {
    setSelectedDocument(document)
    // Open document in new tab
    window.open(document.sharepoint_url, '_blank')
  }

  const handleDocumentSelect = (document: SharePointDocument) => {
    setSelectedDocument(document)
  }

  if (!opportunityId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">PEAK Process</h1>
          <p className="text-gray-600 mb-8">Please select an opportunity to view the PEAK process workflow.</p>
          <Link
            href="/opportunities"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View Opportunities
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">PEAK Process</h1>
              <p className="text-sm text-gray-600">{opportunityName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href={`/opportunities/${opportunityId}`}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Opportunity
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('workflow')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'workflow'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              PEAK Workflow
            </button>
            <button
              onClick={() => setActiveTab('repository')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'repository'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Document Repository
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'workflow' ? (
          <PEAKWorkflow
            opportunityId={opportunityId}
            opportunityName={opportunityName}
            currentStage={currentStage}
            onStageChange={handleStageChange}
            onDocumentUpload={handleDocumentUpload}
            onDocumentDelete={handleDocumentDelete}
            onDocumentOpen={handleDocumentOpen}
          />
        ) : (
          <SharePointRepository
            opportunityId={opportunityId}
            opportunityName={opportunityName}
            organizationId={organizationId}
            onDocumentSelect={handleDocumentSelect}
            onDocumentUpload={handleDocumentUploadWrapper}
          />
        )}
      </div>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Document Preview</h3>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-gray-900">{selectedDocument.document_name}</h4>
                <p className="text-sm text-gray-600">
                  {Math.round((selectedDocument.file_size || 0) / 1024)} KB • 
                  Last modified: {selectedDocument.uploaded_at ? new Date(selectedDocument.uploaded_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <a
                  href={selectedDocument.sharepoint_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Download
                </a>
                <a
                  href={selectedDocument.sharepoint_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Open in SharePoint
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PEAKProcessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    }>
      <PEAKProcessContent />
    </Suspense>
  )
}

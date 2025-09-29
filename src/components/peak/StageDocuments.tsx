'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { SharePointDocument } from '@/lib/integrations/sharepoint'

interface StageDocumentsProps {
  opportunityId: string
  stage: string
  documents: SharePointDocument[]
  onDocumentUpload: (stage: string, document: SharePointDocument) => void
  onDocumentDelete: (documentId: string) => void
  onDocumentOpen: (document: SharePointDocument) => void
}

interface StageRequirement {
  id: string
  name: string
  description: string
  isRequired: boolean
  documentType: string
  completed: boolean
  documentId?: string
}

export function StageDocuments({
  opportunityId,
  stage,
  documents,
  onDocumentUpload,
  onDocumentDelete,
  onDocumentOpen: _onDocumentOpen
}: StageDocumentsProps) {
  const [requirements, setRequirements] = useState<StageRequirement[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null)

  useEffect(() => {
    loadStageRequirements()
  }, [loadStageRequirements])

  const loadStageRequirements = useCallback(() => {
    // Define PEAK stage requirements
    const stageRequirements: Record<string, StageRequirement[]> = {
      'prospecting': [
        {
          id: 'company_research',
          name: 'Company Research Document',
          description: 'Comprehensive research on the target company',
          isRequired: true,
          documentType: 'pdf',
          completed: false
        },
        {
          id: 'stakeholder_map',
          name: 'Stakeholder Mapping',
          description: 'Map of key stakeholders and decision makers',
          isRequired: true,
          documentType: 'pdf',
          completed: false
        },
        {
          id: 'initial_contact_notes',
          name: 'Initial Contact Notes',
          description: 'Notes from first contact with prospect',
          isRequired: false,
          documentType: 'docx',
          completed: false
        }
      ],
      'engaging': [
        {
          id: 'discovery_questions',
          name: 'Discovery Questions',
          description: 'List of discovery questions for needs analysis',
          isRequired: true,
          documentType: 'docx',
          completed: false
        },
        {
          id: 'pain_point_analysis',
          name: 'Pain Point Analysis',
          description: 'Analysis of customer pain points and challenges',
          isRequired: true,
          documentType: 'pdf',
          completed: false
        },
        {
          id: 'champion_identification',
          name: 'Champion Identification',
          description: 'Document identifying internal champions',
          isRequired: true,
          documentType: 'docx',
          completed: false
        }
      ],
      'advancing': [
        {
          id: 'solution_proposal',
          name: 'Solution Proposal',
          description: 'Detailed solution proposal and pricing',
          isRequired: true,
          documentType: 'pdf',
          completed: false
        },
        {
          id: 'demo_script',
          name: 'Demo Script',
          description: 'Script for product demonstration',
          isRequired: true,
          documentType: 'docx',
          completed: false
        },
        {
          id: 'competitor_analysis',
          name: 'Competitor Analysis',
          description: 'Analysis of competitive landscape',
          isRequired: false,
          documentType: 'pdf',
          completed: false
        }
      ],
      'key_decision': [
        {
          id: 'final_presentation',
          name: 'Final Presentation',
          description: 'Final presentation to decision committee',
          isRequired: true,
          documentType: 'pptx',
          completed: false
        },
        {
          id: 'contract_draft',
          name: 'Contract Draft',
          description: 'Draft contract and terms',
          isRequired: true,
          documentType: 'pdf',
          completed: false
        },
        {
          id: 'implementation_plan',
          name: 'Implementation Plan',
          description: 'Plan for solution implementation',
          isRequired: true,
          documentType: 'pdf',
          completed: false
        }
      ]
    }

    const stageReqs = stageRequirements[stage.toLowerCase()] || []
    
    // Mark requirements as completed if documents exist
    const updatedReqs = stageReqs.map(req => {
      const matchingDoc = documents.find(doc => 
        doc.document_name.toLowerCase().includes(req.name.toLowerCase()) ||
        doc.document_name.toLowerCase().includes(req.id.toLowerCase())
      )
      
      return {
        ...req,
        completed: !!matchingDoc,
        documentId: matchingDoc?.id
      }
    })

    setRequirements(updatedReqs)
  }, [stage, documents])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadFile(file)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !selectedRequirement) return

    try {
      // Simulate upload - in real implementation, this would call the SharePoint API
      const mockDocument: SharePointDocument = {
        id: `doc_${Date.now()}`,
        opportunity_id: opportunityId,
        stage_name: stage,
        document_name: uploadFile.name,
        document_type: uploadFile.type,
        sharepoint_url: `https://sharepoint.com/documents/${uploadFile.name}`,
        local_path: null,
        file_size: uploadFile.size,
        is_required: false,
        is_completed: true,
        uploaded_by: 'current-user',
        uploaded_at: new Date().toISOString(),
        organization_id: 'mock-org',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      onDocumentUpload(stage, mockDocument)
      
      // Update requirements
      setRequirements(prev => prev.map(req => 
        req.id === selectedRequirement 
          ? { ...req, completed: true, documentId: mockDocument.id }
          : req
      ))

      setShowUpload(false)
      setUploadFile(null)
      setSelectedRequirement(null)
    } catch (_error) {
    }
  }

  const handleDeleteDocument = (documentId: string) => {
    onDocumentDelete(documentId)
    
    // Update requirements
    setRequirements(prev => prev.map(req => 
      req.documentId === documentId 
        ? { ...req, completed: false, documentId: undefined }
        : req
    ))
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'prospecting': 'blue',
      'engaging': 'purple',
      'advancing': 'yellow',
      'key_decision': 'green'
    }
    return colors[stage.toLowerCase()] || 'gray'
  }

  const getDocumentIcon = (documentType: string) => {
    const icons: Record<string, string> = {
      'pdf': '📄',
      'docx': '📝',
      'pptx': '📊',
      'xlsx': '📈'
    }
    return icons[documentType] || '📄'
  }

  const stageColor = getStageColor(stage)
  const completedCount = requirements.filter(req => req.completed).length
  const requiredCount = requirements.filter(req => req.isRequired).length
  const requiredCompletedCount = requirements.filter(req => req.isRequired && req.completed).length

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 capitalize">{stage} Stage Documents</h3>
            <p className="text-sm text-gray-500">
              {completedCount} of {requirements.length} documents completed
              {requiredCount > 0 && ` (${requiredCompletedCount}/${requiredCount} required)`}
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Upload Document
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Stage Completion</span>
          <span>{Math.round((completedCount / requirements.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`bg-${stageColor}-500 h-2 rounded-full transition-all duration-300`}
            style={{ width: `${(completedCount / requirements.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Requirements */}
      <div className="p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Stage Requirements</h4>
        <div className="space-y-3">
          {requirements.map(requirement => (
            <div
              key={requirement.id}
              className={`p-4 border rounded-lg ${
                requirement.completed 
                  ? 'border-green-200 bg-green-50' 
                  : requirement.isRequired 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {requirement.completed ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className={`w-6 h-6 border-2 rounded-full ${
                        requirement.isRequired ? 'border-red-500' : 'border-gray-300'
                      }`}></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h5 className="text-sm font-medium text-gray-900">{requirement.name}</h5>
                      {requirement.isRequired && (
                        <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{requirement.description}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <span className="mr-4">{getDocumentIcon(requirement.documentType)} {requirement.documentType.toUpperCase()}</span>
                      {requirement.completed && (
                        <span className="text-green-600">✓ Completed</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {requirement.completed ? (
                    <button
                      onClick={() => handleDeleteDocument(requirement.documentId!)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedRequirement(requirement.id)
                        setShowUpload(true)
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
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
                  accept=".pdf,.docx,.pptx,.xlsx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowUpload(false)
                    setSelectedRequirement(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

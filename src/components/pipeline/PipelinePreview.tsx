'use client'

import React from 'react'
import { PipelineConfigData, PipelineStage } from '@/lib/api/pipeline-config'

interface PipelinePreviewProps {
  config: PipelineConfigData
}

export function PipelinePreview({ config }: PipelinePreviewProps) {
  const sortedStages = [...config.stages].sort((a, b) => a.order - b.order)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Pipeline Preview</h3>
        <p className="text-gray-600">
          This is how your pipeline will look to users. Stages are displayed in order from left to right.
        </p>
      </div>

      {/* Pipeline Visualization */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">{config.name}</h4>
          <div className="flex items-center space-x-2">
            {config.branchSpecific && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                Branch: {config.branchName}
              </span>
            )}
            {config.roleSpecific && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                Role: {config.roleName}
              </span>
            )}
            {config.isDefault && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Default
              </span>
            )}
          </div>
        </div>

        {config.description && (
          <p className="text-sm text-gray-600 mb-6">{config.description}</p>
        )}

        {/* Pipeline Stages */}
        <div className="relative">
          {/* Connection Lines */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 transform -translate-y-1/2 z-0"></div>
          
          <div className="relative flex justify-between items-center">
            {sortedStages.map((stage, index) => (
              <div key={stage.id} className="relative z-10">
                <StageCard stage={stage} />
                
                {/* Arrow to next stage */}
                {index < sortedStages.length - 1 && (
                  <div className="absolute top-1/2 left-full transform -translate-y-1/2 z-20">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stage Details */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900">Stage Details</h4>
        {sortedStages.map((stage, index) => (
          <StageDetails key={stage.id} stage={stage} index={index} />
        ))}
      </div>

      {/* Pipeline Statistics */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Pipeline Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{sortedStages.length}</div>
            <div className="text-sm text-gray-600">Total Stages</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {sortedStages.filter(s => s.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Active Stages</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(sortedStages.reduce((sum, s) => sum + s.probability, 0) / sortedStages.length)}%
            </div>
            <div className="text-sm text-gray-600">Average Probability</div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StageCardProps {
  stage: PipelineStage
}

function StageCard({ stage }: StageCardProps) {
  return (
    <div className={`w-32 p-4 rounded-lg border-2 text-center ${
      stage.isActive 
        ? 'border-gray-200 bg-white shadow-sm' 
        : 'border-gray-300 bg-gray-50'
    }`}>
      <div className="flex items-center justify-center mb-2">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: stage.color }}
        />
      </div>
      <h5 className="text-sm font-medium text-gray-900 mb-1">{stage.name}</h5>
      <div className="text-xs text-gray-500">
        {stage.probability}% probability
      </div>
      {!stage.isActive && (
        <div className="mt-1 text-xs text-gray-400">Inactive</div>
      )}
    </div>
  )
}

interface StageDetailsProps {
  stage: PipelineStage
  index: number
}

function StageDetails({ stage, index }: StageDetailsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
            {index + 1}
          </div>
          <div>
            <h5 className="text-md font-medium text-gray-900">{stage.name}</h5>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Probability: {stage.probability}%</span>
              <span>•</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                stage.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {stage.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        <div
          className="w-6 h-6 rounded-full"
          style={{ backgroundColor: stage.color }}
        />
      </div>

      {(stage.requirements.length > 0 || stage.transitions.length > 0) && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {stage.requirements.length > 0 && (
            <div>
              <h6 className="text-sm font-medium text-gray-700 mb-2">Requirements</h6>
              <ul className="space-y-1">
                {stage.requirements.map((req, reqIndex) => (
                  <li key={reqIndex} className="text-sm text-gray-600 flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stage.transitions.length > 0 && (
            <div>
              <h6 className="text-sm font-medium text-gray-700 mb-2">Transitions</h6>
              <ul className="space-y-1">
                {stage.transitions.map((trans, transIndex) => (
                  <li key={transIndex} className="text-sm text-gray-600 flex items-start">
                    <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    {trans}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

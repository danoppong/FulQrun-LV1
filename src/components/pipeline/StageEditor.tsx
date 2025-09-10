'use client'

import React, { useState } from 'react'
import { PipelineStage } from '@/lib/api/pipeline-config'

interface StageEditorProps {
  stages: PipelineStage[]
  onStageAdd: (stage: PipelineStage) => void
  onStageUpdate: (index: number, stage: PipelineStage) => void
  onStageDelete: (index: number) => void
  onStageReorder: (fromIndex: number, toIndex: number) => void
}

export function StageEditor({
  stages,
  onStageAdd,
  onStageUpdate,
  onStageDelete,
  onStageReorder
}: StageEditorProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const [newStage, setNewStage] = useState<Omit<PipelineStage, 'id' | 'order'>>({
    name: '',
    color: '#3B82F6',
    probability: 0,
    isActive: true,
    requirements: [],
    transitions: []
  })

  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null)

  const handleAddStage = () => {
    if (!newStage.name.trim()) return

    const stage: PipelineStage = {
      ...newStage,
      id: `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order: stages.length + 1
    }

    onStageAdd(stage)
    setNewStage({
      name: '',
      color: '#3B82F6',
      probability: 0,
      isActive: true,
      requirements: [],
      transitions: []
    })
    setShowAddForm(false)
  }

  const handleEditStage = (index: number) => {
    setEditingIndex(index)
    setEditingStage({ ...stages[index] })
  }

  const handleUpdateStage = () => {
    if (editingIndex !== null && editingStage) {
      onStageUpdate(editingIndex, editingStage)
      setEditingIndex(null)
      setEditingStage(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditingStage(null)
  }

  const handleAddRequirement = (stage: PipelineStage, requirement: string) => {
    if (!requirement.trim()) return
    
    const updatedStage = {
      ...stage,
      requirements: [...stage.requirements, requirement]
    }
    
    if (editingIndex !== null) {
      setEditingStage(updatedStage)
    } else {
      setNewStage(updatedStage)
    }
  }

  const handleRemoveRequirement = (stage: PipelineStage, index: number) => {
    const updatedStage = {
      ...stage,
      requirements: stage.requirements.filter((_, i) => i !== index)
    }
    
    if (editingIndex !== null) {
      setEditingStage(updatedStage)
    } else {
      setNewStage(updatedStage)
    }
  }

  const handleAddTransition = (stage: PipelineStage, transition: string) => {
    if (!transition.trim()) return
    
    const updatedStage = {
      ...stage,
      transitions: [...stage.transitions, transition]
    }
    
    if (editingIndex !== null) {
      setEditingStage(updatedStage)
    } else {
      setNewStage(updatedStage)
    }
  }

  const handleRemoveTransition = (stage: PipelineStage, index: number) => {
    const updatedStage = {
      ...stage,
      transitions: stage.transitions.filter((_, i) => i !== index)
    }
    
    if (editingIndex !== null) {
      setEditingStage(updatedStage)
    } else {
      setNewStage(updatedStage)
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onStageReorder(draggedIndex, dropIndex)
    }
    
    setDraggedIndex(null)
  }

  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Gray', value: '#6B7280' }
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Pipeline Stages</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Stage
        </button>
      </div>

      {/* Add Stage Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Add New Stage</h4>
          <StageForm
            stage={newStage}
            onChange={setNewStage}
            onAddRequirement={(req) => handleAddRequirement(newStage, req)}
            onRemoveRequirement={(index) => handleRemoveRequirement(newStage, index)}
            onAddTransition={(trans) => handleAddTransition(newStage, trans)}
            onRemoveTransition={(index) => handleRemoveTransition(newStage, index)}
            colorOptions={colorOptions}
          />
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddStage}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Stage
            </button>
          </div>
        </div>
      )}

      {/* Stages List */}
      <div className="space-y-4">
        {stages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No stages configured yet. Add your first stage to get started.</p>
          </div>
        ) : (
          stages.map((stage, index) => (
            <div
              key={stage.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`p-4 border rounded-lg cursor-move ${
                draggedIndex === index ? 'opacity-50' : 'hover:shadow-md'
              } ${stage.isActive ? 'border-gray-200' : 'border-gray-300 bg-gray-50'}`}
            >
              {editingIndex === index ? (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Edit Stage</h4>
                  <StageForm
                    stage={editingStage!}
                    onChange={setEditingStage!}
                    onAddRequirement={(req) => handleAddRequirement(editingStage!, req)}
                    onRemoveRequirement={(index) => handleRemoveRequirement(editingStage!, index)}
                    onAddTransition={(trans) => handleAddTransition(editingStage!, trans)}
                    onRemoveTransition={(index) => handleRemoveTransition(editingStage!, index)}
                    colorOptions={colorOptions}
                  />
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateStage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Update Stage
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <div>
                      <h4 className="text-md font-medium text-gray-900">{stage.name}</h4>
                      <p className="text-sm text-gray-500">
                        Probability: {stage.probability}% | 
                        Requirements: {stage.requirements.length} | 
                        Transitions: {stage.transitions.length}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      stage.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {stage.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleEditStage(index)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onStageDelete(index)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

interface StageFormProps {
  stage: PipelineStage
  onChange: (stage: PipelineStage) => void
  onAddRequirement: (requirement: string) => void
  onRemoveRequirement: (index: number) => void
  onAddTransition: (transition: string) => void
  onRemoveTransition: (index: number) => void
  colorOptions: Array<{ name: string; value: string }>
}

function StageForm({
  stage,
  onChange,
  onAddRequirement,
  onRemoveRequirement,
  onAddTransition,
  onRemoveTransition,
  colorOptions
}: StageFormProps) {
  const [newRequirement, setNewRequirement] = useState('')
  const [newTransition, setNewTransition] = useState('')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stage Name *
          </label>
          <input
            type="text"
            value={stage.name}
            onChange={(e) => onChange({ ...stage, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter stage name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Probability (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={stage.probability}
            onChange={(e) => onChange({ ...stage, probability: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <div className="flex space-x-2">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => onChange({ ...stage, color: color.value })}
                className={`w-8 h-8 rounded-full border-2 ${
                  stage.color === color.value ? 'border-gray-900' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={stage.isActive}
            onChange={(e) => onChange({ ...stage, isActive: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
            Active Stage
          </label>
        </div>
      </div>

      {/* Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Requirements
        </label>
        <div className="space-y-2">
          {stage.requirements.map((req, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{req}</span>
              <button
                onClick={() => onRemoveRequirement(index)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add requirement"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onAddRequirement(newRequirement)
                  setNewRequirement('')
                }
              }}
            />
            <button
              onClick={() => {
                onAddRequirement(newRequirement)
                setNewRequirement('')
              }}
              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Transitions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transitions
        </label>
        <div className="space-y-2">
          {stage.transitions.map((trans, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{trans}</span>
              <button
                onClick={() => onRemoveTransition(index)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTransition}
              onChange={(e) => setNewTransition(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add transition"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onAddTransition(newTransition)
                  setNewTransition('')
                }
              }}
            />
            <button
              onClick={() => {
                onAddTransition(newTransition)
                setNewTransition('')
              }}
              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

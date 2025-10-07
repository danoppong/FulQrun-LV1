'use client'
import React from 'react';

import { useState, useEffect } from 'react';

interface LearningModuleViewerProps {
  moduleId: string
  userId: string
  onProgressUpdate: (moduleId: string, progress: number) => void
  onModuleComplete: (moduleId: string) => void
}

interface LearningModule {
  id: string
  title: string
  description: string
  content: string
  module_type: 'video' | 'article' | 'quiz' | 'interactive' | 'micro_learning'
  duration_minutes: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
}

export function LearningModuleViewer({ 
  moduleId, 
  userId: _userId, 
  onProgressUpdate, 
  onModuleComplete 
}: LearningModuleViewerProps) {
  const [module, setModule] = useState<LearningModule | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    // Mock data for now - in real implementation, this would fetch from API
    const mockModule: LearningModule = {
      id: moduleId,
      title: 'Sales Fundamentals',
      description: 'Learn the basics of effective sales techniques',
      content: 'This is the content of the learning module...',
      module_type: 'article',
      duration_minutes: 30,
      difficulty_level: 'beginner',
      tags: ['sales', 'fundamentals', 'training']
    }
    
    setModule(mockModule)
    setLoading(false)
  }, [moduleId])

  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress)
    onProgressUpdate(moduleId, newProgress)
    
    if (newProgress >= 100 && !isCompleted) {
      setIsCompleted(true)
      onModuleComplete(moduleId)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!module) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Module not found</h3>
        <p className="text-gray-500">The requested learning module could not be found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Module Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
            <p className="mt-2 text-gray-600">{module.description}</p>
            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {module.duration_minutes} minutes
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
                {module.difficulty_level}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {module.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {isCompleted && (
            <div className="flex items-center text-green-600">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Completed
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900">Progress</h3>
          <span className="text-sm text-gray-500">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => handleProgressChange(Math.max(0, progress - 10))}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            -10%
          </button>
          <button
            onClick={() => handleProgressChange(Math.min(100, progress + 10))}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            +10%
          </button>
          <button
            onClick={() => handleProgressChange(100)}
            className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90"
          >
            Complete
          </button>
        </div>
      </div>

      {/* Module Content */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Content</h3>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {module.content}
          </p>
          <p className="text-gray-700 leading-relaxed mt-4">
            This is a placeholder for the actual learning content. In a real implementation,
            this would contain the actual module content based on the module_type (video,
            article, quiz, interactive, or micro-learning).
          </p>
        </div>
      </div>
    </div>
  )
}

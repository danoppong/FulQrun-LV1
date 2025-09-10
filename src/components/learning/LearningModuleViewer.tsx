'use client'

import React, { useState, useEffect } from 'react'
import { LearningModule, UserLearningProgress } from '@/lib/api/learning'

interface LearningModuleViewerProps {
  moduleId: string
  userId: string
  onProgressUpdate: (moduleId: string, progress: number) => void
  onModuleComplete: (moduleId: string) => void
}

export function LearningModuleViewer({
  moduleId,
  userId,
  onProgressUpdate,
  onModuleComplete
}: LearningModuleViewerProps) {
  const [module, setModule] = useState<LearningModule | null>(null)
  const [progress, setProgress] = useState<UserLearningProgress | null>(null)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadModule()
  }, [moduleId])

  const loadModule = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [moduleResponse, progressResponse] = await Promise.all([
        fetch(`/api/learning/modules/${moduleId}`),
        fetch(`/api/learning/progress?userId=${userId}&moduleId=${moduleId}`)
      ])

      if (moduleResponse.ok) {
        const moduleData = await moduleResponse.json()
        setModule(moduleData)
      } else {
        throw new Error('Failed to load module')
      }

      if (progressResponse.ok) {
        const progressData = await progressResponse.json()
        setProgress(progressData[0] || null)
        if (progressData[0]) {
          setCurrentLessonIndex(progressData[0].current_lesson_index || 0)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load module')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLessonComplete = async (lessonIndex: number) => {
    if (!module) return

    try {
      const newProgress = Math.min(((lessonIndex + 1) / module.lessons.length) * 100, 100)
      
      // Update progress in database
      const response = await fetch(`/api/learning/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          moduleId,
          progress: newProgress,
          currentLessonIndex: lessonIndex + 1,
          completed: newProgress === 100
        })
      })

      if (response.ok) {
        setProgress(prev => ({
          ...prev!,
          progress: newProgress,
          current_lesson_index: lessonIndex + 1,
          completed: newProgress === 100
        }))
        
        onProgressUpdate(moduleId, newProgress)
        
        if (newProgress === 100) {
          onModuleComplete(moduleId)
        }
      }
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const handleNextLesson = () => {
    if (module && currentLessonIndex < module.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1)
    }
  }

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Module</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  const currentLesson = module.lessons[currentLessonIndex]
  const progressPercentage = progress?.progress || 0

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
            <p className="text-gray-600 mt-1">{module.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Progress</div>
            <div className="text-lg font-semibold text-gray-900">{Math.round(progressPercentage)}%</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Lesson Navigation */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePreviousLesson}
              disabled={currentLessonIndex === 0}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Lesson {currentLessonIndex + 1} of {module.lessons.length}
            </span>
            <button
              onClick={handleNextLesson}
              disabled={currentLessonIndex === module.lessons.length - 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {progress?.completed && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Completed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{currentLesson.title}</h2>
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
          </div>
        </div>

        {/* Lesson Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Estimated time: {currentLesson.duration} minutes
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => handleLessonComplete(currentLessonIndex)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Mark as Complete
            </button>
          </div>
        </div>
      </div>

      {/* Lesson List Sidebar */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Lessons</h3>
        <div className="space-y-2">
          {module.lessons.map((lesson, index) => (
            <div
              key={index}
              className={`flex items-center p-2 rounded-md cursor-pointer ${
                index === currentLessonIndex
                  ? 'bg-blue-100 text-blue-900'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setCurrentLessonIndex(index)}
            >
              <div className="flex-shrink-0 mr-3">
                {index < (progress?.current_lesson_index || 0) ? (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : index === currentLessonIndex ? (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{lesson.title}</p>
                <p className="text-xs text-gray-500">{lesson.duration} min</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

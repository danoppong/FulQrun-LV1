'use client'

import React, { useState, useEffect } from 'react'
import { LearningModule, UserLearningProgress } from '@/lib/api/learning'

interface LearningDashboardProps {
  userId: string
  organizationId: string
}

export function LearningDashboard({ userId, organizationId }: LearningDashboardProps) {
  const [modules, setModules] = useState<LearningModule[]>([])
  const [progress, setProgress] = useState<UserLearningProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { id: 'all', name: 'All Modules', count: 0 },
    { id: 'sales_fundamentals', name: 'Sales Fundamentals', count: 0 },
    { id: 'peak_process', name: 'PEAK Process', count: 0 },
    { id: 'cstpv_framework', name: 'CSTPV Framework', count: 0 },
    { id: 'ai_insights', name: 'AI & Insights', count: 0 },
    { id: 'tools_integrations', name: 'Tools & Integrations', count: 0 }
  ]

  useEffect(() => {
    loadLearningData()
  }, [userId, organizationId])

  const loadLearningData = async () => {
    try {
      setIsLoading(true)
      
      const [modulesResponse, progressResponse] = await Promise.all([
        fetch(`/api/learning/modules?organizationId=${organizationId}`),
        fetch(`/api/learning/progress?userId=${userId}`)
      ])

      if (modulesResponse.ok) {
        const modulesData = await modulesResponse.json()
        setModules(modulesData)
        
        // Update category counts
        const updatedCategories = categories.map(category => ({
          ...category,
          count: category.id === 'all' 
            ? modulesData.length 
            : modulesData.filter((m: LearningModule) => m.category === category.id).length
        }))
        setCategories(updatedCategories)
      }

      if (progressResponse.ok) {
        const progressData = await progressResponse.json()
        setProgress(progressData)
      }
    } catch (error) {
      console.error('Failed to load learning data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getModuleProgress = (moduleId: string) => {
    const moduleProgress = progress.find(p => p.module_id === moduleId)
    return moduleProgress?.progress || 0
  }

  const getModuleStatus = (moduleId: string) => {
    const moduleProgress = progress.find(p => p.module_id === moduleId)
    if (!moduleProgress) return 'not_started'
    if (moduleProgress.progress === 100) return 'completed'
    if (moduleProgress.progress > 0) return 'in_progress'
    return 'not_started'
  }

  const filteredModules = selectedCategory === 'all' 
    ? modules 
    : modules.filter(module => module.category === selectedCategory)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'in_progress':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in_progress':
        return 'In Progress'
      default:
        return 'Not Started'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Learning Platform</h2>
        <p className="text-sm text-gray-600 mt-1">
          Enhance your sales skills with our comprehensive learning modules
        </p>
      </div>

      {/* Categories */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Modules Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map(module => {
            const moduleProgress = getModuleProgress(module.id)
            const moduleStatus = getModuleStatus(module.id)
            
            return (
              <div
                key={module.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{module.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(moduleStatus)}`}>
                        {getStatusText(moduleStatus)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {module.duration} min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{moduleProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${moduleProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {module.lessons?.length || 0} lessons
                  </div>
                  <button
                    onClick={() => window.open(`/learning/modules/${module.id}`, '_blank')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    {moduleStatus === 'completed' ? 'Review' : 'Start'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredModules.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No modules found</h3>
            <p className="text-gray-600">No learning modules available for this category.</p>
          </div>
        )}
      </div>
    </div>
  )
}

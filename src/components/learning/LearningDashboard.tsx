'use client'
import React from 'react';

import { useState, useEffect } from 'react'
import Link from 'next/link';

interface LearningModule {
  id: string
  title: string
  description: string
  module_type: 'video' | 'article' | 'quiz' | 'interactive' | 'micro_learning'
  duration_minutes: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  status: 'not_started' | 'in_progress' | 'completed' | 'certified'
  progress_percentage: number
}

interface LearningDashboardProps {
  userId: string
  organizationId: string
}

export function LearningDashboard({ userId, organizationId: _organizationId }: LearningDashboardProps) {
  const [modules, setModules] = useState<LearningModule[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all')

  useEffect(() => {
    // Mock data - in real implementation, this would fetch from API
    const mockModules: LearningModule[] = [
      {
        id: 'module-1',
        title: 'Sales Fundamentals',
        description: 'Learn the basics of effective sales techniques',
        module_type: 'article',
        duration_minutes: 30,
        difficulty_level: 'beginner',
        tags: ['sales', 'fundamentals'],
        status: 'completed',
        progress_percentage: 100
      },
      {
        id: 'module-2',
        title: 'MEDDPICC Qualification',
        description: 'Master the MEDDPICC qualification framework',
        module_type: 'interactive',
        duration_minutes: 45,
        difficulty_level: 'intermediate',
        tags: ['meddpicc', 'qualification'],
        status: 'in_progress',
        progress_percentage: 60
      },
      {
        id: 'module-3',
        title: 'PEAK Process Overview',
        description: 'Understand the PEAK sales process stages',
        module_type: 'video',
        duration_minutes: 25,
        difficulty_level: 'beginner',
        tags: ['peak', 'process'],
        status: 'not_started',
        progress_percentage: 0
      },
      {
        id: 'module-4',
        title: 'Advanced Negotiation',
        description: 'Advanced negotiation techniques and strategies',
        module_type: 'quiz',
        duration_minutes: 40,
        difficulty_level: 'advanced',
        tags: ['negotiation', 'advanced'],
        status: 'not_started',
        progress_percentage: 0
      }
    ]

    setModules(mockModules)
    setLoading(false)
  }, [userId])

  const filteredModules = modules.filter(module => {
    if (filter === 'all') return true
    return module.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'certified':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'not_started':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Learning Dashboard</h1>
        <p className="text-gray-600">Track your learning progress and access training modules</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Modules</p>
              <p className="text-2xl font-semibold text-gray-900">{modules.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {modules.filter(m => m.status === 'completed' || m.status === 'certified').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">
                {modules.filter(m => m.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Time Spent</p>
              <p className="text-2xl font-semibold text-gray-900">
                {modules.reduce((total, module) => {
                  if (module.status === 'completed' || module.status === 'certified') {
                    return total + module.duration_minutes
                  } else if (module.status === 'in_progress') {
                    return total + (module.duration_minutes * module.progress_percentage / 100)
                  }
                  return total
                }, 0)}m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'not_started', label: 'Not Started' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'completed', label: 'Completed' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as string)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => (
          <div key={module.id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{module.description}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(module.status)}`}>
                {module.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium">{module.progress_percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${module.progress_percentage}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {module.duration_minutes}m
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty_level)}`}>
                {module.difficulty_level}
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {module.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>

            <Link
              href={`/learning/modules/${module.id}`}
              className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {module.status === 'not_started' ? 'Start Module' : 'Continue Learning'}
            </Link>
          </div>
        ))}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No modules found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your filter criteria.</p>
        </div>
      )}
    </div>
  )
}

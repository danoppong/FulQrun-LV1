'use client'
import React from 'react'

import { useState, useEffect } from 'react'
import { activityAPI, ActivityWithDetails } from '@/lib/api/activities'

interface ActivityListProps {
  opportunityId: string
  onEdit?: (activity: ActivityWithDetails) => void
  onDelete?: (activityId: string) => void
}

const activityTypeIcons = {
  email: '📧',
  call: '📞',
  meeting: '🤝',
  task: '✅'
}

const priorityColors = {
  low: 'text-green-600 bg-green-100',
  medium: 'text-yellow-600 bg-yellow-100',
  high: 'text-red-600 bg-red-100'
}

const statusColors = {
  pending: 'text-yellow-600 bg-yellow-100',
  completed: 'text-green-600 bg-green-100',
  cancelled: 'text-gray-600 bg-gray-100'
}

export default function ActivityList({ opportunityId, onEdit, onDelete }: ActivityListProps) {
  const [activities, setActivities] = useState<ActivityWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadActivities()
  }, [opportunityId, loadActivities])

  const loadActivities = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await activityAPI.getActivities(opportunityId)
      
      if (error) {
        setError(error.message || 'Failed to load activities')
      } else {
        setActivities(data || [])
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return
    
    setDeletingId(activityId)
    setDeleteError(null)
    
    try {
      const { error } = await activityAPI.deleteActivity(activityId)
      if (error) {
        setDeleteError(error.message || 'Failed to delete activity')
      } else {
        setActivities(activities.filter(a => a.id !== activityId))
        if (onDelete) onDelete(activityId)
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while deleting activity'
      setDeleteError(errorMessage)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'email': return 'Email'
      case 'call': return 'Phone Call'
      case 'meeting': return 'Meeting'
      case 'task': return 'Task'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No activities</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new activity.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {deleteError && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{deleteError}</div>
          <button
            onClick={() => setDeleteError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}
      {activities.map((activity) => (
        <div key={activity.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">
                  {activityTypeIcons[activity.type as keyof typeof activityTypeIcons]}
                </span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {activity.subject}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {getActivityTypeLabel(activity.type)} • {formatDate(activity.created_at)}
                  </p>
                </div>
              </div>

              {activity.description && (
                <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
              )}

              <div className="flex items-center space-x-4 text-xs">
                {activity.contact && (
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500">Contact:</span>
                    <span className="text-gray-900">
                      {activity.contact.first_name} {activity.contact.last_name}
                    </span>
                  </div>
                )}

                {activity.priority && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[activity.priority as keyof typeof priorityColors]}`}>
                    {activity.priority}
                  </span>
                )}

                {activity.status && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[activity.status as keyof typeof statusColors]}`}>
                    {activity.status}
                  </span>
                )}
              </div>

              {activity.created_by_user && (
                <div className="mt-2 text-xs text-gray-500">
                  Created by {activity.created_by_user.full_name || activity.created_by_user.email}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {onEdit && (
                <button
                  onClick={() => onEdit(activity)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Edit activity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={() => handleDelete(activity.id)}
                disabled={deletingId === activity.id}
                className={`text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed ${
                  deletingId === activity.id ? 'animate-pulse' : ''
                }`}
                title={deletingId === activity.id ? 'Deleting...' : 'Delete activity'}
              >
                {deletingId === activity.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

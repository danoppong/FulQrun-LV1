'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button';

interface GamificationDashboardProps {
  organizationId: string
  user: any
}

interface SalesRecognition {
  id: string
  user_id: string
  recognition_type: string
  title: string
  description: string
  metric_type: string
  metric_value: number
  period_start: string
  period_end: string
  badge_icon: string
  points_awarded: number
  is_public: boolean
  awarded_by: string
  user: {
    id: string
    full_name: string
    email: string
  }
  awarded_by_user?: {
    id: string
    full_name: string
    email: string
  }
}

export function GamificationDashboard({ organizationId, user }: GamificationDashboardProps) {
  const [recognitions, setRecognitions] = useState<SalesRecognition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')

  useEffect(() => {
    fetchRecognitions()
  }, [organizationId, selectedType])

  const fetchRecognitions = async () => {
    try {
      setLoading(true)
      // Mock data for now - would be replaced with actual API call
      const mockRecognitions: SalesRecognition[] = [
        {
          id: '1',
          user_id: user?.id || '1',
          recognition_type: 'milestone',
          title: 'First Deal of the Quarter',
          description: 'Closed the first deal of Q1 2024',
          metric_type: 'deals',
          metric_value: 1,
          period_start: '2024-01-01',
          period_end: '2024-03-31',
          badge_icon: '🏆',
          points_awarded: 100,
          is_public: true,
          awarded_by: 'manager-1',
          user: {
            id: user?.id || '1',
            full_name: user?.profile?.full_name || 'John Doe',
            email: user?.email || 'john@example.com'
          },
          awarded_by_user: {
            id: 'manager-1',
            full_name: 'Jane Manager',
            email: 'jane@example.com'
          }
        },
        {
          id: '2',
          user_id: user?.id || '1',
          recognition_type: 'achievement',
          title: 'Quota Crusher',
          description: 'Exceeded monthly quota by 150%',
          metric_type: 'quota_attainment',
          metric_value: 150,
          period_start: '2024-01-01',
          period_end: '2024-01-31',
          badge_icon: '💪',
          points_awarded: 250,
          is_public: true,
          awarded_by: 'manager-1',
          user: {
            id: user?.id || '1',
            full_name: user?.profile?.full_name || 'John Doe',
            email: user?.email || 'john@example.com'
          },
          awarded_by_user: {
            id: 'manager-1',
            full_name: 'Jane Manager',
            email: 'jane@example.com'
          }
        }
      ]
      
      setRecognitions(mockRecognitions)
    } catch (error) {
      console.error('Error fetching recognitions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRecognitionTypeColor = (type: string) => {
    switch (type) {
      case 'milestone': return 'bg-blue-100 text-blue-800'
      case 'achievement': return 'bg-green-100 text-green-800'
      case 'leaderboard': return 'bg-yellow-100 text-yellow-800'
      case 'award': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMetricTypeIcon = (metricType: string) => {
    switch (metricType) {
      case 'revenue': return '💰'
      case 'deals': return '🤝'
      case 'activities': return '📞'
      case 'quota_attainment': return '🎯'
      default: return '📊'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Recognition & Gamification</h2>
        <div className="flex space-x-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Recognition</option>
            <option value="milestone">Milestones</option>
            <option value="achievement">Achievements</option>
            <option value="leaderboard">Leaderboard</option>
            <option value="award">Awards</option>
          </select>
          <button
            onClick={fetchRecognitions}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Recognition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recognitions.map((recognition) => (
          <Card key={recognition.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{recognition.badge_icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{recognition.title}</h3>
                    <p className="text-sm text-gray-600">{recognition.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecognitionTypeColor(recognition.recognition_type)}`}>
                  {recognition.recognition_type}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Recipient:</span>
                  <span className="text-sm font-medium">
                    {recognition.user.full_name}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Metric:</span>
                  <span className="text-sm font-medium flex items-center">
                    <span className="mr-1">{getMetricTypeIcon(recognition.metric_type)}</span>
                    {recognition.metric_type.replace('_', ' ')}: {recognition.metric_value}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Points Awarded:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {recognition.points_awarded} pts
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Period:</span>
                  <span className="text-sm font-medium">
                    {new Date(recognition.period_start).toLocaleDateString()} - {new Date(recognition.period_end).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Awarded By */}
              {recognition.awarded_by_user && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Awarded by: {recognition.awarded_by_user.full_name}
                  </div>
                </div>
              )}

              {/* Public/Private */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Visibility:</span>
                  <span className={`text-sm font-medium ${recognition.is_public ? 'text-green-600' : 'text-gray-600'}`}>
                    {recognition.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Leaderboard Section */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Team Leaderboard</h3>
        <Card className="p-6">
          <div className="space-y-4">
            {/* Mock leaderboard data */}
            {[
              { rank: 1, name: 'Sarah Johnson', points: 1250, deals: 15, revenue: 450000 },
              { rank: 2, name: 'Mike Chen', points: 1100, deals: 12, revenue: 380000 },
              { rank: 3, name: 'Emily Davis', points: 950, deals: 10, revenue: 320000 },
              { rank: 4, name: 'Alex Rodriguez', points: 800, deals: 8, revenue: 280000 },
              { rank: 5, name: 'Lisa Wang', points: 750, deals: 7, revenue: 250000 }
            ].map((person) => (
              <div key={person.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    person.rank === 1 ? 'bg-yellow-500' :
                    person.rank === 2 ? 'bg-gray-400' :
                    person.rank === 3 ? 'bg-orange-500' : 'bg-gray-300'
                  }`}>
                    {person.rank}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{person.name}</div>
                    <div className="text-sm text-gray-600">{person.deals} deals • ${person.revenue.toLocaleString()} revenue</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{person.points} pts</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {recognitions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No recognition found</div>
          <p className="text-gray-400 mt-2">
            Recognition and achievements will appear here
          </p>
        </div>
      )}
    </div>
  )
}

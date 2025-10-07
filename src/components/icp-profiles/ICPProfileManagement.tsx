'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { icpProfileAPI, ICPProfile } from '@/lib/api/icp-profiles';

const ICPProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  criteria: z.record(z.any()).optional()
})

type ICPProfileFormData = z.infer<typeof ICPProfileSchema>

interface ICPProfileFormProps {
  icpProfile?: ICPProfile
  onSave: (data: ICPProfileFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

function ICPProfileForm({ icpProfile, onSave, onCancel, loading = false }: ICPProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ICPProfileFormData>({
    resolver: zodResolver(ICPProfileSchema),
    defaultValues: {
      name: icpProfile?.name || '',
      description: icpProfile?.description || '',
      criteria: icpProfile?.criteria || {}
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {icpProfile ? 'Edit ICP Profile' : 'Create ICP Profile'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <Input
              {...register('name')}
              placeholder="e.g., Enterprise SaaS Companies"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              {...register('description')}
              placeholder="Describe this ICP profile..."
              rows={3}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criteria (JSON)
            </label>
            <Textarea
              {...register('criteria')}
              placeholder='{"revenue_band": ">$1B", "employee_band": ">5k", "industry": "Software"}'
              rows={4}
            />
            <p className="mt-1 text-sm text-gray-500">
              Define the criteria for this ICP profile in JSON format
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : icpProfile ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ICPProfileManagement() {
  const [profiles, setProfiles] = useState<ICPProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState<ICPProfile | undefined>()
  const [formLoading, setFormLoading] = useState(false)

  const loadProfiles = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await icpProfileAPI.getICPProfiles()
      
      if (error) {
        setError(error.message || 'Failed to load ICP profiles')
      } else {
        setProfiles(data || [])
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  const handleCreateProfile = () => {
    setEditingProfile(undefined)
    setShowForm(true)
  }

  const handleEditProfile = (profile: ICPProfile) => {
    setEditingProfile(profile)
    setShowForm(true)
  }

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ICP profile?')) return

    try {
      const { error } = await icpProfileAPI.deleteICPProfile(id)
      if (error) {
        setError(error.message || 'Failed to delete ICP profile')
      } else {
        await loadProfiles()
      }
    } catch (err) {
      setError('Failed to delete ICP profile')
    }
  }

  const handleSaveProfile = async (data: ICPProfileFormData) => {
    setFormLoading(true)
    setError(null)
    
    try {
      let result
      if (editingProfile) {
        result = await icpProfileAPI.updateICPProfile(editingProfile.id, data)
      } else {
        result = await icpProfileAPI.createICPProfile(data)
      }
      
      if (result.error) {
        setError(result.error.message || 'Failed to save ICP profile')
      } else {
        setShowForm(false)
        setEditingProfile(undefined)
        await loadProfiles()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setFormLoading(false)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingProfile(undefined)
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading ICP profiles...</div>
      </div>
    )
  }

  if (showForm) {
    return (
      <ICPProfileForm
        icpProfile={editingProfile}
        onSave={handleSaveProfile}
        onCancel={handleCancelForm}
        loading={formLoading}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ICP Profiles</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your Ideal Customer Profile definitions for AI lead generation
          </p>
        </div>
        <Button onClick={handleCreateProfile} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Create ICP Profile
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Profiles Grid */}
      {profiles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">No ICP profiles found</p>
            <Button onClick={handleCreateProfile}>
              Create your first ICP profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{profile.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditProfile(profile)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteProfile(profile.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.description && (
                    <p className="text-sm text-gray-600">{profile.description}</p>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Criteria:</span>
                    <div className="mt-1">
                      {Object.entries(profile.criteria || {}).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="mr-1 mb-1">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Created {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

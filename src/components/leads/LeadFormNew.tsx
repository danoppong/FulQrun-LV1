'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ;
  Save, 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Play,
  RefreshCw,
  Info
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { leadAPI } from '@/lib/api/leads';

const LeadSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  company: z.string().min(1, 'Company is required'),
  title: z.string().optional(),
  source: z.string().min(1, 'Source is required'),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted']),
  notes: z.string().optional()
})

type LeadFormData = z.infer<typeof LeadSchema>

interface QualificationFramework {
  id: string
  name: string
  fullName: string
  description: string
  fields: string[]
  enabled: boolean
}

interface QualificationData {
  id: string
  lead_id: string
  framework: string
  status: 'not_started' | 'in_progress' | 'qualified' | 'disqualified'
  score: number | null
  evidence: unknown[]
  created_at: string
  updated_at: string
}

interface LeadFormProps {
  mode: 'create' | 'edit'
  leadId?: string
}

export default function LeadForm({ mode, leadId }: LeadFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [qualificationLoading, setQualificationLoading] = useState(false)
  const [selectedFramework, setSelectedFramework] = useState<string>('')
  const [availableFrameworks, setAvailableFrameworks] = useState<QualificationFramework[]>([])
  const [currentQualification, setCurrentQualification] = useState<QualificationData | null>(null)
  const [qualificationFormData, setQualificationFormData] = useState<Record<string, any>>({})

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<LeadFormData>({
    resolver: zodResolver(LeadSchema),
    defaultValues: {
      status: 'new',
      source: 'Website'
    }
  })

  const loadLead = useCallback(async () => {
    if (!leadId) return
    
    setLoading(true)
    try {
      const result = await leadAPI.getLead(leadId)
      if (result.data) {
        const lead = result.data
        setValue('first_name', lead.first_name || '')
        setValue('last_name', lead.last_name || '')
        setValue('email', lead.email || '')
        setValue('phone', lead.phone || '')
        setValue('company', lead.company || '')
        setValue('title', lead.title || '')
        setValue('source', lead.source || '')
        setValue('status', lead.status as any || 'new')
        setValue('notes', lead.notes || '')
      }
    } catch (error) {
      console.error('Failed to load lead:', error)
    } finally {
      setLoading(false)
    }
  }, [leadId, setValue])

  const loadAvailableFrameworks = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/qualification-frameworks')
      if (response.ok) {
        const data = await response.json()
        const enabledFrameworks = data.data?.frameworks?.filter((f: QualificationFramework) => f.enabled) || []
        setAvailableFrameworks(enabledFrameworks)
      }
    } catch (error) {
      console.error('Failed to load frameworks:', error)
    }
  }, [])

  const loadCurrentQualification = useCallback(async () => {
    if (!leadId) return
    
    try {
      const response = await fetch(`/api/leads/qualify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_qualifications', lead_ids: [leadId] })
      })
      
      if (response.ok) {
        const data = await response.json()
        const qualifications = data.data?.qualifications || []
        if (qualifications.length > 0) {
          const current = qualifications[0] // Get the most recent qualification
          setCurrentQualification(current)
          setSelectedFramework(current.framework)
        }
      }
    } catch (error) {
      console.error('Failed to load qualification:', error)
    }
  }, [leadId])

  const onSubmit = async (data: LeadFormData) => {
    setSaving(true)
    try {
      if (mode === 'create') {
        const result = await leadAPI.createLead(data)
        if (result.data) {
          router.push('/leads')
        } else {
          console.error('Failed to create lead:', result.error)
        }
      } else if (leadId) {
        const result = await leadAPI.updateLead(leadId, data)
        if (result.data) {
          router.push('/leads')
        } else {
          console.error('Failed to update lead:', result.error)
        }
      }
    } catch (error) {
      console.error('Error saving lead:', error)
    } finally {
      setSaving(false)
    }
  }

  const startQualification = async () => {
    if (!selectedFramework || !leadId) return
    
    setQualificationLoading(true)
    try {
      const response = await fetch(`/api/leads/qualify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'qualify',
          lead_ids: [leadId],
          framework: selectedFramework,
          auto_qualify: false
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentQualification(data.data?.qualifications?.[0] || null)
      } else {
        console.error('Failed to start qualification:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to start qualification:', error)
    } finally {
      setQualificationLoading(false)
    }
  }

  const renderQualificationForm = () => {
    if (!selectedFramework || !currentQualification) return null

    const framework = availableFrameworks.find(f => f.id === selectedFramework)
    if (!framework) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Play className="h-5 w-5" />
            <span>{framework.name} Qualification</span>
          </CardTitle>
          <CardDescription>
            {framework.fullName} - {framework.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {framework.fields.map((field) => (
            <div key={field}>
              <Label htmlFor={field} className="capitalize">
                {field.replace('_', ' ')}
              </Label>
              <Input
                id={field}
                value={qualificationFormData[field] || ''}
                onChange={(e) => setQualificationFormData(prev => ({
                  ...prev,
                  [field]: e.target.value
                }))}
                placeholder={`Enter ${field.replace('_', ' ')}...`}
              />
            </div>
          ))}
          
          <div className="flex space-x-2 pt-4">
            <Button 
              onClick={startQualification}
              disabled={qualificationLoading}
              className="flex-1"
            >
              {qualificationLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Qualifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Qualification
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  useEffect(() => {
    if (mode === 'edit' && leadId) {
      loadLead()
      loadCurrentQualification()
    }
    loadAvailableFrameworks()
  }, [mode, leadId, loadLead, loadCurrentQualification, loadAvailableFrameworks])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {mode === 'create' ? 'Create New Lead' : 'Edit Lead'}
          </h1>
          <p className="text-gray-600">
            {mode === 'create' 
              ? 'Add a new lead to your CRM system' 
              : 'Update lead information and qualification status'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Information Form */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
            <CardDescription>
              Basic contact and company information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    {...register('first_name')}
                    className={errors.first_name ? 'border-red-500' : ''}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-500 mt-1">{errors.first_name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    {...register('last_name')}
                    className={errors.last_name ? 'border-red-500' : ''}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-500 mt-1">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                />
              </div>

              <div>
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  {...register('company')}
                  className={errors.company ? 'border-red-500' : ''}
                />
                {errors.company && (
                  <p className="text-sm text-red-500 mt-1">{errors.company.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  {...register('title')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source">Source *</Label>
                  <Select value={watch('source')} onValueChange={(value) => setValue('source', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Cold Call">Cold Call</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Trade Show">Trade Show</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value={watch('status')} onValueChange={(value) => setValue('status', value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="unqualified">Unqualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === 'create' ? 'Create Lead' : 'Update Lead'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Qualification Section */}
        <div className="space-y-6">
          {/* Framework Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Lead Qualification</span>
              </CardTitle>
              <CardDescription>
                Select a qualification framework to assess this lead
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableFrameworks.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No qualification frameworks are currently enabled. 
                    Contact your administrator to enable frameworks in the CRM module settings.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div>
                    <Label htmlFor="framework">Qualification Framework</Label>
                    <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a qualification framework" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFrameworks.map((framework) => (
                          <SelectItem key={framework.id} value={framework.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{framework.name}</span>
                              <span className="text-xs text-gray-500">{framework.fullName}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {currentQualification && (
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        currentQualification.status === 'qualified' ? 'default' :
                        currentQualification.status === 'disqualified' ? 'destructive' :
                        currentQualification.status === 'in_progress' ? 'secondary' :
                        'outline'
                      }>
                        {currentQualification.status.replace('_', ' ')}
                      </Badge>
                      {currentQualification.score && (
                        <Badge variant="outline">
                          Score: {currentQualification.score}
                        </Badge>
                      )}
                    </div>
                  )}

                  {selectedFramework && !currentQualification && (
                    <Button 
                      onClick={startQualification}
                      disabled={qualificationLoading}
                      className="w-full"
                    >
                      {qualificationLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Qualification
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Qualification Form */}
          {renderQualificationForm()}
        </div>
      </div>
    </div>
  )
}

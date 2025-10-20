'use client'
import React from 'react';

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { leadAPI, LeadWithScore } from '@/lib/api/leads'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, Clock, AlertCircle, Target, Users, DollarSign, Calendar, Zap } from 'lucide-react';

const leadSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted']).optional(),
})

type LeadFormData = z.infer<typeof leadSchema>

interface LeadFormProps {
  lead?: LeadWithScore
  leadId?: string
  mode: 'create' | 'edit'
}

const sourceOptions = [
  'website',
  'social',
  'referral',
  'trade_show',
  'cold_outreach',
  'email_campaign',
  'advertisement',
  'other'
]

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'unqualified', label: 'Unqualified' },
  { value: 'converted', label: 'Converted' }
]

const QUALIFICATION_FRAMEWORKS = [
  {
    id: 'BANT',
    name: 'BANT',
    description: 'Budget, Authority, Need, Timeline',
    icon: DollarSign,
    criteria: ['Budget', 'Authority', 'Need', 'Timeline']
  },
  {
    id: 'CHAMP',
    name: 'CHAMP',
    description: 'Challenges, Authority, Money, Prioritization',
    icon: Target,
    criteria: ['Challenges', 'Authority', 'Money', 'Prioritization']
  },
  {
    id: 'GPCTBA/C&I',
    name: 'GPCTBA/C&I',
    description: 'Goals, Plans, Challenges, Timeline, Budget, Authority, Consequences & Implications',
    icon: Users,
    criteria: ['Goals', 'Plans', 'Challenges', 'Timeline', 'Budget', 'Authority', 'Consequences']
  },
  {
    id: 'SPICED',
    name: 'SPICED',
    description: 'Situation, Pain, Impact, Consequence, Evidence, Decision',
    icon: AlertCircle,
    criteria: ['Situation', 'Pain', 'Impact', 'Consequence', 'Evidence', 'Decision']
  },
  {
    id: 'ANUM',
    name: 'ANUM',
    description: 'Authority, Need, Urgency, Money',
    icon: Clock,
    criteria: ['Authority', 'Need', 'Urgency', 'Money']
  },
  {
    id: 'FAINT',
    name: 'FAINT',
    description: 'Funds, Authority, Interest, Need, Timing',
    icon: Calendar,
    criteria: ['Funds', 'Authority', 'Interest', 'Need', 'Timing']
  },
  {
    id: 'NEAT',
    name: 'NEAT',
    description: 'Need, Economic Impact, Access to Authority, Timeline',
    icon: Zap,
    criteria: ['Need', 'Economic Impact', 'Access to Authority', 'Timeline']
  },
  {
    id: 'PACT',
    name: 'PACT',
    description: 'Pain, Authority, Consequence, Timeline',
    icon: Target,
    criteria: ['Pain', 'Authority', 'Consequence', 'Timeline']
  },
  {
    id: 'JTBD_FIT',
    name: 'JTBD-Fit',
    description: 'Jobs to be Done Framework',
    icon: Users,
    criteria: ['Job', 'Struggle', 'Outcome', 'Fit']
  },
  {
    id: 'FIVE_FIT',
    name: '5-Fit',
    description: 'Five-Fit Qualification Framework',
    icon: CheckCircle,
    criteria: ['Fit', 'Interest', 'Timing', 'Authority', 'Money']
  },
  {
    id: 'ABM',
    name: 'ABM',
    description: 'Account-Based Marketing Qualification',
    icon: Target,
    criteria: ['Account Fit', 'Engagement', 'Intent', 'Opportunity']
  },
  {
    id: 'TARGETING',
    name: 'Targeting',
    description: 'Advanced Targeting Framework',
    icon: Target,
    criteria: ['Demographics', 'Firmographics', 'Technographics', 'Behavioral']
  }
]

export default function LeadForm({ lead, leadId, mode }: LeadFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qualifications, setQualifications] = useState<unknown[]>([])
  const [qualifyingFramework, setQualifyingFramework] = useState<string | null>(null)
  const [qualificationLoading, setQualificationLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: lead ? {
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      source: lead.source || '',
      status: lead.status
    } : {
      status: 'new'
    }
  })

  const watchedValues = watch()

  const loadLead = useCallback(async () => {
    if (!leadId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await leadAPI.getLead(leadId)
      
      if (error) {
        setError(error.message || 'Failed to load lead')
      } else if (data) {
        // Update form with loaded data
        setValue('first_name', data.first_name)
        setValue('last_name', data.last_name)
        setValue('email', data.email || '')
        setValue('phone', data.phone || '')
        setValue('company', data.company || '')
        setValue('source', data.source || '')
        setValue('status', data.status)
      }
    } catch (_err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [leadId, setValue])

  const loadQualifications = useCallback(async () => {
    if (!leadId) return
    
    try {
      const response = await fetch(`/api/leads/qualify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_qualifications', lead_ids: [leadId] })
      })
      
      if (response.ok) {
        const data = await response.json()
        setQualifications(data.data?.qualifications || [])
      } else {
        console.error('Failed to load qualifications:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to load qualifications:', error)
    }
  }, [leadId])

  const handleQualifyLead = async (framework: string) => {
    if (!leadId) return
    
    setQualificationLoading(true)
    setQualifyingFramework(framework)
    
    try {
      const response = await fetch('/api/leads/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'qualify',
          lead_ids: [leadId],
          framework,
          auto_qualify: false
        })
      })
      
      if (response.ok) {
        await loadQualifications()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to qualify lead')
      }
    } catch (error) {
      setError('Failed to qualify lead')
    } finally {
      setQualificationLoading(false)
      setQualifyingFramework(null)
    }
  }

  useEffect(() => {
    if (mode === 'edit' && leadId && !lead) {
      loadLead()
    }
  }, [mode, leadId, lead, loadLead])

  useEffect(() => {
    if (mode === 'edit' && leadId) {
      loadQualifications()
    }
  }, [mode, leadId, loadQualifications])

  const onSubmit = async (data: LeadFormData) => {
    setLoading(true)
    setError(null)

    try {
      const leadData = {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        source: data.source || null,
      }

      let result
      if (mode === 'create') {
        result = await leadAPI.createLead(leadData)
      } else if (lead) {
        result = await leadAPI.updateLead(lead.id, leadData)
      }

      if (result?.error) {
        setError(result.error.message || 'Failed to save lead')
      } else {
        router.push('/leads')
      }
    } catch (_err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card shadow sm:rounded-lg border border-border">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-card-foreground">
            {mode === 'create' ? 'Create New Lead' : 'Edit Lead'}
          </h3>
          <div className="mt-2 max-w-xl text-sm text-muted-foreground">
            <p>
              {mode === 'create' 
                ? 'Add a new lead to your pipeline. The lead will be automatically scored based on available information.' 
                : 'Update the lead information below.'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
                <div className="text-sm text-destructive">{error}</div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-foreground">
                  First Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('first_name')}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                  />
                  {errors.first_name && (
                    <p className="mt-2 text-sm text-destructive">{errors.first_name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-foreground">
                  Last Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('last_name')}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                  />
                  {errors.last_name && (
                    <p className="mt-2 text-sm text-destructive">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    {...register('email')}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                  Phone
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    {...register('phone')}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-foreground">
                  Company
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('company')}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-foreground">
                  Source
                </label>
                <div className="mt-1">
                  <select
                    {...register('source')}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                  >
                    <option value="">Select a source</option>
                    {sourceOptions.map((source) => (
                      <option key={source} value={source}>
                        {source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {mode === 'edit' && (
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-foreground">
                    Status
                  </label>
                  <div className="mt-1">
                    <select
                      {...register('status')}
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                    >
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Lead Scoring Preview */}
            {mode === 'create' && (watchedValues.first_name || watchedValues.last_name) && (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
                <h4 className="text-sm font-medium text-primary mb-2">Lead Scoring Preview</h4>
                <p className="text-sm text-primary/80">
                  This lead will be automatically scored based on the information provided. 
                  Complete more fields to increase the lead score.
                </p>
              </div>
            )}

            {/* Qualification Frameworks Section */}
            {mode === 'edit' && (
              <div className="space-y-4">
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-card-foreground mb-4">
                    Lead Qualification Frameworks
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Use these frameworks to systematically qualify your lead and track qualification progress.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {QUALIFICATION_FRAMEWORKS.map((framework) => {
                      const Icon = framework.icon
                      const qualification = qualifications.find(q => q.framework === framework.id)
                      const status = qualification?.status || 'NOT_STARTED'
                      
                      return (
                        <Card key={framework.id} className="relative">
                          <CardHeader className="pb-3">
                            <div className="flex items-center space-x-2">
                              <Icon className="h-5 w-5 text-primary" />
                              <CardTitle className="text-sm">{framework.name}</CardTitle>
                            </div>
                            <CardDescription className="text-xs">
                              {framework.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              {/* Status Badge */}
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant={
                                    status === 'QUALIFIED' ? 'default' :
                                    status === 'IN_PROGRESS' ? 'secondary' :
                                    status === 'DISQUALIFIED' ? 'destructive' :
                                    'outline'
                                  }
                                  className="text-xs"
                                >
                                  {status === 'QUALIFIED' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {status === 'IN_PROGRESS' && <Clock className="h-3 w-3 mr-1" />}
                                  {status === 'DISQUALIFIED' && <AlertCircle className="h-3 w-3 mr-1" />}
                                  {status.replace('_', ' ')}
                                </Badge>
                              </div>
                              
                              {/* Criteria */}
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Criteria:</p>
                                <div className="flex flex-wrap gap-1">
                                  {framework.criteria.slice(0, 3).map((criterion, index) => (
                                    <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                      {criterion}
                                    </Badge>
                                  ))}
                                  {framework.criteria.length > 3 && (
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                      +{framework.criteria.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              {/* Action Button */}
                              <Button
                                size="sm"
                                variant={status === 'QUALIFIED' ? 'outline' : 'default'}
                                onClick={() => handleQualifyLead(framework.id)}
                                disabled={qualificationLoading && qualifyingFramework === framework.id}
                                className="w-full text-xs"
                              >
                                {qualificationLoading && qualifyingFramework === framework.id ? (
                                  <>
                                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                                    Qualifying...
                                  </>
                                ) : status === 'QUALIFIED' ? (
                                  'Re-qualify'
                                ) : status === 'IN_PROGRESS' ? (
                                  'Continue'
                                ) : (
                                  'Start Qualification'
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                  
                  {/* Qualification Summary */}
                  {qualifications.length > 0 && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Qualification Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">
                            {qualifications.filter(q => q.status === 'QUALIFIED').length}
                          </div>
                          <div className="text-xs text-muted-foreground">Qualified</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">
                            {qualifications.filter(q => q.status === 'IN_PROGRESS').length}
                          </div>
                          <div className="text-xs text-muted-foreground">In Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-red-600">
                            {qualifications.filter(q => q.status === 'DISQUALIFIED').length}
                          </div>
                          <div className="text-xs text-muted-foreground">Disqualified</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-600">
                            {qualifications.filter(q => q.status === 'NOT_STARTED').length}
                          </div>
                          <div className="text-xs text-muted-foreground">Not Started</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-background py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {loading ? 'Saving...' : mode === 'create' ? 'Create Lead' : 'Update Lead'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

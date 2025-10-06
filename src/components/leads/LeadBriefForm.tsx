'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { icpProfileAPI, ICPProfile } from '@/lib/api/icp-profiles'

const LeadBriefSchema = z.object({
  lead_type: z.enum(['account', 'contact']),
  geography: z.enum(['US', 'EU', 'UK', 'APAC']),
  industry: z.string().optional(),
  revenue_band: z.enum(['<$10M', '$10–50M', '$50–250M', '$250M–$1B', '>$1B']).optional(),
  employee_band: z.enum(['1–50', '51–200', '201–1k', '1k–5k', '>5k']).optional(),
  entity_type: z.enum(['PUBLIC', 'PRIVATE', 'NONPROFIT', 'OTHER']),
  technographics: z.array(z.string()).max(50).optional(),
  installed_tools_hints: z.array(z.string()).optional(),
  intent_keywords: z.array(z.string().regex(/^[A-Za-z0-9\-+& ]{2,50}$/)).optional(),
  time_horizon: z.enum(['NEAR_TERM', 'MID_TERM', 'LONG_TERM']).optional(),
  notes: z.string().max(2000).optional(),
  icp_profile_id: z.string().uuid()
})

type LeadBriefFormData = z.infer<typeof LeadBriefSchema>

interface LeadBriefFormProps {
  onSubmit: (data: LeadBriefFormData) => Promise<void>
  loading?: boolean
  initialData?: Partial<LeadBriefFormData>
}

export default function LeadBriefForm({ 
  onSubmit, 
  loading = false, 
  initialData 
}: LeadBriefFormProps) {
  const [technographics, setTechnographics] = useState<string[]>(initialData?.technographics || [])
  const [intentKeywords, setIntentKeywords] = useState<string[]>(initialData?.intent_keywords || [])
  const [installedTools, setInstalledTools] = useState<string[]>(initialData?.installed_tools_hints || [])
  const [newTechnographic, setNewTechnographic] = useState('')
  const [newIntentKeyword, setNewIntentKeyword] = useState('')
  const [newInstalledTool, setNewInstalledTool] = useState('')
  const [icpProfiles, setIcpProfiles] = useState<ICPProfile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<LeadBriefFormData>({
    resolver: zodResolver(LeadBriefSchema),
    defaultValues: {
      lead_type: initialData?.lead_type || 'account',
      geography: initialData?.geography || 'US',
      entity_type: initialData?.entity_type || 'PRIVATE',
      industry: initialData?.industry || '',
      revenue_band: initialData?.revenue_band || '',
      employee_band: initialData?.employee_band || '',
      time_horizon: initialData?.time_horizon || '',
      notes: initialData?.notes || '',
      icp_profile_id: initialData?.icp_profile_id || ''
    }
  })

  const watchedValues = watch()

  useEffect(() => {
    loadICPProfiles()
  }, [])

  const loadICPProfiles = async () => {
    setLoadingProfiles(true)
    try {
      const { data, error } = await icpProfileAPI.getICPProfiles()
      if (!error && data) {
        setIcpProfiles(data)
      }
    } catch (error) {
      console.error('Failed to load ICP profiles:', error)
    } finally {
      setLoadingProfiles(false)
    }
  }

  const addTechnographic = () => {
    if (newTechnographic && technographics.length < 50) {
      setTechnographics([...technographics, newTechnographic])
      setNewTechnographic('')
    }
  }

  const removeTechnographic = (index: number) => {
    setTechnographics(technographics.filter((_, i) => i !== index))
  }

  const addIntentKeyword = () => {
    if (newIntentKeyword && intentKeywords.length < 50 && /^[A-Za-z0-9\-+& ]{2,50}$/.test(newIntentKeyword)) {
      setIntentKeywords([...intentKeywords, newIntentKeyword])
      setNewIntentKeyword('')
    }
  }

  const removeIntentKeyword = (index: number) => {
    setIntentKeywords(intentKeywords.filter((_, i) => i !== index))
  }

  const addInstalledTool = () => {
    if (newInstalledTool && installedTools.length < 50) {
      setInstalledTools([...installedTools, newInstalledTool])
      setNewInstalledTool('')
    }
  }

  const removeInstalledTool = (index: number) => {
    setInstalledTools(installedTools.filter((_, i) => i !== index))
  }

  const handleFormSubmit = async (data: LeadBriefFormData) => {
    const formData = {
      ...data,
      technographics,
      intent_keywords: intentKeywords,
      installed_tools_hints: installedTools
    }
    await onSubmit(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Lead Generation Brief</CardTitle>
        <p className="text-sm text-gray-600">
          Define criteria for AI-powered lead generation. The AI will use this brief along with your ICP profile to generate qualified candidates.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Lead Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead Type *
            </label>
            <Select {...register('lead_type')}>
              <option value="account">Account (Company)</option>
              <option value="contact">Contact (Person)</option>
            </Select>
            {errors.lead_type && (
              <p className="mt-1 text-sm text-red-600">{errors.lead_type.message}</p>
            )}
          </div>

          {/* Geography */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Geography *
            </label>
            <Select {...register('geography')}>
              <option value="US">United States</option>
              <option value="EU">European Union</option>
              <option value="UK">United Kingdom</option>
              <option value="APAC">Asia Pacific</option>
            </Select>
            {errors.geography && (
              <p className="mt-1 text-sm text-red-600">{errors.geography.message}</p>
            )}
          </div>

          {/* ICP Profile Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ICP Profile *
            </label>
            <Select {...register('icp_profile_id')} disabled={loadingProfiles}>
              <option value="">{loadingProfiles ? 'Loading profiles...' : 'Select an ICP Profile'}</option>
              {icpProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </Select>
            {errors.icp_profile_id && (
              <p className="mt-1 text-sm text-red-600">{errors.icp_profile_id.message}</p>
            )}
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <Input
              {...register('industry')}
              placeholder="e.g., Software, Healthcare, Financial Services"
            />
            {errors.industry && (
              <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
            )}
          </div>

          {/* Revenue Band */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Revenue Band
            </label>
            <Select {...register('revenue_band')}>
              <option value="">Select revenue band</option>
              <option value="<$10M">Less than $10M</option>
              <option value="$10–50M">$10M - $50M</option>
              <option value="$50–250M">$50M - $250M</option>
              <option value="$250M–$1B">$250M - $1B</option>
              <option value=">$1B">Greater than $1B</option>
            </Select>
            {errors.revenue_band && (
              <p className="mt-1 text-sm text-red-600">{errors.revenue_band.message}</p>
            )}
          </div>

          {/* Employee Band */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Band
            </label>
            <Select {...register('employee_band')}>
              <option value="">Select employee count</option>
              <option value="1–50">1 - 50 employees</option>
              <option value="51–200">51 - 200 employees</option>
              <option value="201–1k">201 - 1,000 employees</option>
              <option value="1k–5k">1,001 - 5,000 employees</option>
              <option value=">5k">More than 5,000 employees</option>
            </Select>
            {errors.employee_band && (
              <p className="mt-1 text-sm text-red-600">{errors.employee_band.message}</p>
            )}
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entity Type *
            </label>
            <Select {...register('entity_type')}>
              <option value="PRIVATE">Private Company</option>
              <option value="PUBLIC">Public Company</option>
              <option value="NONPROFIT">Non-profit Organization</option>
              <option value="OTHER">Other</option>
            </Select>
            {errors.entity_type && (
              <p className="mt-1 text-sm text-red-600">{errors.entity_type.message}</p>
            )}
          </div>

          {/* Technographics */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technographics (Max 50)
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTechnographic}
                onChange={(e) => setNewTechnographic(e.target.value)}
                placeholder="e.g., aws, snowflake, salesforce"
                maxLength={50}
              />
              <Button type="button" onClick={addTechnographic} disabled={technographics.length >= 50}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {technographics.map((tech, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTechnographic(index)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Installed Tools Hints */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Installed Tools Hints
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newInstalledTool}
                onChange={(e) => setNewInstalledTool(e.target.value)}
                placeholder="e.g., hubspot, salesforce, zendesk"
                maxLength={50}
              />
              <Button type="button" onClick={addInstalledTool} disabled={installedTools.length >= 50}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {installedTools.map((tool, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {tool}
                  <button
                    type="button"
                    onClick={() => removeInstalledTool(index)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Intent Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intent Keywords (Max 50)
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newIntentKeyword}
                onChange={(e) => setNewIntentKeyword(e.target.value)}
                placeholder="e.g., data warehouse, cloud migration"
                maxLength={50}
              />
              <Button type="button" onClick={addIntentKeyword} disabled={intentKeywords.length >= 50}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {intentKeywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeIntentKeyword(index)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Time Horizon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Horizon
            </label>
            <Select {...register('time_horizon')}>
              <option value="">Select time horizon</option>
              <option value="NEAR_TERM">Near Term (0-3 months)</option>
              <option value="MID_TERM">Mid Term (3-12 months)</option>
              <option value="LONG_TERM">Long Term (12+ months)</option>
            </Select>
            {errors.time_horizon && (
              <p className="mt-1 text-sm text-red-600">{errors.time_horizon.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <Textarea
              {...register('notes')}
              placeholder="Additional context or requirements (max 2000 characters)"
              maxLength={2000}
              rows={4}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          {/* PII Warning */}
          <Alert>
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Privacy Notice:</strong> Do not include any personal identifiable information (PII) such as email addresses, phone numbers, or names in the notes field. The AI will generate leads based on the criteria you specify.
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating Brief...' : 'Create Lead Brief'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

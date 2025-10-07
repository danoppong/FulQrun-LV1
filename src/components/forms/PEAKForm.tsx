'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod';

const peakFormSchema = z.object({
  peak_stage: z.enum(['prospecting', 'engaging', 'advancing', 'key_decision']),
  deal_value: z.number().min(0, 'Deal value must be positive').optional(),
  probability: z.number().min(0, 'Probability must be between 0 and 100').max(100, 'Probability must be between 0 and 100').optional(),
  close_date: z.string().optional(),
})

type PEAKFormData = z.infer<typeof peakFormSchema>

interface PEAKFormProps {
  initialData?: PEAKFormData
  onSave: (data: PEAKFormData) => Promise<void>
  loading?: boolean
  onSuccess?: () => void
}

const peakStages = [
  { 
    value: 'prospecting', 
    label: 'Prospecting', 
    description: 'Initial contact and qualification',
    icon: '🔍',
    color: 'bg-blue-100 text-blue-800'
  },
  { 
    value: 'engaging', 
    label: 'Engaging', 
    description: 'Active communication and relationship building',
    icon: '💬',
    color: 'bg-yellow-100 text-yellow-800'
  },
  { 
    value: 'advancing', 
    label: 'Advancing', 
    description: 'Solution presentation and negotiation',
    icon: '📈',
    color: 'bg-orange-100 text-orange-800'
  },
  { 
    value: 'key_decision', 
    label: 'Key Decision', 
    description: 'Final decision and closing',
    icon: '🎯',
    color: 'bg-green-100 text-green-800'
  }
]

export default function PEAKForm({ initialData, onSave, loading = false, onSuccess }: PEAKFormProps) {
  const [selectedStage, setSelectedStage] = useState(initialData?.peak_stage || 'prospecting')
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<PEAKFormData>({
    resolver: zodResolver(peakFormSchema),
    defaultValues: initialData || {
      peak_stage: 'prospecting',
      deal_value: undefined,
      probability: undefined,
      close_date: ''
    }
  })

  const _watchedValues = watch()

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setSelectedStage(initialData.peak_stage || 'prospecting')
      setValue('peak_stage', initialData.peak_stage || 'prospecting')
      setValue('deal_value', initialData.deal_value)
      setValue('probability', initialData.probability)
      setValue('close_date', initialData.close_date || '')
    }
  }, [initialData, setValue])

  const handleStageSelect = (stage: string) => {
    setSelectedStage(stage as 'prospecting' | 'engaging' | 'advancing' | 'key_decision')
    setValue('peak_stage', stage as 'prospecting' | 'engaging' | 'advancing' | 'key_decision')
  }

  const onSubmit = async (data: PEAKFormData) => {
    await onSave(data)
    setSaved(true)
    if (onSuccess) {
      onSuccess()
    }
    // Reset saved state after 3 seconds
    setTimeout(() => setSaved(false), 3000)
  }

  const getStageRecommendations = (stage: string) => {
    switch (stage) {
      case 'prospecting':
        return [
          'Research the prospect thoroughly',
          'Identify key decision makers',
          'Understand their pain points',
          'Qualify budget and timeline'
        ]
      case 'engaging':
        return [
          'Schedule discovery calls',
          'Share relevant case studies',
          'Build relationships with stakeholders',
          'Understand their evaluation process'
        ]
      case 'advancing':
        return [
          'Present your solution',
          'Address objections',
          'Negotiate terms and pricing',
          'Get buy-in from economic buyer'
        ]
      case 'key_decision':
        return [
          'Finalize contract terms',
          'Coordinate with legal team',
          'Prepare for implementation',
          'Close the deal'
        ]
      default:
        return []
    }
  }

  return (
    <div className="bg-card shadow sm:rounded-lg border border-border">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-card-foreground">
              PEAK Stage Management
            </h3>
            <div className="mt-2 max-w-xl text-sm text-muted-foreground">
              <p>
                Track your opportunity through the PEAK methodology stages.
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {peakStages.find(s => s.value === selectedStage)?.icon}
            </div>
            <div className="text-sm text-muted-foreground">Current Stage</div>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {/* Stage Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Current PEAK Stage
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {peakStages.map((stage) => (
                <div
                  key={stage.value}
                  className={`relative rounded-lg p-4 border-2 cursor-pointer transition-all ${
                    selectedStage === stage.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => handleStageSelect(stage.value)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{stage.icon}</span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-foreground">
                        {stage.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stage.description}
                      </div>
                    </div>
                  </div>
                  {selectedStage === stage.value && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <input type="hidden" {...register('peak_stage')} />
            {errors.peak_stage && (
              <p className="mt-2 text-sm text-destructive">{errors.peak_stage.message}</p>
            )}
          </div>

          {/* Stage Details */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="text-sm font-medium text-foreground mb-2">
              {peakStages.find(s => s.value === selectedStage)?.label} Stage
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              {peakStages.find(s => s.value === selectedStage)?.description}
            </p>
            
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">
                Recommended Actions
              </h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                {getStageRecommendations(selectedStage).map((action, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Deal Information */}
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="deal_value" className="block text-sm font-medium text-foreground">
                Deal Value ($)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('deal_value', { valueAsNumber: true })}
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                  placeholder="50000"
                />
                {errors.deal_value && (
                  <p className="mt-2 text-sm text-destructive">{errors.deal_value.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="probability" className="block text-sm font-medium text-foreground">
                Probability (%)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  {...register('probability', { valueAsNumber: true })}
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                  placeholder="75"
                />
                {errors.probability && (
                  <p className="mt-2 text-sm text-destructive">{errors.probability.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="close_date" className="block text-sm font-medium text-foreground">
                Expected Close Date
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  {...register('close_date')}
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-input bg-background text-foreground rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Stage Progress Indicator */}
          <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">
                  {peakStages.find(s => s.value === selectedStage)?.icon}
                </span>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-primary">
                  Current Stage: {peakStages.find(s => s.value === selectedStage)?.label}
                </h4>
                <p className="text-sm text-primary/80">
                  {selectedStage === 'prospecting' && 'Focus on qualification and initial contact'}
                  {selectedStage === 'engaging' && 'Build relationships and understand needs'}
                  {selectedStage === 'advancing' && 'Present solutions and negotiate terms'}
                  {selectedStage === 'key_decision' && 'Finalize deal and close the opportunity'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                saved 
                  ? 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                  : 'text-primary-foreground bg-primary hover:bg-primary/90 focus:ring-primary'
              }`}
            >
              {loading ? 'Saving...' : saved ? '✓ Saved!' : 'Save PEAK Stage'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

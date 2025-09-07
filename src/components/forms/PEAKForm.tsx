'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

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

  const watchedValues = watch()

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
    setSelectedStage(stage)
    setValue('peak_stage', stage as any)
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
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          PEAK Stage Management
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>
            Track your opportunity through the PEAK methodology stages.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {/* Stage Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Current PEAK Stage
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {peakStages.map((stage) => (
                <div
                  key={stage.value}
                  className={`relative rounded-lg p-4 border-2 cursor-pointer transition-all ${
                    selectedStage === stage.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleStageSelect(stage.value)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{stage.icon}</span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {stage.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {stage.description}
                      </div>
                    </div>
                  </div>
                  {selectedStage === stage.value && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
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
              <p className="mt-2 text-sm text-red-600">{errors.peak_stage.message}</p>
            )}
          </div>

          {/* Stage Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              {peakStages.find(s => s.value === selectedStage)?.label} Stage
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              {peakStages.find(s => s.value === selectedStage)?.description}
            </p>
            
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Recommended Actions
              </h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {getStageRecommendations(selectedStage).map((action, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-indigo-500 mr-2">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Deal Information */}
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="deal_value" className="block text-sm font-medium text-gray-700">
                Deal Value ($)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('deal_value', { valueAsNumber: true })}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="50000"
                />
                {errors.deal_value && (
                  <p className="mt-2 text-sm text-red-600">{errors.deal_value.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="probability" className="block text-sm font-medium text-gray-700">
                Probability (%)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  {...register('probability', { valueAsNumber: true })}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="75"
                />
                {errors.probability && (
                  <p className="mt-2 text-sm text-red-600">{errors.probability.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="close_date" className="block text-sm font-medium text-gray-700">
                Expected Close Date
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  {...register('close_date')}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Stage Progress Indicator */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">
                  {peakStages.find(s => s.value === selectedStage)?.icon}
                </span>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">
                  Current Stage: {peakStages.find(s => s.value === selectedStage)?.label}
                </h4>
                <p className="text-sm text-blue-700">
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
                  : 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
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

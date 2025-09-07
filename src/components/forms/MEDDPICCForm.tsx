'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const meddpiccSchema = z.object({
  metrics: z.string().optional(),
  economic_buyer: z.string().optional(),
  decision_criteria: z.string().optional(),
  decision_process: z.string().optional(),
  paper_process: z.string().optional(),
  identify_pain: z.string().optional(),
  champion: z.string().optional(),
  competition: z.string().optional(),
})

type MEDDPICCFormData = z.infer<typeof meddpiccSchema>

interface MEDDPICCFormProps {
  initialData?: MEDDPICCFormData
  onSave: (data: MEDDPICCFormData) => Promise<void>
  loading?: boolean
}

const meddpiccFields = [
  {
    key: 'metrics' as keyof MEDDPICCFormData,
    label: 'Metrics',
    description: 'Quantify the business impact and value proposition',
    placeholder: 'e.g., Reduce costs by 30%, increase efficiency by 50%',
    icon: '📊'
  },
  {
    key: 'economic_buyer' as keyof MEDDPICCFormData,
    label: 'Economic Buyer',
    description: 'Identify the decision maker with budget authority',
    placeholder: 'e.g., CFO, VP of Operations, Director of IT',
    icon: '💰'
  },
  {
    key: 'decision_criteria' as keyof MEDDPICCFormData,
    label: 'Decision Criteria',
    description: 'Understand the evaluation process and criteria',
    placeholder: 'e.g., ROI > 200%, implementation < 6 months, security compliance',
    icon: '📋'
  },
  {
    key: 'decision_process' as keyof MEDDPICCFormData,
    label: 'Decision Process',
    description: 'Map the approval workflow and decision timeline',
    placeholder: 'e.g., Technical evaluation → Budget approval → Legal review → Final decision',
    icon: '🔄'
  },
  {
    key: 'paper_process' as keyof MEDDPICCFormData,
    label: 'Paper Process',
    description: 'Document requirements and procurement process',
    placeholder: 'e.g., RFP process, vendor evaluation, contract negotiation',
    icon: '📄'
  },
  {
    key: 'identify_pain' as keyof MEDDPICCFormData,
    label: 'Identify Pain',
    description: 'Understand pain points and business challenges',
    placeholder: 'e.g., Current system is slow, manual processes, high maintenance costs',
    icon: '😰'
  },
  {
    key: 'champion' as keyof MEDDPICCFormData,
    label: 'Champion',
    description: 'Find internal advocate and supporter',
    placeholder: 'e.g., Sarah Johnson (IT Director), Mike Chen (Operations Manager)',
    icon: '🏆'
  },
  {
    key: 'competition' as keyof MEDDPICCFormData,
    label: 'Competition',
    description: 'Assess competitive landscape and positioning',
    placeholder: 'e.g., Competitor A (strong on price), Competitor B (better features)',
    icon: '⚔️'
  }
]

export default function MEDDPICCForm({ initialData, onSave, loading = false }: MEDDPICCFormProps) {
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set())

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<MEDDPICCFormData>({
    resolver: zodResolver(meddpiccSchema),
    defaultValues: initialData || {}
  })

  const watchedValues = watch()

  // Calculate completion percentage
  const totalFields = meddpiccFields.length
  const completedCount = meddpiccFields.filter(field => {
    const value = watchedValues[field.key]
    return value && value.trim() !== ''
  }).length
  const completionPercentage = Math.round((completedCount / totalFields) * 100)

  const onSubmit = async (data: MEDDPICCFormData) => {
    await onSave(data)
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              MEDDPICC Qualification
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Complete the MEDDPICC framework to qualify your opportunity
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">
              {completionPercentage}%
            </div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {meddpiccFields.map((field) => {
              const value = watchedValues[field.key]
              const isCompleted = value && value.trim() !== ''
              
              return (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{field.icon}</span>
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {isCompleted && <span className="text-green-500 ml-1">✓</span>}
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">{field.description}</p>
                  <div>
                    <textarea
                      {...register(field.key)}
                      rows={3}
                      className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border rounded-md ${
                        isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-300'
                      }`}
                      placeholder={field.placeholder}
                    />
                    {errors[field.key] && (
                      <p className="mt-1 text-sm text-red-600">{errors[field.key]?.message}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">MEDDPICC Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Completed Fields:</span>
                <span className="ml-2 font-medium">{completedCount}/{totalFields}</span>
              </div>
              <div>
                <span className="text-gray-500">Completion:</span>
                <span className="ml-2 font-medium">{completionPercentage}%</span>
              </div>
            </div>
            {completionPercentage >= 75 && (
              <div className="mt-2 text-sm text-green-600 font-medium">
                🎉 Great job! This opportunity is well-qualified.
              </div>
            )}
            {completionPercentage < 25 && (
              <div className="mt-2 text-sm text-yellow-600 font-medium">
                ⚠️ Consider gathering more qualification information.
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save MEDDPICC Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
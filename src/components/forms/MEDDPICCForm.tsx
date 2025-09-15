'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { opportunityAPI } from '@/lib/api/opportunities'

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
  initialData?: Partial<MEDDPICCFormData>
  onSave?: (data: MEDDPICCFormData) => void
  onSuccess?: () => void
  loading?: boolean
}

export default function MEDDPICCForm({ 
  initialData = {}, 
  onSave, 
  onSuccess, 
  loading = false 
}: MEDDPICCFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<MEDDPICCFormData>({
    resolver: zodResolver(meddpiccSchema),
    defaultValues: initialData
  })

  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  const onSubmit = async (data: MEDDPICCFormData) => {
    setIsSubmitting(true)
    try {
      if (onSave) {
        onSave(data)
      }
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error saving MEDDPICC data:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">MEDDPICC Qualification</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="metrics" className="block text-sm font-medium text-gray-700">
              Metrics
            </label>
            <textarea
              {...register('metrics')}
              id="metrics"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="What metrics will be used to measure success?"
            />
            {errors.metrics && (
              <p className="mt-1 text-sm text-red-600">{errors.metrics.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="economic_buyer" className="block text-sm font-medium text-gray-700">
              Economic Buyer
            </label>
            <textarea
              {...register('economic_buyer')}
              id="economic_buyer"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Who has the budget authority?"
            />
            {errors.economic_buyer && (
              <p className="mt-1 text-sm text-red-600">{errors.economic_buyer.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="decision_criteria" className="block text-sm font-medium text-gray-700">
              Decision Criteria
            </label>
            <textarea
              {...register('decision_criteria')}
              id="decision_criteria"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="What criteria will be used to make the decision?"
            />
            {errors.decision_criteria && (
              <p className="mt-1 text-sm text-red-600">{errors.decision_criteria.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="decision_process" className="block text-sm font-medium text-gray-700">
              Decision Process
            </label>
            <textarea
              {...register('decision_process')}
              id="decision_process"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="How will the decision be made?"
            />
            {errors.decision_process && (
              <p className="mt-1 text-sm text-red-600">{errors.decision_process.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="paper_process" className="block text-sm font-medium text-gray-700">
              Paper Process
            </label>
            <textarea
              {...register('paper_process')}
              id="paper_process"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="What paperwork/approvals are required?"
            />
            {errors.paper_process && (
              <p className="mt-1 text-sm text-red-600">{errors.paper_process.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="identify_pain" className="block text-sm font-medium text-gray-700">
              Identify Pain
            </label>
            <textarea
              {...register('identify_pain')}
              id="identify_pain"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="What pain points are we solving?"
            />
            {errors.identify_pain && (
              <p className="mt-1 text-sm text-red-600">{errors.identify_pain.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="champion" className="block text-sm font-medium text-gray-700">
              Champion
            </label>
            <textarea
              {...register('champion')}
              id="champion"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Who is our internal advocate?"
            />
            {errors.champion && (
              <p className="mt-1 text-sm text-red-600">{errors.champion.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="competition" className="block text-sm font-medium text-gray-700">
              Competition
            </label>
            <textarea
              {...register('competition')}
              id="competition"
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Who are we competing against?"
            />
            {errors.competition && (
              <p className="mt-1 text-sm text-red-600">{errors.competition.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save MEDDPICC'}
          </button>
        </div>
      </form>
    </div>
  )
}

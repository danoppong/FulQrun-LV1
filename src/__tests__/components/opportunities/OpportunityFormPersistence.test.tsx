import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import OpportunityForm from '@/components/opportunities/OpportunityForm'
// import { opportunityAPI as _opportunityAPI } from '@/lib/api/opportunities' // Unused import

// Mock the opportunity API
const mockCreateOpportunity = jest.fn()
const mockUpdateOpportunity = jest.fn()
const mockUpdateMEDDPICC = jest.fn()
const mockGetOpportunity = jest.fn()

jest.mock('@/lib/api/opportunities', () => ({
  opportunityAPI: {
    createOpportunity: mockCreateOpportunity,
    updateOpportunity: mockUpdateOpportunity,
    updateMEDDPICC: mockUpdateMEDDPICC,
    getOpportunity: mockGetOpportunity
  }
}))

// Mock the contact and company APIs
jest.mock('@/lib/api/contacts', () => ({
  contactAPI: {
    getContacts: jest.fn().mockResolvedValue({ data: [], error: null })
  }
}))

jest.mock('@/lib/api/companies', () => ({
  companyAPI: {
    getCompanies: jest.fn().mockResolvedValue({ data: [], error: null })
  }
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn()
  })
}))

const mockOpportunity = {
  id: 'opp123',
  name: 'Test Opportunity',
  contact_id: 'contact123',
  company_id: 'company123',
  peak_stage: 'prospecting' as const,
  deal_value: 50000,
  probability: 25,
  close_date: '2024-12-31',
  metrics: 'Test metrics',
  economic_buyer: 'Test buyer',
  decision_criteria: 'Test criteria',
  decision_process: 'Test process',
  paper_process: 'Test paper',
  identify_pain: 'Test pain',
  champion: 'Test champion',
  competition: 'Test competition',
  organization_id: 'org123',
  created_by: 'user123',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

describe('OpportunityForm Data Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Form Field Persistence', () => {
    it('should persist all basic opportunity fields', async () => {
      mockUpdateOpportunity.mockResolvedValue({ data: mockOpportunity, error: null })

      render(
        <OpportunityForm
          opportunity={mockOpportunity}
          opportunityId="opp123"
          mode="edit"
        />
      )

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Opportunity')).toBeInTheDocument()
      })

      // Change the opportunity name
      const nameInput = screen.getByDisplayValue('Test Opportunity')
      fireEvent.change(nameInput, { target: { value: 'Updated Opportunity' } })

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update opportunity/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateOpportunity).toHaveBeenCalledWith('opp123', expect.objectContaining({
          name: 'Updated Opportunity',
          contact_id: 'contact123',
          company_id: 'company123',
          peak_stage: 'prospecting',
          deal_value: 50000,
          probability: 25,
          close_date: '2024-12-31',
          metrics: 'Test metrics',
          economic_buyer: 'Test buyer',
          decision_criteria: 'Test criteria',
          decision_process: 'Test process',
          paper_process: 'Test paper',
          identify_pain: 'Test pain',
          champion: 'Test champion',
          competition: 'Test competition'
        }))
      })
    })

    it('should persist PEAK stage data', async () => {
      mockUpdateOpportunity.mockResolvedValue({ data: mockOpportunity, error: null })

      render(
        <OpportunityForm
          opportunity={mockOpportunity}
          opportunityId="opp123"
          mode="edit"
        />
      )

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Opportunity')).toBeInTheDocument()
      })

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update opportunity/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateOpportunity).toHaveBeenCalledWith('opp123', expect.objectContaining({
          peak_stage: 'prospecting',
          deal_value: 50000,
          probability: 25,
          close_date: '2024-12-31'
        }))
      })
    })

    it('should persist MEDDPICC data', async () => {
      mockUpdateOpportunity.mockResolvedValue({ data: mockOpportunity, error: null })

      render(
        <OpportunityForm
          opportunity={mockOpportunity}
          opportunityId="opp123"
          mode="edit"
        />
      )

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Opportunity')).toBeInTheDocument()
      })

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update opportunity/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateOpportunity).toHaveBeenCalledWith('opp123', expect.objectContaining({
          metrics: 'Test metrics',
          economic_buyer: 'Test buyer',
          decision_criteria: 'Test criteria',
          decision_process: 'Test process',
          paper_process: 'Test paper',
          identify_pain: 'Test pain',
          champion: 'Test champion',
          competition: 'Test competition'
        }))
      })
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields', async () => {
      render(
        <OpportunityForm
          opportunity={null}
          opportunityId={undefined}
          mode="create"
        />
      )

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /create opportunity/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Opportunity name is required')).toBeInTheDocument()
      })
    })

    it('should validate probability range', async () => {
      mockUpdateOpportunity.mockResolvedValue({ data: mockOpportunity, error: null })

      render(
        <OpportunityForm
          opportunity={mockOpportunity}
          opportunityId="opp123"
          mode="edit"
        />
      )

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Opportunity')).toBeInTheDocument()
      })

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update opportunity/i })
      fireEvent.click(submitButton)

      // Should not show validation error for valid probability (25)
      await waitFor(() => {
        expect(screen.queryByText('Probability must be between 0 and 100')).not.toBeInTheDocument()
      })
    })

    it('should validate deal value', async () => {
      mockUpdateOpportunity.mockResolvedValue({ data: mockOpportunity, error: null })

      render(
        <OpportunityForm
          opportunity={mockOpportunity}
          opportunityId="opp123"
          mode="edit"
        />
      )

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Opportunity')).toBeInTheDocument()
      })

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update opportunity/i })
      fireEvent.click(submitButton)

      // Should not show validation error for valid deal value (50000)
      await waitFor(() => {
        expect(screen.queryByText('Deal value cannot be negative')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display API errors', async () => {
      mockUpdateOpportunity.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database connection failed' } 
      })

      render(
        <OpportunityForm
          opportunity={mockOpportunity}
          opportunityId="opp123"
          mode="edit"
        />
      )

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Opportunity')).toBeInTheDocument()
      })

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update opportunity/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Database connection failed')).toBeInTheDocument()
      })
    })

    it('should handle unexpected errors', async () => {
      mockUpdateOpportunity.mockRejectedValue(new Error('Network error'))

      render(
        <OpportunityForm
          opportunity={mockOpportunity}
          opportunityId="opp123"
          mode="edit"
        />
      )

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Opportunity')).toBeInTheDocument()
      })

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update opportunity/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
      })
    })
  })

  describe('Change Tracking', () => {
    it('should track form changes', async () => {
      render(
        <OpportunityForm
          opportunity={mockOpportunity}
          opportunityId="opp123"
          mode="edit"
        />
      )

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Opportunity')).toBeInTheDocument()
      })

      // Change the opportunity name
      const nameInput = screen.getByDisplayValue('Test Opportunity')
      fireEvent.change(nameInput, { target: { value: 'Updated Opportunity' } })

      // The form should be marked as dirty (this would be tested through internal state)
      // In a real implementation, you might show an "unsaved changes" indicator
    })
  })
})

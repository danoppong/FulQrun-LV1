import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MEDDPICCForm from '@/components/forms/MEDDPICCForm'

// Mock the API calls
jest.mock('@/lib/api/opportunities', () => ({
  opportunityAPI: {
    updateMEDDPICC: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}))

describe('MEDDPICCForm', () => {
  const mockOnSave = jest.fn()
  const defaultProps = {
    initialData: {
      metrics: 'Reduce operational costs by 30%',
      economic_buyer: 'CFO John Smith',
      decision_criteria: 'ROI, implementation time',
      decision_process: 'CFO approval required',
      paper_process: 'Contract review by legal',
      identify_pain: 'Current system inefficient',
      champion: 'IT Director Sarah',
      competition: 'Salesforce, HubSpot'
    },
    onSave: mockOnSave,
    loading: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders MEDDPICC form with initial data', () => {
    render(<MEDDPICCForm {...defaultProps} />)
    
    expect(screen.getByText('MEDDPICC Qualification')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Reduce operational costs by 30%')).toBeInTheDocument()
    expect(screen.getByDisplayValue('CFO John Smith')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ROI, implementation time')).toBeInTheDocument()
  })

  it('displays all MEDDPICC fields', () => {
    render(<MEDDPICCForm {...defaultProps} />)
    
    expect(screen.getByText('Metrics')).toBeInTheDocument()
    expect(screen.getByText('Economic Buyer')).toBeInTheDocument()
    expect(screen.getByText('Decision Criteria')).toBeInTheDocument()
    expect(screen.getByText('Decision Process')).toBeInTheDocument()
    expect(screen.getByText('Paper Process')).toBeInTheDocument()
    expect(screen.getByText('Identify Pain')).toBeInTheDocument()
    expect(screen.getByText('Champion')).toBeInTheDocument()
    expect(screen.getByText('Competition')).toBeInTheDocument()
  })

  it('shows completion percentage', () => {
    render(<MEDDPICCForm {...defaultProps} />)
    
    // Should show 100% completion since all fields are filled
    expect(screen.getByText(/100%/)).toBeInTheDocument()
  })

  it('updates metrics field', async () => {
    render(<MEDDPICCForm {...defaultProps} />)
    
    const metricsInput = screen.getByDisplayValue('Reduce operational costs by 30%')
    fireEvent.change(metricsInput, { target: { value: 'Reduce costs by 40%' } })
    fireEvent.blur(metricsInput)
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        metrics: 'Reduce costs by 40%',
        economic_buyer: 'CFO John Smith',
        decision_criteria: 'ROI, implementation time',
        decision_process: 'CFO approval required',
        paper_process: 'Contract review by legal',
        identify_pain: 'Current system inefficient',
        champion: 'IT Director Sarah',
        competition: 'Salesforce, HubSpot'
      })
    })
  })

  it('updates economic buyer field', async () => {
    render(<MEDDPICCForm {...defaultProps} />)
    
    const buyerInput = screen.getByDisplayValue('CFO John Smith')
    fireEvent.change(buyerInput, { target: { value: 'CEO Jane Doe' } })
    fireEvent.blur(buyerInput)
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        metrics: 'Reduce operational costs by 30%',
        economic_buyer: 'CEO Jane Doe',
        decision_criteria: 'ROI, implementation time',
        decision_process: 'CFO approval required',
        paper_process: 'Contract review by legal',
        identify_pain: 'Current system inefficient',
        champion: 'IT Director Sarah',
        competition: 'Salesforce, HubSpot'
      })
    })
  })

  it('shows progress indicators', () => {
    render(<MEDDPICCForm {...defaultProps} />)
    
    // Should show progress bar
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()
  })

  it('calculates completion percentage correctly', () => {
    const partialData = {
      metrics: 'Reduce costs',
      economic_buyer: '',
      decision_criteria: '',
      decision_process: '',
      paper_process: '',
      identify_pain: '',
      champion: '',
      competition: ''
    }

    render(<MEDDPICCForm {...defaultProps} initialData={partialData} />)
    
    // Should show 12.5% completion (1 out of 8 fields)
    expect(screen.getByText(/12.5%/)).toBeInTheDocument()
  })

  it('shows field descriptions', () => {
    render(<MEDDPICCForm {...defaultProps} />)
    
    expect(screen.getByText('Quantify the business impact')).toBeInTheDocument()
    expect(screen.getByText('Identify the decision maker')).toBeInTheDocument()
    expect(screen.getByText('Understand evaluation process')).toBeInTheDocument()
  })

  it('handles empty initial data', () => {
    const emptyProps = {
      initialData: {
        metrics: '',
        economic_buyer: '',
        decision_criteria: '',
        decision_process: '',
        paper_process: '',
        identify_pain: '',
        champion: '',
        competition: ''
      },
      onSave: mockOnSave,
      loading: false
    }

    render(<MEDDPICCForm {...emptyProps} />)
    
    expect(screen.getByText('MEDDPICC Qualification')).toBeInTheDocument()
    expect(screen.getByText(/0%/)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<MEDDPICCForm {...defaultProps} loading={true} />)
    
    const saveButton = screen.getByText('Saving...')
    expect(saveButton).toBeInTheDocument()
    expect(saveButton).toBeDisabled()
  })

  it('disables inputs when loading', () => {
    render(<MEDDPICCForm {...defaultProps} loading={true} />)
    
    const metricsInput = screen.getByDisplayValue('Reduce operational costs by 30%')
    const buyerInput = screen.getByDisplayValue('CFO John Smith')
    
    expect(metricsInput).toBeDisabled()
    expect(buyerInput).toBeDisabled()
  })

  it('shows field validation', () => {
    render(<MEDDPICCForm {...defaultProps} />)
    
    // All fields should be marked as completed
    const completedFields = screen.getAllByText('✓')
    expect(completedFields.length).toBeGreaterThan(0)
  })

  it('handles long text inputs', async () => {
    render(<MEDDPICCForm {...defaultProps} />)
    
    const longText = 'A'.repeat(1000)
    const metricsInput = screen.getByDisplayValue('Reduce operational costs by 30%')
    fireEvent.change(metricsInput, { target: { value: longText } })
    fireEvent.blur(metricsInput)
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          metrics: longText
        })
      )
    })
  })

  it('shows MEDDPICC score', () => {
    render(<MEDDPICCForm {...defaultProps} />)
    
    // Should show score based on completion
    expect(screen.getByText(/Score:/)).toBeInTheDocument()
  })

  it('handles form submission errors gracefully', async () => {
    const errorOnSave = jest.fn().mockRejectedValue(new Error('Save failed'))
    
    render(<MEDDPICCForm {...defaultProps} onSave={errorOnSave} />)
    
    const metricsInput = screen.getByDisplayValue('Reduce operational costs by 30%')
    fireEvent.change(metricsInput, { target: { value: 'New metrics' } })
    fireEvent.blur(metricsInput)
    
    await waitFor(() => {
      expect(errorOnSave).toHaveBeenCalled()
    })
  })
})

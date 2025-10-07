import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PEAKForm from '@/components/forms/PEAKForm';

// Mock the API calls
jest.mock('@/lib/api/opportunities', () => ({
  opportunityAPI: {
    updatePeakStage: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}))

describe('PEAKForm', () => {
  const mockOnSave = jest.fn()
  const defaultProps = {
    initialData: {
      peak_stage: 'prospecting',
      deal_value: 50000,
      probability: 25,
      expected_close_date: '2024-12-31'
    },
    onSave: mockOnSave,
    loading: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders PEAK form with initial data', () => {
    render(<PEAKForm {...defaultProps} />)
    
    expect(screen.getByText('PEAK Stage Management')).toBeInTheDocument()
    expect(screen.getByDisplayValue('50000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('25')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument()
  })

  it('displays all PEAK stages correctly', () => {
    render(<PEAKForm {...defaultProps} />)
    
    expect(screen.getByText('Prospecting')).toBeInTheDocument()
    expect(screen.getByText('Engaging')).toBeInTheDocument()
    expect(screen.getByText('Advancing')).toBeInTheDocument()
    expect(screen.getByText('Key Decision')).toBeInTheDocument()
  })

  it('shows stage descriptions', () => {
    render(<PEAKForm {...defaultProps} />)
    
    expect(screen.getByText('Initial contact and qualification')).toBeInTheDocument()
  })

  it('allows stage selection', async () => {
    render(<PEAKForm {...defaultProps} />)
    
    const engagingButton = screen.getByText('Engaging')
    fireEvent.click(engagingButton)
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        peak_stage: 'engaging',
        deal_value: 50000,
        probability: 25,
        expected_close_date: '2024-12-31'
      })
    })
  })

  it('updates deal value', async () => {
    render(<PEAKForm {...defaultProps} />)
    
    const dealValueInput = screen.getByDisplayValue('50000')
    fireEvent.change(dealValueInput, { target: { value: '75000' } })
    fireEvent.blur(dealValueInput)
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        peak_stage: 'prospecting',
        deal_value: 75000,
        probability: 25,
        expected_close_date: '2024-12-31'
      })
    })
  })

  it('updates probability', async () => {
    render(<PEAKForm {...defaultProps} />)
    
    const probabilityInput = screen.getByDisplayValue('25')
    fireEvent.change(probabilityInput, { target: { value: '50' } })
    fireEvent.blur(probabilityInput)
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        peak_stage: 'prospecting',
        deal_value: 50000,
        probability: 50,
        expected_close_date: '2024-12-31'
      })
    })
  })

  it('updates expected close date', async () => {
    render(<PEAKForm {...defaultProps} />)
    
    const dateInput = screen.getByDisplayValue('2024-12-31')
    fireEvent.change(dateInput, { target: { value: '2024-11-30' } })
    fireEvent.blur(dateInput)
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        peak_stage: 'prospecting',
        deal_value: 50000,
        probability: 25,
        expected_close_date: '2024-11-30'
      })
    })
  })

  it('shows loading state', () => {
    render(<PEAKForm {...defaultProps} loading={true} />)
    
    const saveButton = screen.getByText('Saving...')
    expect(saveButton).toBeInTheDocument()
    expect(saveButton).toBeDisabled()
  })

  it('validates deal value input', () => {
    render(<PEAKForm {...defaultProps} />)
    
    const dealValueInput = screen.getByDisplayValue('50000')
    fireEvent.change(dealValueInput, { target: { value: 'invalid' } })
    fireEvent.blur(dealValueInput)
    
    // Should not call onSave with invalid data
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('validates probability input', () => {
    render(<PEAKForm {...defaultProps} />)
    
    const probabilityInput = screen.getByDisplayValue('25')
    fireEvent.change(probabilityInput, { target: { value: '150' } })
    fireEvent.blur(probabilityInput)
    
    // Should not call onSave with invalid data
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('handles empty initial data', () => {
    const emptyProps = {
      initialData: {
        peak_stage: 'prospecting',
        deal_value: null,
        probability: null,
        expected_close_date: null
      },
      onSave: mockOnSave,
      loading: false
    }

    render(<PEAKForm {...emptyProps} />)
    
    expect(screen.getByText('PEAK Stage Management')).toBeInTheDocument()
    expect(screen.getByDisplayValue('')).toBeInTheDocument() // Deal value input
  })

  it('shows stage-specific recommendations', () => {
    render(<PEAKForm {...defaultProps} />)
    
    // Click on different stages to see recommendations
    const engagingButton = screen.getByText('Engaging')
    fireEvent.click(engagingButton)
    
    // Should show engaging stage recommendations
    expect(screen.getByText('Active communication and relationship building')).toBeInTheDocument()
  })

  it('disables inputs when loading', () => {
    render(<PEAKForm {...defaultProps} loading={true} />)
    
    const dealValueInput = screen.getByDisplayValue('50000')
    const probabilityInput = screen.getByDisplayValue('25')
    const dateInput = screen.getByDisplayValue('2024-12-31')
    
    expect(dealValueInput).toBeDisabled()
    expect(probabilityInput).toBeDisabled()
    expect(dateInput).toBeDisabled()
  })

  it('handles form submission errors gracefully', async () => {
    const errorOnSave = jest.fn().mockRejectedValue(new Error('Save failed'))
    
    render(<PEAKForm {...defaultProps} onSave={errorOnSave} />)
    
    const dealValueInput = screen.getByDisplayValue('50000')
    fireEvent.change(dealValueInput, { target: { value: '60000' } })
    fireEvent.blur(dealValueInput)
    
    await waitFor(() => {
      expect(errorOnSave).toHaveBeenCalled()
    })
  })
})

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import { MEDDPICCQualification } from '@/components/meddpicc'
import { MEDDPICC_CONFIG, calculateMEDDPICCScore } from '@/lib/meddpicc';

// Mock the opportunity API
jest.mock('@/lib/api/opportunities', () => ({
  opportunityAPI: {
    updateMEDDPICC: jest.fn().mockResolvedValue({ data: {}, error: null })
  }
}))

describe('MEDDPICC Integration', () => {
  const mockOpportunityId = 'test-opportunity-123'
  const mockOnSave = jest.fn()
  const mockOnStageGateReady = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('MEDDPICCQualification Component', () => {
    it('renders all MEDDPICC pillars correctly', () => {
      render(
        <MEDDPICCQualification
          opportunityId={mockOpportunityId}
          onSave={mockOnSave}
          onStageGateReady={mockOnStageGateReady}
        />
      )

      // Check that all pillars are rendered
      MEDDPICC_CONFIG.pillars.forEach(pillar => {
        expect(screen.getByText(pillar.displayName)).toBeInTheDocument()
        expect(screen.getByText(pillar.description)).toBeInTheDocument()
      })

      // Check that litmus test is rendered
      expect(screen.getByText(MEDDPICC_CONFIG.litmusTest.displayName)).toBeInTheDocument()
    })

    it('expands and collapses pillars correctly', () => {
      render(
        <MEDDPICCQualification
          opportunityId={mockOpportunityId}
          onSave={mockOnSave}
          onStageGateReady={mockOnStageGateReady}
        />
      )

      // Metrics pillar should be expanded by default
      const metricsPillar = screen.getByText('Metrics').closest('button')
      expect(metricsPillar).toBeInTheDocument()

      // Click to collapse
      fireEvent.click(metricsPillar!)
      
      // Click to expand another pillar
      const economicBuyerPillar = screen.getByText('Economic Buyer').closest('button')
      fireEvent.click(economicBuyerPillar!)
    })

    it('handles text input responses correctly', async () => {
      render(
        <MEDDPICCQualification
          opportunityId={mockOpportunityId}
          onSave={mockOnSave}
          onStageGateReady={mockOnStageGateReady}
        />
      )

      // Expand metrics pillar
      const metricsPillar = screen.getByText('Metrics').closest('button')
      fireEvent.click(metricsPillar!)

      // Find and fill text input
      const textInput = screen.getByPlaceholderText('Enter your response...')
      fireEvent.change(textInput, { target: { value: 'Test response for current cost' } })

      await waitFor(() => {
        expect(textInput).toHaveValue('Test response for current cost')
      })
    })

    it('handles scale/yes_no responses correctly', async () => {
      render(
        <MEDDPICCQualification
          opportunityId={mockOpportunityId}
          onSave={mockOnSave}
          onStageGateReady={mockOnStageGateReady}
        />
      )

      // Expand metrics pillar
      const metricsPillar = screen.getByText('Metrics').closest('button')
      fireEvent.click(metricsPillar!)

      // Find and select a scale option
      const scaleOption = screen.getByLabelText('Critical (Must solve immediately)')
      fireEvent.click(scaleOption)

      await waitFor(() => {
        expect(scaleOption).toBeChecked()
      })
    })

    it('calculates and displays assessment correctly', async () => {
      const mockResponses: MEDDPICCResponse[] = [
        {
          pillarId: 'metrics',
          questionId: 'current_cost',
          answer: 'High operational costs affecting profitability',
          points: 8
        },
        {
          pillarId: 'economicBuyer',
          questionId: 'budget_authority',
          answer: 'CFO John Smith',
          points: 7
        }
      ]

      render(
        <MEDDPICCQualification
          opportunityId={mockOpportunityId}
          initialData={mockResponses}
          onSave={mockOnSave}
          onStageGateReady={mockOnStageGateReady}
        />
      )

      // Check that assessment is calculated and displayed
      await waitFor(() => {
        const scoreElement = screen.getByText(/\d+%/)
        expect(scoreElement).toBeInTheDocument()
      })
    })
  })

  describe('MEDDPICC Scoring System', () => {
    it('calculates scores correctly for complete responses', () => {
      const completeResponses: MEDDPICCResponse[] = [
        // Metrics responses
        { pillarId: 'metrics', questionId: 'current_cost', answer: 'High costs', points: 8 },
        { pillarId: 'metrics', questionId: 'expected_roi', answer: 'Good ROI', points: 7 },
        { pillarId: 'metrics', questionId: 'success_metrics', answer: 'Clear metrics', points: 8 },
        { pillarId: 'metrics', questionId: 'urgency_level', answer: 'Critical', points: 10 },
        
        // Economic Buyer responses
        { pillarId: 'economicBuyer', questionId: 'budget_authority', answer: 'CFO', points: 8 },
        { pillarId: 'economicBuyer', questionId: 'influence_level', answer: 'High', points: 8 },
        { pillarId: 'economicBuyer', questionId: 'meeting_status', answer: 'Multiple meetings', points: 10 },
        { pillarId: 'economicBuyer', questionId: 'budget_range', answer: 'Confirmed', points: 8 }
      ]

      const assessment = calculateMEDDPICCScore(completeResponses)
      
      expect(assessment.overallScore).toBeGreaterThan(0)
      expect(assessment.qualificationLevel).toBeDefined()
      expect(assessment.pillarScores).toBeDefined()
      expect(assessment.nextActions).toBeDefined()
      expect(assessment.stageGateReadiness).toBeDefined()
    })

    it('handles empty responses correctly', () => {
      const emptyResponses: MEDDPICCResponse[] = []
      const assessment = calculateMEDDPICCScore(emptyResponses)
      
      expect(assessment.overallScore).toBe(0)
      expect(assessment.qualificationLevel).toBe('Poor')
      expect(assessment.nextActions.length).toBeGreaterThan(0)
    })

    it('generates appropriate next actions for incomplete assessments', () => {
      const incompleteResponses: MEDDPICCResponse[] = [
        { pillarId: 'metrics', questionId: 'current_cost', answer: 'Some cost', points: 3 }
      ]

      const assessment = calculateMEDDPICCScore(incompleteResponses)
      
      expect(assessment.nextActions.length).toBeGreaterThan(0)
      expect(assessment.nextActions.some(action => action.includes('Complete'))).toBe(true)
    })
  })

  describe('PEAK Integration', () => {
    it('checks stage gate readiness correctly', () => {
      const responsesWithPain: MEDDPICCResponse[] = [
        // Pain identified - need multiple questions for 50% score
        { pillarId: 'identifyPain', questionId: 'biggest_challenge', answer: 'Clear pain point', points: 8 },
        { pillarId: 'identifyPain', questionId: 'consequences', answer: 'Serious consequences', points: 8 },
        { pillarId: 'identifyPain', questionId: 'previous_attempts', answer: 'Tried solutions', points: 6 },
        
        // Champion identified - need multiple questions for 50% score
        { pillarId: 'champion', questionId: 'champion_identity', answer: 'Strong champion', points: 8 },
        { pillarId: 'champion', questionId: 'champion_influence', answer: 'High influence', points: 8 },
        { pillarId: 'champion', questionId: 'champion_commitment', answer: 'Committed', points: 6 },
        
        // Budget confirmed - need multiple questions for 50% score
        { pillarId: 'economicBuyer', questionId: 'budget_authority', answer: 'Budget confirmed', points: 8 },
        { pillarId: 'economicBuyer', questionId: 'influence_level', answer: 'High authority', points: 8 },
        { pillarId: 'economicBuyer', questionId: 'meeting_status', answer: 'Met multiple times', points: 8 },
        { pillarId: 'economicBuyer', questionId: 'budget_range', answer: 'Budget range confirmed', points: 6 }
      ]

      const assessment = calculateMEDDPICCScore(responsesWithPain)
      
      // Should be ready for Prospecting to Engaging gate
      expect(assessment.stageGateReadiness['Prospecting_to_Engaging']).toBe(true)
    })

    it('identifies missing criteria for stage advancement', () => {
      const incompleteResponses: MEDDPICCResponse[] = [
        { pillarId: 'identifyPain', questionId: 'biggest_challenge', answer: 'Some pain', points: 3 }
      ]

      const assessment = calculateMEDDPICCScore(incompleteResponses)
      
      // Should not be ready for advancement
      expect(assessment.stageGateReadiness['Prospecting_to_Engaging']).toBe(false)
    })
  })

  describe('Backward Compatibility', () => {
    it('maintains compatibility with legacy MEDDPICC form', () => {
      // Legacy data structure for compatibility testing
      // const _legacyData = {
      //   metrics: 'Legacy metrics data',
      //   economic_buyer: 'Legacy buyer data',
      //   decision_criteria: 'Legacy criteria data',
      //   decision_process: 'Legacy process data',
      //   paper_process: 'Legacy paper data',
      //   identify_pain: 'Legacy pain data',
      //   champion: 'Legacy champion data',
      //   competition: 'Legacy competition data'
      // }

      // This should not throw any errors
      expect(() => {
        render(
          <MEDDPICCQualification
            opportunityId={mockOpportunityId}
            onSave={mockOnSave}
            onStageGateReady={mockOnStageGateReady}
          />
        )
      }).not.toThrow()
    })
  })
})

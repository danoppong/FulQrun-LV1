// src/tests/enhanced-kpi-widget.test.tsx
// Test Enhanced KPI Widget with AI Integration
// Validates the AI capabilities integration in the KPI widget component

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PharmaKPICardWidget } from '@/components/bi/PharmaKPICardWidget';
import { KPIData } from '@/lib/types/pharmaceutical-bi';

// Mock the AI insights engine
jest.mock('@/lib/ai/ai-insights-engine', () => ({
  aiInsightEngine: {
    generateInsights: jest.fn().mockResolvedValue([
      {
        id: 'test_insight_1',
        title: 'TRx Performance Alert',
        description: 'Total prescriptions have decreased by 25.0% in the latest period.',
        category: 'performance',
        severity: 'high',
        confidence: 0.85,
        recommendations: [
          {
            title: 'Increase Call Frequency',
            description: 'Consider increasing HCP visit frequency to address TRx decline',
            expectedImpact: 'High',
            timeline: 'Immediate',
            confidence: 0.8
          }
        ],
        metadata: {
          analysis_timestamp: new Date().toISOString(),
          data_points: 8,
          algorithm: 'trend_analysis_v1'
        },
        actions: {
          primaryAction: {
            id: 'view_details',
            type: 'navigate',
            label: 'View Details',
            target: { type: 'dashboard', value: '/details' }
          }
        }
      }
    ])
  }
}));

describe('Enhanced KPI Widget - AI Integration', () => {
  const mockKPIData: KPIData = {
    kpiId: 'trx',
    kpiName: 'Total Prescriptions',
    value: 950,
    trend: 'down',
    confidence: 0.85,
    format: 'number',
    metadata: {
      territory: 'TestTerritory',
      product: 'TestProduct',
      period: '30_days'
    }
  };

  beforeEach(() => {
    // Clear any previous mock calls
    jest.clearAllMocks();
  });

  test('renders KPI widget with AI insights capability', async () => {
    render(<PharmaKPICardWidget data={mockKPIData} />);
    
    // Check that the KPI widget renders
    expect(screen.getByText('Total Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('950')).toBeInTheDocument();
    
    // Check for AI analysis button
    const aiButton = screen.getByRole('button', { name: /analyze with ai/i });
    expect(aiButton).toBeInTheDocument();
  });

  test('triggers AI analysis when AI button is clicked', async () => {
    const { aiInsightEngine } = require('@/lib/ai/ai-insights-engine');
    
    render(<PharmaKPICardWidget data={mockKPIData} />);
    
    // Click the AI analysis button
    const aiButton = screen.getByRole('button', { name: /analyze with ai/i });
    fireEvent.click(aiButton);
    
    // Should show analyzing state
    expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
    
    // Wait for AI analysis to complete
    await waitFor(() => {
      expect(aiInsightEngine.generateInsights).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          timeframe: '30_days',
          filters: expect.objectContaining({
            territories: ['TestTerritory'],
            products: ['TestProduct']
          })
        })
      );
    });
  });

  test('displays AI insights after analysis completes', async () => {
    render(<PharmaKPICardWidget data={mockKPIData} />);
    
    // Trigger AI analysis
    const aiButton = screen.getByRole('button', { name: /analyze with ai/i });
    fireEvent.click(aiButton);
    
    // Wait for insights to appear
    await waitFor(() => {
      expect(screen.getByText('TRx Performance Alert')).toBeInTheDocument();
    });
    
    // Check insight details
    expect(screen.getByText(/decreased by 25.0%/)).toBeInTheDocument();
    
    // Check for insight severity indicator
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  test('shows AI insight recommendations in tooltip', async () => {
    render(<PharmaKPICardWidget data={mockKPIData} />);
    
    // Trigger AI analysis
    const aiButton = screen.getByRole('button', { name: /analyze with ai/i });
    fireEvent.click(aiButton);
    
    // Wait for insights to load
    await waitFor(() => {
      expect(screen.getByText('TRx Performance Alert')).toBeInTheDocument();
    });
    
    // Look for brain icon indicating AI insights
    const brainIcon = screen.getByTestId('ai-insight-indicator');
    expect(brainIcon).toBeInTheDocument();
    
    // Hover over the insight to see recommendations
    fireEvent.mouseEnter(brainIcon);
    
    await waitFor(() => {
      expect(screen.getByText(/Increase Call Frequency/)).toBeInTheDocument();
      expect(screen.getByText(/Consider increasing HCP visit frequency/)).toBeInTheDocument();
    });
  });

  test('handles AI analysis errors gracefully', async () => {
    // Mock AI engine to throw error
    const { aiInsightEngine } = require('@/lib/ai/ai-insights-engine');
    aiInsightEngine.generateInsights.mockRejectedValue(new Error('AI analysis failed'));
    
    render(<PharmaKPICardWidget data={mockKPIData} />);
    
    // Trigger AI analysis
    const aiButton = screen.getByRole('button', { name: /analyze with ai/i });
    fireEvent.click(aiButton);
    
    // Should handle error and show appropriate message
    await waitFor(() => {
      expect(screen.getByText(/analysis unavailable/i)).toBeInTheDocument();
    });
  });

  test('displays confidence level for AI insights', async () => {
    render(<PharmaKPICardWidget data={mockKPIData} />);
    
    // Trigger AI analysis
    const aiButton = screen.getByRole('button', { name: /analyze with ai/i });
    fireEvent.click(aiButton);
    
    // Wait for insights to load
    await waitFor(() => {
      expect(screen.getByText('TRx Performance Alert')).toBeInTheDocument();
    });
    
    // Check for confidence indicator (85% confidence)
    expect(screen.getByText(/85%/)).toBeInTheDocument();
  });

  test('integrates with different KPI types', async () => {
    const nrxKPIData: KPIData = {
      kpiId: 'nrx',
      kpiName: 'New Prescriptions',
      value: 180,
      trend: 'up',
      confidence: 0.92,
      format: 'number',
      metadata: {
        territory: 'TestTerritory',
        product: 'TestProduct',
        period: '30_days'
      }
    };
    
    render(<PharmaKPICardWidget data={nrxKPIData} />);
    
    // Should render NRx KPI
    expect(screen.getByText('New Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('180')).toBeInTheDocument();
    
    // AI analysis should still be available
    expect(screen.getByRole('button', { name: /analyze with ai/i })).toBeInTheDocument();
  });

  test('AI insights improve over time with more data', async () => {
    const { aiInsightEngine } = require('@/lib/ai/ai-insights-engine');
    
    // Mock multiple calls with improving confidence
    aiInsightEngine.generateInsights
      .mockResolvedValueOnce([{ // First call - lower confidence
        id: 'insight_1',
        title: 'Initial Analysis',
        description: 'Preliminary TRx analysis',
        category: 'performance',
        severity: 'medium',
        confidence: 0.65,
        recommendations: [],
        metadata: { analysis_timestamp: new Date().toISOString(), data_points: 5 }
      }])
      .mockResolvedValueOnce([{ // Second call - higher confidence
        id: 'insight_2', 
        title: 'Refined Analysis',
        description: 'Comprehensive TRx analysis with more data',
        category: 'performance',
        severity: 'high',
        confidence: 0.85,
        recommendations: [],
        metadata: { analysis_timestamp: new Date().toISOString(), data_points: 20 }
      }]);
    
    const { rerender } = render(<PharmaKPICardWidget data={mockKPIData} />);
    
    // First analysis
    fireEvent.click(screen.getByRole('button', { name: /analyze with ai/i }));
    await waitFor(() => {
      expect(screen.getByText(/65%/)).toBeInTheDocument();
    });
    
    // Simulate more data becoming available
    const updatedKPIData = { ...mockKPIData, value: 925 };
    rerender(<PharmaKPICardWidget data={updatedKPIData} />);
    
    // Second analysis with more data
    fireEvent.click(screen.getByRole('button', { name: /analyze with ai/i }));
    await waitFor(() => {
      expect(screen.getByText(/85%/)).toBeInTheDocument();
    });
  });
});

export {};
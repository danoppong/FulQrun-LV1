// src/tests/enhanced-kpi-widget.test.tsx
// Test Enhanced KPI Widget with AI Integration
// Validates the AI capabilities integration in the KPI widget component

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PharmaKPICardWidget } from '@/components/dashboard/widgets/PharmaKPICardWidget';
import { WidgetType } from '@/lib/dashboard-widgets';
import { PharmaKPICardData } from '@/lib/types/dashboard';

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
import { aiInsightEngine } from '@/lib/ai/ai-insights-engine';

// Mock AuthService to avoid auth checks during KPI calculation
jest.mock('@/lib/auth-unified', () => ({
  AuthService: {
    getCurrentUser: jest.fn().mockResolvedValue({ id: 'user_1', profile: { organization_id: 'org1', role: 'rep' } })
  }
}));

// Mock DashboardContext hook used by the widget
jest.mock('@/components/dashboard/DashboardContext', () => ({
  useDashboard: () => ({ updateSettings: jest.fn(), organizationId: 'org1' })
}));

// Mock KPI engine calculations used by the widget
jest.mock('@/lib/bi/kpi-engine', () => ({
  kpiEngine: {
    calculateTRx: jest.fn().mockResolvedValue({ value: 960, confidence: 0.85, metadata: {} }),
    calculateNRx: jest.fn().mockResolvedValue({ value: 185, confidence: 0.9, metadata: {} }),
    calculateMarketShare: jest.fn().mockResolvedValue({ value: 12.5, confidence: 0.8, metadata: {} }),
    calculateGrowth: jest.fn().mockResolvedValue({ value: 5, confidence: 0.8, metadata: {} }),
    calculateReach: jest.fn().mockResolvedValue({ value: 75, confidence: 0.8, metadata: {} }),
    calculateFrequency: jest.fn().mockResolvedValue({ value: 3, confidence: 0.8, metadata: {} }),
    calculateCallEffectiveness: jest.fn().mockResolvedValue({ value: 1.8, confidence: 0.8, metadata: {} }),
    calculateSampleToScriptRatio: jest.fn().mockResolvedValue({ value: 8, confidence: 0.8, metadata: {} }),
    calculateFormularyAccess: jest.fn().mockResolvedValue({ value: 70, confidence: 0.8, metadata: {} }),
  },
}));

// Mock fetch for territories lookup
global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) }) as unknown as typeof fetch;

describe('Enhanced KPI Widget - AI Integration', () => {
  const mockKPIData: PharmaKPICardData = {
    kpiId: 'trx',
    kpiName: 'Total Prescriptions',
    value: 950,
    trend: 'down',
    confidence: 0.85,
    format: 'number',
    metadata: {
      territoryId: 'TestTerritory',
      productId: 'TestProduct',
      period: '30_days'
    }
  };

  beforeEach(() => {
    // Clear any previous mock calls
    jest.clearAllMocks();
  });

  test('renders KPI widget with controls and KPI info', async () => {
    render(
      <PharmaKPICardWidget 
        widget={{ id: 'w1', type: WidgetType.PHARMA_KPI_CARD, title: 'KPI', position: { x:0,y:0,w:3,h:2 } }} 
        data={mockKPIData} 
      />
    );
    
    // Check that the KPI widget renders
    expect(screen.getByText('Total Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('950')).toBeInTheDocument();
    
    // Check for refresh control
    expect(screen.getByTitle('Refresh KPI')).toBeInTheDocument();
  });

  test('triggers AI analysis when AI button is clicked', async () => {
    
    render(
      <PharmaKPICardWidget 
        widget={{ id: 'w1', type: WidgetType.PHARMA_KPI_CARD, title: 'KPI', position: { x:0,y:0,w:3,h:2 } }} 
        data={mockKPIData}
        organizationId="org1" 
        territoryId="TestTerritory" 
        productId="TestProduct" 
      />
    );
    
    // Click the AI analysis button
  fireEvent.click(screen.getByTitle('Refresh KPI'));
    
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
    render(
      <PharmaKPICardWidget 
        widget={{ id: 'w1', type: WidgetType.PHARMA_KPI_CARD, title: 'KPI', position: { x:0,y:0,w:3,h:2 } }} 
        data={mockKPIData} 
        organizationId="org1"
      />
    );
    
    // Trigger KPI calculation and AI analysis
    fireEvent.click(screen.getByTitle('Refresh KPI'));
    
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
    render(
      <PharmaKPICardWidget 
        widget={{ id: 'w1', type: WidgetType.PHARMA_KPI_CARD, title: 'KPI', position: { x:0,y:0,w:3,h:2 } }} 
        data={mockKPIData}
        organizationId="org1"
      />
    );
    
    // Trigger KPI calculation and AI analysis
    fireEvent.click(screen.getByTitle('Refresh KPI'));
    
    // Wait for insights to load
    await waitFor(() => {
      expect(screen.getByText('TRx Performance Alert')).toBeInTheDocument();
    });
    
    // Look for brain icon indicating AI insights
    const brainIconEl = await screen.findByTestId('ai-insight-indicator');
    expect(brainIconEl).toBeInTheDocument();
    
    // Hover over the insight to see recommendations
  fireEvent.mouseEnter(brainIconEl);
    
    await waitFor(() => {
      expect(screen.getByText(/Increase Call Frequency/)).toBeInTheDocument();
      expect(screen.getByText(/Consider increasing HCP visit frequency/)).toBeInTheDocument();
    });
  });

  test('handles AI analysis errors gracefully', async () => {
    // Mock AI engine to throw error
    (aiInsightEngine.generateInsights as jest.Mock).mockRejectedValue(new Error('AI analysis failed'));
    
    render(
      <PharmaKPICardWidget 
        widget={{ id: 'w1', type: WidgetType.PHARMA_KPI_CARD, title: 'KPI', position: { x:0,y:0,w:3,h:2 } }} 
        data={mockKPIData} 
        organizationId="org1"
      />
    );
    
    // Trigger KPI calculation and AI analysis
    fireEvent.click(screen.getByTitle('Refresh KPI'));
    
    // Should handle error and show appropriate message
    await waitFor(() => {
      expect(screen.getByText(/analysis unavailable/i)).toBeInTheDocument();
    });
  });

  test('displays confidence level for AI insights', async () => {
    render(
      <PharmaKPICardWidget 
        widget={{ id: 'w1', type: WidgetType.PHARMA_KPI_CARD, title: 'KPI', position: { x:0,y:0,w:3,h:2 } }} 
        data={mockKPIData} 
      />
    );
    
  // Trigger KPI calculation and AI analysis
  fireEvent.click(screen.getByTitle('Refresh KPI'));
    
    // Wait for insights to load
    await waitFor(() => {
      expect(screen.getByText('TRx Performance Alert')).toBeInTheDocument();
    });
    
    // Check for confidence indicator (85% confidence)
    expect(screen.getByText(/85%/)).toBeInTheDocument();
  });

  test('integrates with different KPI types', async () => {
    const nrxKPIData: PharmaKPICardData = {
      kpiId: 'nrx',
      kpiName: 'New Prescriptions',
      value: 180,
      trend: 'up',
      confidence: 0.92,
      format: 'number',
      metadata: {
        territoryId: 'TestTerritory',
        productId: 'TestProduct',
        period: '30_days'
      }
    };
    
    render(
      <PharmaKPICardWidget 
        widget={{ id: 'w1', type: WidgetType.PHARMA_KPI_CARD, title: 'KPI', position: { x:0,y:0,w:3,h:2 } }} 
        data={nrxKPIData} 
      />
    );
    
    // Should render NRx KPI
    expect(screen.getByText('New Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('180')).toBeInTheDocument();
    
  // Refresh control should be available
  expect(screen.getByTitle('Refresh KPI')).toBeInTheDocument();
  });

  test('AI insights improve over time with more data', async () => {
    
    // Mock multiple calls with improving confidence
    (aiInsightEngine.generateInsights as jest.Mock)
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
    
    const { rerender } = render(
      <PharmaKPICardWidget 
        widget={{ id: 'w1', type: WidgetType.PHARMA_KPI_CARD, title: 'KPI', position: { x:0,y:0,w:3,h:2 } }} 
        data={mockKPIData} 
      />
    );
    
    // First analysis
    fireEvent.click(screen.getByTitle('Refresh KPI'));
    await waitFor(() => {
      expect(screen.getByText('Initial Analysis')).toBeInTheDocument();
    });
    
    // Simulate more data becoming available
    const updatedKPIData = { ...mockKPIData, value: 925 };
    rerender(
      <PharmaKPICardWidget 
        widget={{ id: 'w1', type: WidgetType.PHARMA_KPI_CARD, title: 'KPI', position: { x:0,y:0,w:3,h:2 } }} 
        data={updatedKPIData} 
      />
    );
    
    // Second analysis with more data
    fireEvent.click(screen.getByTitle('Refresh KPI'));
    await waitFor(() => {
      expect(screen.getByText('Refined Analysis')).toBeInTheDocument();
    });
  });
});

export {};
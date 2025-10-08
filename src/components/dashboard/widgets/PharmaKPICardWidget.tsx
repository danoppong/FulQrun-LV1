// src/components/dashboard/widgets/PharmaKPICardWidget.tsx
// Enhanced Pharmaceutical KPI Card Widget Component
// Displays pharmaceutical-specific KPIs with real-time KPI engine integration

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardWidget } from '@/lib/dashboard-widgets'
import { PharmaKPICardData } from '@/lib/types/dashboard'
import { KPICard } from '@/components/bi/KPICard';
import { kpiEngine, KPICalculationParams } from '@/lib/bi/kpi-engine';
import { aiInsightEngine } from '@/lib/ai/ai-insights-engine';
import { AuthService } from '@/lib/auth-unified';
import { AlertCircle, RefreshCw, Brain, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { AIInsight } from '@/lib/types/ai-insights';

interface PharmaKPICardWidgetProps {
  widget: DashboardWidget;
  data: PharmaKPICardData;
  organizationId?: string;
  productId?: string;
  territoryId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
  onDrillDown?: (kpiData: PharmaKPICardData, kpiId: string, organizationId: string, productId?: string, territoryId?: string) => void;
}

export function PharmaKPICardWidget({ 
  widget: _widget, 
  data, 
  organizationId,
  productId,
  territoryId,
  autoRefresh = false,
  refreshInterval = 15,
  onDrillDown
}: PharmaKPICardWidgetProps) {
  const [kpiData, setKpiData] = useState<PharmaKPICardData>(data);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handle drill-down click
  const handleDrillDown = useCallback(() => {
    if (onDrillDown && organizationId) {
      onDrillDown(kpiData, data.kpiId, organizationId, productId, territoryId);
    }
  }, [onDrillDown, kpiData, data.kpiId, organizationId, productId, territoryId]);

  // AI Analysis for KPI insights
  const analyzeKPIWithAI = useCallback(async (kpiDataToAnalyze: PharmaKPICardData) => {
    if (!organizationId) return;

    setIsAnalyzing(true);
    
    try {
      // Generate mock pharmaceutical data for AI analysis
      const pharmaData = [{
        date: new Date().toISOString().split('T')[0],
        territory: territoryId || 'Territory-1',
        product: productId || 'Product-A',
        trx: data.kpiId === 'trx' ? kpiDataToAnalyze.value : Math.floor(Math.random() * 1000) + 500,
        nrx: data.kpiId === 'nrx' ? kpiDataToAnalyze.value : Math.floor(Math.random() * 200) + 100,
        market_share: data.kpiId === 'market_share' ? kpiDataToAnalyze.value : Math.random() * 20 + 10,
        calls: Math.floor(Math.random() * 10) + 3,
        samples: Math.floor(Math.random() * 50) + 20
      }];

      const analysisContext = {
        timeframe: '30_days',
        filters: {
          territories: territoryId ? [territoryId] : [],
          products: productId ? [productId] : [],
        },
        user_id: 'user_123',
        organization_id: organizationId
      };

      // Generate AI insights for this KPI
      const insights = await aiInsightEngine.generateInsights(pharmaData, analysisContext);
      
      // Filter insights relevant to this specific KPI
      const relevantInsights = insights.filter(insight => 
        insight.category === 'performance' && 
        (insight.description.toLowerCase().includes(data.kpiId) || 
         insight.title.toLowerCase().includes(data.kpiName.toLowerCase()))
      );

      setAiInsights(relevantInsights);
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [organizationId, territoryId, productId, data.kpiId, data.kpiName]);

  // Calculate KPI using the engine
  const calculateKPI = useCallback(async () => {
    if (!organizationId || !data.kpiId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const params: KPICalculationParams = {
        organizationId,
        productId,
        territoryId,
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        periodEnd: new Date()
      };

      let calculation;
      
      // Call appropriate KPI calculation method
      switch (data.kpiId) {
        case 'trx':
          calculation = await kpiEngine.calculateTRx(params);
          break;
        case 'nrx':
          calculation = await kpiEngine.calculateNRx(params);
          break;
        case 'market_share':
          calculation = await kpiEngine.calculateMarketShare(params);
          break;
        case 'growth':
          calculation = await kpiEngine.calculateGrowth(params);
          break;
        case 'reach':
          calculation = await kpiEngine.calculateReach(params);
          break;
        case 'frequency':
          calculation = await kpiEngine.calculateFrequency(params);
          break;
        case 'call_effectiveness':
          calculation = await kpiEngine.calculateCallEffectiveness(params);
          break;
        case 'sample_to_script_ratio':
          calculation = await kpiEngine.calculateSampleToScriptRatio(params);
          break;
        case 'formulary_access':
          calculation = await kpiEngine.calculateFormularyAccess(params);
          break;
        default:
          throw new Error(`Unknown KPI: ${data.kpiId}`);
      }

      // Update KPI data with calculated values
      const trendValue = calculation.value > kpiData.value ? 'up' as const : 
                        calculation.value < kpiData.value ? 'down' as const : 
                        'stable' as const;

      const newKpiData: PharmaKPICardData = {
        ...kpiData,
        value: calculation.value,
        confidence: calculation.confidence,
        trend: trendValue,
        metadata: {
          ...kpiData.metadata,
          ...calculation.metadata,
          calculatedAt: calculation.calculatedAt.toISOString()
        }
      };

      setKpiData(newKpiData);
      setLastUpdated(new Date());

      // Trigger AI analysis for insights
      await analyzeKPIWithAI(newKpiData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate KPI');
      console.error('KPI calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, productId, territoryId, data.kpiId, kpiData, analyzeKPIWithAI]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && organizationId) {
      // Initial calculation
      calculateKPI();

      // Set up interval for auto-refresh
      const interval = setInterval(() => {
        calculateKPI();
      }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, calculateKPI, organizationId]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    calculateKPI();
  }, [calculateKPI]);

  const getKPIColor = (kpiId: string, value: number): string => {
    // Enhanced color schemes based on KPI type and pharmaceutical benchmarks
    switch (kpiId) {
      case 'trx':
      case 'nrx':
        return value > 1000 ? 'text-green-600' : value > 500 ? 'text-yellow-600' : 'text-red-600';
      case 'market_share':
        return value > 15 ? 'text-green-600' : value > 10 ? 'text-yellow-600' : 'text-red-600';
      case 'growth':
        return value > 10 ? 'text-green-600' : value > 0 ? 'text-yellow-600' : 'text-red-600';
      case 'reach':
        return value > 80 ? 'text-green-600' : value > 60 ? 'text-yellow-600' : 'text-red-600';
      case 'frequency':
        return value > 3 ? 'text-green-600' : value > 2 ? 'text-yellow-600' : 'text-red-600';
      case 'call_effectiveness':
        return value > 2 ? 'text-green-600' : value > 1.5 ? 'text-yellow-600' : 'text-red-600';
      case 'sample_to_script_ratio':
        return value < 10 ? 'text-green-600' : value < 15 ? 'text-yellow-600' : 'text-red-600';
      case 'formulary_access':
        return value > 80 ? 'text-green-600' : value > 60 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative">
      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center z-10">
          <div className="text-center p-4">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={handleManualRefresh}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-80 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <RefreshCw className="h-6 w-6 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-blue-700">Calculating...</p>
          </div>
        </div>
      )}

      {/* Enhanced KPI Card */}
      <div className="relative">
        <div 
          className={`${onDrillDown ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
          onClick={onDrillDown ? handleDrillDown : undefined}
          title={onDrillDown ? 'Click for detailed analytics' : undefined}
        >
          <KPICard
            title={kpiData.kpiName}
            value={kpiData.value}
            trend={kpiData.trend}
            color={getKPIColor(kpiData.kpiId, kpiData.value)}
            confidence={kpiData.confidence}
            metadata={kpiData.metadata}
            format={kpiData.format}
          />
        </div>
        
        {/* Refresh Controls */}
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          {autoRefresh && (
            <div className="flex items-center text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1" />
              <span>Live</span>
            </div>
          )}
          
          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Refresh KPI"
          >
            <RefreshCw className={`h-3 w-3 text-gray-400 hover:text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Last Updated Indicator */}
        <div className="absolute bottom-1 right-2 text-xs text-gray-400">
          {formatLastUpdated(lastUpdated)}
        </div>

        {/* Confidence Indicator */}
        {kpiData.confidence < 0.8 && (
          <div className="absolute bottom-1 left-2 flex items-center">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1" />
            <span className="text-xs text-gray-500">Low confidence</span>
          </div>
        )}

        {/* AI Insights Indicator */}
        {aiInsights.length > 0 && (
          <div className="absolute top-1 left-2 flex items-center">
            <Brain className="h-3 w-3 text-purple-500 mr-1" />
            <span className="text-xs text-purple-600 font-medium">{aiInsights.length}</span>
            <div className="ml-1 group relative">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              {/* AI Insights Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <div className="font-medium mb-1">AI Insights:</div>
                {aiInsights.slice(0, 2).map((insight) => (
                  <div key={insight.id} className="mb-1">
                    <div className="flex items-center">
                      {insight.severity === 'high' && <TrendingDown className="h-3 w-3 text-red-400 mr-1" />}
                      {insight.severity === 'medium' && <TrendingUp className="h-3 w-3 text-yellow-400 mr-1" />}
                      {insight.severity === 'low' && <Brain className="h-3 w-3 text-blue-400 mr-1" />}
                      <span className="truncate">{insight.title}</span>
                    </div>
                  </div>
                ))}
                {aiInsights.length > 2 && (
                  <div className="text-purple-300">+{aiInsights.length - 2} more insights</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Analysis Loading Indicator */}
        {isAnalyzing && (
          <div className="absolute top-1 left-2 flex items-center">
            <Brain className="h-3 w-3 text-purple-500 animate-pulse mr-1" />
            <span className="text-xs text-purple-600">Analyzing...</span>
          </div>
        )}
      </div>
    </div>
  );
}

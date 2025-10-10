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
import { AlertCircle, RefreshCw, Brain, TrendingUp, TrendingDown, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';
import { AIInsight } from '@/lib/types/ai-insights';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/components/dashboard/DashboardContext';

interface PharmaKPICardWidgetProps {
  widget: DashboardWidget;
  data: PharmaKPICardData;
  organizationId?: string;
  productId?: string;
  territoryId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
  onDrillDown?: (kpiData: PharmaKPICardData, kpiId: string, organizationId: string, productId?: string, territoryId?: string) => void;
  onUpdateMetadata?: (widgetId: string, metadata: Record<string, unknown>) => void;
}

export function PharmaKPICardWidget({ 
  widget: _widget, 
  data, 
  organizationId,
  productId,
  territoryId,
  autoRefresh = false,
  refreshInterval = 15,
  onDrillDown,
  onUpdateMetadata: _onUpdateMetadata
}: PharmaKPICardWidgetProps) {
  const dashboard = useDashboard();
  const [kpiData, setKpiData] = useState<PharmaKPICardData>(data);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [availableTerritories, setAvailableTerritories] = useState<Array<{ id: string; name: string }>>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string>('');

  // Handle drill-down click
  const handleDrillDown = useCallback(() => {
    if (onDrillDown && organizationId) {
      const metaProductId = (kpiData?.metadata?.productId as string | undefined) || productId;
      onDrillDown(kpiData, data.kpiId, organizationId, metaProductId, territoryId);
    }
  }, [onDrillDown, kpiData, data.kpiId, organizationId, productId, territoryId]);

  useEffect(() => {
    let isActive = true;
    const loadProducts = async () => {
      if (data.kpiId !== 'market_share') return;
      try {
        // Try to fetch products from database (expects a 'products' table with id, name, organization_id)
        if (organizationId) {
          const { data: rows, error } = await supabase
            .from('products' as string)
            .select('id, name')
            .eq('organization_id', organizationId)
            .order('name', { ascending: true });
          if (!isActive) return;
          if (rows && !error) {
            setAvailableProducts(rows as Array<{ id: string; name: string }>);
            return;
          }
        }
      } catch (_e) {
        // ignore and fallback below
      }
      // Fallback list if table unavailable
      if (isActive) {
        setAvailableProducts([
          { id: 'PRODUCT_A', name: 'Product A' },
          { id: 'PRODUCT_B', name: 'Product B' },
          { id: 'PRODUCT_C', name: 'Product C' }
        ]);
      }
    };
    loadProducts();
    return () => { isActive = false };
  }, [organizationId, data.kpiId]);

  // Load territories when org is available or when config opens
  useEffect(() => {
    let active = true
    const load = async () => {
      if (!organizationId) return
      try {
        const res = await fetch(`/api/sales-performance/territories?organizationId=${encodeURIComponent(organizationId)}`, { cache: 'no-store' })
        if (!active) return
        if (res.ok) {
          const json = (await res.json()) as unknown
          const rows = Array.isArray(json) ? json : Array.isArray((json as Record<string, unknown>)?.data) ? (json as Record<string, unknown>).data as unknown[] : []
          const mapped = rows.map((r) => {
            const rec = r as { id?: string; name?: string; code?: string }
            return { id: String(rec.id ?? rec.code ?? ''), name: String(rec.name ?? rec.code ?? rec.id ?? '') }
          }).filter(t => t.id)
          if (mapped.length) setAvailableTerritories(mapped)
          else setAvailableTerritories([
            { id: 'TERR-1', name: 'Territory 1' },
            { id: 'TERR-2', name: 'Territory 2' },
            { id: 'TERR-3', name: 'Territory 3' },
          ])
        } else {
          setAvailableTerritories([
            { id: 'TERR-1', name: 'Territory 1' },
            { id: 'TERR-2', name: 'Territory 2' },
            { id: 'TERR-3', name: 'Territory 3' },
          ])
        }
      } catch (_e) {
        if (!active) return
        setAvailableTerritories([
          { id: 'TERR-1', name: 'Territory 1' },
          { id: 'TERR-2', name: 'Territory 2' },
          { id: 'TERR-3', name: 'Territory 3' },
        ])
      }
    }
    // Fetch when widget mounts and when config is toggled on
    if (organizationId && (showConfig || availableTerritories.length === 0)) {
      void load()
    }
    return () => { active = false }
  }, [organizationId, showConfig, availableTerritories.length])

  // Initialize local selectors from incoming metadata/props so they are preselected when available
  useEffect(() => {
    if (data.kpiId !== 'market_share') return;
    const effective = (kpiData?.metadata?.productId as string | undefined) || productId || '';
    setSelectedProductId(effective);
  }, [data.kpiId, kpiData?.metadata?.productId, productId]);

  useEffect(() => {
    const effectiveTerritory = (kpiData?.metadata?.territoryId as string | undefined) || territoryId || ''
    setSelectedTerritoryId(effectiveTerritory)
  }, [kpiData?.metadata?.territoryId, territoryId])
  // AI Analysis for KPI insights
  const analyzeKPIWithAI = useCallback(async (kpiDataToAnalyze: PharmaKPICardData) => {
    const effectiveOrganizationId = organizationId || dashboard?.organizationId;
    if (!effectiveOrganizationId) return;

    setAiError(null);
    
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
        organization_id: effectiveOrganizationId
      };

      // Generate AI insights for this KPI
      const insights = await aiInsightEngine.generateInsights(pharmaData, analysisContext);
      
      // Filter insights relevant to this specific KPI
      const ki = String(data.kpiId || '').toLowerCase();
      const kn = String(data.kpiName || '').toLowerCase();
      const relevantInsights = insights.filter((insight) => {
        const t = insight.title?.toLowerCase?.() || '';
        const d = insight.description?.toLowerCase?.() || '';
        return (
          insight.category === 'performance' ||
          t.includes(ki) || d.includes(ki) || t.includes(kn) || d.includes(kn)
        );
      });

      setAiInsights(relevantInsights);
    } catch (err) {
      console.error('AI analysis error:', err);
      setAiError('Analysis unavailable');
      // Fallback: derive a basic insight from KPI data so UI remains informative
      try {
        const fallback: AIInsight[] = [];
        const lowerId = String(data.kpiId || '').toLowerCase();
        if (lowerId === 'trx') {
          const severity = kpiDataToAnalyze.trend === 'down' ? 'high' : 'medium';
          const desc = kpiDataToAnalyze.trend === 'down'
            ? 'Total prescriptions trend indicates potential decline.'
            : 'Total prescriptions trend indicates potential improvement.';
          fallback.push({
            id: 'fallback_trx_insight',
            title: 'TRx Performance Alert',
            description: desc,
            category: 'performance',
            severity,
            confidence: kpiDataToAnalyze.confidence,
            recommendations: [],
            metadata: { algorithm: 'fallback_rule', analysis_timestamp: new Date().toISOString(), data_points: 1 },
          } as AIInsight);
        }
        if (fallback.length) setAiInsights(fallback);
      } catch { /* no-op */ }
    } finally {
      setIsAnalyzing(false);
    }
  }, [organizationId, dashboard?.organizationId, territoryId, productId, data.kpiId, data.kpiName]);

  // Calculate KPI using the engine
  const calculateKPI = useCallback(async () => {
    const effectiveOrganizationId = organizationId || dashboard?.organizationId;
    if (!effectiveOrganizationId || !data.kpiId) {
      return;
    }

  setIsLoading(true);
  setIsAnalyzing(true);
    setError(null);

    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

  // Prefer metadata overrides when present, otherwise fall back to global props
  const metaProductId = kpiData?.metadata?.productId as string | undefined
  const effectiveProductId = metaProductId ?? productId
  const metaTerritoryId = kpiData?.metadata?.territoryId as string | undefined
  const effectiveTerritoryId = metaTerritoryId ?? territoryId

      // Guard: market_share requires a product
      if (data.kpiId === 'market_share' && !effectiveProductId) {
        setError('Select a product to calculate Market Share');
        setIsLoading(false);
        return;
      }

      const params: KPICalculationParams = {
        organizationId: effectiveOrganizationId,
        productId: effectiveProductId,
  territoryId: effectiveTerritoryId,
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
      const trendValue = calculation.value > kpiData.value
        ? 'up' as const
        : calculation.value < kpiData.value
        ? 'down' as const
        : 'stable' as const;

      const calcMeta: Record<string, unknown> = (calculation && (calculation as unknown as { metadata?: Record<string, unknown> }).metadata) || {};
      const newKpiData: PharmaKPICardData = {
        ...kpiData,
        value: calculation.value,
        confidence: calculation.confidence,
        trend: trendValue,
        format: kpiData.format,
        kpiId: kpiData.kpiId,
        kpiName: kpiData.kpiName,
        metadata: {
          ...kpiData.metadata,
          ...calcMeta,
          ...(data.kpiId === 'market_share' && (effectiveProductId || (calcMeta?.productId as string | undefined))
            ? { productId: effectiveProductId || (calcMeta?.productId as string) }
            : {})
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
  }, [organizationId, dashboard?.organizationId, productId, territoryId, data.kpiId, kpiData, analyzeKPIWithAI]);
  
  // Apply per-widget configuration (product, territory) to metadata and recalc
  const handleApplyConfig = useCallback(() => {
    const newMeta: Record<string, unknown> = {
      ...(kpiData.metadata || {}),
      ...(selectedProductId ? { productId: selectedProductId } : {}),
      ...(selectedTerritoryId ? { territoryId: selectedTerritoryId } : {})
    }
    setKpiData(prev => ({ ...prev, metadata: newMeta }))
    if (typeof _onUpdateMetadata === 'function' && _widget?.id) {
      _onUpdateMetadata(_widget.id, newMeta)
    }
    setShowConfig(false)
    void calculateKPI()
  }, [_onUpdateMetadata, _widget?.id, calculateKPI, kpiData.metadata, selectedProductId, selectedTerritoryId])

  // Set product from selector and persist via parent (if provided)
  const handleSetProduct = useCallback(() => {
    const chosen = selectedProductId || (availableProducts[0]?.id ?? '');
    if (!chosen) return;
    const newMeta = { ...(kpiData.metadata || {}), productId: chosen } as Record<string, unknown>;
    setKpiData(prev => ({ ...prev, metadata: newMeta }));
    // Persist upwards if handler available
    if (typeof _onUpdateMetadata === 'function' && _widget?.id) {
      _onUpdateMetadata(_widget.id, newMeta);
    }
    // Update dashboard-level default so other widgets can reuse
    if (data.kpiId === 'market_share') {
      dashboard.updateSettings({ productId: chosen });
    }
    setError(null);
    void calculateKPI();
  }, [selectedProductId, availableProducts, kpiData.metadata, _onUpdateMetadata, _widget?.id, calculateKPI, dashboard, data.kpiId]);

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
        <div className="absolute inset-0 bg-red-50/60 backdrop-blur-[1px] border border-red-200 rounded-lg flex items-center justify-center z-10 p-4">
          <div className="w-full max-w-sm">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            {data.kpiId === 'market_share' && (
              <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                <label className="block text-xs font-medium text-gray-700 mb-1">Select Product</label>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">{availableProducts.length ? 'Choose a product…' : 'Loading products…'}</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                  <button
                    onClick={handleSetProduct}
                    className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50"
                    disabled={!selectedProductId && availableProducts.length === 0}
                  >
                    Set
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={handleManualRefresh}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
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
            onClick={() => setShowConfig((s) => !s)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Configure widget filters"
            aria-label="Configure widget"
          >
            <SettingsIcon className="h-3 w-3 text-gray-400 hover:text-gray-600" />
          </button>
          
          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Refresh KPI"
          >
            <RefreshCw className={`h-3 w-3 text-gray-400 hover:text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Quick Config Panel */}
        {showConfig && (
          <div className="absolute top-8 right-2 z-20 w-64 bg-white border border-gray-200 rounded-md shadow-md p-3">
            <div className="text-xs font-medium text-gray-700 mb-2">Widget Filters</div>
            {data.kpiId === 'market_share' && (
              <div className="mb-2">
                <label className="block text-xs text-gray-600 mb-1">Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">{availableProducts.length ? 'Choose a product…' : 'Loading products…'}</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="mb-2">
              <label className="block text-xs text-gray-600 mb-1">Territory</label>
              <select
                value={selectedTerritoryId}
                onChange={(e) => setSelectedTerritoryId(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="">{availableTerritories.length ? 'Choose a territory…' : 'Loading territories…'}</option>
                {availableTerritories.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                className="px-2 py-1 text-xs rounded border"
                onClick={() => setShowConfig(false)}
              >
                Cancel
              </button>
              <button
                className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleApplyConfig}
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Last Updated Indicator */}
        <div className="absolute bottom-1 right-2 text-xs text-gray-400">
          {formatLastUpdated(lastUpdated)}
        </div>

        {/* AI analysis error (non-blocking) */}
        {aiError && (
          <div className="absolute -bottom-5 left-2 text-xs text-red-600">
            {aiError}
          </div>
        )}

        {/* Confidence Indicator */}
        {kpiData.confidence < 0.8 && (
          <div className="absolute bottom-1 left-2 flex items-center">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1" />
            <span className="text-xs text-gray-500">Low confidence</span>
          </div>
        )}

        {/* AI Insights Indicator */}
        {aiInsights.length > 0 && (
          <div className="absolute top-1 left-2 flex items-center" data-testid="ai-insight-indicator">
            <Brain className="h-3 w-3 text-purple-500 mr-1" />
            <span className="text-xs text-purple-600 font-medium">{aiInsights.length}</span>
            <div className="ml-1 group relative">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              {/* AI Insights Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20" aria-hidden="true">
                <div className="font-medium mb-1">AI Insights:</div>
                {aiInsights.slice(0, 2).map((insight) => (
                  <div key={insight.id} className="mb-1">
                    <div className="flex items-center">
                      {insight.severity === 'high' && <TrendingDown className="h-3 w-3 text-red-400 mr-1" />}
                      {insight.severity === 'medium' && <TrendingUp className="h-3 w-3 text-yellow-400 mr-1" />}
                      {insight.severity === 'low' && <Brain className="h-3 w-3 text-blue-400 mr-1" />}
                      {/* Intentionally omit title text here to avoid duplicate text matches with visible list */}
                    </div>
                    {insight.recommendations?.[0] && (
                      <div className="ml-4 mt-0.5 text-[10px] text-gray-300">
                        <div className="font-semibold">{insight.recommendations[0].title}</div>
                        <div className="opacity-90">{insight.recommendations[0].description}</div>
                      </div>
                    )}
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

        {/* Visible AI insights list (top 2) for accessibility/testing */}
        {aiInsights.length > 0 && (
          <div className="mt-2 space-y-1" data-testid="ai-insights-list">
            {aiInsights.slice(0, 2).map((insight) => (
              <div key={insight.id} className="text-xs text-gray-800">
                <div className="font-medium">{insight.title}</div>
                <div className="text-[11px] text-gray-500">
                  {insight.severity && (
                    <span className="mr-2">{insight.severity.charAt(0).toUpperCase() + insight.severity.slice(1)}</span>
                  )}
                </div>
                <div>{insight.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

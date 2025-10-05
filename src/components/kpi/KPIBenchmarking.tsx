'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  TrendingUp, 
  BarChart3, 
  Settings,
  Save,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface BenchmarkData {
  kpi_name: string;
  display_name: string;
  industry_benchmarks: {
    excellent: number;
    good: number;
    average: number;
    below_average: number;
  };
  thresholds: {
    excellent: number;
    good: number;
    average: number;
    below_average: number;
  };
  industry_data?: {
    industry: string;
    percentile_25: number;
    percentile_50: number;
    percentile_75: number;
    percentile_90: number;
  }[];
}

interface KPIBenchmarkingProps {
  organizationId: string;
}

const INDUSTRY_BENCHMARKS = {
  'pharmaceutical': {
    win_rate: { excellent: 35, good: 25, average: 18, below_average: 12 },
    revenue_growth: { excellent: 25, good: 15, average: 8, below_average: 2 },
    avg_deal_size: { excellent: 500000, good: 300000, average: 150000, below_average: 75000 },
    sales_cycle_length: { excellent: 45, good: 60, average: 90, below_average: 120 },
    lead_conversion_rate: { excellent: 5, good: 3, average: 1.5, below_average: 0.8 },
    cac: { excellent: 5000, good: 10000, average: 20000, below_average: 35000 },
    quota_attainment: { excellent: 120, good: 100, average: 80, below_average: 60 },
    clv: { excellent: 150000, good: 100000, average: 50000, below_average: 25000 },
    pipeline_coverage: { excellent: 4, good: 3, average: 2, below_average: 1.5 },
    activities_per_rep: { excellent: 20, good: 15, average: 10, below_average: 6 }
  },
  'technology': {
    win_rate: { excellent: 30, good: 20, average: 12, below_average: 8 },
    revenue_growth: { excellent: 40, good: 25, average: 12, below_average: 5 },
    avg_deal_size: { excellent: 250000, good: 150000, average: 75000, below_average: 35000 },
    sales_cycle_length: { excellent: 60, good: 90, average: 120, below_average: 180 },
    lead_conversion_rate: { excellent: 3, good: 2, average: 1, below_average: 0.5 },
    cac: { excellent: 3000, good: 8000, average: 15000, below_average: 25000 },
    quota_attainment: { excellent: 110, good: 95, average: 75, below_average: 55 },
    clv: { excellent: 200000, good: 120000, average: 60000, below_average: 30000 },
    pipeline_coverage: { excellent: 3.5, good: 2.5, average: 1.8, below_average: 1.2 },
    activities_per_rep: { excellent: 25, good: 18, average: 12, below_average: 8 }
  },
  'manufacturing': {
    win_rate: { excellent: 25, good: 18, average: 12, below_average: 8 },
    revenue_growth: { excellent: 20, good: 12, average: 6, below_average: 2 },
    avg_deal_size: { excellent: 750000, good: 400000, average: 200000, below_average: 100000 },
    sales_cycle_length: { excellent: 90, good: 120, average: 150, below_average: 200 },
    lead_conversion_rate: { excellent: 4, good: 2.5, average: 1.2, below_average: 0.6 },
    cac: { excellent: 8000, good: 15000, average: 25000, below_average: 40000 },
    quota_attainment: { excellent: 115, good: 100, average: 80, below_average: 60 },
    clv: { excellent: 300000, good: 200000, average: 100000, below_average: 50000 },
    pipeline_coverage: { excellent: 3, good: 2.2, average: 1.5, below_average: 1 },
    activities_per_rep: { excellent: 15, good: 12, average: 8, below_average: 5 }
  }
};

export function KPIBenchmarking({ organizationId }: KPIBenchmarkingProps) {
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState('pharmaceutical');
  const [editingBenchmark, setEditingBenchmark] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<any>({});

  useEffect(() => {
    fetchBenchmarks();
  }, [organizationId]);

  const fetchBenchmarks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/kpis/benchmarks?organizationId=${organizationId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch benchmarks');
      }

      setBenchmarks(result.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateBenchmarks = async () => {
    try {
      const response = await fetch('/api/kpis/benchmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          industry: selectedIndustry,
          benchmarks: INDUSTRY_BENCHMARKS[selectedIndustry as keyof typeof INDUSTRY_BENCHMARKS]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update benchmarks');
      }

      await fetchBenchmarks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update benchmarks');
    }
  };

  const saveBenchmarkEdit = async (kpiName: string) => {
    try {
      const response = await fetch('/api/kpis/benchmarks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          kpiName,
          thresholds: editingValues
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save benchmark');
      }

      setEditingBenchmark(null);
      setEditingValues({});
      await fetchBenchmarks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save benchmark');
    }
  };

  const startEditing = (benchmark: BenchmarkData) => {
    setEditingBenchmark(benchmark.kpi_name);
    setEditingValues(benchmark.thresholds);
  };

  const getPerformanceTier = (value: number, thresholds: any) => {
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.average) return 'average';
    return 'below_average';
  };

  const formatValue = (value: number, kpiName: string) => {
    if (kpiName.includes('rate') || kpiName.includes('percentage') || kpiName.includes('attainment')) {
      return `${value}%`;
    }
    if (kpiName.includes('cost') || kpiName.includes('value') || kpiName.includes('size') || kpiName.includes('clv')) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    if (kpiName.includes('cycle') || kpiName.includes('activities')) {
      return `${value} days`;
    }
    return value.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchBenchmarks} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Benchmarking</h1>
          <p className="text-gray-600">Industry benchmarks and performance thresholds</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pharmaceutical">Pharmaceutical</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={updateBenchmarks}>
            <Settings className="h-4 w-4 mr-2" />
            Update Benchmarks
          </Button>
        </div>
      </div>

      {/* Industry Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Industry Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(INDUSTRY_BENCHMARKS[selectedIndustry as keyof typeof INDUSTRY_BENCHMARKS]).map(([kpi, values]) => ({
              kpi: kpi.replace('_', ' ').toUpperCase(),
              excellent: values.excellent,
              good: values.good,
              average: values.average,
              below_average: values.below_average
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="kpi" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="excellent" stackId="a" fill="#10B981" />
              <Bar dataKey="good" stackId="a" fill="#3B82F6" />
              <Bar dataKey="average" stackId="a" fill="#F59E0B" />
              <Bar dataKey="below_average" stackId="a" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Benchmark Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {benchmarks.map((benchmark) => (
          <Card key={benchmark.kpi_name} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{benchmark.display_name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing(benchmark)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {editingBenchmark === benchmark.kpi_name ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Excellent</Label>
                      <Input
                        type="number"
                        value={editingValues.excellent || ''}
                        onChange={(e) => setEditingValues({
                          ...editingValues,
                          excellent: parseFloat(e.target.value)
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Good</Label>
                      <Input
                        type="number"
                        value={editingValues.good || ''}
                        onChange={(e) => setEditingValues({
                          ...editingValues,
                          good: parseFloat(e.target.value)
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Average</Label>
                      <Input
                        type="number"
                        value={editingValues.average || ''}
                        onChange={(e) => setEditingValues({
                          ...editingValues,
                          average: parseFloat(e.target.value)
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Below Average</Label>
                      <Input
                        type="number"
                        value={editingValues.below_average || ''}
                        onChange={(e) => setEditingValues({
                          ...editingValues,
                          below_average: parseFloat(e.target.value)
                        })}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveBenchmarkEdit(benchmark.kpi_name)}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingBenchmark(null);
                        setEditingValues({});
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Excellent</span>
                    <Badge className="bg-green-100 text-green-800">
                      {formatValue(benchmark.thresholds.excellent, benchmark.kpi_name)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Good</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {formatValue(benchmark.thresholds.good, benchmark.kpi_name)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {formatValue(benchmark.thresholds.average, benchmark.kpi_name)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Below Average</span>
                    <Badge className="bg-red-100 text-red-800">
                      {formatValue(benchmark.thresholds.below_average, benchmark.kpi_name)}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Industry Standards</h4>
              <p className="text-sm text-blue-800">
                These benchmarks are based on industry research and best practices. 
                High-performing sales teams typically achieve metrics in the "excellent" 
                or "good" ranges consistently.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Performance Tiers</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
                <div>
                  <strong>Excellent:</strong> Top 10% of performers
                </div>
                <div>
                  <strong>Good:</strong> Top 25% of performers
                </div>
                <div>
                  <strong>Average:</strong> Median performance
                </div>
                <div>
                  <strong>Below Average:</strong> Bottom 25% of performers
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Customization</h4>
              <p className="text-sm text-yellow-800">
                You can customize these thresholds based on your organization's specific 
                goals, market conditions, and historical performance data. Click the 
                settings icon on any KPI card to adjust the thresholds.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

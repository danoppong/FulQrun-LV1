// Dashboard widget data types

export interface KPICardData {
  value: string | number
  change: string
  trend: 'up' | 'down' | 'neutral'
}

export interface SalesChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string
    borderColor?: string
  }>
}

export interface TeamMemberData {
  name: string
  quota: number
  achieved: number
  percentage: number
}

export interface TeamPerformanceData {
  teamMembers: TeamMemberData[]
}

export interface PipelineStageData {
  name: string
  count: number
  value: number
}

export interface PipelineOverviewData {
  stages: PipelineStageData[]
}

export interface ActivityData {
  type: 'lead' | 'opportunity' | 'contact' | 'company'
  message: string
  time: string
}

export interface RecentActivityData {
  activities: ActivityData[]
}

export interface MEDDPICCOpportunityData {
  name: string
  score: number
  status: 'High' | 'Medium' | 'Low'
}

export interface MEDDPICCScoringData {
  opportunities: MEDDPICCOpportunityData[]
}

export interface LeadScoringData {
  leads: Array<{
    name: string
    score: number
    category: 'hot' | 'warm' | 'cold'
  }>
}

export interface RegionalMapData {
  regions: Array<{
    name: string
    value: number
    coordinates: [number, number]
  }>
}

export interface QuotaTrackerData {
  current: number
  target: number
  percentage: number
  period: string
}

export interface ConversionFunnelData {
  stages: Array<{
    name: string
    count: number
    conversionRate: number
  }>
}

// Pharmaceutical BI Data Types
export interface PharmaKPICardData {
  kpiId: string
  kpiName: string
  value: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
  format: 'number' | 'percentage' | 'currency' | 'ratio'
  metadata: Record<string, any>
}

export interface TerritoryPerformanceData {
  territories: Array<{
    id: string
    name: string
    kpis: PharmaKPICardData[]
  }>
}

export interface ProductPerformanceData {
  products: Array<{
    id: string
    name: string
    totalVolume: number
    newVolume: number
    refillVolume: number
  }>
}

export interface HCPEngagementData {
  totalHCPs: number
  engagedHCPs: number
  engagementRate: number
  avgInteractions: number
}

export interface SampleDistributionData {
  totalSamples: number
  totalScripts: number
  ratio: number
  topProducts: Array<{
    productId: string
    productName: string
    samples: number
    scripts: number
  }>
}

export interface FormularyAccessData {
  totalAccounts: number
  favorableAccounts: number
  accessRate: number
  topPayers: Array<{
    payerId: string
    payerName: string
    coverage: 'preferred' | 'standard' | 'non_preferred' | 'not_covered'
  }>
}

export type WidgetData = 
  | KPICardData
  | SalesChartData
  | TeamPerformanceData
  | PipelineOverviewData
  | RecentActivityData
  | MEDDPICCScoringData
  | LeadScoringData
  | RegionalMapData
  | QuotaTrackerData
  | ConversionFunnelData
  | PharmaKPICardData
  | TerritoryPerformanceData
  | ProductPerformanceData
  | HCPEngagementData
  | SampleDistributionData
  | FormularyAccessData

export interface WidgetConfig {
  refreshInterval?: number
  autoRefresh?: boolean
  showTrends?: boolean
  colorScheme?: 'default' | 'dark' | 'light'
  [key: string]: unknown
}

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

export interface WidgetConfig {
  refreshInterval?: number
  autoRefresh?: boolean
  showTrends?: boolean
  colorScheme?: 'default' | 'dark' | 'light'
  [key: string]: unknown
}

import { WidgetData, WidgetConfig } from '@/lib/types/dashboard';

export interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  position: { x: number; y: number; w: number; h: number }
  data?: WidgetData
  config?: WidgetConfig
}

export enum WidgetType {
  KPI_CARD = 'kpi_card',
  SALES_CHART = 'sales_chart',
  TEAM_PERFORMANCE = 'team_performance',
  PIPELINE_OVERVIEW = 'pipeline_overview',
  RECENT_ACTIVITY = 'recent_activity',
  LEAD_SCORING = 'lead_scoring',
  REGIONAL_MAP = 'regional_map',
  QUOTA_TRACKER = 'quota_tracker',
  CONVERSION_FUNNEL = 'conversion_funnel',
  MEDDPICC_SCORING = 'meddpicc_scoring',
  
  // Pharmaceutical BI Widgets
  PHARMA_KPI_CARD = 'pharma_kpi_card',
  TERRITORY_PERFORMANCE = 'territory_performance',
  PRODUCT_PERFORMANCE = 'product_performance',
  HCP_ENGAGEMENT = 'hcp_engagement',
  SAMPLE_DISTRIBUTION = 'sample_distribution',
  FORMULARY_ACCESS = 'formulary_access'
}

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'kpi-total-leads',
    type: WidgetType.KPI_CARD,
    title: 'Total Leads',
    position: { x: 0, y: 0, w: 3, h: 2 },
    data: { value: 24, change: '+12%', trend: 'up' }
  },
  {
    id: 'kpi-pipeline-value',
    type: WidgetType.KPI_CARD,
    title: 'Pipeline Value',
    position: { x: 3, y: 0, w: 3, h: 2 },
    data: { value: '$2.4M', change: '+8%', trend: 'up' }
  },
  {
    id: 'kpi-conversion-rate',
    type: WidgetType.KPI_CARD,
    title: 'Conversion Rate',
    position: { x: 6, y: 0, w: 3, h: 2 },
    data: { value: '23%', change: '+3%', trend: 'up' }
  },
  {
    id: 'kpi-quota-achievement',
    type: WidgetType.KPI_CARD,
    title: 'Quota Achievement',
    position: { x: 9, y: 0, w: 3, h: 2 },
    data: { value: '87%', change: '+5%', trend: 'up' }
  },
  {
    id: 'sales-chart',
    type: WidgetType.SALES_CHART,
    title: 'Sales Performance',
    position: { x: 0, y: 2, w: 6, h: 4 },
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        { label: 'Revenue', data: [120, 150, 180, 200, 220, 250] },
        { label: 'Target', data: [100, 120, 140, 160, 180, 200] }
      ]
    }
  },
  {
    id: 'team-performance',
    type: WidgetType.TEAM_PERFORMANCE,
    title: 'Team Performance',
    position: { x: 6, y: 2, w: 6, h: 4 },
    data: {
      teamMembers: [
        { name: 'John Smith', quota: 100000, achieved: 87000, percentage: 87 },
        { name: 'Sarah Johnson', quota: 100000, achieved: 95000, percentage: 95 },
        { name: 'Mike Davis', quota: 100000, achieved: 78000, percentage: 78 }
      ]
    }
  },
  {
    id: 'pipeline-overview',
    type: WidgetType.PIPELINE_OVERVIEW,
    title: 'Pipeline Overview',
    position: { x: 0, y: 6, w: 4, h: 4 },
    data: {
      stages: [
        { name: 'Prospecting', count: 45, value: 180000 },
        { name: 'Qualification', count: 32, value: 240000 },
        { name: 'Proposal', count: 18, value: 360000 },
        { name: 'Negotiation', count: 12, value: 480000 },
        { name: 'Closed Won', count: 8, value: 320000 }
      ]
    }
  },
  {
    id: 'recent-activity',
    type: WidgetType.RECENT_ACTIVITY,
    title: 'Recent Activity',
    position: { x: 4, y: 6, w: 4, h: 4 },
    data: {
      activities: [
        { type: 'lead', message: 'New lead: Acme Corp', time: '2h ago' },
        { type: 'opportunity', message: 'Opportunity updated: Enterprise Deal', time: '4h ago' },
        { type: 'contact', message: 'Contact created: John Smith', time: '1d ago' }
      ]
    }
  },
  {
    id: 'meddpicc-scoring',
    type: WidgetType.MEDDPICC_SCORING,
    title: 'MEDDPICC Scoring',
    position: { x: 8, y: 6, w: 4, h: 4 },
    data: {
      opportunities: [
        { name: 'Enterprise Deal', score: 85, status: 'High' },
        { name: 'SMB Contract', score: 62, status: 'Medium' },
        { name: 'Pilot Program', score: 45, status: 'Low' }
      ]
    }
  }
]

export const WIDGET_TEMPLATES = {
  [WidgetType.KPI_CARD]: {
    name: 'KPI Card',
    description: 'Display key performance indicators with trends',
    defaultSize: { w: 3, h: 2 },
    icon: '📊'
  },
  [WidgetType.SALES_CHART]: {
    name: 'Sales Chart',
    description: 'Visualize sales performance over time',
    defaultSize: { w: 6, h: 4 },
    icon: '📈'
  },
  [WidgetType.TEAM_PERFORMANCE]: {
    name: 'Team Performance',
    description: 'Track team member performance and quotas',
    defaultSize: { w: 6, h: 4 },
    icon: '👥'
  },
  [WidgetType.PIPELINE_OVERVIEW]: {
    name: 'Pipeline Overview',
    description: 'View sales pipeline by stage',
    defaultSize: { w: 4, h: 4 },
    icon: '🔄'
  },
  [WidgetType.RECENT_ACTIVITY]: {
    name: 'Recent Activity',
    description: 'Show recent system activities',
    defaultSize: { w: 4, h: 4 },
    icon: '⚡'
  },
  [WidgetType.LEAD_SCORING]: {
    name: 'Lead Scoring',
    description: 'Track lead quality and scoring',
    defaultSize: { w: 4, h: 3 },
    icon: '🎯'
  },
  [WidgetType.REGIONAL_MAP]: {
    name: 'Regional Map',
    description: 'Geographic performance visualization',
    defaultSize: { w: 6, h: 4 },
    icon: '🗺️'
  },
  [WidgetType.QUOTA_TRACKER]: {
    name: 'Quota Tracker',
    description: 'Monitor quota achievement progress',
    defaultSize: { w: 3, h: 3 },
    icon: '🎯'
  },
  [WidgetType.CONVERSION_FUNNEL]: {
    name: 'Conversion Funnel',
    description: 'Visualize conversion rates through stages',
    defaultSize: { w: 6, h: 4 },
    icon: '🔽'
  },
  [WidgetType.MEDDPICC_SCORING]: {
    name: 'MEDDPICC Scoring',
    description: 'Track opportunity qualification scores',
    defaultSize: { w: 4, h: 4 },
    icon: '📋'
  },
  
  // Pharmaceutical BI Widget Templates
  [WidgetType.PHARMA_KPI_CARD]: {
    name: 'Pharmaceutical KPI',
    description: 'Display pharmaceutical-specific KPIs (TRx, NRx, Market Share)',
    defaultSize: { w: 3, h: 2 },
    icon: '💊'
  },
  [WidgetType.TERRITORY_PERFORMANCE]: {
    name: 'Territory Performance',
    description: 'Territory-level pharmaceutical performance metrics',
    defaultSize: { w: 6, h: 4 },
    icon: '🗺️'
  },
  [WidgetType.PRODUCT_PERFORMANCE]: {
    name: 'Product Performance',
    description: 'Product-level sales and sample distribution metrics',
    defaultSize: { w: 6, h: 4 },
    icon: '📦'
  },
  [WidgetType.HCP_ENGAGEMENT]: {
    name: 'HCP Engagement',
    description: 'Healthcare provider engagement and interaction metrics',
    defaultSize: { w: 4, h: 4 },
    icon: '👨‍⚕️'
  },
  [WidgetType.SAMPLE_DISTRIBUTION]: {
    name: 'Sample Distribution',
    description: 'Sample distribution effectiveness and ROI analysis',
    defaultSize: { w: 4, h: 4 },
    icon: '📋'
  },
  [WidgetType.FORMULARY_ACCESS]: {
    name: 'Formulary Access',
    description: 'Formulary access metrics and payer coverage analysis',
    defaultSize: { w: 4, h: 4 },
    icon: '🏥'
  }
}

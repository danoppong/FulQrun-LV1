export interface TimeBasedPerformance {
  weekly: {
    quota: number
    achieved: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }
  monthly: {
    quota: number
    achieved: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }
  quarterly: {
    quota: number
    achieved: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }
  yearly: {
    quota: number
    achieved: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }
}

export interface SalesmanKPIs {
  userId: string
  name: string
  performance: TimeBasedPerformance
  dealsClosed: number
  dealsInPipeline: number
  averageDealSize: number
  conversionRate: number
  callsMade: number
  meetingsScheduled: number
  leadsGenerated: number
  customerSatisfaction: number
  topPerformingProduct: string
  region: string
  manager: string
  joinDate: string
  lastActivity: string
}

export const SAMPLE_SALESMAN_DATA: SalesmanKPIs = {
  userId: 'salesman-1',
  name: 'John Smith',
  performance: {
    weekly: {
      quota: 25000,
      achieved: 22000,
      percentage: 88.0,
      trend: 'up'
    },
    monthly: {
      quota: 100000,
      achieved: 95000,
      percentage: 95.0,
      trend: 'up'
    },
    quarterly: {
      quota: 300000,
      achieved: 285000,
      percentage: 95.0,
      trend: 'stable'
    },
    yearly: {
      quota: 1200000,
      achieved: 1100000,
      percentage: 91.7,
      trend: 'up'
    }
  },
  dealsClosed: 12,
  dealsInPipeline: 8,
  averageDealSize: 7917,
  conversionRate: 24.5,
  callsMade: 156,
  meetingsScheduled: 23,
  leadsGenerated: 18,
  customerSatisfaction: 4.7,
  topPerformingProduct: 'Enterprise CRM',
  region: 'North America',
  manager: 'Sarah Johnson',
  joinDate: '2023-01-15',
  lastActivity: '2024-01-15'
}

export interface PerformanceWidget {
  id: string
  title: string
  type: 'quota' | 'deals' | 'conversion' | 'activity' | 'satisfaction' | 'trend' | 'pipeline' | 'products'
  size: 'small' | 'medium' | 'large'
  position: { x: number; y: number; w: number; h: number }
  data: any
}

export const SALESMAN_WIDGET_TEMPLATES: { [key: string]: Omit<PerformanceWidget, 'position' | 'data'> } = {
  'quota-weekly': {
    id: 'quota-weekly',
    title: 'Weekly Quota',
    type: 'quota',
    size: 'small'
  },
  'quota-monthly': {
    id: 'quota-monthly',
    title: 'Monthly Quota',
    type: 'quota',
    size: 'small'
  },
  'quota-quarterly': {
    id: 'quota-quarterly',
    title: 'Quarterly Quota',
    type: 'quota',
    size: 'small'
  },
  'quota-yearly': {
    id: 'quota-yearly',
    title: 'Yearly Quota',
    type: 'quota',
    size: 'small'
  },
  'deals-closed': {
    id: 'deals-closed',
    title: 'Deals Closed',
    type: 'deals',
    size: 'small'
  },
  'deals-pipeline': {
    id: 'deals-pipeline',
    title: 'Pipeline Value',
    type: 'pipeline',
    size: 'medium'
  },
  'conversion-rate': {
    id: 'conversion-rate',
    title: 'Conversion Rate',
    type: 'conversion',
    size: 'small'
  },
  'activity-calls': {
    id: 'activity-calls',
    title: 'Calls Made',
    type: 'activity',
    size: 'small'
  },
  'activity-meetings': {
    id: 'activity-meetings',
    title: 'Meetings Scheduled',
    type: 'activity',
    size: 'small'
  },
  'leads-generated': {
    id: 'leads-generated',
    title: 'Leads Generated',
    type: 'activity',
    size: 'small'
  },
  'customer-satisfaction': {
    id: 'customer-satisfaction',
    title: 'Customer Satisfaction',
    type: 'satisfaction',
    size: 'small'
  },
  'performance-trend': {
    id: 'performance-trend',
    title: 'Performance Trend',
    type: 'trend',
    size: 'large'
  },
  'top-products': {
    id: 'top-products',
    title: 'Top Products',
    type: 'products',
    size: 'medium'
  }
}

export const DEFAULT_SALESMAN_WIDGETS: PerformanceWidget[] = [
  {
    id: 'widget-quota-monthly',
    title: 'Monthly Quota',
    type: 'quota',
    size: 'small',
    position: { x: 0, y: 0, w: 3, h: 2 },
    data: {}
  },
  {
    id: 'widget-quota-quarterly',
    title: 'Quarterly Quota',
    type: 'quota',
    size: 'small',
    position: { x: 3, y: 0, w: 3, h: 2 },
    data: {}
  },
  {
    id: 'widget-deals-closed',
    title: 'Deals Closed',
    type: 'deals',
    size: 'small',
    position: { x: 6, y: 0, w: 3, h: 2 },
    data: {}
  },
  {
    id: 'widget-conversion-rate',
    title: 'Conversion Rate',
    type: 'conversion',
    size: 'small',
    position: { x: 9, y: 0, w: 3, h: 2 },
    data: {}
  },
  {
    id: 'widget-deals-pipeline',
    title: 'Pipeline Value',
    type: 'pipeline',
    size: 'medium',
    position: { x: 0, y: 2, w: 6, h: 3 },
    data: {}
  },
  {
    id: 'widget-performance-trend',
    title: 'Performance Trend',
    type: 'trend',
    size: 'large',
    position: { x: 6, y: 2, w: 6, h: 3 },
    data: {}
  },
  {
    id: 'widget-activity-calls',
    title: 'Calls Made',
    type: 'activity',
    size: 'small',
    position: { x: 0, y: 5, w: 3, h: 2 },
    data: {}
  },
  {
    id: 'widget-activity-meetings',
    title: 'Meetings Scheduled',
    type: 'activity',
    size: 'small',
    position: { x: 3, y: 5, w: 3, h: 2 },
    data: {}
  },
  {
    id: 'widget-customer-satisfaction',
    title: 'Customer Satisfaction',
    type: 'satisfaction',
    size: 'small',
    position: { x: 6, y: 5, w: 3, h: 2 },
    data: {}
  },
  {
    id: 'widget-top-products',
    title: 'Top Products',
    type: 'products',
    size: 'medium',
    position: { x: 9, y: 5, w: 3, h: 2 },
    data: {}
  }
]

export function getWidgetData(widget: PerformanceWidget, salesmanData: SalesmanKPIs): any {
  switch (widget.type) {
    case 'quota':
      if (widget.id.includes('weekly')) return salesmanData.performance.weekly
      if (widget.id.includes('monthly')) return salesmanData.performance.monthly
      if (widget.id.includes('quarterly')) return salesmanData.performance.quarterly
      if (widget.id.includes('yearly')) return salesmanData.performance.yearly
      return salesmanData.performance.monthly
    
    case 'deals':
      return {
        closed: salesmanData.dealsClosed,
        inPipeline: salesmanData.dealsInPipeline,
        averageSize: salesmanData.averageDealSize
      }
    
    case 'pipeline':
      return {
        value: salesmanData.dealsInPipeline * salesmanData.averageDealSize,
        deals: salesmanData.dealsInPipeline,
        averageSize: salesmanData.averageDealSize
      }
    
    case 'conversion':
      return {
        rate: salesmanData.conversionRate,
        calls: salesmanData.callsMade,
        meetings: salesmanData.meetingsScheduled
      }
    
    case 'activity':
      if (widget.id.includes('calls')) return { calls: salesmanData.callsMade }
      if (widget.id.includes('meetings')) return { meetings: salesmanData.meetingsScheduled }
      if (widget.id.includes('leads')) return { leads: salesmanData.leadsGenerated }
      return { calls: salesmanData.callsMade }
    
    case 'satisfaction':
      return {
        score: salesmanData.customerSatisfaction,
        rating: Math.round(salesmanData.customerSatisfaction)
      }
    
    case 'trend':
      return {
        weekly: salesmanData.performance.weekly,
        monthly: salesmanData.performance.monthly,
        quarterly: salesmanData.performance.quarterly,
        yearly: salesmanData.performance.yearly
      }
    
    case 'products':
      return {
        topProduct: salesmanData.topPerformingProduct,
        region: salesmanData.region
      }
    
    default:
      return {}
  }
}

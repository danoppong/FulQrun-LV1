export interface PerformanceMetrics {
  userId: string
  name: string
  role: string
  quota: number
  achieved: number
  percentage: number
  region?: string
  businessUnit?: string
  managerId?: string
  teamMembers?: PerformanceMetrics[]
}

export interface QuotaData {
  monthly: number
  quarterly: number
  yearly: number
  currentPeriod: number
  periodType: 'monthly' | 'quarterly' | 'yearly'
}

export interface PerformanceData {
  global: PerformanceMetrics
  regions: { [region: string]: PerformanceMetrics }
  businessUnits: { [unit: string]: PerformanceMetrics }
  teams: { [managerId: string]: PerformanceMetrics[] }
  individuals: { [userId: string]: PerformanceMetrics }
}

// Sample hierarchical performance data
export const SAMPLE_PERFORMANCE_DATA: PerformanceData = {
  global: {
    userId: 'global',
    name: 'Global Performance',
    role: 'global',
    quota: 10000000,
    achieved: 8750000,
    percentage: 87.5,
    businessUnit: 'Enterprise'
  },
  regions: {
    'North America': {
      userId: 'na-region',
      name: 'North America Region',
      role: 'regional_sales_director',
      quota: 4000000,
      achieved: 3500000,
      percentage: 87.5,
      region: 'North America',
      businessUnit: 'Enterprise'
    },
    'Europe': {
      userId: 'eu-region',
      name: 'Europe Region',
      role: 'regional_sales_director',
      quota: 3000000,
      achieved: 2800000,
      percentage: 93.3,
      region: 'Europe',
      businessUnit: 'Enterprise'
    },
    'Asia Pacific': {
      userId: 'apac-region',
      name: 'Asia Pacific Region',
      role: 'regional_sales_director',
      quota: 3000000,
      achieved: 2450000,
      percentage: 81.7,
      region: 'Asia Pacific',
      businessUnit: 'Enterprise'
    }
  },
  businessUnits: {
    'Enterprise': {
      userId: 'enterprise-bu',
      name: 'Enterprise Business Unit',
      role: 'business_unit_head',
      quota: 10000000,
      achieved: 8750000,
      percentage: 87.5,
      businessUnit: 'Enterprise'
    }
  },
  teams: {
    'na-manager-1': [
      {
        userId: 'salesman-1',
        name: 'John Smith',
        role: 'salesman',
        quota: 500000,
        achieved: 450000,
        percentage: 90,
        region: 'North America',
        businessUnit: 'Enterprise',
        managerId: 'na-manager-1'
      },
      {
        userId: 'salesman-2',
        name: 'Sarah Johnson',
        role: 'salesman',
        quota: 500000,
        achieved: 475000,
        percentage: 95,
        region: 'North America',
        businessUnit: 'Enterprise',
        managerId: 'na-manager-1'
      },
      {
        userId: 'salesman-3',
        name: 'Mike Davis',
        role: 'salesman',
        quota: 500000,
        achieved: 400000,
        percentage: 80,
        region: 'North America',
        businessUnit: 'Enterprise',
        managerId: 'na-manager-1'
      }
    ],
    'na-manager-2': [
      {
        userId: 'salesman-4',
        name: 'Lisa Chen',
        role: 'salesman',
        quota: 500000,
        achieved: 520000,
        percentage: 104,
        region: 'North America',
        businessUnit: 'Enterprise',
        managerId: 'na-manager-2'
      },
      {
        userId: 'salesman-5',
        name: 'Robert Wilson',
        role: 'salesman',
        quota: 500000,
        achieved: 480000,
        percentage: 96,
        region: 'North America',
        businessUnit: 'Enterprise',
        managerId: 'na-manager-2'
      }
    ],
    'eu-manager-1': [
      {
        userId: 'salesman-6',
        name: 'Emma Thompson',
        role: 'salesman',
        quota: 500000,
        achieved: 490000,
        percentage: 98,
        region: 'Europe',
        businessUnit: 'Enterprise',
        managerId: 'eu-manager-1'
      },
      {
        userId: 'salesman-7',
        name: 'James Brown',
        role: 'salesman',
        quota: 500000,
        achieved: 510000,
        percentage: 102,
        region: 'Europe',
        businessUnit: 'Enterprise',
        managerId: 'eu-manager-1'
      }
    ]
  },
  individuals: {
    'salesman-1': {
      userId: 'salesman-1',
      name: 'John Smith',
      role: 'salesman',
      quota: 500000,
      achieved: 450000,
      percentage: 90,
      region: 'North America',
      businessUnit: 'Enterprise',
      managerId: 'na-manager-1'
    },
    'salesman-2': {
      userId: 'salesman-2',
      name: 'Sarah Johnson',
      role: 'salesman',
      quota: 500000,
      achieved: 475000,
      percentage: 95,
      region: 'North America',
      businessUnit: 'Enterprise',
      managerId: 'na-manager-1'
    },
    'salesman-3': {
      userId: 'salesman-3',
      name: 'Mike Davis',
      role: 'salesman',
      quota: 500000,
      achieved: 400000,
      percentage: 80,
      region: 'North America',
      businessUnit: 'Enterprise',
      managerId: 'na-manager-1'
    },
    'salesman-4': {
      userId: 'salesman-4',
      name: 'Lisa Chen',
      role: 'salesman',
      quota: 500000,
      achieved: 520000,
      percentage: 104,
      region: 'North America',
      businessUnit: 'Enterprise',
      managerId: 'na-manager-2'
    },
    'salesman-5': {
      userId: 'salesman-5',
      name: 'Robert Wilson',
      role: 'salesman',
      quota: 500000,
      achieved: 480000,
      percentage: 96,
      region: 'North America',
      businessUnit: 'Enterprise',
      managerId: 'na-manager-2'
    },
    'salesman-6': {
      userId: 'salesman-6',
      name: 'Emma Thompson',
      role: 'salesman',
      quota: 500000,
      achieved: 490000,
      percentage: 98,
      region: 'Europe',
      businessUnit: 'Enterprise',
      managerId: 'eu-manager-1'
    },
    'salesman-7': {
      userId: 'salesman-7',
      name: 'James Brown',
      role: 'salesman',
      quota: 500000,
      achieved: 510000,
      percentage: 102,
      region: 'Europe',
      businessUnit: 'Enterprise',
      managerId: 'eu-manager-1'
    }
  }
}

export function getPerformanceDataForRole(userId: string, role: string, region?: string, businessUnit?: string): PerformanceMetrics[] {
  const data = SAMPLE_PERFORMANCE_DATA
  
  switch (role) {
    case 'salesman':
      // Individual performance only
      return [data.individuals[userId] || data.individuals['salesman-1']]
    
    case 'sales_manager':
      // Personal performance + team performance
      const personalData = data.individuals[userId] || data.individuals['salesman-1']
      const teamData = data.teams[userId] || data.teams['na-manager-1']
      return [personalData, ...teamData]
    
    case 'regional_sales_director':
      // Personal + regional + all teams in region
      const regionalData = data.regions[region || 'North America']
      const allTeamsInRegion = Object.values(data.teams).flat().filter(member => member.region === region)
      return [regionalData, ...allTeamsInRegion]
    
    case 'global_sales_lead':
    case 'business_unit_head':
      // Global + all regions + all business units + all teams
      return [
        data.global,
        ...Object.values(data.regions),
        ...Object.values(data.businessUnits),
        ...Object.values(data.teams).flat()
      ]
    
    default:
      return [data.individuals[userId] || data.individuals['salesman-1']]
  }
}

export function calculateTeamPerformance(teamMembers: PerformanceMetrics[]): PerformanceMetrics {
  const totalQuota = teamMembers.reduce((sum, member) => sum + member.quota, 0)
  const totalAchieved = teamMembers.reduce((sum, member) => sum + member.achieved, 0)
  const averagePercentage = totalQuota > 0 ? (totalAchieved / totalQuota) * 100 : 0
  
  return {
    userId: 'team-total',
    name: 'Team Total',
    role: 'team',
    quota: totalQuota,
    achieved: totalAchieved,
    percentage: averagePercentage
  }
}

export function getDrillDownData(userId: string, role: string, targetLevel: 'individual' | 'team' | 'regional' | 'global'): PerformanceMetrics[] {
  const data = SAMPLE_PERFORMANCE_DATA
  
  switch (targetLevel) {
    case 'individual':
      return [data.individuals[userId] || data.individuals['salesman-1']]
    
    case 'team':
      return data.teams[userId] || data.teams['na-manager-1']
    
    case 'regional':
      const region = data.individuals[userId]?.region || 'North America'
      return [data.regions[region], ...Object.values(data.teams).flat().filter(member => member.region === region)]
    
    case 'global':
      return [
        data.global,
        ...Object.values(data.regions),
        ...Object.values(data.businessUnits)
      ]
    
    default:
      return [data.individuals[userId] || data.individuals['salesman-1']]
  }
}

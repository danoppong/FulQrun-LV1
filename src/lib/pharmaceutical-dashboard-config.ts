// src/lib/pharmaceutical-dashboard-config.ts
// Pharmaceutical Dashboard Configuration
// Provides role-based pharmaceutical widget layouts for dashboard integration

import { DashboardWidget, WidgetType } from '@/lib/dashboard-widgets'
import { UserRole } from '@/lib/roles';

export interface PharmaceuticalDashboardConfig {
  role: UserRole;
  widgets: DashboardWidget[];
  defaultLayout: 'grid' | 'stacked' | 'mixed';
}

export const PHARMACEUTICAL_DASHBOARD_CONFIGS: Record<UserRole, PharmaceuticalDashboardConfig> = {
  salesman: {
    role: 'salesman',
    defaultLayout: 'grid',
    widgets: [
      {
        id: 'pharma-kpi-trx',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'Total Prescriptions (TRx)',
        position: { x: 0, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'trx',
          kpiName: 'Total Prescriptions',
          value: 0,
          confidence: 0.95,
          trend: 'stable',
          format: 'number',
          metadata: {}
        }
      },
      {
        id: 'pharma-kpi-nrx',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'New Prescriptions (NRx)',
        position: { x: 3, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'nrx',
          kpiName: 'New Prescriptions',
          value: 0,
          confidence: 0.90,
          trend: 'stable',
          format: 'number',
          metadata: {}
        }
      },
      {
        id: 'pharma-kpi-market-share',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'Market Share',
        position: { x: 6, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'market_share',
          kpiName: 'Market Share',
          value: 0,
          confidence: 0.85,
          trend: 'stable',
          format: 'percentage',
          metadata: {}
        }
      },
      {
        id: 'product-performance',
        type: WidgetType.PRODUCT_PERFORMANCE,
        title: 'My Product Performance',
        position: { x: 0, y: 2, w: 6, h: 4 },
        data: {
          products: []
        }
      }
    ]
  },
  
  sales_manager: {
    role: 'sales_manager',
    defaultLayout: 'mixed',
    widgets: [
      {
        id: 'pharma-kpi-trx',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'Team TRx',
        position: { x: 0, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'trx',
          kpiName: 'Team Total Prescriptions',
          value: 0,
          confidence: 0.95,
          trend: 'stable',
          format: 'number',
          metadata: {}
        }
      },
      {
        id: 'pharma-kpi-nrx',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'Team NRx',
        position: { x: 3, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'nrx',
          kpiName: 'Team New Prescriptions',
          value: 0,
          confidence: 0.90,
          trend: 'stable',
          format: 'number',
          metadata: {}
        }
      },
      {
        id: 'pharma-kpi-market-share',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'Team Market Share',
        position: { x: 6, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'market_share',
          kpiName: 'Team Market Share',
          value: 0,
          confidence: 0.85,
          trend: 'stable',
          format: 'percentage',
          metadata: {}
        }
      },
      {
        id: 'territory-performance',
        type: WidgetType.TERRITORY_PERFORMANCE,
        title: 'Territory Performance',
        position: { x: 0, y: 2, w: 6, h: 4 },
        data: {
          territories: []
        }
      },
      {
        id: 'hcp-engagement',
        type: WidgetType.HCP_ENGAGEMENT,
        title: 'HCP Engagement',
        position: { x: 6, y: 2, w: 3, h: 4 },
        data: {
          totalHCPs: 0,
          engagedHCPs: 0,
          engagementRate: 0,
          avgInteractions: 0
        }
      }
    ]
  },
  
  regional_sales_director: {
    role: 'regional_sales_director',
    defaultLayout: 'mixed',
    widgets: [
      {
        id: 'pharma-kpi-trx',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'Regional TRx',
        position: { x: 0, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'trx',
          kpiName: 'Regional Total Prescriptions',
          value: 0,
          confidence: 0.95,
          trend: 'stable',
          format: 'number',
          metadata: {}
        }
      },
      {
        id: 'pharma-kpi-nrx',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'Regional NRx',
        position: { x: 3, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'nrx',
          kpiName: 'Regional New Prescriptions',
          value: 0,
          confidence: 0.90,
          trend: 'stable',
          format: 'number',
          metadata: {}
        }
      },
      {
        id: 'pharma-kpi-market-share',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'Regional Market Share',
        position: { x: 6, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'market_share',
          kpiName: 'Regional Market Share',
          value: 0,
          confidence: 0.85,
          trend: 'stable',
          format: 'percentage',
          metadata: {}
        }
      },
      {
        id: 'pharma-kpi-growth',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'Growth Rate',
        position: { x: 9, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'growth',
          kpiName: 'Growth Rate',
          value: 0,
          confidence: 0.80,
          trend: 'stable',
          format: 'percentage',
          metadata: {}
        }
      },
      {
        id: 'territory-performance',
        type: WidgetType.TERRITORY_PERFORMANCE,
        title: 'Territory Performance',
        position: { x: 0, y: 2, w: 6, h: 4 },
        data: {
          territories: []
        }
      },
      {
        id: 'product-performance',
        type: WidgetType.PRODUCT_PERFORMANCE,
        title: 'Product Performance',
        position: { x: 6, y: 2, w: 6, h: 4 },
        data: {
          products: []
        }
      },
      {
        id: 'hcp-engagement',
        type: WidgetType.HCP_ENGAGEMENT,
        title: 'HCP Engagement',
        position: { x: 0, y: 6, w: 4, h: 4 },
        data: {
          totalHCPs: 0,
          engagedHCPs: 0,
          engagementRate: 0,
          avgInteractions: 0
        }
      },
      {
        id: 'sample-distribution',
        type: WidgetType.SAMPLE_DISTRIBUTION,
        title: 'Sample Distribution',
        position: { x: 4, y: 6, w: 4, h: 4 },
        data: {
          totalSamples: 0,
          totalScripts: 0,
          ratio: 0,
          topProducts: []
        }
      },
      {
        id: 'formulary-access',
        type: WidgetType.FORMULARY_ACCESS,
        title: 'Formulary Access',
        position: { x: 8, y: 6, w: 4, h: 4 },
        data: {
          totalAccounts: 0,
          favorableAccounts: 0,
          accessRate: 0,
          topPayers: []
        }
      }
    ]
  },
  
  global_sales_lead: {
    role: 'global_sales_lead',
    defaultLayout: 'mixed',
    widgets: [
      {
        id: 'pharma-kpi-trx',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'Global TRx',
        position: { x: 0, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'trx',
          kpiName: 'Global Total Prescriptions',
          value: 0,
          confidence: 0.95,
          trend: 'stable',
          format: 'number',
          metadata: {}
        }
      },
      {
        id: 'pharma-kpi-nrx',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'Global NRx',
        position: { x: 3, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'nrx',
          kpiName: 'Global New Prescriptions',
          value: 0,
          confidence: 0.90,
          trend: 'stable',
          format: 'number',
          metadata: {}
        }
      },
      {
        id: 'pharma-kpi-market-share',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'Global Market Share',
        position: { x: 6, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'market_share',
          kpiName: 'Global Market Share',
          value: 0,
          confidence: 0.85,
          trend: 'stable',
          format: 'percentage',
          metadata: {}
        }
      },
      {
        id: 'pharma-kpi-growth',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'Global Growth',
        position: { x: 9, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'growth',
          kpiName: 'Global Growth Rate',
          value: 0,
          confidence: 0.80,
          trend: 'stable',
          format: 'percentage',
          metadata: {}
        }
      },
      {
        id: 'territory-performance',
        type: WidgetType.TERRITORY_PERFORMANCE,
        title: 'Territory Performance',
        position: { x: 0, y: 2, w: 6, h: 4 },
        data: {
          territories: []
        }
      },
      {
        id: 'product-performance',
        type: WidgetType.PRODUCT_PERFORMANCE,
        title: 'Product Performance',
        position: { x: 6, y: 2, w: 6, h: 4 },
        data: {
          products: []
        }
      },
      {
        id: 'hcp-engagement',
        type: WidgetType.HCP_ENGAGEMENT,
        title: 'HCP Engagement',
        position: { x: 0, y: 6, w: 4, h: 4 },
        data: {
          totalHCPs: 0,
          engagedHCPs: 0,
          engagementRate: 0,
          avgInteractions: 0
        }
      },
      {
        id: 'sample-distribution',
        type: WidgetType.SAMPLE_DISTRIBUTION,
        title: 'Sample Distribution',
        position: { x: 4, y: 6, w: 4, h: 4 },
        data: {
          totalSamples: 0,
          totalScripts: 0,
          ratio: 0,
          topProducts: []
        }
      },
      {
        id: 'formulary-access',
        type: WidgetType.FORMULARY_ACCESS,
        title: 'Formulary Access',
        position: { x: 8, y: 6, w: 4, h: 4 },
        data: {
          totalAccounts: 0,
          favorableAccounts: 0,
          accessRate: 0,
          topPayers: []
        }
      }
    ]
  },
  
  business_unit_head: {
    role: 'business_unit_head',
    defaultLayout: 'mixed',
    widgets: [
      {
        id: 'pharma-kpi-trx',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'BU TRx',
        position: { x: 0, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'trx',
          kpiName: 'Business Unit Total Prescriptions',
          value: 0,
          confidence: 0.95,
          trend: 'stable',
          format: 'number',
          metadata: {}
        }
      },
      {
        id: 'pharma-kpi-nrx',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'BU NRx',
        position: { x: 3, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'nrx',
          kpiName: 'Business Unit New Prescriptions',
          value: 0,
          confidence: 0.90,
          trend: 'stable',
          format: 'number',
          metadata: {}
        }
      },
      {
        id: 'pharma-kpi-market-share',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'BU Market Share',
        position: { x: 6, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'market_share',
          kpiName: 'Business Unit Market Share',
          value: 0,
          confidence: 0.85,
          trend: 'stable',
          format: 'percentage',
          metadata: {}
        }
      },
      {
        id: 'pharma-kpi-growth',
        type: WidgetType.PHARMA_KPI_CARD,
        title: 'BU Growth',
        position: { x: 9, y: 0, w: 3, h: 2 },
        data: {
          kpiId: 'growth',
          kpiName: 'Business Unit Growth Rate',
          value: 0,
          confidence: 0.80,
          trend: 'stable',
          format: 'percentage',
          metadata: {}
        }
      },
      {
        id: 'territory-performance',
        type: WidgetType.TERRITORY_PERFORMANCE,
        title: 'Territory Performance',
        position: { x: 0, y: 2, w: 6, h: 4 },
        data: {
          territories: []
        }
      },
      {
        id: 'product-performance',
        type: WidgetType.PRODUCT_PERFORMANCE,
        title: 'Product Performance',
        position: { x: 6, y: 2, w: 6, h: 4 },
        data: {
          products: []
        }
      },
      {
        id: 'hcp-engagement',
        type: WidgetType.HCP_ENGAGEMENT,
        title: 'HCP Engagement',
        position: { x: 0, y: 6, w: 4, h: 4 },
        data: {
          totalHCPs: 0,
          engagedHCPs: 0,
          engagementRate: 0,
          avgInteractions: 0
        }
      },
      {
        id: 'sample-distribution',
        type: WidgetType.SAMPLE_DISTRIBUTION,
        title: 'Sample Distribution',
        position: { x: 4, y: 6, w: 4, h: 4 },
        data: {
          totalSamples: 0,
          totalScripts: 0,
          ratio: 0,
          topProducts: []
        }
      },
      {
        id: 'formulary-access',
        type: WidgetType.FORMULARY_ACCESS,
        title: 'Formulary Access',
        position: { x: 8, y: 6, w: 4, h: 4 },
        data: {
          totalAccounts: 0,
          favorableAccounts: 0,
          accessRate: 0,
          topPayers: []
        }
      }
    ]
  }
};

/**
 * Get pharmaceutical dashboard configuration for a user role
 */
export function getPharmaceuticalDashboardConfig(userRole: UserRole): PharmaceuticalDashboardConfig {
  return PHARMACEUTICAL_DASHBOARD_CONFIGS[userRole] || PHARMACEUTICAL_DASHBOARD_CONFIGS.salesman;
}

/**
 * Get pharmaceutical widgets for a user role
 */
export function getPharmaceuticalWidgets(userRole: UserRole): DashboardWidget[] {
  const config = getPharmaceuticalDashboardConfig(userRole);
  return config.widgets;
}

/**
 * Merge pharmaceutical widgets with existing dashboard widgets
 */
export function mergePharmaceuticalWidgets(existingWidgets: DashboardWidget[], userRole: UserRole): DashboardWidget[] {
  const pharmaWidgets = getPharmaceuticalWidgets(userRole);
  
  // Filter out any existing pharmaceutical widgets to avoid duplicates
  const filteredExisting = existingWidgets.filter(widget => 
    !Object.values(WidgetType).includes(widget.type as WidgetType) || 
    !widget.type.startsWith('pharma_') && 
    !['territory_performance', 'product_performance', 'hcp_engagement', 'sample_distribution', 'formulary_access'].includes(widget.type)
  );
  
  return [...filteredExisting, ...pharmaWidgets];
}

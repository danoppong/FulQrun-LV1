# Pharmaceutical BI Integration Plan

## Executive Summary

This document outlines a comprehensive plan to integrate Pharmaceutical BI KPIs into the default Dashboard while ensuring no regression to existing functionality. The integration will provide pharmaceutical-specific metrics alongside traditional sales KPIs, creating a unified dashboard experience.

## Current State Analysis

### Existing Dashboard Structure
- **Main Dashboard**: `/src/app/dashboard/page.tsx`
- **Role-based Components**: 
  - `HierarchicalPerformanceDashboard` (managers/directors)
  - `SalesmanDashboard` (individual reps)
  - `PipelineChart` (all roles)
- **Widget System**: Configurable widgets with types defined in `dashboard-widgets.ts`
- **KPI Cards**: Basic KPI display with trend indicators

### Pharmaceutical BI Structure
- **Dedicated BI Dashboard**: `/src/components/bi/PharmaceuticalDashboard.tsx`
- **KPI Engine**: `/src/lib/bi/kpi-engine.ts` with comprehensive pharmaceutical metrics
- **API Endpoints**: `/src/app/api/bi/` for data retrieval
- **Specialized Components**: Territory, Product, HCP, Sample, and Formulary widgets

## Integration Strategy

### Phase 1: Extend Widget System (No Regression)

#### 1.1 Add Pharmaceutical Widget Types
```typescript
// Extend WidgetType enum in dashboard-widgets.ts
export enum WidgetType {
  // Existing widgets...
  MEDDPICC_SCORING = 'meddpicc_scoring',
  
  // New Pharmaceutical BI widgets
  PHARMA_KPI_CARD = 'pharma_kpi_card',
  TERRITORY_PERFORMANCE = 'territory_performance',
  PRODUCT_PERFORMANCE = 'product_performance',
  HCP_ENGAGEMENT = 'hcp_engagement',
  SAMPLE_DISTRIBUTION = 'sample_distribution',
  FORMULARY_ACCESS = 'formulary_access'
}
```

#### 1.2 Create Pharmaceutical Widget Templates
```typescript
export const PHARMA_WIDGET_TEMPLATES = {
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
  // ... other templates
}
```

#### 1.3 Extend Data Types
```typescript
// Add to dashboard.ts types
export interface PharmaKPICardData {
  kpiId: string;
  kpiName: string;
  value: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  format: 'number' | 'percentage' | 'currency' | 'ratio';
  metadata: Record<string, any>;
}

export interface TerritoryPerformanceData {
  territories: Array<{
    id: string;
    name: string;
    kpis: PharmaKPICardData[];
  }>;
}

// ... other pharmaceutical data types
```

### Phase 2: Create Pharmaceutical Widget Components

#### 2.1 PharmaKPICardWidget Component
```typescript
// src/components/dashboard/widgets/PharmaKPICardWidget.tsx
interface PharmaKPICardWidgetProps {
  widget: DashboardWidget;
  data: PharmaKPICardData;
}

export function PharmaKPICardWidget({ widget, data }: PharmaKPICardWidgetProps) {
  // Reuse existing KPICard component with pharmaceutical-specific styling
  return (
    <KPICard
      title={data.kpiName}
      value={data.value}
      trend={data.trend}
      color={getKPIColor(data.kpiId, data.value)}
      confidence={data.confidence}
      metadata={data.metadata}
      format={data.format}
    />
  );
}
```

#### 2.2 TerritoryPerformanceWidget Component
```typescript
// src/components/dashboard/widgets/TerritoryPerformanceWidget.tsx
export function TerritoryPerformanceWidget({ widget, data }: TerritoryPerformanceWidgetProps) {
  // Compact version of TerritoryPerformanceChart for dashboard
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium mb-4">{widget.title}</h3>
      <div className="space-y-3">
        {data.territories.map(territory => (
          <TerritorySummaryCard key={territory.id} territory={territory} />
        ))}
      </div>
    </div>
  );
}
```

### Phase 3: Integrate with Existing Dashboard Components

#### 3.1 Extend HierarchicalPerformanceDashboard
```typescript
// Add pharmaceutical KPI section
const PharmaceuticalKPISection = ({ userRole, userId }: { userRole: UserRole, userId: string }) => {
  const [pharmaKPIs, setPharmaKPIs] = useState<PharmaKPICardData[]>([]);
  
  useEffect(() => {
    // Load pharmaceutical KPIs based on user role
    loadPharmaceuticalKPIs(userId, userRole).then(setPharmaKPIs);
  }, [userId, userRole]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Pharmaceutical KPIs</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pharmaKPIs.map(kpi => (
          <PharmaKPICardWidget 
            key={kpi.kpiId}
            widget={{ id: kpi.kpiId, type: WidgetType.PHARMA_KPI_CARD, title: kpi.kpiName, position: { x: 0, y: 0, w: 3, h: 2 } }}
            data={kpi}
          />
        ))}
      </div>
    </div>
  );
};
```

#### 3.2 Extend SalesmanDashboard
```typescript
// Add pharmaceutical metrics to individual rep dashboard
const PharmaceuticalMetricsSection = ({ userId }: { userId: string }) => {
  const [repKPIs, setRepKPIs] = useState<PharmaKPICardData[]>([]);
  
  useEffect(() => {
    // Load rep-specific pharmaceutical KPIs
    loadRepPharmaceuticalKPIs(userId).then(setRepKPIs);
  }, [userId]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">My Pharmaceutical Performance</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {repKPIs.map(kpi => (
          <PharmaKPICardWidget key={kpi.kpiId} widget={...} data={kpi} />
        ))}
      </div>
    </div>
  );
};
```

### Phase 4: Data Integration Layer

#### 4.1 Create Pharmaceutical Data Service
```typescript
// src/lib/pharmaceutical-data-service.ts
export class PharmaceuticalDataService {
  static async getKPIsForUser(userId: string, userRole: UserRole, filters?: any): Promise<PharmaKPICardData[]> {
    const params = {
      organizationId: await getOrganizationId(userId),
      repId: userRole === 'salesman' ? userId : undefined,
      periodStart: getDefaultPeriodStart(),
      periodEnd: getDefaultPeriodEnd(),
      ...filters
    };

    const response = await fetch(`/api/bi/kpis?${new URLSearchParams(params)}`);
    const kpis = await response.json();
    
    return kpis.map((kpi: any) => ({
      kpiId: kpi.kpiId,
      kpiName: kpi.kpiName,
      value: kpi.value,
      confidence: kpi.confidence,
      trend: determineTrend(kpi.value, kpi.previousValue),
      format: getKPIColor(kpi.kpiId),
      metadata: kpi.metadata
    }));
  }

  static async getTerritoryPerformance(userId: string, userRole: UserRole): Promise<TerritoryPerformanceData> {
    // Implementation for territory performance data
  }

  static async getProductPerformance(userId: string): Promise<ProductPerformanceData> {
    // Implementation for product performance data
  }
}
```

#### 4.2 Extend Existing API Integration
```typescript
// Modify existing dashboard data loading to include pharmaceutical KPIs
const loadDashboardData = async (userId: string, userRole: UserRole) => {
  const [traditionalKPIs, pharmaKPIs] = await Promise.all([
    loadTraditionalKPIs(userId, userRole),
    PharmaceuticalDataService.getKPIsForUser(userId, userRole)
  ]);

  return {
    traditional: traditionalKPIs,
    pharmaceutical: pharmaKPIs
  };
};
```

### Phase 5: Configuration and Customization

#### 5.1 Role-Based Widget Availability
```typescript
// Extend widget filtering logic
const getAvailableWidgets = (userRole: UserRole): WidgetType[] => {
  const baseWidgets = getBaseWidgets(userRole);
  const pharmaWidgets = getPharmaceuticalWidgets(userRole);
  
  return [...baseWidgets, ...pharmaWidgets];
};

const getPharmaceuticalWidgets = (userRole: UserRole): WidgetType[] => {
  switch (userRole) {
    case 'salesman':
      return [WidgetType.PHARMA_KPI_CARD, WidgetType.PRODUCT_PERFORMANCE];
    case 'sales_manager':
      return [WidgetType.PHARMA_KPI_CARD, WidgetType.TERRITORY_PERFORMANCE, WidgetType.HCP_ENGAGEMENT];
    case 'regional_sales_director':
    case 'global_sales_lead':
      return [
        WidgetType.PHARMA_KPI_CARD,
        WidgetType.TERRITORY_PERFORMANCE,
        WidgetType.PRODUCT_PERFORMANCE,
        WidgetType.HCP_ENGAGEMENT,
        WidgetType.SAMPLE_DISTRIBUTION,
        WidgetType.FORMULARY_ACCESS
      ];
    default:
      return [WidgetType.PHARMA_KPI_CARD];
  }
};
```

#### 5.2 Dashboard Layout Templates
```typescript
// Create pharmaceutical-specific dashboard layouts
export const PHARMA_DASHBOARD_LAYOUTS = {
  salesman: [
    { id: 'pharma-kpi-trx', type: WidgetType.PHARMA_KPI_CARD, position: { x: 0, y: 0, w: 3, h: 2 } },
    { id: 'pharma-kpi-nrx', type: WidgetType.PHARMA_KPI_CARD, position: { x: 3, y: 0, w: 3, h: 2 } },
    { id: 'product-performance', type: WidgetType.PRODUCT_PERFORMANCE, position: { x: 0, y: 2, w: 6, h: 4 } }
  ],
  manager: [
    // Manager-specific layout with territory and team performance
  ],
  director: [
    // Director-specific layout with comprehensive pharmaceutical metrics
  ]
};
```

## Implementation Plan

### Week 1: Foundation
- [ ] Extend widget system with pharmaceutical types
- [ ] Create pharmaceutical data types
- [ ] Implement PharmaceuticalDataService
- [ ] Create basic PharmaKPICardWidget component

### Week 2: Core Components
- [ ] Implement TerritoryPerformanceWidget
- [ ] Implement ProductPerformanceWidget
- [ ] Implement HCPEngagementWidget
- [ ] Create widget rendering logic

### Week 3: Integration
- [ ] Integrate pharmaceutical KPIs into HierarchicalPerformanceDashboard
- [ ] Integrate pharmaceutical KPIs into SalesmanDashboard
- [ ] Add role-based widget filtering
- [ ] Implement dashboard layout templates

### Week 4: Testing & Refinement
- [ ] Regression testing for existing functionality
- [ ] Performance testing with pharmaceutical data
- [ ] User acceptance testing
- [ ] Documentation and training materials

## Risk Mitigation

### No Regression Strategy
1. **Incremental Integration**: Add pharmaceutical widgets alongside existing widgets
2. **Feature Flags**: Use feature flags to enable/disable pharmaceutical features
3. **Backward Compatibility**: Ensure existing dashboard functionality remains unchanged
4. **Rollback Plan**: Maintain ability to disable pharmaceutical features if issues arise

### Performance Considerations
1. **Lazy Loading**: Load pharmaceutical data only when needed
2. **Caching**: Implement caching for pharmaceutical KPI calculations
3. **Pagination**: Handle large datasets efficiently
4. **Error Boundaries**: Isolate pharmaceutical widget errors from main dashboard

### Data Security
1. **Role-Based Access**: Ensure pharmaceutical data respects user permissions
2. **Data Filtering**: Filter data based on user role and territory
3. **Audit Logging**: Track access to pharmaceutical data
4. **Compliance**: Ensure pharmaceutical data handling meets regulatory requirements

## Success Metrics

### Technical Metrics
- [ ] Zero regression in existing dashboard functionality
- [ ] < 2 second load time for pharmaceutical widgets
- [ ] 99.9% uptime for pharmaceutical data services
- [ ] < 5% increase in overall dashboard load time

### User Experience Metrics
- [ ] User adoption rate of pharmaceutical widgets > 80%
- [ ] User satisfaction score > 4.5/5 for pharmaceutical features
- [ ] Reduced time to access pharmaceutical insights by 50%
- [ ] Increased pharmaceutical KPI visibility by 100%

## Conclusion

This integration plan provides a comprehensive approach to incorporating Pharmaceutical BI KPIs into the default Dashboard while maintaining backward compatibility and ensuring no regression. The phased approach allows for incremental implementation and testing, reducing risk while delivering value to pharmaceutical sales teams.

The key success factors are:
1. **Incremental Integration**: Add pharmaceutical features alongside existing functionality
2. **Role-Based Customization**: Provide appropriate pharmaceutical metrics for each user role
3. **Performance Optimization**: Ensure pharmaceutical data doesn't impact dashboard performance
4. **User Experience**: Maintain consistent UI/UX patterns across traditional and pharmaceutical widgets

By following this plan, we can successfully integrate pharmaceutical BI capabilities into the main dashboard while preserving all existing functionality and providing a seamless user experience.

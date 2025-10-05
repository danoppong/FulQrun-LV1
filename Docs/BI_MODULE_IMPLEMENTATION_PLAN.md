# FulQrun Business Intelligence Module - Implementation Plan

## Executive Summary

This implementation plan outlines the development of a comprehensive Business Intelligence module for FulQrun, specifically designed for pharmaceutical sales KPI analytics and visualization. The module will integrate seamlessly with existing FulQrun modules (CRM, Sales Performance, Learning, Integrations) while adding advanced AI-powered analytics, compliance features, and mobile-first design capabilities.

## Current Architecture Analysis

### Existing FulQrun Modules (Completed)
- **Core CRM**: Contact/Company management, Lead scoring, Opportunity tracking (PEAK/MEDDPICC)
- **Sales Performance**: Territories, Quotas, Compensation plans, Performance metrics
- **Authentication**: Supabase Auth + Microsoft EntraID SSO
- **Learning Platform**: Training modules and certification system
- **Integrations**: Microsoft Graph, QuickBooks (stubbed), API framework
- **Analytics**: Basic dashboard with pipeline visualization

### Current Database Schema
- **Core Tables**: organizations, users, contacts, companies, leads, opportunities, activities
- **Sales Performance**: sales_territories, quota_plans, compensation_plans, performance_metrics
- **Enhanced Metrics**: daily_performance, product_performance, customer_performance, sales_activities
- **Security**: Row-level security (RLS) for multi-tenancy

## BI Module Integration Strategy

### Phase 1: Foundation & Data Model (Weeks 1-4)

#### 1.1 Pharmaceutical KPI Schema Extensions
```sql
-- Pharmaceutical-specific KPI tables
CREATE TABLE pharmaceutical_kpis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    kpi_name TEXT NOT NULL, -- TRx, NRx, Market Share, etc.
    kpi_definition TEXT NOT NULL,
    formula TEXT NOT NULL,
    grain TEXT[] NOT NULL, -- [date, product, territory, hcp]
    dimensions TEXT[] NOT NULL, -- [territory, rep, payer, channel]
    thresholds JSONB DEFAULT '{}',
    owner TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Healthcare Provider (HCP) management
CREATE TABLE healthcare_providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hcp_id TEXT NOT NULL, -- External HCP identifier
    name TEXT NOT NULL,
    specialty TEXT,
    practice_id TEXT,
    territory_id UUID REFERENCES sales_territories(id),
    formulary_status TEXT,
    last_interaction_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescription events tracking
CREATE TABLE prescription_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    hcp_id TEXT NOT NULL,
    account_id TEXT,
    prescription_date DATE NOT NULL,
    prescription_type TEXT CHECK (prescription_type IN ('new', 'refill')),
    volume INTEGER NOT NULL,
    territory_id UUID REFERENCES sales_territories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call activity tracking for pharmaceutical sales
CREATE TABLE pharmaceutical_calls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    rep_id UUID NOT NULL REFERENCES users(id),
    hcp_id TEXT NOT NULL,
    call_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    call_type TEXT CHECK (call_type IN ('detailing', 'sampling', 'follow_up', 'presentation')),
    product_id TEXT,
    outcome TEXT CHECK (outcome IN ('successful', 'unsuccessful', 'follow_up_required', 'no_response')),
    samples_distributed INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample distribution tracking
CREATE TABLE sample_distributions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    hcp_id TEXT NOT NULL,
    rep_id UUID NOT NULL REFERENCES users(id),
    distribution_date DATE NOT NULL,
    quantity INTEGER NOT NULL,
    territory_id UUID REFERENCES sales_territories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Formulary access tracking
CREATE TABLE formulary_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    payer_id TEXT NOT NULL,
    payer_name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    coverage_level TEXT CHECK (coverage_level IN ('preferred', 'standard', 'non_preferred', 'not_covered')),
    territory_id UUID REFERENCES sales_territories(id),
    effective_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 1.2 Data Integration Layer
```typescript
// src/lib/bi/data-integration.ts
export interface DataSourceConfig {
  id: string;
  name: string;
  type: 'salesforce' | 'iqvia' | 'snowflake' | 'redshift' | 'bigquery' | 'csv';
  connectionString?: string;
  apiKey?: string;
  refreshInterval: number; // minutes
  lastSync?: Date;
  status: 'active' | 'inactive' | 'error';
}

export class DataIntegrationService {
  async syncSalesforceData(organizationId: string): Promise<void> {
    // Sync CRM data, opportunities, contacts
  }
  
  async syncIQVIAData(organizationId: string): Promise<void> {
    // Sync prescription data, market share, competitor data
  }
  
  async syncSnowflakeData(organizationId: string): Promise<void> {
    // Sync data warehouse metrics
  }
  
  async processCSVUpload(file: File, mapping: DataMapping): Promise<void> {
    // Handle CSV data uploads with field mapping
  }
}
```

#### 1.3 KPI Calculation Engine
```typescript
// src/lib/bi/kpi-engine.ts
export interface KPICalculation {
  kpiId: string;
  formula: string;
  parameters: Record<string, any>;
  result: number;
  confidence: number;
  calculatedAt: Date;
}

export class KPIEngine {
  async calculateTRx(params: {
    organizationId: string;
    productId?: string;
    territoryId?: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<KPICalculation> {
    // Calculate Total Prescriptions
  }
  
  async calculateNRx(params: {
    organizationId: string;
    productId?: string;
    territoryId?: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<KPICalculation> {
    // Calculate New Prescriptions
  }
  
  async calculateMarketShare(params: {
    organizationId: string;
    productId: string;
    territoryId?: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<KPICalculation> {
    // Calculate Market Share percentage
  }
  
  async calculateCallEffectiveness(params: {
    organizationId: string;
    repId?: string;
    territoryId?: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<KPICalculation> {
    // Calculate Call Effectiveness Index
  }
}
```

### Phase 2: API Layer & Core Services (Weeks 5-8)

#### 2.1 BI API Endpoints
```typescript
// src/app/api/bi/kpis/route.ts
export async function GET(request: NextRequest) {
  // Get KPI definitions and calculated values
}

export async function POST(request: NextRequest) {
  // Create new KPI definitions
}

// src/app/api/bi/dashboard/route.ts
export async function GET(request: NextRequest) {
  // Get dashboard data with role-based filtering
}

// src/app/api/bi/analytics/conversational/route.ts
export async function POST(request: NextRequest) {
  // Handle natural language queries
}

// src/app/api/bi/forecasting/route.ts
export async function POST(request: NextRequest) {
  // Generate predictive forecasts
}

// src/app/api/bi/anomaly-detection/route.ts
export async function POST(request: NextRequest) {
  // Detect anomalies in KPI data
}
```

#### 2.2 Integration with Existing APIs
```typescript
// Extend existing sales-performance APIs
// src/app/api/sales-performance/enhanced-metrics/route.ts
export async function GET(request: NextRequest) {
  // Add pharmaceutical KPI calculations to existing metrics
  const pharmaceuticalKPIs = await KPIEngine.calculatePharmaceuticalKPIs({
    organizationId,
    userId,
    periodStart,
    periodEnd
  });
  
  return NextResponse.json({
    ...existingMetrics,
    pharmaceutical: pharmaceuticalKPIs
  });
}
```

#### 2.3 Real-time Data Processing
```typescript
// src/lib/bi/real-time-processor.ts
export class RealTimeProcessor {
  async processPrescriptionEvent(event: PrescriptionEvent): Promise<void> {
    // Update TRx/NRx calculations in real-time
    await this.updateKPICache(event);
    await this.checkAnomalies(event);
    await this.updateForecasts(event);
  }
  
  async processCallEvent(event: CallEvent): Promise<void> {
    // Update call effectiveness metrics
    await this.updateCallMetrics(event);
    await this.updateReachFrequency(event);
  }
}
```

### Phase 3: AI-Powered Analytics (Weeks 9-12)

#### 3.1 Conversational Analytics Engine
```typescript
// src/lib/bi/ai/conversational-analytics.ts
export class ConversationalAnalytics {
  async processQuery(query: string, context: UserContext): Promise<AnalyticsResponse> {
    // Parse natural language query
    const parsedQuery = await this.parseQuery(query);
    
    // Generate SQL/API calls
    const dataQuery = await this.generateDataQuery(parsedQuery);
    
    // Execute query
    const data = await this.executeQuery(dataQuery);
    
    // Generate narrative response
    const narrative = await this.generateNarrative(data, parsedQuery);
    
    return {
      data,
      narrative,
      visualizations: this.generateVisualizations(data),
      insights: await this.generateInsights(data)
    };
  }
  
  async generateNarrative(data: any[], query: ParsedQuery): Promise<string> {
    // Use OpenAI/Anthropic to generate human-readable insights
  }
}
```

#### 3.2 Predictive Analytics & Forecasting
```typescript
// src/lib/bi/ai/forecasting.ts
export class ForecastingEngine {
  async generateTRxForecast(params: ForecastParams): Promise<ForecastResult> {
    // Time series forecasting for TRx
  }
  
  async generateMarketShareForecast(params: ForecastParams): Promise<ForecastResult> {
    // Market share prediction with competitor analysis
  }
  
  async generateScenarioAnalysis(scenarios: Scenario[]): Promise<ScenarioResult[]> {
    // What-if analysis for different scenarios
  }
}
```

#### 3.3 Anomaly Detection
```typescript
// src/lib/bi/ai/anomaly-detection.ts
export class AnomalyDetector {
  async detectKPITrends(kpiData: KPIData[]): Promise<AnomalyResult[]> {
    // ML-based anomaly detection
  }
  
  async detectPrescriptionSpikes(prescriptionData: PrescriptionEvent[]): Promise<AnomalyResult[]> {
    // Detect unusual prescription patterns
  }
  
  async generateRootCauseAnalysis(anomaly: AnomalyResult): Promise<RootCauseAnalysis> {
    // AI-powered root cause analysis
  }
}
```

### Phase 4: Frontend Components & UI (Weeks 13-16)

#### 4.1 BI Dashboard Components
```typescript
// src/components/bi/PharmaceuticalDashboard.tsx
export default function PharmaceuticalDashboard({ 
  organizationId, 
  userId, 
  role 
}: PharmaceuticalDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'territory' | 'hcp' | 'products' | 'forecasting'>('overview');
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Role-based dashboard tabs */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} role={role} />
      
      {/* KPI Cards */}
      <KPICardsGrid kpiData={kpiData} />
      
      {/* Interactive Charts */}
      <ChartsSection data={kpiData} />
      
      {/* AI Insights Panel */}
      <AIInsightsPanel />
      
      {/* Forecasting Section */}
      <ForecastingSection data={forecastData} />
    </div>
  );
}
```

#### 4.2 Mobile-First Components
```typescript
// src/components/bi/mobile/MobileKPICard.tsx
export default function MobileKPICard({ kpi, value, trend }: MobileKPICardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{kpi.name}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <TrendIndicator trend={trend} />
      </div>
      <TouchOptimizedChart data={kpi.data} />
    </div>
  );
}
```

#### 4.3 Conversational Interface
```typescript
// src/components/bi/ConversationalAnalytics.tsx
export default function ConversationalAnalytics() {
  const [query, setQuery] = useState('');
  const [responses, setResponses] = useState<AnalyticsResponse[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleVoiceInput = async () => {
    // Voice-to-text integration
    const voiceQuery = await speechToText();
    setQuery(voiceQuery);
    await processQuery(voiceQuery);
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about your sales performance..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
        />
        <button onClick={handleVoiceInput} className="p-2 bg-blue-600 text-white rounded-md">
          <MicrophoneIcon className="h-5 w-5" />
        </button>
      </div>
      
      <div className="space-y-4">
        {responses.map((response, index) => (
          <AnalyticsResponse key={index} response={response} />
        ))}
      </div>
    </div>
  );
}
```

### Phase 5: Compliance & Security (Weeks 17-20)

#### 5.1 HIPAA Compliance Features
```typescript
// src/lib/bi/compliance/hipaa-compliance.ts
export class HIPAAComplianceService {
  async auditDataAccess(userId: string, dataType: string, action: string): Promise<void> {
    // Log all data access for HIPAA compliance
  }
  
  async encryptSensitiveData(data: any): Promise<string> {
    // Encrypt PHI data
  }
  
  async validateDataRetention(dataId: string): Promise<boolean> {
    // Check data retention policies
  }
}
```

#### 5.2 Row-Level Security Extensions
```sql
-- Extend RLS policies for pharmaceutical data
CREATE POLICY "Users can view HCPs in their territory" ON healthcare_providers
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view prescription events for their territory" ON prescription_events
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ) AND (
      territory_id IN (
        SELECT id FROM sales_territories 
        WHERE assigned_user_id = auth.uid() OR manager_id = auth.uid()
      )
    )
  );
```

#### 5.3 Audit Trail Implementation
```typescript
// src/lib/bi/audit/audit-service.ts
export class AuditService {
  async logKPIAccess(userId: string, kpiId: string, action: string): Promise<void> {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: action,
      resource_type: 'kpi',
      resource_id: kpiId,
      timestamp: new Date(),
      ip_address: await this.getClientIP(),
      user_agent: await this.getUserAgent()
    });
  }
}
```

### Phase 6: Integration & Testing (Weeks 21-24)

#### 6.1 Integration with Existing Modules
```typescript
// Extend existing dashboard to include BI components
// src/app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Existing dashboard components */}
      <SalesPerformanceOverview />
      <PipelineVisualization />
      
      {/* New BI components */}
      <PharmaceuticalKPICards />
      <ConversationalAnalytics />
      <ForecastingWidget />
    </div>
  );
}
```

#### 6.2 Mobile App Integration
```typescript
// src/components/mobile/MobileBIDashboard.tsx
export default function MobileBIDashboard() {
  return (
    <div className="space-y-4 p-4">
      <MobileKPICards />
      <MobileConversationalAnalytics />
      <MobileForecastingCharts />
      <MobileAnomalyAlerts />
    </div>
  );
}
```

#### 6.3 PWA Enhancements
```typescript
// src/lib/pwa/bi-offline-sync.ts
export class BIOfflineSync {
  async syncKPIData(): Promise<void> {
    // Sync KPI data for offline access
  }
  
  async syncForecastData(): Promise<void> {
    // Sync forecast data for offline viewing
  }
  
  async queueOfflineQueries(): Promise<void> {
    // Queue analytics queries for when online
  }
}
```

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-4)
- [ ] Database schema design and migration
- [ ] Data integration service development
- [ ] KPI calculation engine implementation
- [ ] Basic API endpoints creation

### Phase 2: API Layer (Weeks 5-8)
- [ ] Complete BI API endpoints
- [ ] Integration with existing sales-performance APIs
- [ ] Real-time data processing implementation
- [ ] Data source connector development

### Phase 3: AI Analytics (Weeks 9-12)
- [ ] Conversational analytics engine
- [ ] Predictive forecasting models
- [ ] Anomaly detection algorithms
- [ ] AI-powered insights generation

### Phase 4: Frontend (Weeks 13-16)
- [ ] BI dashboard components
- [ ] Mobile-optimized interfaces
- [ ] Conversational UI implementation
- [ ] Chart and visualization components

### Phase 5: Compliance (Weeks 17-20)
- [ ] HIPAA compliance features
- [ ] Enhanced RLS policies
- [ ] Audit trail implementation
- [ ] Data encryption and security

### Phase 6: Integration (Weeks 21-24)
- [ ] Integration with existing modules
- [ ] Mobile app enhancements
- [ ] PWA offline capabilities
- [ ] Comprehensive testing and QA

## Success Metrics

### Technical Metrics
- **Performance**: <3 second load times for dashboards with 10M+ data rows
- **Availability**: 99.9% uptime for BI services
- **Data Freshness**: <5 minute latency for real-time KPIs
- **Mobile Performance**: <2 second load times on mobile devices

### User Adoption Metrics
- **Daily Active Users**: 80% of sales reps using mobile BI daily
- **Query Response Time**: <2 minutes for 90% of conversational queries
- **Forecast Accuracy**: 15% improvement in prediction accuracy
- **Compliance**: 100% audit-ready compliance across all features

### Business Impact Metrics
- **Sales Growth**: 10% uplift in TRx/NRx through optimized strategies
- **Time-to-Insight**: 60% reduction in time to generate insights
- **Decision Speed**: 50% faster decision-making through AI insights
- **Territory Optimization**: 20% improvement in territory performance

## Risk Mitigation

### Technical Risks
- **Data Volume**: Implement efficient caching and data partitioning
- **Performance**: Use CDN and edge computing for global performance
- **Integration Complexity**: Develop robust error handling and fallback mechanisms

### Compliance Risks
- **HIPAA Violations**: Implement comprehensive audit trails and encryption
- **Data Privacy**: Ensure GDPR compliance with data residency controls
- **Regulatory Changes**: Build flexible compliance framework for future regulations

### User Adoption Risks
- **Complexity**: Design intuitive, mobile-first interfaces
- **Training**: Provide comprehensive onboarding and documentation
- **Change Management**: Implement gradual rollout with user feedback loops

## Conclusion

This implementation plan provides a comprehensive roadmap for developing the FulQrun Business Intelligence module that seamlessly integrates with existing modules while adding powerful pharmaceutical-specific analytics capabilities. The phased approach ensures steady progress while maintaining system stability and user experience quality.

The module will transform FulQrun into a complete pharmaceutical sales operations platform, providing the AI-powered insights, compliance features, and mobile-first experience needed to compete in the pharmaceutical sales technology market.

# Salesman Dashboard KPI Implementation Guide

## Executive Summary

This document details the implementation of the **Salesman Dashboard** for the FulQrun pharmaceutical sales operations platform, implementing sophisticated KPI calculations with hierarchical roll-up capabilities.

### Key Features Delivered
✅ **8 Core KPIs** with pharmaceutical-specific formulas  
✅ **Hierarchical Roll-Up** for manager team views  
✅ **Tri-Temporal Analysis** (Weekly/Monthly/Annually)  
✅ **Premium Dark Mode UI** with sophisticated Tailwind styling  
✅ **Real-Time Calculations** via RESTful API  
✅ **Velocity-Based Funnel Health** with stage-by-stage breakdown  

---

## Section 1: KPI Calculation Formulas Implemented

### 1.1 Funnel Health (Overall Score)

**Formula:**
```
Weighted Score = (Weighted Avg Velocity Score × 0.7) + (Qualified Opp Volume Score × 0.3)
```

**Component Calculations:**

**Weighted Average Velocity Score:**
```
Σ (Days in Stage / Historical Avg Days in Stage × Stage Weight) for all stages
```

**Stage Weights:**
- Prospecting: 0.1
- Qualification: 0.15
- Needs Analysis: 0.2
- Proposal: 0.25
- Negotiation: 0.3
- Closed Won/Lost: 0

**Historical Average Days per Stage:**
- Prospecting: 14 days
- Qualification: 21 days
- Needs Analysis: 30 days
- Proposal: 28 days
- Negotiation: 21 days

**Qualified Opportunity Volume Score:**
```
Min((Σ Rx Volume for Qualified/Needs Analysis stages / 10,000) × 100, 100)
```

**Implementation Location:** `src/lib/services/salesman-kpi-engine.ts` - `calculateFunnelHealth()`

**Data Fields Required:**
- `opportunities.stage` (current funnel stage)
- `opportunities.stage_entry_date` (when opportunity entered current stage)
- `opportunities.value` (monetary value)
- `opportunities.custom_fields.rx_volume` (prescription volume in mock units)
- `opportunities.created_at` (opportunity creation date)

---

### 1.2 Funnel Health (Number)

**Formula:**
```
Total Number of Active Opportunities assigned to Salesman
```

**Filters:**
- Status: Active (not Closed Won/Lost)
- Assigned To: Salesman ID(s)
- Organization: User's organization
- Date Range: Within selected period

**Implementation:** Returns `funnelHealth.numberOfOpportunities` field

---

### 1.3 Funnel Health (Value)

**Formula:**
```
Σ Opportunity Value for all active opportunities
```

**Implementation:** Returns `funnelHealth.totalValue` field with stage-by-stage breakdown

---

### 1.4 Win Rate

**Formula:**
```
(Number of Deals Won / Number of Deals Closed (Won + Lost)) × 100%
```

**Data Fields Required:**
- `opportunities.stage` (must be 'Closed Won' or 'Closed Lost')
- `opportunities.closed_at` (within selected period)
- `opportunities.assigned_to` (salesman ID)

**Implementation Location:** `calculateWinRate()`

**Returns:**
```typescript
{
  winRate: number,          // Percentage
  dealsWon: number,
  dealsLost: number,
  totalClosed: number,
  periodStart: Date,
  periodEnd: Date
}
```

---

### 1.5 Revenue Growth

**Formula:**
```
((Current Period Revenue - Prior Period Revenue) / Prior Period Revenue) × 100%
```

**Period Calculation Logic:**
1. Calculate period duration: `periodEnd - periodStart`
2. Prior period end: `periodStart - 1 day`
3. Prior period start: `priorPeriodEnd - period duration`

**Data Fields Required:**
- `opportunities.value` (for Closed Won deals)
- `opportunities.closed_at` (for period filtering)

**Implementation Location:** `calculateRevenueGrowth()`

**Returns:**
```typescript
{
  growthRate: number,              // Percentage
  currentPeriodRevenue: number,
  priorPeriodRevenue: number,
  absoluteChange: number
}
```

---

### 1.6 Average Deal Size

**Formula:**
```
Σ Closed Deal Value / Number of Closed Deals
```

**Additional Metrics:**
- **Median:** Middle value of sorted deal values
- **Min/Max:** Range boundaries

**Implementation Location:** `calculateAverageDealSize()`

**Returns:**
```typescript
{
  averageDealSize: number,
  totalClosedValue: number,
  numberOfClosedDeals: number,
  median: number,
  min: number,
  max: number
}
```

---

### 1.7 Performance vs Target

**Formula:**
```
(Actual Sales Value / Target Value) × 100%
```

**Target Lookup:**
- Queries `sales_targets` table
- Filters by: `salesman_id`, `period_type`, `period_start/end`
- Aggregates targets for team rollup views
- Fallback: If no target set, uses 120% of actual (20% above current)

**On-Track Threshold:** >= 95% of target

**Implementation Location:** `calculatePerformanceVsTarget()`

**Returns:**
```typescript
{
  performancePercentage: number,
  actualValue: number,
  targetValue: number,
  variance: number,               // actualValue - targetValue
  onTrack: boolean,               // >= 95%
  period: 'weekly' | 'monthly' | 'annually'
}
```

---

## Section 2: Hierarchical Roll-Up Logic

### 2.1 View Modes

**Individual View (Default):**
- Displays KPIs for single salesman
- `salesmanIds = [userId]`
- No aggregation required

**Team Rollup View (Managers Only):**
- Aggregates data for all direct and indirect reports
- Recursive query to build team hierarchy
- Same KPI formulas applied to aggregated data

### 2.2 Hierarchy Resolution Algorithm

**Function:** `getTeamSalesmanIds(managerId, organizationId)`

**Process:**
```
1. Initialize: teamIds = [managerId]
2. Query direct reports: WHERE manager_id = managerId
3. Add direct reports to teamIds
4. For each direct report:
   4a. Recursively call getTeamSalesmanIds(reportId)
   4b. Merge results (avoid duplicates)
5. Return complete team hierarchy
```

**Implementation:** `src/lib/services/salesman-kpi-engine.ts`

### 2.3 Authorization Rules

**View Other Salesman Data:**
- Requires role: `manager`, `admin`, or `regional_director`

**Team Rollup View:**
- Verify requesting user is manager of target salesman
- Admin role bypasses hierarchy check

**Implementation:** `src/app/api/dashboard/salesman-kpis/route.ts`

---

## Section 3: Data Model Requirements

### 3.1 Opportunities Table Schema

**Minimum Required Fields:**
```sql
CREATE TABLE opportunities (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  assigned_to UUID NOT NULL,           -- Salesman ID
  manager_id UUID,                     -- For hierarchy
  stage TEXT NOT NULL,                 -- Current funnel stage
  stage_entry_date TIMESTAMP,          -- Entry date for velocity
  value NUMERIC,                       -- Deal monetary value
  created_at TIMESTAMP,
  closed_at TIMESTAMP,
  custom_fields JSONB                  -- Contains rx_volume
);
```

**Custom Fields Structure:**
```typescript
{
  rx_volume: number,      // Prescription volume (mock units)
  product_category: string,
  territory: string
}
```

### 3.2 Sales Targets Table Schema

```sql
CREATE TABLE sales_targets (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  salesman_id UUID NOT NULL,
  period_type TEXT NOT NULL,           -- 'weekly', 'monthly', 'annually'
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  target_value NUMERIC NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 3.3 User Profiles for Hierarchy

**Required Fields:**
```sql
user_profiles (
  id UUID,
  organization_id UUID,
  manager_id UUID,                     -- Points to manager's user ID
  role TEXT,                           -- 'salesman', 'manager', etc.
  full_name TEXT
)
```

---

## Section 4: API Documentation

### 4.1 GET /api/dashboard/salesman-kpis

**Description:** Calculate KPIs for a single salesman or team

**Query Parameters:**
```typescript
{
  salesmanId: string,              // Required
  viewMode: 'individual' | 'rollup', // Default: 'individual'
  includeSubordinates: boolean,    // Default: false
  periodStart: string,             // ISO date, default: start of month
  periodEnd: string                // ISO date, default: now
}
```

**Response Example:**
```json
{
  "funnelHealth": {
    "overallScore": 78.5,
    "numberOfOpportunities": 45,
    "totalValue": 2450000,
    "totalVolume": 8750,
    "velocityScore": 82.3,
    "qualifiedVolumeScore": 71.2,
    "breakdown": [
      {
        "stage": "Prospecting",
        "count": 12,
        "value": 450000,
        "volume": 2100,
        "avgDaysInStage": 16.5,
        "velocityRatio": 1.18
      }
    ]
  },
  "winRate": {
    "winRate": 62.5,
    "dealsWon": 25,
    "dealsLost": 15,
    "totalClosed": 40
  },
  "revenueGrowth": {
    "growthRate": 18.7,
    "currentPeriodRevenue": 1950000,
    "priorPeriodRevenue": 1643000,
    "absoluteChange": 307000
  },
  "averageDealSize": {
    "averageDealSize": 78000,
    "totalClosedValue": 1950000,
    "numberOfClosedDeals": 25,
    "median": 72000,
    "min": 35000,
    "max": 250000
  },
  "performanceVsTarget": {
    "weekly": { ... },
    "monthly": {
      "performancePercentage": 97.5,
      "actualValue": 1950000,
      "targetValue": 2000000,
      "variance": -50000,
      "onTrack": true,
      "period": "monthly"
    },
    "annually": { ... }
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Organization not found
- `500` - Internal server error

### 4.2 POST /api/dashboard/salesman-kpis/batch

**Description:** Calculate KPIs for multiple salesmen (manager bulk operations)

**Request Body:**
```typescript
{
  salesmanIds: string[],           // Max 50
  periodStart: string,
  periodEnd: string,
  viewMode: 'individual' | 'rollup'
}
```

**Response:**
```json
{
  "successful": [ ... ],           // Array of SalesmanKPIResults
  "failed": [
    {
      "salesmanId": "uuid",
      "error": "Error message"
    }
  ],
  "summary": {
    "total": 25,
    "successCount": 24,
    "failureCount": 1
  }
}
```

---

## Section 5: UI Component Architecture

### 5.1 PremiumSalesmanDashboard Component

**File:** `src/components/dashboard/PremiumSalesmanDashboard.tsx`

**Props:**
```typescript
{
  userId: string,
  userRole: string,
  organizationId: string,
  darkMode?: boolean
}
```

**State Management:**
```typescript
- kpiData: SalesmanKPIResults | null
- loading: boolean
- error: string | null
- selectedTimeFrame: 'weekly' | 'monthly' | 'annually'
- viewMode: 'individual' | 'rollup'
- refreshKey: number (for manual refresh)
```

### 5.2 Layout Sections

1. **Header Bar (Sticky)**
   - Dashboard title (dynamic: individual/team)
   - Salesman name and view mode
   - Refresh button with rotate animation

2. **Control Panel**
   - Timeframe selector (Weekly/Monthly/Annually)
   - View mode toggle (Individual/Team Rollup) - managers only

3. **Top KPI Cards (4-column grid)**
   - Funnel Health (blue theme)
   - Win Rate (green theme)
   - Revenue Growth (purple theme)
   - Average Deal Size (orange theme)

4. **Performance vs Target (Large featured card)**
   - Percentage display with on-track indicator
   - Animated progress bar
   - 3-column detail grid (Actual/Target/Variance)

5. **Funnel Stage Breakdown (Grid)**
   - Card per stage
   - Opportunities count, value, avg days
   - Color-coded velocity warnings

### 5.3 Responsive Breakpoints

```css
Mobile (< 768px):   Single column, stacked cards
Tablet (768-1024px): 2-column grid
Desktop (> 1024px):  4-column KPI grid, 3-column breakdown
```

---

## Section 6: Styling & Design System

### 6.1 Color Palette

**Dark Mode:**
```
Background: gray-950 → gray-900 gradient
Cards: gray-800/95 with ring-1 ring-white/5
Shadows: shadow-2xl shadow-black/50
Hover: shadow-[color]-900/20
```

**Light Mode:**
```
Background: gray-50 → blue-50/30 gradient
Cards: white/95 with ring-1 ring-gray-900/5
Shadows: shadow-xl shadow-gray-200/50
Hover: shadow-[color]-100/30
```

### 6.2 KPI Card Color Themes

| KPI | Dark From | Dark To | Light From | Light To |
|-----|-----------|---------|------------|----------|
| Funnel Health | blue-500/10 | blue-600/10 | blue-50 | blue-100/50 |
| Win Rate | green-500/10 | green-600/10 | green-50 | green-100/50 |
| Revenue Growth | purple-500/10 | purple-600/10 | purple-50 | purple-100/50 |
| Avg Deal Size | orange-500/10 | orange-600/10 | orange-50 | orange-100/50 |

### 6.3 Animation Specifications

```css
Card Hover: scale-[1.02] duration-500
Button Hover: scale-110 duration-300
Progress Bar: duration-1000 ease-out
Refresh Icon: rotate-180 duration-500
Transitions: all duration-300
```

---

## Section 7: Testing & Verification

### 7.1 Unit Test Checklist

- [ ] Funnel Health calculation accuracy
- [ ] Win Rate percentage correctness
- [ ] Revenue Growth period logic
- [ ] Average Deal Size statistical metrics
- [ ] Performance vs Target threshold (95%)
- [ ] Hierarchical team ID resolution
- [ ] Authorization checks for manager views

### 7.2 Integration Test Scenarios

1. **Individual Salesman View**
   - Login as salesman
   - Verify KPIs show only personal data
   - Switch timeframes (W/M/A)
   - Confirm data changes

2. **Manager Team Rollup**
   - Login as manager
   - Toggle to "Team Rollup"
   - Verify aggregated numbers > individual
   - Check stage breakdown sums correctly

3. **Hierarchy Edge Cases**
   - Manager with no direct reports
   - Multi-level hierarchy (3+ levels)
   - Circular reference prevention
   - Organization boundary enforcement

### 7.3 Performance Benchmarks

**Target Response Times:**
- Individual KPI calculation: < 500ms
- Team rollup (10 salesmen): < 2s
- Team rollup (50 salesmen): < 5s
- Batch calculation (25 salesmen): < 10s

**Optimization Strategies:**
- Database indexes on `assigned_to`, `stage`, `closed_at`
- Parallel Promise.allSettled for multiple KPIs
- 5-minute cache headers on API responses
- React useMemo for expensive computations

---

## Section 8: Deployment & Maintenance

### 8.1 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 8.2 Database Migrations Required

1. **Add `sales_targets` table** (if not exists)
2. **Add `custom_fields` JSONB column** to opportunities
3. **Create indexes:**
   ```sql
   CREATE INDEX idx_opps_assigned_to ON opportunities(assigned_to);
   CREATE INDEX idx_opps_stage ON opportunities(stage);
   CREATE INDEX idx_opps_closed_at ON opportunities(closed_at);
   CREATE INDEX idx_targets_salesman ON sales_targets(salesman_id);
   ```

### 8.3 Monitoring & Alerts

**Key Metrics to Track:**
- API response times (p50, p95, p99)
- Error rates by endpoint
- KPI calculation failures
- Cache hit/miss ratios

**Alert Thresholds:**
- Response time > 3s: Warning
- Error rate > 5%: Critical
- KPI calculation failure: Immediate

---

## Section 9: Future Enhancements

### 9.1 Phase 2 Features
- [ ] Historical trend charts (6-month comparison)
- [ ] Predictive forecasting using AI
- [ ] Automated alerts for below-target performance
- [ ] Export to PDF/Excel functionality
- [ ] Real-time collaboration annotations

### 9.2 Advanced Analytics
- [ ] Cohort analysis by product category
- [ ] Territory-based performance comparison
- [ ] Seasonal adjustment factors
- [ ] Competitive benchmarking
- [ ] Call frequency correlation analysis

### 9.3 Mobile Optimization
- [ ] Progressive Web App (PWA)
- [ ] Offline mode with sync
- [ ] Voice command integration
- [ ] Push notifications for milestones

---

## Appendix A: Formula Reference Card

```
1. Funnel Health Overall:
   (Velocity Score × 0.7) + (Volume Score × 0.3)

2. Funnel Health Number:
   COUNT(active_opportunities)

3. Funnel Health Value:
   SUM(opportunity.value)

4. Win Rate:
   (Deals Won / Total Closed) × 100%

5. Revenue Growth:
   ((Current - Prior) / Prior) × 100%

6. Average Deal Size:
   SUM(closed_value) / COUNT(closed_deals)

7. Performance vs Target:
   (Actual / Target) × 100%
```

---

## Appendix B: Quick Start Commands

```bash
# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Test KPI calculations
npm test -- salesman-kpi-engine

# Check types
npx tsc --noEmit
```

---

**Document Version:** 1.0  
**Last Updated:** October 10, 2025  
**Maintained By:** FulQrun Development Team  
**Contact:** support@fulqrun.com

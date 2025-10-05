# Sales Performance Module - Implementation Guide

## 🚀 Quick Start

### Step 1: Apply Database Migration
Run the following SQL in your Supabase Dashboard SQL Editor:

```sql
-- Navigate to: Supabase Dashboard > SQL Editor > New Query
-- Copy and paste: supabase/migrations/022_sales_performance_enhancement.sql
```

This will create:
- 8 new tables for advanced tracking
- Enhanced columns in existing tables
- Audit triggers and functions
- RLS policies for security

### Step 2: Verify Tables Created
After running the migration, verify these tables exist:
- ✅ `territory_accounts`
- ✅ `daily_performance`
- ✅ `product_performance`
- ✅ `customer_performance`
- ✅ `sales_activities`
- ✅ `commission_adjustments`
- ✅ `sales_performance_audit`
- ✅ `payroll_exports`

### Step 3: Test the New Components
1. Navigate to `/sales-performance` in your app
2. Click on **Territory Management** tab
3. Click **"Create Territory"** button - Modal should appear
4. Fill in territory details and save
5. Click on **Quota Planning** tab
6. Click **"Create Quota Plan"** button - Modal should appear
7. Configure hierarchical quota with planning method
8. Save and verify it appears in the list

---

## 📂 New File Structure

```
/src/components/sales-performance/
├── modals/
│   ├── TerritoryModal.tsx          ✅ NEW - Create/Edit territories
│   ├── QuotaPlanModal.tsx          ✅ NEW - Create/Edit quota plans with hierarchy
│   └── CompensationPlanModal.tsx   ✅ NEW - Create/Edit compensation plans
├── TerritoryManagementNew.tsx      ✅ NEW - Full CRUD territory management
├── QuotaPlanningNew.tsx            ✅ NEW - Hierarchical quota planning
├── SalesPerformanceDashboard.tsx   ✅ UPDATED - Uses new components
└── [old components remain for reference]

/src/app/api/sales-performance/
├── territories/
│   ├── route.ts                    ✅ Existing
│   └── [id]/
│       └── route.ts                ✅ NEW - PUT/DELETE support
├── quota-plans/
│   ├── route.ts                    ✅ Existing
│   └── [id]/
│       ├── route.ts                ✅ NEW - PUT/DELETE support
│       └── approve/
│           └── route.ts            ✅ NEW - Approval workflow
└── [other routes...]

/supabase/migrations/
└── 022_sales_performance_enhancement.sql   ✅ NEW - Enhanced schema
```

---

## 🎯 What's Working Now

### ✅ Territory Management
- **Create territories** with zip codes, industry codes, revenue tiers
- **Edit existing territories** with full data retention
- **Delete territories** (with cascade to related records)
- **Assign to users** and managers
- **Fairness index calculation** (auto-calculated, color-coded)
- **Grid and Table views** for different visualization needs
- **Filter by status** (All, Active, Inactive)
- **Statistics dashboard** showing total, active, assigned, avg value, avg fairness

### ✅ Quota Planning
- **Create quota plans** with multiple target types (Revenue, Deals, Activities)
- **Hierarchical planning** with 5 levels (Individual → Team → Manager → Director → Executive)
- **Planning methods**: Top-Down, Bottom-Up, Middle-Out, Direct
- **Parent-child relationships** for cascading targets
- **Approval workflow** with reconciliation tracking
- **Time-based progress bars** for active plans
- **Status tracking**: Upcoming → Active → Completed
- **List and Hierarchy views** to visualize plan relationships
- **Statistics dashboard** showing totals, active, approved, revenue targets

### ✅ Compensation Plans
- **Create compensation plans** with base salary + commission structure
- **Plan types**: Commission Only, Salary + Commission, Bonus Based, Hybrid
- **Banded bonus thresholds** (e.g., 100% quota → 1.5x multiplier)
- **Product-specific weightings** (different rates per product)
- **Commission caps** to limit maximum earnings
- **Territory and user assignment**

### ✅ API Routes
- **GET/POST** `/api/sales-performance/territories`
- **PUT/DELETE** `/api/sales-performance/territories/:id`
- **GET/POST** `/api/sales-performance/quota-plans`
- **PUT/DELETE** `/api/sales-performance/quota-plans/:id`
- **POST** `/api/sales-performance/quota-plans/:id/approve`
- **GET** `/api/users` (for dropdowns)

### ✅ Security & Audit
- **Row Level Security (RLS)** on all tables
- **Role-based access control** (Rep, Manager, Admin)
- **Automatic audit logging** via triggers
- **Immutable audit trail** in `sales_performance_audit` table

---

## 🔧 Configuration Options

### Territory Configuration
```typescript
{
  name: string                    // Required
  description: string             // Optional
  region: string                  // Optional
  zip_codes: string[]            // Comma-separated in UI
  industry_codes: string[]       // Comma-separated in UI
  revenue_tier_min: number       // Optional
  revenue_tier_max: number       // Optional
  assigned_user_id: UUID         // Optional
  manager_id: UUID               // Optional
}
```

### Quota Plan Configuration
```typescript
{
  name: string                    // Required
  plan_type: 'annual' | 'quarterly' | 'monthly' | 'custom'
  start_date: Date                // Required
  end_date: Date                  // Required
  target_revenue: number          // Required
  target_deals: number            // Optional
  target_activities: number       // Optional
  planning_method: 'top_down' | 'bottom_up' | 'middle_out' | 'direct'
  planning_level: 'executive' | 'director' | 'manager' | 'team' | 'individual'
  parent_plan_id: UUID           // Optional (for hierarchy)
  territory_id: UUID             // Optional
  user_id: UUID                  // Optional
}
```

### Compensation Plan Configuration
```typescript
{
  name: string                    // Required
  plan_type: 'commission_only' | 'salary_plus_commission' | 'bonus_based' | 'hybrid'
  base_salary: number             // Optional
  commission_rate: number         // Percentage (e.g., 5.0 = 5%)
  commission_cap: number          // Optional max earnings
  bonus_thresholds: {             // Optional
    [quotaPercent: string]: multiplier
    // Example: { "100": 1.5, "120": 2.0 }
  }
  product_weightings: {           // Optional
    [productName: string]: rate
    // Example: { "Product A": 0.07, "Product B": 0.05 }
  }
  territory_id: UUID              // Optional
  user_id: UUID                   // Optional
}
```

---

## 🎨 UI Features

### Territory Management UI
- **Grid View**: Card-based layout showing all territory details
- **Table View**: Compact table for quick scanning
- **Color-coded Fairness**: 
  - 🟢 Green (≥80%): Excellent
  - 🟡 Yellow (≥60%): Good
  - 🔴 Red (<60%): Needs Attention
- **Status Badges**: Active/Inactive with visual indicators

### Quota Planning UI
- **Hierarchy View**: Visual tree showing parent-child relationships
- **List View**: All plans in flat list with filters
- **Planning Method Badges**: Color-coded (Top-Down=Blue, Bottom-Up=Green, etc.)
- **Level Icons**: 👔 Executive, 📊 Director, 🎯 Manager, 👥 Team, 👤 Individual
- **Progress Bars**: Time-based progress for active plans
- **Approval Status**: Pending/Approved with approver name

### Modal Features
- **Responsive Design**: Works on mobile, tablet, desktop
- **Validation**: Required field checking before submission
- **Error Handling**: Clear error messages on failure
- **Loading States**: Disabled buttons and spinners during save
- **Dynamic Fields**: Add/remove bonus thresholds and product weightings

---

## 🔍 How Hierarchical Planning Works

### Example: Top-Down Planning
1. **Executive sets company target**: $10M annual revenue
2. **Create Executive-level plan**: 
   - Planning Level: Executive
   - Planning Method: Top-Down
   - Target: $10M
3. **Create Director-level plan**:
   - Parent Plan: (Select Executive plan)
   - Planning Level: Director
   - Target: $2.5M (25% of parent)
4. **Create Manager-level plans**:
   - Parent Plan: (Select Director plan)
   - Planning Level: Manager
   - Targets cascade down automatically

### Example: Bottom-Up Planning
1. **Sales reps enter their targets**: Individual level
2. **Managers aggregate**: Sum of team targets
3. **Directors review**: Sum of manager targets
4. **Executives reconcile**: Compare bottom-up total to top-down goal
5. **Reconciliation**: Mark plans as reconciled when aligned

---

## 📊 Database Functions Available

### Calculate Territory Fairness
```sql
SELECT calculate_territory_fairness('territory-uuid');
-- Returns: 0.0 to 1.0 (fairness score)
```

### Calculate Expected Commission
```sql
SELECT calculate_expected_commission('user-uuid', 'quota-plan-uuid');
-- Returns: Projected commission based on current run-rate
```

### View Audit Trail
```sql
SELECT * FROM sales_performance_audit
WHERE entity_type = 'quota_plans'
AND entity_id = 'plan-uuid'
ORDER BY created_at DESC;
```

---

## ⚠️ Important Notes

### Data Validation
- **Dates**: End date must be after start date
- **Revenue Tiers**: Min must be less than Max
- **Hierarchical Plans**: Parent plan must exist before creating child
- **Approvals**: Only managers/admins can approve plans

### Cascading Deletes
- Deleting a territory will delete all related quota plans and compensation plans
- Deleting a parent quota plan will delete all child plans
- Audit logs are preserved even after deletion

### Performance Considerations
- Territory fairness index is calculated on-demand (not auto-updated)
- Consider running a nightly job to recalculate fairness for all territories
- Audit logs will grow over time - archive older records periodically

---

## 🐛 Troubleshooting

### Modal not appearing?
- Check browser console for errors
- Verify all modal dependencies are imported
- Ensure `isOpen` state is being toggled correctly

### Cannot create/edit records?
- Verify user has Manager or Admin role
- Check RLS policies in Supabase
- Ensure organization_id is set correctly

### Hierarchical planning not showing?
- Switch to "Hierarchy View" in Quota Planning
- Verify parent_plan_id is set correctly
- Ensure child plans have higher-level planning_level than parent

### Fairness index not showing?
- Run database migration to add fairness_index column
- Manually trigger calculation: `SELECT calculate_territory_fairness(id) FROM sales_territories;`
- Update territory to trigger recalculation

---

## 📈 Next Steps

### Recommended Implementation Order:
1. ✅ **DONE**: Database migration, modals, territory & quota management
2. **Daily Performance Tracking**: Build UI for daily sales tracking
3. **Commission Approval Workflow**: Build manager review interface
4. **Scenario Planning**: Build what-if analysis tool
5. **Payroll Export**: Build CSV/JSON export functionality
6. **CRM Integration**: Sync opportunity data for auto-tracking
7. **Alert System**: Email/in-app notifications for threshold alerts
8. **Advanced Analytics**: Build variance analysis and ML optimization

---

## 🎓 Training Guide for Users

### For Sales Reps:
1. View your assigned territory and quota plan
2. Track your performance against targets
3. See expected commission based on current performance

### For Managers:
1. Create and assign territories to your team
2. Set quota targets (individual or hierarchical)
3. Define compensation plans with bonus structures
4. Approve quota plans after reconciliation
5. Review team performance and adjust as needed

### For Admins:
1. Set executive-level targets (Top-Down)
2. Design territory fairness optimization
3. Create organization-wide compensation policies
4. Export payroll data
5. Review audit trails for compliance

---

## 📞 Support

If you encounter issues:
1. Check the `sales_performance_audit` table for error details
2. Review Supabase logs for API errors
3. Verify RLS policies are not blocking legitimate access
4. Ensure all migrations have been applied in order

---

**Built with**: Next.js 14, TypeScript, Supabase, TailwindCSS, shadcn/ui
**Last Updated**: October 2025
**Version**: 2.0.0 (Complete Rebuild)







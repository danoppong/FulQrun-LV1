# FulQrun Sales Operations Platform - AI Agent Guide

## Architecture Overview

This is a **Next.js 14 + Supabase** pharmaceutical sales operations platform implementing **MEDDPICC + PEAK** methodologies with enterprise-grade BI analytics and workflow automation. The app uses App Router with server components by default and follows clean architecture patterns.

### Key Technologies & Patterns
- **Next.js 14** with App Router (prefer server components, minimize `'use client'`)
- **Supabase** with Row Level Security (RLS) - critical for multi-tenant data isolation
- **TypeScript** with strict typing - use existing type definitions in `src/lib/types/`
- **Tailwind CSS** + **Radix UI** components (mobile-first approach)
- **React Hook Form + Zod** for validation
- **OpenAI/Anthropic** integration for conversational analytics
- **Pharmaceutical KPI Engine** for TRx, NRx, Market Share calculations

## Critical File Structure

```
src/
├── app/                     # Next.js App Router pages
│   ├── pharmaceutical-bi/   # BI dashboard main page
│   └── api/                 # API routes for KPIs, workflows
├── components/
│   ├── ui/                 # Reusable Radix UI components
│   ├── bi/                 # Pharmaceutical BI widgets & dashboards
│   ├── forms/              # Form components with validation
│   └── [feature]/          # Feature-specific components
├── lib/
│   ├── auth-unified.ts     # AuthService singleton - use this for all auth
│   ├── supabase-singleton.ts # Supabase client management
│   ├── meddpicc.ts         # MEDDPICC scoring logic & PEAK stages
│   ├── validation.ts       # Zod schemas
│   ├── ai/                 # AI insights engine & OpenAI client
│   ├── bi/                 # KPI engine, conversational analytics
│   ├── workflows/          # Workflow automation engine
│   ├── pharmaceutical-*    # Pharma-specific data services
│   └── services/           # Business logic services
└── middleware.ts           # Security headers + auth routing
```

## Essential Development Patterns

### 1. Authentication (Critical)
**Always use the unified auth service:**
```typescript
import { AuthService } from '@/lib/auth-unified'

// Client-side
const client = AuthService.getClient()
const user = await AuthService.getCurrentUser()

// Server-side  
const serverClient = AuthService.getServerClient()
```

### 2. Database Access with RLS
All database queries must respect Row Level Security:
- Users only see data from their `organization_id`
- Use the singleton Supabase clients from `@/lib/supabase-singleton`
- Test RLS policies in isolated environments first

### 3. MEDDPICC/PEAK Business Logic
Core sales methodology implementations:
- **MEDDPICC scoring**: Use `MEDDPICCScoringService` from `src/lib/services/meddpicc-scoring.ts`
- **PEAK stages**: Reference `src/lib/meddpicc.ts` for stage configurations
- **Opportunity tracking**: Opportunities table has embedded MEDDPICC fields

### 4. Component Conventions
- Use **kebab-case** for component files (`my-component.tsx`)
- Prefer **server components** - only add `'use client'` when necessary
- Wrap forms with `ConditionalLayout` for consistent auth handling
- Use existing UI components from `src/components/ui/`
- Follow accessibility patterns: `tabindex="0"`, `aria-label`, proper event handlers
- Use descriptive variable names with auxiliary verbs (`isLoading`, `hasError`)
- Prefer `const` over `function` declarations for components

## Critical Workflows

### Testing
```bash
npm test                    # Run Jest test suite
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```
**Memory constraints**: Tests use `--max-old-space-size=8192` due to large codebase

### Database Migrations
```bash
# Apply migrations (be careful with RLS changes)
npx supabase db push
```
**RLS Warning**: Many SQL migration files exist due to RLS complexity. Always test RLS changes in isolation.

### Development
```bash
npm run dev                # Start dev server
npm run build              # Production build
npm run lint               # ESLint checking
```

## Security Requirements

### 1. Input Validation
Always use Zod schemas from `src/lib/validation.ts`:
```typescript
import { validateRequest, emailSchema } from '@/lib/validation'
const data = validateRequest(emailSchema, input)
```

### 2. XSS Protection
- DOMPurify is configured for HTML sanitization
- CSP headers enforced in `middleware.ts`
- Never bypass validation or sanitization

### 3. Rate Limiting
Basic rate limiting available in `validation.ts`:
```typescript
import { checkRateLimit } from '@/lib/validation'
if (!checkRateLimit(userIP)) throw new Error('Rate limit exceeded')
```

## Database Schema Key Points

### Core Tables
- **user_profiles**: Role-based access (`rep`, `manager`, `admin`)
- **opportunities**: MEDDPICC fields embedded, PEAK stage tracking
- **organizations**: Multi-tenant isolation key
- **metric_templates**: KPI definitions with organization-specific RLS

### RLS Patterns
- All tables filter by `organization_id` or user role
- Complex RLS policies exist for metric templates and admin functions
- Recursive RLS issues have been resolved (see migration files)

## AI-Powered Intelligence

### Insights Engine
`src/lib/ai/insights-engine.ts` provides advanced analytics:
- **Lead Scoring**: Source, company size, industry, engagement analysis
- **Deal Risk Assessment**: MEDDPICC-based risk factors and mitigation strategies  
- **Next Action Recommendations**: Context-aware sales guidance
- **Forecasting**: Time series prediction with confidence intervals
- **Anomaly Detection**: Prescription spikes/drops with root cause analysis

```typescript
import { AIInsightsEngine } from '@/lib/ai/insights-engine'

const riskAssessment = await AIInsightsEngine.generateDealRiskAssessment(
  opportunityId, opportunityData, context
)
```

### OpenAI Integration
Conversational AI capabilities:
- Natural language KPI queries with voice input
- Automated insight generation from dashboard data
- Executive summary creation for presentations
- What-if scenario analysis for call frequency impact

## Performance Optimization Patterns

### Database Optimization
- **Supabase RPC**: Use stored procedures for complex KPI calculations
- **Caching**: KPI results cached with TTL for performance
- **Pagination**: Large datasets handled with cursor-based pagination
- **Indexes**: Pharmaceutical queries optimized with territory/product indexes

### Frontend Performance
- **React Server Components**: Minimize `'use client'` usage
- **Suspense Boundaries**: Wrap client components with fallbacks
- **Dynamic Loading**: Non-critical components loaded asynchronously
- **Mobile-First**: Touch-optimized UI for field sales teams

## Pharmaceutical BI & Analytics Engine

### Core KPI Calculations
The `src/lib/bi/kpi-engine.ts` implements pharmaceutical-specific metrics:
- **TRx (Total Prescriptions)**: Uses `calculate_trx` stored procedure
- **NRx (New Prescriptions)**: Uses `calculate_nrx` stored procedure  
- **Market Share**: Competitive positioning analysis
- **Call Effectiveness Index**: HCP engagement impact measurement
- **Sample-to-Script Ratio**: Distribution effectiveness tracking

```typescript
import { KPIEngine } from '@/lib/bi/kpi-engine'

const trx = await KPIEngine.calculateTRx({
  organizationId, productId, territoryId, 
  periodStart, periodEnd
})
```

### Conversational Analytics
Natural language query processing in `src/lib/bi/conversational-analytics.ts`:
- Query intent parsing with entity extraction
- KPI keyword mapping (`trx`, `nrx`, `market_share`, etc.)
- Territory and product recognition
- Timeframe parsing with seasonal adjustments
- AI-generated insights and recommendations

### Dashboard Architecture
Role-based pharmaceutical dashboards in `src/lib/pharmaceutical-dashboard-config.ts`:
- **Salesman**: TRx, NRx, Market Share, Product Performance
- **Sales Manager**: Team performance, Territory analysis, HCP engagement
- **Regional Director**: Multi-territory aggregation, Competitive analysis

## Workflow Automation Engine

### Trigger-Based Workflows
`src/lib/workflows/workflow-engine.ts` provides enterprise automation:
- **PEAK Stage Triggers**: Automatic progression based on MEDDPICC scores
- **Condition Evaluation**: Field-based rules with logical operators
- **Action Execution**: Email, task creation, field updates, webhook calls
- **Approval Processes**: Sequential/parallel approvals with escalation

```typescript
import { WorkflowEngine } from '@/lib/workflows/workflow-engine'

await WorkflowEngine.executeWorkflow(
  workflowId, 'opportunity', opportunityId, triggerData
)
```

### PEAK + MEDDPICC Integration
Workflow automation tied to sales methodology:
- Stage gate validation using MEDDPICC criteria
- Automatic next action recommendations
- Deal risk assessment triggers
- Compliance workflow enforcement

## Development Conventions (from Cursor Rules)

### Code Style & Structure
- Write concise, technical TypeScript with accurate examples
- Use functional and declarative programming patterns; avoid classes
- Prefer iteration and modularization over code duplication
- Use descriptive variable names with auxiliary verbs (`isLoading`, `hasError`)
- Structure files: exported component, subcomponents, helpers, static content, types

### Naming Conventions
- Use lowercase with dashes for directories (`components/auth-wizard`)
- Favor named exports for components
- Use "handle" prefix for event functions (`handleClick`, `handleKeyDown`)

### TypeScript Usage
- Use TypeScript for all code; prefer interfaces over types
- Avoid enums; use maps instead
- Use functional components with TypeScript interfaces

### UI & Styling Conventions
- Always use Tailwind classes for styling; avoid CSS or style tags
- Use `class:` instead of ternary operator in class tags when possible
- Implement accessibility features: `tabindex="0"`, `aria-label`, event handlers
- Use early returns for readability
- Mobile-first responsive design with Tailwind CSS

## Troubleshooting Quick Fixes

1. **Auth issues**: Check Supabase config in `src/lib/config.ts`
2. **RLS errors**: Verify organization_id context in queries
3. **Build errors**: Often related to client/server component boundaries
4. **Memory issues**: Tests may need memory flags, use existing npm scripts
5. **MEDDPICC scoring**: Use the unified service, avoid direct calculations

---

*This platform requires understanding of sales methodology (MEDDPICC/PEAK) for meaningful feature development. Reference business logic in `src/lib/meddpicc.ts` for scoring algorithms and stage definitions.*
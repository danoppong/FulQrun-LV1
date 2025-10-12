# FulQrun AI agent working notes (concise)

Big picture
- Next.js 15 (App Router, React 19) + Supabase with strict RLS; multi-tenant isolation by organization_id.
- Core domains: MEDDPICC/PEAK sales methodology, BI KPI engine, Workflow automation, AI insights.
- Server-first: prefer React Server Components; keep 'use client' minimal and isolated.

Where things live (examples)
- Auth: `src/lib/auth-unified.ts` (use AuthService.getClient/getServerClient); Supabase singleton: `src/lib/supabase-singleton.ts` (never instantiate clients ad hoc).
- MEDDPICC: `src/lib/meddpicc.ts` (config + scoring), unified service `src/lib/services/meddpicc-scoring.ts` used in `components/opportunities/OpportunityList.tsx`.
- KPIs: `src/lib/bi/kpi-engine.ts` uses Supabase RPC (calculate_trx, calculate_nrx, calculate_market_share) and local caching helpers.
- AI: `src/lib/ai/insights-engine.ts` orchestrates OpenAI via `openai-client.ts` and persists via `AIInsightsAPI`.
- Workflows: `src/lib/workflows/workflow-engine.ts` executes multi-step enterprise workflows against tables like workflow_executions and workflow_step_executions.

Data access and RLS
- Always get clients from AuthService or `getSupabaseBrowserClient()`; never create new Supabase clients.
- Include organization context in filters; all tables enforce RLS on organization_id.
- Avoid bypassing RLS with admin-like operations unless in vetted SQL migrations.

Component and UI conventions
- File names: kebab-case (`my-widget.tsx`); named exports preferred.
- Tailwind + Radix UI; mobile-first; accessibility via aria-* and keyboard handlers; early returns.
- Layout: `src/components/ConditionalLayout.tsx` wraps non-auth pages with app chrome; auth routes and `/` are unwrapped.

Patterns to follow (code-level)
- Auth (client): `const supabase = AuthService.getClient(); const user = await AuthService.getCurrentUser();`
- Auth (server): `const supabase = await AuthService.getServerClient();`
- KPI example: `await kpiEngine.calculateTRx({ organizationId, productId, territoryId, periodStart, periodEnd });`
- MEDDPICC example: `const { score } = await meddpiccScoringService.getOpportunityScore(opportunityId, opportunity);`

Developer workflows
- Dev/build/lint: `npm run dev`, `npm run build`, `npm run lint`.
- Tests: Jest uses large heap (8192 MB). Run `npm test` or the VS Code task “run jest targeted” (targets KPI and AI insight tests).
- Migrations: `npx supabase db push` (RLS-heavy repo; validate policies in isolation before merging).

Common pitfalls (watch-outs)
- Multiple Supabase clients (use the singleton); missing organization filters; computing MEDDPICC directly (use service); client/server boundary leaks; RPC names must match DB functions.

Useful file references
- Auth: `src/lib/auth-unified.ts`, Supabase: `src/lib/supabase-singleton.ts`.
- MEDDPICC service: `src/lib/services/meddpicc-scoring.ts` (exports `meddpiccScoringService`).
- KPIs: `src/lib/bi/kpi-engine.ts`.
- AI: `src/lib/ai/insights-engine.ts`.
- Validation/rate limits: `src/lib/validation.ts`.

Latest session highlights (2025-10-11)
- Route security: middleware route guards and SSR redirects are enforced for protected pages; keep this pattern when adding routes/APIs. Standardize Cache-Control headers for API responses.
- API hygiene: use `checkRateLimit` from `src/lib/validation.ts` for basic per-IP rate limiting on endpoints.
- Opportunities UI: Owner and Region quick filters added; owner names resolved via `user_profiles.full_name` (using `AuthService.getClient()`); region derived from `region || territory_name || territory`. MEDDPICC values come from `meddpiccScoringService` with fallback to stored score.
- Types: prefer `unknown`/`Record<string, unknown>` over `any`. Minimal Supabase typings for workflow tables (`enterprise_workflows`, `workflow_executions`, `workflow_step_executions`) are pending and should be added when editing workflow modules.

Note: Keep new features server-first, RLS-safe, and integrated with the above services. Prefer existing services over re-implementing logic.

Quick pattern snippets
- RLS-safe auth + query (client):
	- Get client from AuthService; always filter by organization_id
	- Example:
		- `const supabase = AuthService.getClient();`
		- `const { data } = await supabase.from('opportunities').select('*').eq('organization_id', orgId).limit(20);`
- KPI RPC call:
	- `const res = await kpiEngine.calculateTRx({ organizationId: orgId, productId, territoryId, periodStart, periodEnd });`
- MEDDPICC score usage:
	- `const { score } = await meddpiccScoringService.getOpportunityScore(opportunity.id, opportunity);`
- Currency formatting (standardized):
	- Use `formatCurrencySafe` from `src/lib/format.ts` for all currency displays; it’s NaN-safe and supports `{ compact: true }`.
	- Example: `const fmt = (v: unknown) => formatCurrencySafe(v)`; `fmt(total)`, `fmt(count > 0 ? total / count : 0)`; chart formatters: `tickFormatter={(v) => fmt(v)}`.
	- Avoid re-implementing `Intl.NumberFormat` in components.
- Suspense-wrapped client component:
	- Server comp fetches; client comp only for interactivity
	- Example structure:
		- Server: fetch data and render `<Suspense fallback={...}><ClientPart data={data}/></Suspense>`
		- Client: `'use client'` with minimal state/effects
	- Protected route SSR redirect (server):
		- In a server component or route handler, require auth and redirect if needed
		- `const supabase = await AuthService.getServerClient();`
		- `const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/auth/sign-in');`
	- Middleware guard (edge):
		- Use `AuthService.getMiddlewareClient(req)` to read/propagate cookies and gate routes
		- Standardize response headers: Cache-Control per endpoint sensitivity
	- API scaffold with rate limit + validation:
		- `import { checkRateLimit, validateRequest, analyticsDashboardSchema } from '@/lib/validation'`
		- `if (!checkRateLimit(req.ip)) return NextResponse.json({ error: 'Rate limit' }, { status: 429 });`
		- `const { organizationId, startDate, endDate } = validateRequest(analyticsDashboardSchema, await req.json());`
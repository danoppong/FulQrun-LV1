# FulQrun MVP Setup Instructions

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- (Optional) Microsoft Azure account for Graph integration

## Environment Setup

1. Copy the environment variables template:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Database Setup

1. Run the database migration in your Supabase project:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Execute the migration

2. Enable Row Level Security (RLS) policies are already included in the migration

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features Implemented

### Phase 1: Foundation ✅
- ✅ Supabase database schema with all required tables
- ✅ Authentication system with email/password and Microsoft SSO
- ✅ Row-level security for multi-tenancy
- ✅ Basic UI components and layout

### Phase 2A: Core CRM Modules ✅
- ✅ Contact management (CRUD operations)
- ✅ Company management (CRUD operations)
- ✅ Search and filtering capabilities
- ✅ Responsive design

### Phase 2B: Integrations (In Progress)
- 🔄 Microsoft Graph integration (stubbed)
- 🔄 QuickBooks integration (stubbed)
- 🔄 Analytics dashboard

### Phase 3: Advanced Features (Pending)
- ⏳ Lead management with scoring
- ⏳ Opportunity management with PEAK stages
- ⏳ MEDDPICC qualification tracking
- ⏳ Role-based dashboards

## Next Steps

1. Set up your Supabase project and run the migration
2. Configure environment variables
3. Test the authentication flow
4. Add sample data through the UI
5. Continue with lead and opportunity management features

## Architecture

- **Frontend**: Next.js 15 with App Router, TailwindCSS, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: TailwindCSS with custom components
- **State Management**: React Context + Server Components
- **Forms**: React Hook Form with Zod validation (planned)

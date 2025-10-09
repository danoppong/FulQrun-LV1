-- Create table for user dashboard layouts
create extension if not exists pgcrypto;

create table if not exists public.user_dashboard_layouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null default 'My Dashboard',
  layout_json jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists user_dashboard_layouts_user_id_key on public.user_dashboard_layouts(user_id);
create index if not exists user_dashboard_layouts_org_idx on public.user_dashboard_layouts(organization_id);

alter table public.user_dashboard_layouts enable row level security;

-- Policies: users can manage their own layout
drop policy if exists "Users can select own layout" on public.user_dashboard_layouts;
create policy "Users can select own layout"
  on public.user_dashboard_layouts for select
  using (auth.uid() = user_id);

drop policy if exists "Users can upsert own layout" on public.user_dashboard_layouts;
create policy "Users can upsert own layout"
  on public.user_dashboard_layouts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own layout" on public.user_dashboard_layouts;
create policy "Users can update own layout"
  on public.user_dashboard_layouts for update
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- VestIQ Supabase Schema — run this ONCE in the Supabase SQL Editor
-- Project: https://lacrkmmarfhpfvsojvme.supabase.co
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. profiles table ─────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  full_name     text,
  email         text,
  pan           text,
  plan                      text default 'free',
  trial_ends_at             timestamptz,
  monthly_expenses_estimate numeric,
  created_at                timestamptz default now()
);

-- Ensure columns exist if table was already created
alter table public.profiles add column if not exists plan text default 'free';
alter table public.profiles add column if not exists trial_ends_at timestamptz;
alter table public.profiles add column if not exists monthly_expenses_estimate numeric;

-- ── 2. RLS on profiles ────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Drop old policies before re-creating to avoid "already exists" errors
drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow users to insert their own row (needed for backfill upsert from client)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ── 3. Auto-profile trigger on signup ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email
  )
  on conflict (id) do update
  set full_name = coalesce(
        excluded.full_name,
        public.profiles.full_name  -- don't overwrite an existing name with NULL
      ),
      email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 4. Backfill profiles for ALL existing auth users ─────────────────────────
-- This handles accounts created before the trigger existed.
insert into public.profiles (id, full_name, email)
select
  u.id,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  u.email
from auth.users u
on conflict (id) do update
  set full_name = coalesce(
        excluded.full_name,
        public.profiles.full_name
      ),
      email = excluded.email;

-- ── 5. cas_upload_audit table ─────────────────────────────────────────────────
create table if not exists public.cas_upload_audit (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users on delete cascade not null,
  created_at   timestamptz default now(),
  parsed_name  text,
  profile_name text,
  similarity   float,
  profile_pan  text,
  parsed_pan   text,
  outcome      text,
  details      jsonb
);

-- ── 6. RLS on cas_upload_audit ────────────────────────────────────────────────
alter table public.cas_upload_audit enable row level security;

drop policy if exists "Users can view own audit rows"   on public.cas_upload_audit;
drop policy if exists "Users can insert own audit rows" on public.cas_upload_audit;
drop policy if exists "Users can delete own audit rows" on public.cas_upload_audit;

create policy "Users can view own audit rows"
  on public.cas_upload_audit for select
  using (auth.uid() = user_id);

create policy "Users can insert own audit rows"
  on public.cas_upload_audit for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own audit rows"
  on public.cas_upload_audit for delete
  using (auth.uid() = user_id);

-- ── 7. scoring_thresholds table ───────────────────────────────────────────────
create table if not exists public.scoring_thresholds (
  key         text primary key,
  value       numeric not null,
  updated_by  uuid references auth.users(id),
  updated_at  timestamptz default now()
);

alter table public.scoring_thresholds enable row level security;

drop policy if exists "Anyone authenticated can view scoring thresholds" on public.scoring_thresholds;
drop policy if exists "Admins can update scoring thresholds" on public.scoring_thresholds;
drop policy if exists "Admins can manage scoring thresholds" on public.scoring_thresholds;

create policy "Anyone authenticated can view scoring thresholds"
  on public.scoring_thresholds for select
  using (true);

create policy "Admins can manage scoring thresholds"
  on public.scoring_thresholds for insert
  to authenticated
  with check (
    coalesce((auth.jwt()->'app_metadata'->>'role'), (auth.jwt()->'user_metadata'->>'role')) = 'admin'
  );

create policy "Admins can update scoring thresholds"
  on public.scoring_thresholds for update
  to authenticated
  using (
    coalesce((auth.jwt()->'app_metadata'->>'role'), (auth.jwt()->'user_metadata'->>'role')) = 'admin'
  )
  with check (
    coalesce((auth.jwt()->'app_metadata'->>'role'), (auth.jwt()->'user_metadata'->>'role')) = 'admin'
  );

-- Seed default threshold rows if missing
insert into public.scoring_thresholds (key, value)
values
  ('concentrationThresholdPct', 25),
  ('reitInvitMaxPct', 35),
  ('lockinHorizonMonths', 18),
  ('fixedIncomeMinPct', 20),
  ('concentrationPenalty', 12),
  ('liquidityPenalty', 10),
  ('volatilityPenalty', 8),
  ('diversificationPenalty', 6),
  ('behaviorBonus', 8),
  ('CONCENTRATION_THRESHOLD_PCT', 25),
  ('CONCENTRATION_FACTOR', 0.8),
  ('CONCENTRATION_SINGLE_MAX_PENALTY', 20),
  ('CONCENTRATION_TOTAL_MAX_PENALTY', 25),
  ('VOLATILITY_THRESHOLD_PCT', 50),
  ('VOLATILITY_FACTOR', 0.5),
  ('VOLATILITY_MAX_PENALTY', 15),
  ('LIQUIDITY_MAX_PENALTY', 30),
  ('POSITIVE_BEHAVIOR_BONUS', 8)
on conflict (key) do nothing;

-- ── 8. broker_leads table ───────────────────────────────────────────────────
create table if not exists public.broker_leads (
  id                uuid default gen_random_uuid() primary key,
  institution_name  text not null,
  work_email        text not null,
  submitted_at      timestamptz default now()
);

alter table public.broker_leads enable row level security;

drop policy if exists "Anyone can insert broker leads" on public.broker_leads;
drop policy if exists "Admins can view broker leads" on public.broker_leads;

create policy "Anyone can insert broker leads"
  on public.broker_leads for insert
  with check (true);

create policy "Admins can view broker leads"
  on public.broker_leads for select
  to authenticated
  using (
    coalesce((auth.jwt()->'app_metadata'->>'role'), (auth.jwt()->'user_metadata'->>'role')) = 'admin'
  );

-- ── 9. user_portfolios table & RLS policies ──────────────────────────────
create table if not exists public.user_portfolios (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users on delete cascade not null unique,
  holdings      jsonb not null default '[]'::jsonb,
  red_flags     jsonb not null default '[]'::jsonb,
  total_value   numeric default 0,
  updated_at    timestamptz default now()
);

alter table public.user_portfolios enable row level security;

drop policy if exists "Users can view own portfolio"   on public.user_portfolios;
drop policy if exists "Users can insert own portfolio" on public.user_portfolios;
drop policy if exists "Users can update own portfolio" on public.user_portfolios;
drop policy if exists "Users can delete own portfolio" on public.user_portfolios;

create policy "Users can view own portfolio"
  on public.user_portfolios for select
  using (auth.uid() = user_id);

create policy "Users can insert own portfolio"
  on public.user_portfolios for insert
  with check (auth.uid() = user_id);

create policy "Users can update own portfolio"
  on public.user_portfolios for update
  using (auth.uid() = user_id);

create policy "Users can delete own portfolio"
  on public.user_portfolios for delete
  using (auth.uid() = user_id);

-- ── 10. whitelisted_brokers table for Enterprise deployments ──────────────────
create table if not exists public.whitelisted_brokers (
  id                uuid default gen_random_uuid() primary key,
  org_name          text not null,
  integration_type  text not null default 'VestIQ API v3',
  sebi_reg_number   text,
  contact_email     text,
  status            text not null default 'active' check (status in ('active', 'revoked')),
  onboarded_at      timestamptz default now(),
  onboarded_by      uuid references auth.users(id),
  revoked_at        timestamptz,
  revoked_by        uuid references auth.users(id),
  updated_at        timestamptz default now()
);

alter table public.whitelisted_brokers add column if not exists sebi_reg_number text;
alter table public.whitelisted_brokers add column if not exists contact_email text;

alter table public.whitelisted_brokers enable row level security;

drop policy if exists "Anyone authenticated can view whitelisted brokers" on public.whitelisted_brokers;
drop policy if exists "Admins can view whitelisted brokers" on public.whitelisted_brokers;
drop policy if exists "Admins can manage whitelisted brokers" on public.whitelisted_brokers;
drop policy if exists "Admins can update whitelisted brokers" on public.whitelisted_brokers;

create policy "Admins can view whitelisted brokers"
  on public.whitelisted_brokers for select
  to authenticated
  using (
    coalesce((auth.jwt()->'app_metadata'->>'role'), (auth.jwt()->'user_metadata'->>'role')) = 'admin'
  );

create policy "Admins can manage whitelisted brokers"
  on public.whitelisted_brokers for insert
  to authenticated
  with check (
    coalesce((auth.jwt()->'app_metadata'->>'role'), (auth.jwt()->'user_metadata'->>'role')) = 'admin'
  );

create policy "Admins can update whitelisted brokers"
  on public.whitelisted_brokers for update
  to authenticated
  using (
    coalesce((auth.jwt()->'app_metadata'->>'role'), (auth.jwt()->'user_metadata'->>'role')) = 'admin'
  )
  with check (
    coalesce((auth.jwt()->'app_metadata'->>'role'), (auth.jwt()->'user_metadata'->>'role')) = 'admin'
  );

-- Seed initial broker data
insert into public.whitelisted_brokers (org_name, integration_type, onboarded_at, status)
values
  ('Zerodha Broking Ltd', 'VestIQ API v3', '2026-01-15T00:00:00Z', 'active'),
  ('Groww (Nextbillion Technology)', 'VestIQ API v3', '2026-02-20T00:00:00Z', 'active'),
  ('ICICI Securities', 'VestIQ API v3', '2026-03-10T00:00:00Z', 'active'),
  ('RBI Retail Direct Portal', 'G-Sec API Sync', '2026-05-01T00:00:00Z', 'active')
on conflict do nothing;

-- ── 11. audit_log table for admin actions and whitelisting events ──────────────
create table if not exists public.audit_log (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id),
  action        text not null,
  entity_type   text not null default 'system',
  entity_id     text,
  entity_name   text,
  metadata      jsonb default '{}'::jsonb,
  created_at    timestamptz default now()
);

alter table public.audit_log enable row level security;

drop policy if exists "Anyone authenticated can view audit log" on public.audit_log;
drop policy if exists "Service role can insert audit log" on public.audit_log;
drop policy if exists "Users can create audit log" on public.audit_log;
drop policy if exists "Admins can manage audit log" on public.audit_log;

create policy "Anyone authenticated can view audit log"
  on public.audit_log for select
  to authenticated
  using (true);

-- ── 12. household_links table & RLS policies ───────────────────────────────────
create table if not exists public.household_links (
  id                  uuid default gen_random_uuid() primary key,
  user_id_a           uuid references auth.users(id) on delete cascade not null,
  user_id_b           uuid references auth.users(id) on delete cascade not null,
  status              text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  requested_by        uuid references auth.users(id) on delete cascade not null,
  partner_email       text,
  partner_name        text,
  share_details_a     boolean default false,
  share_details_b     boolean default false,
  requested_at        timestamptz default now(),
  accepted_at         timestamptz,
  updated_at          timestamptz default now(),
  constraint different_users check (user_id_a <> user_id_b)
);

alter table public.household_links enable row level security;

drop policy if exists "Users can view own household links" on public.household_links;
drop policy if exists "Users can create household links" on public.household_links;
drop policy if exists "Users can update own household links" on public.household_links;
drop policy if exists "Users can delete own household links" on public.household_links;

create policy "Users can view own household links"
  on public.household_links for select
  using (auth.uid() = user_id_a or auth.uid() = user_id_b);

create policy "Users can create household links"
  on public.household_links for insert
  with check (auth.uid() = requested_by and (auth.uid() = user_id_a or auth.uid() = user_id_b));

create policy "Users can update own household links"
  on public.household_links for update
  using (auth.uid() = user_id_a or auth.uid() = user_id_b);

create policy "Users can delete own household links"
  on public.household_links for delete
  using (auth.uid() = user_id_a or auth.uid() = user_id_b);

-- ── 13. upcoming_issues table for IPO/NFO Suitability Screener ─────────────────
create table if not exists public.upcoming_issues (
  id                  uuid default gen_random_uuid() primary key,
  name                text not null,
  ticker              text,
  issue_type          text not null check (issue_type in ('IPO', 'NFO', 'FPO')),
  asset_class         text not null check (asset_class in ('equities', 'bonds', 'reits_invits', 'mutual_funds')),
  sector              text not null,
  risk_category       text not null check (risk_category in ('Low', 'Low to Moderate', 'Moderate', 'Moderately High', 'High', 'Very High')),
  lock_in_months      integer not null default 0,
  price_range         text,
  min_investment      numeric default 15000,
  bidding_dates       text,
  description         text,
  created_at          timestamptz default now()
);

alter table public.upcoming_issues enable row level security;

drop policy if exists "Anyone authenticated can view upcoming issues" on public.upcoming_issues;
drop policy if exists "Admins can manage upcoming issues" on public.upcoming_issues;

create policy "Anyone authenticated can view upcoming issues"
  on public.upcoming_issues for select
  using (true);

create policy "Admins can manage upcoming issues"
  on public.upcoming_issues for all
  to authenticated
  using (
    coalesce((auth.jwt()->'app_metadata'->>'role'), (auth.jwt()->'user_metadata'->>'role')) = 'admin'
  );

-- Seed default upcoming IPOs and NFOs
insert into public.upcoming_issues (name, ticker, issue_type, asset_class, sector, risk_category, lock_in_months, price_range, min_investment, bidding_dates, description)
values
  ('Brookfield Real Estate Income Trust NFO', 'BROOKFIELD-REIT', 'NFO', 'reits_invits', 'Real Estate & REITs', 'High', 0, '₹100 - ₹105', 15000, 'Sep 10 – Sep 14, 2026', 'Institutional Grade-A commercial office space portfolio with quarterly rental dividend distributions.'),
  ('NTPC Green Energy Ltd IPO', 'NTPCGREEN', 'IPO', 'equities', 'Renewable Energy & Utilities', 'Moderate', 0, '₹102 - ₹108', 14850, 'Sep 18 – Sep 22, 2026', 'PSU-backed renewable solar and wind power generation utility with long-term 25-year PPAs.'),
  ('SBI Sovereign Target Maturity G-Sec NFO 2034', 'SBIGSEC2034', 'NFO', 'bonds', 'Government Sovereign Bonds', 'Low', 0, '₹10 NAV Par', 5000, 'Sep 05 – Sep 19, 2026', 'Zero-credit risk sovereign debt fund targeting 2034 government security yields with indexation benefits.'),
  ('Swiggy Ltd IPO', 'SWIGGY', 'IPO', 'equities', 'Consumer Tech & Platform', 'Very High', 0, '₹375 - ₹390', 14820, 'Sep 25 – Sep 29, 2026', 'Hyperlocal on-demand convenience and quick-commerce platform expanding dark store network.'),
  ('Bharat Highways InvIT NFO', 'BHARATHWY', 'NFO', 'reits_invits', 'Infrastructure & InvITs', 'High', 36, '₹98 - ₹100', 25000, 'Oct 02 – Oct 06, 2026', 'HAM road asset portfolio offering toll and annuity cash flows with a 3-year initial lock-in window.')
on conflict do nothing;

-- ── 14. Broker / RM Credentials & SEBI Registration Number columns ───────────
alter table if exists public.user_portfolios
  add column if not exists broker_reg_number text,
  add column if not exists rm_name text;

alter table if exists public.audit_logs
  add column if not exists broker_reg_number text;

-- ── 15. Dividend & Coupon Payout Calendar columns ────────────────────────────
alter table if exists public.user_portfolios
  add column if not exists next_payout_date date,
  add column if not exists payout_type text check (payout_type in ('dividend', 'coupon', 'distribution')),
  add column if not exists estimated_payout_amount numeric;





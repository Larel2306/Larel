-- LAREL Admin professional modules
-- Run this script in Supabase SQL Editor. It does not create stock or Qikink automation.
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  category text not null,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  min_order_value numeric(12,2) not null default 0,
  max_discount numeric(12,2),
  usage_limit integer,
  usage_count integer not null default 0,
  starts_at timestamptz,
  expires_at date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.expenses enable row level security;
alter table public.coupons enable row level security;
drop policy if exists "LAREL admins manage expenses" on public.expenses;
create policy "LAREL admins manage expenses" on public.expenses
for all to authenticated using (public.is_larel_admin()) with check (public.is_larel_admin());
drop policy if exists "LAREL admins manage coupons" on public.coupons;
create policy "LAREL admins manage coupons" on public.coupons
for all to authenticated using (public.is_larel_admin()) with check (public.is_larel_admin());

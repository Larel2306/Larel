-- LAREL product cost / profit support
-- Run this once in Supabase Dashboard -> SQL Editor -> New query.
alter table public.products
  add column if not exists cost_price numeric(12,2) not null default 0;

comment on column public.products.cost_price is
  'Per-unit product base cost used by LAREL admin to estimate selling price and gross product profit before shipping, ads, taxes and payment fees.';

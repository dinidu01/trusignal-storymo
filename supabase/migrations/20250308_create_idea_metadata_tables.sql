create extension if not exists "pgcrypto";

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_text text not null,
  target_audience text,
  problem_solved text,
  research_data jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ideas_user_id_idx on public.ideas(user_id);

create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  selected_domain text,
  netlify_site_id text,
  preview_storage_path text,
  published_storage_path text,
  published_url text,
  template_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists landing_pages_user_id_idx on public.landing_pages(user_id);
create index if not exists landing_pages_idea_id_idx on public.landing_pages(idea_id);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  status text not null default 'queued',
  meta_campaign_id text,
  meta_payload jsonb not null default '{}'::jsonb,
  meta_ad_campaign_metadata jsonb not null default '{}'::jsonb,
  meta_response jsonb not null default '{}'::jsonb,
  creative_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ad_campaigns_user_id_idx on public.ad_campaigns(user_id);
create index if not exists ad_campaigns_idea_id_idx on public.ad_campaigns(idea_id);

alter table public.ideas enable row level security;
alter table public.landing_pages enable row level security;
alter table public.ad_campaigns enable row level security;

create policy "Ideas are owned by user" on public.ideas
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Landing pages are owned by user" on public.landing_pages
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Ad campaigns are owned by user" on public.ad_campaigns
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

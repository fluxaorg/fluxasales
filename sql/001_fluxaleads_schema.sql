-- Fluxa Leads — schema completo (tabelas, índices, RLS)
-- Reconstruído a partir do código da aplicação. Idempotente: pode rodar mais de uma vez.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Tabelas
-- ─────────────────────────────────────────────────────────────

create table if not exists public.fluxaleads_organizations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  slug          text not null unique,
  meta_pixel_id text,
  created_at    timestamptz not null default now()
);
create unique index if not exists fluxaleads_organizations_user_id_key on public.fluxaleads_organizations(user_id);

create table if not exists public.fluxaleads_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null unique references public.fluxaleads_organizations(id) on delete cascade,
  plan       text not null default 'TRIAL' check (plan in ('TRIAL','BASIC','PRO','ELITE')),
  status     text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fluxaleads_funnels (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.fluxaleads_organizations(id) on delete cascade,
  name         text not null,
  slug         text not null unique,
  status       text not null default 'draft' check (status in ('draft','published')),
  theme        jsonb,
  published_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists fluxaleads_funnels_org_id_idx on public.fluxaleads_funnels(org_id);

create table if not exists public.fluxaleads_funnel_collaborators (
  id         uuid primary key default gen_random_uuid(),
  funnel_id  uuid not null references public.fluxaleads_funnels(id) on delete cascade,
  user_email text not null,
  created_at timestamptz not null default now(),
  unique (funnel_id, user_email)
);
create index if not exists fluxaleads_funnel_collaborators_email_idx on public.fluxaleads_funnel_collaborators(lower(user_email));

create table if not exists public.fluxaleads_pages (
  id         uuid primary key default gen_random_uuid(),
  funnel_id  uuid not null references public.fluxaleads_funnels(id) on delete cascade,
  name       text not null,
  page_order int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists fluxaleads_pages_funnel_id_idx on public.fluxaleads_pages(funnel_id);

create table if not exists public.fluxaleads_components (
  id              uuid primary key default gen_random_uuid(),
  page_id         uuid not null references public.fluxaleads_pages(id) on delete cascade,
  type            text not null check (type in ('HEADING','TEXT','INPUT','QUESTION','BUTTON')),
  content         jsonb not null default '{}'::jsonb,
  component_order int  not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists fluxaleads_components_page_id_idx on public.fluxaleads_components(page_id);

create table if not exists public.fluxaleads_leads (
  id            uuid primary key default gen_random_uuid(),
  funnel_id     uuid not null references public.fluxaleads_funnels(id) on delete cascade,
  org_id        uuid not null references public.fluxaleads_organizations(id) on delete cascade,
  email         text,
  name          text,
  phone         text,
  custom_fields jsonb not null default '{}'::jsonb,
  source        text,
  ip_hash       text,
  created_at    timestamptz not null default now()
);
create index if not exists fluxaleads_leads_org_created_idx on public.fluxaleads_leads(org_id, created_at desc);
create index if not exists fluxaleads_leads_funnel_id_idx on public.fluxaleads_leads(funnel_id);

create table if not exists public.fluxaleads_team_members (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.fluxaleads_organizations(id) on delete cascade,
  email      text not null,
  role       text not null default 'member',
  created_at timestamptz not null default now(),
  unique (org_id, email)
);

create table if not exists public.fluxaleads_webhooks (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.fluxaleads_organizations(id) on delete cascade,
  url        text not null,
  event_type text not null default 'lead_created',
  active     boolean not null default true,
  secret     text not null,
  created_at timestamptz not null default now()
);
create index if not exists fluxaleads_webhooks_org_id_idx on public.fluxaleads_webhooks(org_id);

-- ─────────────────────────────────────────────────────────────
-- Funções auxiliares (security definer evita recursão entre políticas)
-- ─────────────────────────────────────────────────────────────

create or replace function public.fluxaleads_is_org_owner(p_org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from fluxaleads_organizations where id = p_org_id and user_id = auth.uid());
$$;

create or replace function public.fluxaleads_can_edit_funnel(p_funnel_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from fluxaleads_funnels f
    join fluxaleads_organizations o on o.id = f.org_id
    where f.id = p_funnel_id and o.user_id = auth.uid()
  ) or exists (
    select 1 from fluxaleads_funnel_collaborators c
    where c.funnel_id = p_funnel_id and lower(c.user_email) = lower(auth.jwt() ->> 'email')
  );
$$;

create or replace function public.fluxaleads_is_funnel_published(p_funnel_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from fluxaleads_funnels where id = p_funnel_id and status = 'published');
$$;

create or replace function public.fluxaleads_page_funnel(p_page_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select funnel_id from fluxaleads_pages where id = p_page_id;
$$;

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────

alter table public.fluxaleads_organizations        enable row level security;
alter table public.fluxaleads_subscriptions        enable row level security;
alter table public.fluxaleads_funnels              enable row level security;
alter table public.fluxaleads_funnel_collaborators enable row level security;
alter table public.fluxaleads_pages                enable row level security;
alter table public.fluxaleads_components           enable row level security;
alter table public.fluxaleads_leads                enable row level security;
alter table public.fluxaleads_team_members         enable row level security;
alter table public.fluxaleads_webhooks             enable row level security;

-- organizations: só o dono acessa. A página pública lê o meta_pixel_id no servidor (service role),
-- então visitantes não precisam — nem devem — ler esta tabela (ela guarda o user_id do dono).
drop policy if exists fluxaleads_org_owner on public.fluxaleads_organizations;
create policy fluxaleads_org_owner on public.fluxaleads_organizations
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists fluxaleads_org_public on public.fluxaleads_organizations;

-- subscriptions: só leitura pelo dono (escrita via service role / Stripe)
drop policy if exists fluxaleads_sub_owner_read on public.fluxaleads_subscriptions;
create policy fluxaleads_sub_owner_read on public.fluxaleads_subscriptions
  for select to authenticated using (public.fluxaleads_is_org_owner(org_id));

-- funnels
drop policy if exists fluxaleads_funnel_owner on public.fluxaleads_funnels;
create policy fluxaleads_funnel_owner on public.fluxaleads_funnels
  for all to authenticated using (public.fluxaleads_is_org_owner(org_id)) with check (public.fluxaleads_is_org_owner(org_id));
drop policy if exists fluxaleads_funnel_collab_read on public.fluxaleads_funnels;
create policy fluxaleads_funnel_collab_read on public.fluxaleads_funnels
  for select to authenticated using (public.fluxaleads_can_edit_funnel(id));
drop policy if exists fluxaleads_funnel_collab_update on public.fluxaleads_funnels;
create policy fluxaleads_funnel_collab_update on public.fluxaleads_funnels
  for update to authenticated using (public.fluxaleads_can_edit_funnel(id)) with check (public.fluxaleads_can_edit_funnel(id));
drop policy if exists fluxaleads_funnel_public on public.fluxaleads_funnels;
create policy fluxaleads_funnel_public on public.fluxaleads_funnels
  for select to anon, authenticated using (status = 'published');

-- collaborators: dono do funil gerencia; colaborador vê os próprios convites
drop policy if exists fluxaleads_collab_owner on public.fluxaleads_funnel_collaborators;
create policy fluxaleads_collab_owner on public.fluxaleads_funnel_collaborators
  for all to authenticated
  using (exists (select 1 from public.fluxaleads_funnels f where f.id = funnel_id and public.fluxaleads_is_org_owner(f.org_id)))
  with check (exists (select 1 from public.fluxaleads_funnels f where f.id = funnel_id and public.fluxaleads_is_org_owner(f.org_id)));
drop policy if exists fluxaleads_collab_self on public.fluxaleads_funnel_collaborators;
create policy fluxaleads_collab_self on public.fluxaleads_funnel_collaborators
  for select to authenticated using (lower(user_email) = lower(auth.jwt() ->> 'email'));

-- pages
drop policy if exists fluxaleads_page_edit on public.fluxaleads_pages;
create policy fluxaleads_page_edit on public.fluxaleads_pages
  for all to authenticated using (public.fluxaleads_can_edit_funnel(funnel_id)) with check (public.fluxaleads_can_edit_funnel(funnel_id));
drop policy if exists fluxaleads_page_public on public.fluxaleads_pages;
create policy fluxaleads_page_public on public.fluxaleads_pages
  for select to anon, authenticated using (public.fluxaleads_is_funnel_published(funnel_id));

-- components
drop policy if exists fluxaleads_component_edit on public.fluxaleads_components;
create policy fluxaleads_component_edit on public.fluxaleads_components
  for all to authenticated
  using (public.fluxaleads_can_edit_funnel(public.fluxaleads_page_funnel(page_id)))
  with check (public.fluxaleads_can_edit_funnel(public.fluxaleads_page_funnel(page_id)));
drop policy if exists fluxaleads_component_public on public.fluxaleads_components;
create policy fluxaleads_component_public on public.fluxaleads_components
  for select to anon, authenticated using (public.fluxaleads_is_funnel_published(public.fluxaleads_page_funnel(page_id)));

-- leads: dono lê/exclui; inserção só via API (service role)
drop policy if exists fluxaleads_lead_owner_read on public.fluxaleads_leads;
create policy fluxaleads_lead_owner_read on public.fluxaleads_leads
  for select to authenticated using (public.fluxaleads_is_org_owner(org_id));
drop policy if exists fluxaleads_lead_owner_delete on public.fluxaleads_leads;
create policy fluxaleads_lead_owner_delete on public.fluxaleads_leads
  for delete to authenticated using (public.fluxaleads_is_org_owner(org_id));

-- team members
drop policy if exists fluxaleads_team_owner on public.fluxaleads_team_members;
create policy fluxaleads_team_owner on public.fluxaleads_team_members
  for all to authenticated using (public.fluxaleads_is_org_owner(org_id)) with check (public.fluxaleads_is_org_owner(org_id));

-- webhooks
drop policy if exists fluxaleads_webhook_owner on public.fluxaleads_webhooks;
create policy fluxaleads_webhook_owner on public.fluxaleads_webhooks
  for all to authenticated using (public.fluxaleads_is_org_owner(org_id)) with check (public.fluxaleads_is_org_owner(org_id));

notify pgrst, 'reload schema';

create extension if not exists pgcrypto;

create table if not exists public.hackathons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null,
  description text,
  location text,
  modality text not null default 'hybrid' check (modality in ('online', 'in_person', 'hybrid')),
  status text not null default 'draft' check (status in ('draft', 'published', 'closed', 'archived')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  registration_deadline timestamptz,
  max_team_size integer not null default 5 check (max_team_size between 1 and 10),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (registration_deadline is null or registration_deadline <= starts_at)
);

create table if not exists public.hackathon_registrations (
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (hackathon_id, user_id)
);

drop trigger if exists hackathons_set_updated_at on public.hackathons;
create trigger hackathons_set_updated_at
before update on public.hackathons
for each row execute function private.set_updated_at();

drop trigger if exists hackathon_registrations_set_updated_at on public.hackathon_registrations;
create trigger hackathon_registrations_set_updated_at
before update on public.hackathon_registrations
for each row execute function private.set_updated_at();

create or replace function private.is_registered_for_hackathon(target_hackathon_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.hackathon_registrations hr
    where hr.hackathon_id = target_hackathon_id
      and hr.user_id = (select auth.uid())
  );
$$;

insert into public.hackathons (
  title,
  slug,
  summary,
  description,
  location,
  modality,
  status,
  starts_at,
  ends_at,
  registration_deadline,
  max_team_size
)
values (
  'Reto LIMA CERTUS 2026',
  'reto-lima-certus-2026',
  'Hackaton academico para validar la gestion de participantes, equipos y entregables dentro de LIMA.',
  'Esta semilla permite probar el flujo inicial: publicar un hackaton, inscribirse y preparar la siguiente escala de equipos.',
  'Campus CERTUS',
  'hybrid',
  'published',
  '2026-08-08 09:00:00-05',
  '2026-08-09 18:00:00-05',
  '2026-08-07 23:59:00-05',
  5
)
on conflict (slug) do nothing;

grant select, insert, update, delete on public.hackathons to authenticated;
grant select, insert, update, delete on public.hackathon_registrations to authenticated;

alter table public.hackathons enable row level security;
alter table public.hackathon_registrations enable row level security;

drop policy if exists "Users can read visible hackathons" on public.hackathons;
create policy "Users can read visible hackathons"
on public.hackathons
for select
to authenticated
using (
  status = 'published'
  or (select private.has_role('admin'))
  or (select private.is_registered_for_hackathon(id))
);

drop policy if exists "Admins can create hackathons" on public.hackathons;
create policy "Admins can create hackathons"
on public.hackathons
for insert
to authenticated
with check ((select private.has_role('admin')));

drop policy if exists "Admins can update hackathons" on public.hackathons;
create policy "Admins can update hackathons"
on public.hackathons
for update
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));

drop policy if exists "Admins can delete hackathons" on public.hackathons;
create policy "Admins can delete hackathons"
on public.hackathons
for delete
to authenticated
using ((select private.has_role('admin')));

drop policy if exists "Users can read own registrations" on public.hackathon_registrations;
create policy "Users can read own registrations"
on public.hackathon_registrations
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_role('admin'))
);

drop policy if exists "Users can register to open hackathons" on public.hackathon_registrations;
create policy "Users can register to open hackathons"
on public.hackathon_registrations
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.hackathons h
    where h.id = hackathon_id
      and h.status = 'published'
      and (h.registration_deadline is null or h.registration_deadline >= now())
  )
);

drop policy if exists "Users can update own registrations" on public.hackathon_registrations;
create policy "Users can update own registrations"
on public.hackathon_registrations
for update
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_role('admin'))
)
with check (
  user_id = (select auth.uid())
  or (select private.has_role('admin'))
);

drop policy if exists "Users can delete own registrations" on public.hackathon_registrations;
create policy "Users can delete own registrations"
on public.hackathon_registrations
for delete
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_role('admin'))
);

create index if not exists hackathons_status_starts_at_idx on public.hackathons (status, starts_at);
create index if not exists hackathons_created_by_idx on public.hackathons (created_by);
create index if not exists hackathon_registrations_user_id_idx on public.hackathon_registrations (user_id);
create index if not exists hackathon_registrations_status_idx on public.hackathon_registrations (status);

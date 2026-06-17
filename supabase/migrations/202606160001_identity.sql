create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  career_area text,
  skills text[] not null default '{}',
  experience text,
  qr_payload text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id smallserial primary key,
  slug text not null unique check (slug in ('admin', 'participant', 'judge')),
  name text not null
);

create table if not exists public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role_id smallint not null references public.roles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

insert into public.roles (slug, name)
values
  ('admin', 'Administrador'),
  ('participant', 'Participante'),
  ('judge', 'Jurado')
on conflict (slug) do update set name = excluded.name;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function private.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create or replace function private.has_role(required_role text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = (select auth.uid())
      and r.slug = required_role
  );
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  participant_role_id smallint;
  display_name text;
  avatar text;
begin
  select id into participant_role_id from public.roles where slug = 'participant';
  display_name := coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name');
  avatar := new.raw_user_meta_data ->> 'avatar_url';

  insert into public.users (id, email, full_name, avatar_url)
  values (new.id, coalesce(new.email, ''), display_name, avatar)
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.users.full_name),
      avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url);

  insert into public.profiles (user_id, qr_payload)
  values (new.id, '/profile/' || new.id::text)
  on conflict (user_id) do nothing;

  if participant_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, participant_role_id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_lima_identity on auth.users;
create trigger on_auth_user_created_lima_identity
after insert on auth.users
for each row execute function private.handle_new_user();

insert into public.users (id, email, full_name, avatar_url)
select
  au.id,
  coalesce(au.email, ''),
  coalesce(au.raw_user_meta_data ->> 'full_name', au.raw_user_meta_data ->> 'name'),
  au.raw_user_meta_data ->> 'avatar_url'
from auth.users au
on conflict (id) do update
set email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url);

insert into public.profiles (user_id, qr_payload)
select id, '/profile/' || id::text
from public.users
on conflict (user_id) do nothing;

insert into public.user_roles (user_id, role_id)
select u.id, r.id
from public.users u
cross join public.roles r
where r.slug = 'participant'
on conflict do nothing;

grant usage on schema public to anon, authenticated;
grant select on public.roles to authenticated;
grant select on public.users to authenticated;
grant update (full_name, avatar_url) on public.users to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists "Authenticated users can read roles" on public.roles;
create policy "Authenticated users can read roles"
on public.roles
for select
to authenticated
using (true);

drop policy if exists "Users can read own user row" on public.users;
create policy "Users can read own user row"
on public.users
for select
to authenticated
using ((select auth.uid()) = id or (select private.has_role('admin')));

drop policy if exists "Users can update own user row" on public.users;
create policy "Users can update own user row"
on public.users
for update
to authenticated
using ((select auth.uid()) = id or (select private.has_role('admin')))
with check ((select auth.uid()) = id or (select private.has_role('admin')));

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = user_id or (select private.has_role('admin')));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id or (select private.has_role('admin')))
with check ((select auth.uid()) = user_id or (select private.has_role('admin')));

drop policy if exists "Users can read own roles" on public.user_roles;
create policy "Users can read own roles"
on public.user_roles
for select
to authenticated
using ((select auth.uid()) = user_id or (select private.has_role('admin')));

create index if not exists profiles_completed_at_idx on public.profiles (completed_at);
create index if not exists user_roles_user_id_idx on public.user_roles (user_id);
create index if not exists user_roles_role_id_idx on public.user_roles (role_id);

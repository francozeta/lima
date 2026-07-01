create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  name text not null,
  join_code text not null unique,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hackathon_id, name)
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null,
  description text not null,
  repository_url text,
  demo_url text,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id)
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_bucket text not null default 'project-deliverables',
  storage_path text not null unique,
  filename text not null,
  content_type text,
  size_bytes bigint not null default 0,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.evaluation_criteria (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  name text not null,
  description text,
  weight numeric(6, 4) not null default 1 check (weight > 0),
  max_score integer not null default 10 check (max_score between 1 and 100),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hackathon_id, name)
);

create table if not exists public.judge_assignments (
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  judge_id uuid not null references public.users(id) on delete cascade,
  assigned_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (hackathon_id, judge_id)
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  judge_id uuid not null references public.users(id) on delete cascade,
  comments text,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, judge_id)
);

create table if not exists public.evaluation_scores (
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  criteria_id uuid not null references public.evaluation_criteria(id) on delete cascade,
  score numeric(8, 2) not null check (score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (evaluation_id, criteria_id)
);

create table if not exists public.results_publications (
  hackathon_id uuid primary key references public.hackathons(id) on delete cascade,
  published_by uuid references public.users(id) on delete set null,
  note text,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at
before update on public.teams
for each row execute function private.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function private.set_updated_at();

drop trigger if exists evaluation_criteria_set_updated_at on public.evaluation_criteria;
create trigger evaluation_criteria_set_updated_at
before update on public.evaluation_criteria
for each row execute function private.set_updated_at();

drop trigger if exists evaluations_set_updated_at on public.evaluations;
create trigger evaluations_set_updated_at
before update on public.evaluations
for each row execute function private.set_updated_at();

drop trigger if exists evaluation_scores_set_updated_at on public.evaluation_scores;
create trigger evaluation_scores_set_updated_at
before update on public.evaluation_scores
for each row execute function private.set_updated_at();

drop trigger if exists results_publications_set_updated_at on public.results_publications;
create trigger results_publications_set_updated_at
before update on public.results_publications
for each row execute function private.set_updated_at();

create or replace function private.is_team_member(target_team_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = target_team_id
      and tm.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_team_owner(target_team_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = target_team_id
      and tm.user_id = (select auth.uid())
      and tm.role = 'owner'
  );
$$;

create or replace function private.is_judge_for_hackathon(target_hackathon_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.judge_assignments ja
    where ja.hackathon_id = target_hackathon_id
      and ja.judge_id = (select auth.uid())
  );
$$;

create or replace function private.is_judge_for_project(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.projects p
    join public.judge_assignments ja on ja.hackathon_id = p.hackathon_id
    where p.id = target_project_id
      and ja.judge_id = (select auth.uid())
  );
$$;

create or replace function private.can_read_project(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and (
        (select private.has_role('admin'))
        or (select private.is_team_member(p.team_id))
        or (select private.is_judge_for_hackathon(p.hackathon_id))
        or exists (
          select 1
          from public.results_publications rp
          where rp.hackathon_id = p.hackathon_id
        )
      )
  );
$$;

create or replace function private.storage_team_id(object_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  first_folder text;
begin
  first_folder := (storage.foldername(object_name))[1];
  return first_folder::uuid;
exception when others then
  return null;
end;
$$;

create or replace function private.can_read_team_files(target_team_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.teams t
    where t.id = target_team_id
      and (
        (select private.has_role('admin'))
        or (select private.is_team_member(t.id))
        or (select private.is_judge_for_hackathon(t.hackathon_id))
      )
  );
$$;

create or replace function private.can_manage_team_files(target_team_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.teams t
    where t.id = target_team_id
      and (
        (select private.has_role('admin'))
        or (select private.is_team_member(t.id))
      )
  );
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-deliverables',
  'project-deliverables',
  false,
  52428800,
  array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into public.evaluation_criteria (hackathon_id, name, description, weight, max_score, position)
select h.id, criteria.name, criteria.description, criteria.weight, 10, criteria.position
from public.hackathons h
cross join (
  values
    ('Impacto', 'Valor del problema y alcance de la solucion.', 0.35::numeric, 1),
    ('Innovacion', 'Originalidad y propuesta diferencial.', 0.25::numeric, 2),
    ('Ejecucion tecnica', 'Calidad funcional y tecnica del entregable.', 0.25::numeric, 3),
    ('Pitch', 'Claridad de comunicacion y defensa del proyecto.', 0.15::numeric, 4)
) as criteria(name, description, weight, position)
where h.slug = 'reto-lima-certus-2026'
on conflict (hackathon_id, name) do update
set description = excluded.description,
    weight = excluded.weight,
    max_score = excluded.max_score,
    position = excluded.position;

grant select, insert, update, delete on public.teams to authenticated;
grant select, insert, update, delete on public.team_members to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.project_files to authenticated;
grant select, insert, update, delete on public.evaluation_criteria to authenticated;
grant select, insert, update, delete on public.judge_assignments to authenticated;
grant select, insert, update, delete on public.evaluations to authenticated;
grant select, insert, update, delete on public.evaluation_scores to authenticated;
grant select, insert, update, delete on public.results_publications to authenticated;
grant insert, delete on public.user_roles to authenticated;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_files enable row level security;
alter table public.evaluation_criteria enable row level security;
alter table public.judge_assignments enable row level security;
alter table public.evaluations enable row level security;
alter table public.evaluation_scores enable row level security;
alter table public.results_publications enable row level security;

drop policy if exists "Users can read teams for registered hackathons" on public.teams;
create policy "Users can read teams for registered hackathons"
on public.teams
for select
to authenticated
using (
  (select private.has_role('admin'))
  or (select private.is_team_member(id))
  or (select private.is_registered_for_hackathon(hackathon_id))
  or (select private.is_judge_for_hackathon(hackathon_id))
);

drop policy if exists "Registered users can create teams" on public.teams;
create policy "Registered users can create teams"
on public.teams
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (select private.has_role('admin'))
    or (select private.is_registered_for_hackathon(hackathon_id))
  )
);

drop policy if exists "Team owners can update teams" on public.teams;
create policy "Team owners can update teams"
on public.teams
for update
to authenticated
using (
  (select private.has_role('admin'))
  or (select private.is_team_owner(id))
)
with check (
  (select private.has_role('admin'))
  or (select private.is_team_owner(id))
);

drop policy if exists "Admins and owners can delete teams" on public.teams;
create policy "Admins and owners can delete teams"
on public.teams
for delete
to authenticated
using (
  (select private.has_role('admin'))
  or (select private.is_team_owner(id))
);

drop policy if exists "Team users can read members" on public.team_members;
create policy "Team users can read members"
on public.team_members
for select
to authenticated
using (
  (select private.has_role('admin'))
  or (select private.is_team_member(team_id))
  or exists (
    select 1
    from public.teams t
    where t.id = team_id
      and (
        (select private.is_registered_for_hackathon(t.hackathon_id))
        or (select private.is_judge_for_hackathon(t.hackathon_id))
      )
  )
);

drop policy if exists "Users can join teams" on public.team_members;
create policy "Users can join teams"
on public.team_members
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.teams t
    where t.id = team_id
      and (
        (select private.has_role('admin'))
        or (select private.is_registered_for_hackathon(t.hackathon_id))
      )
  )
);

drop policy if exists "Members can leave teams" on public.team_members;
create policy "Members can leave teams"
on public.team_members
for delete
to authenticated
using (
  (select private.has_role('admin'))
  or user_id = (select auth.uid())
);

drop policy if exists "Readable projects" on public.projects;
create policy "Readable projects"
on public.projects
for select
to authenticated
using ((select private.can_read_project(id)));

drop policy if exists "Team members can create projects" on public.projects;
create policy "Team members can create projects"
on public.projects
for insert
to authenticated
with check (
  (select private.has_role('admin'))
  or (
    (select private.is_team_member(team_id))
    and exists (
      select 1
      from public.teams t
      where t.id = team_id
        and t.hackathon_id = hackathon_id
    )
  )
);

drop policy if exists "Team members can update projects" on public.projects;
create policy "Team members can update projects"
on public.projects
for update
to authenticated
using (
  (select private.has_role('admin'))
  or (select private.is_team_member(team_id))
)
with check (
  (select private.has_role('admin'))
  or (select private.is_team_member(team_id))
);

drop policy if exists "Team members can delete draft projects" on public.projects;
create policy "Team members can delete draft projects"
on public.projects
for delete
to authenticated
using (
  (select private.has_role('admin'))
  or ((select private.is_team_owner(team_id)) and status = 'draft')
);

drop policy if exists "Readable project files" on public.project_files;
create policy "Readable project files"
on public.project_files
for select
to authenticated
using ((select private.can_read_project(project_id)));

drop policy if exists "Team members can add project files" on public.project_files;
create policy "Team members can add project files"
on public.project_files
for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and (
        (select private.has_role('admin'))
        or (select private.is_team_member(p.team_id))
      )
  )
);

drop policy if exists "Team members can delete project files" on public.project_files;
create policy "Team members can delete project files"
on public.project_files
for delete
to authenticated
using (
  (select private.has_role('admin'))
  or exists (
    select 1
    from public.projects p
    where p.id = project_id
      and (select private.is_team_member(p.team_id))
  )
);

drop policy if exists "Users can read evaluation criteria" on public.evaluation_criteria;
create policy "Users can read evaluation criteria"
on public.evaluation_criteria
for select
to authenticated
using (
  (select private.has_role('admin'))
  or (select private.is_registered_for_hackathon(hackathon_id))
  or (select private.is_judge_for_hackathon(hackathon_id))
  or exists (
    select 1
    from public.results_publications rp
    where rp.hackathon_id = evaluation_criteria.hackathon_id
  )
);

drop policy if exists "Admins manage evaluation criteria" on public.evaluation_criteria;
create policy "Admins manage evaluation criteria"
on public.evaluation_criteria
for all
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));

drop policy if exists "Admins and judges read assignments" on public.judge_assignments;
create policy "Admins and judges read assignments"
on public.judge_assignments
for select
to authenticated
using (
  (select private.has_role('admin'))
  or judge_id = (select auth.uid())
);

drop policy if exists "Admins manage judge assignments" on public.judge_assignments;
create policy "Admins manage judge assignments"
on public.judge_assignments
for all
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));

drop policy if exists "Users can read evaluations" on public.evaluations;
create policy "Users can read evaluations"
on public.evaluations
for select
to authenticated
using (
  (select private.has_role('admin'))
  or judge_id = (select auth.uid())
  or (
    validated_at is not null
    and exists (
      select 1
      from public.projects p
      join public.results_publications rp on rp.hackathon_id = p.hackathon_id
      where p.id = project_id
    )
  )
);

drop policy if exists "Judges can create evaluations" on public.evaluations;
create policy "Judges can create evaluations"
on public.evaluations
for insert
to authenticated
with check (
  judge_id = (select auth.uid())
  and (select private.is_judge_for_project(project_id))
);

drop policy if exists "Judges can update own evaluations" on public.evaluations;
create policy "Judges can update own evaluations"
on public.evaluations
for update
to authenticated
using (
  (select private.has_role('admin'))
  or judge_id = (select auth.uid())
)
with check (
  (select private.has_role('admin'))
  or (
    judge_id = (select auth.uid())
    and (select private.is_judge_for_project(project_id))
  )
);

drop policy if exists "Users can read evaluation scores" on public.evaluation_scores;
create policy "Users can read evaluation scores"
on public.evaluation_scores
for select
to authenticated
using (
  exists (
    select 1
    from public.evaluations e
    where e.id = evaluation_id
      and (
        (select private.has_role('admin'))
        or e.judge_id = (select auth.uid())
        or (
          e.validated_at is not null
          and exists (
            select 1
            from public.projects p
            join public.results_publications rp on rp.hackathon_id = p.hackathon_id
            where p.id = e.project_id
          )
        )
      )
  )
);

drop policy if exists "Judges manage own evaluation scores" on public.evaluation_scores;
create policy "Judges manage own evaluation scores"
on public.evaluation_scores
for all
to authenticated
using (
  exists (
    select 1
    from public.evaluations e
    where e.id = evaluation_id
      and (
        (select private.has_role('admin'))
        or e.judge_id = (select auth.uid())
      )
  )
)
with check (
  exists (
    select 1
    from public.evaluations e
    where e.id = evaluation_id
      and (
        (select private.has_role('admin'))
        or e.judge_id = (select auth.uid())
      )
  )
);

drop policy if exists "Authenticated users can read result publications" on public.results_publications;
create policy "Authenticated users can read result publications"
on public.results_publications
for select
to authenticated
using (true);

drop policy if exists "Admins manage result publications" on public.results_publications;
create policy "Admins manage result publications"
on public.results_publications
for all
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));

drop policy if exists "Admins can add user roles" on public.user_roles;
create policy "Admins can add user roles"
on public.user_roles
for insert
to authenticated
with check ((select private.has_role('admin')));

drop policy if exists "Admins can delete user roles" on public.user_roles;
create policy "Admins can delete user roles"
on public.user_roles
for delete
to authenticated
using ((select private.has_role('admin')));

drop policy if exists "Users can read deliverable objects" on storage.objects;
create policy "Users can read deliverable objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-deliverables'
  and (select private.can_read_team_files(private.storage_team_id(name)))
);

drop policy if exists "Team members can upload deliverable objects" on storage.objects;
create policy "Team members can upload deliverable objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-deliverables'
  and (select private.can_manage_team_files(private.storage_team_id(name)))
);

drop policy if exists "Team members can update deliverable objects" on storage.objects;
create policy "Team members can update deliverable objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'project-deliverables'
  and (select private.can_manage_team_files(private.storage_team_id(name)))
)
with check (
  bucket_id = 'project-deliverables'
  and (select private.can_manage_team_files(private.storage_team_id(name)))
);

drop policy if exists "Team members can delete deliverable objects" on storage.objects;
create policy "Team members can delete deliverable objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-deliverables'
  and (select private.can_manage_team_files(private.storage_team_id(name)))
);

create index if not exists teams_hackathon_id_idx on public.teams (hackathon_id);
create index if not exists teams_join_code_idx on public.teams (join_code);
create index if not exists team_members_user_id_idx on public.team_members (user_id);
create index if not exists projects_hackathon_id_idx on public.projects (hackathon_id);
create index if not exists projects_team_id_idx on public.projects (team_id);
create index if not exists project_files_project_id_idx on public.project_files (project_id);
create index if not exists evaluation_criteria_hackathon_id_idx on public.evaluation_criteria (hackathon_id, position);
create index if not exists judge_assignments_judge_id_idx on public.judge_assignments (judge_id);
create index if not exists evaluations_project_id_idx on public.evaluations (project_id);
create index if not exists evaluations_judge_id_idx on public.evaluations (judge_id);
create index if not exists evaluation_scores_criteria_id_idx on public.evaluation_scores (criteria_id);

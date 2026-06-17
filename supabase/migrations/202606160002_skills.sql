create extension if not exists pgcrypto;

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null default 'General',
  is_seeded boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.profile_skills (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

insert into public.skills (name, slug, category, is_seeded)
values
  ('HTML', 'html', 'Frontend', true),
  ('CSS', 'css', 'Frontend', true),
  ('JavaScript', 'javascript', 'Frontend', true),
  ('TypeScript', 'typescript', 'Frontend', true),
  ('React', 'react', 'Frontend', true),
  ('Next.js', 'next-js', 'Frontend', true),
  ('Vue', 'vue', 'Frontend', true),
  ('Angular', 'angular', 'Frontend', true),
  ('Tailwind CSS', 'tailwind-css', 'Frontend', true),
  ('Accesibilidad web', 'accesibilidad-web', 'Frontend', true),
  ('Responsive design', 'responsive-design', 'Frontend', true),
  ('Node.js', 'node-js', 'Backend', true),
  ('Express', 'express', 'Backend', true),
  ('NestJS', 'nestjs', 'Backend', true),
  ('Python', 'python', 'Backend', true),
  ('Django', 'django', 'Backend', true),
  ('FastAPI', 'fastapi', 'Backend', true),
  ('Java', 'java', 'Backend', true),
  ('Spring Boot', 'spring-boot', 'Backend', true),
  ('C#', 'c', 'Backend', true),
  ('.NET', 'net', 'Backend', true),
  ('Go', 'go', 'Backend', true),
  ('REST APIs', 'rest-apis', 'Backend', true),
  ('GraphQL', 'graphql', 'Backend', true),
  ('PostgreSQL', 'postgresql', 'Datos', true),
  ('MySQL', 'mysql', 'Datos', true),
  ('SQL', 'sql', 'Datos', true),
  ('MongoDB', 'mongodb', 'Datos', true),
  ('Supabase', 'supabase', 'Datos', true),
  ('Firebase', 'firebase', 'Datos', true),
  ('Data modeling', 'data-modeling', 'Datos', true),
  ('Dashboards', 'dashboards', 'Datos', true),
  ('Power BI', 'power-bi', 'Datos', true),
  ('Excel avanzado', 'excel-avanzado', 'Datos', true),
  ('Machine Learning', 'machine-learning', 'IA y Data', true),
  ('Deep Learning', 'deep-learning', 'IA y Data', true),
  ('NLP', 'nlp', 'IA y Data', true),
  ('Computer Vision', 'computer-vision', 'IA y Data', true),
  ('Prompt engineering', 'prompt-engineering', 'IA y Data', true),
  ('Python para datos', 'python-para-datos', 'IA y Data', true),
  ('Pandas', 'pandas', 'IA y Data', true),
  ('NumPy', 'numpy', 'IA y Data', true),
  ('Scikit-learn', 'scikit-learn', 'IA y Data', true),
  ('OpenAI API', 'openai-api', 'IA y Data', true),
  ('UI', 'ui', 'Diseno', true),
  ('UX', 'ux', 'Diseno', true),
  ('UI/UX', 'ui-ux', 'Diseno', true),
  ('Figma', 'figma', 'Diseno', true),
  ('Design systems', 'design-systems', 'Diseno', true),
  ('Prototipado', 'prototipado', 'Diseno', true),
  ('User research', 'user-research', 'Diseno', true),
  ('Wireframing', 'wireframing', 'Diseno', true),
  ('Branding', 'branding', 'Diseno', true),
  ('Product management', 'product-management', 'Producto', true),
  ('Lean startup', 'lean-startup', 'Producto', true),
  ('Design thinking', 'design-thinking', 'Producto', true),
  ('Storytelling', 'storytelling', 'Producto', true),
  ('Pitch', 'pitch', 'Producto', true),
  ('Roadmapping', 'roadmapping', 'Producto', true),
  ('Validacion de usuarios', 'validacion-de-usuarios', 'Producto', true),
  ('Git', 'git', 'DevOps', true),
  ('GitHub', 'github', 'DevOps', true),
  ('Docker', 'docker', 'DevOps', true),
  ('CI/CD', 'ci-cd', 'DevOps', true),
  ('Vercel', 'vercel', 'DevOps', true),
  ('AWS', 'aws', 'DevOps', true),
  ('Linux', 'linux', 'DevOps', true),
  ('Testing', 'testing', 'DevOps', true),
  ('React Native', 'react-native', 'Mobile', true),
  ('Flutter', 'flutter', 'Mobile', true),
  ('Kotlin', 'kotlin', 'Mobile', true),
  ('Swift', 'swift', 'Mobile', true),
  ('Android', 'android', 'Mobile', true),
  ('iOS', 'ios', 'Mobile', true),
  ('Arduino', 'arduino', 'Hardware', true),
  ('Raspberry Pi', 'raspberry-pi', 'Hardware', true),
  ('IoT', 'iot', 'Hardware', true),
  ('Electronica basica', 'electronica-basica', 'Hardware', true),
  ('Marketing digital', 'marketing-digital', 'Negocio', true),
  ('Ventas', 'ventas', 'Negocio', true),
  ('Investigacion de mercado', 'investigacion-de-mercado', 'Negocio', true),
  ('Modelo de negocio', 'modelo-de-negocio', 'Negocio', true),
  ('Finanzas basicas', 'finanzas-basicas', 'Negocio', true),
  ('Liderazgo', 'liderazgo', 'Soft skills', true),
  ('Comunicacion', 'comunicacion', 'Soft skills', true),
  ('Trabajo en equipo', 'trabajo-en-equipo', 'Soft skills', true),
  ('Gestion del tiempo', 'gestion-del-tiempo', 'Soft skills', true),
  ('Resolucion de problemas', 'resolucion-de-problemas', 'Soft skills', true),
  ('Facilitacion', 'facilitacion', 'Soft skills', true)
on conflict (slug) do update
set name = excluded.name,
    category = excluded.category,
    is_seeded = true;

with existing_skill_names as (
  select distinct trim(skill_name) as name
  from public.profiles p
  cross join unnest(p.skills) as skill_name
  where trim(skill_name) <> ''
),
normalized as (
  select
    name,
    regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g') as raw_slug
  from existing_skill_names
)
insert into public.skills (name, slug, category, is_seeded)
select
  name,
  trim(both '-' from raw_slug),
  'General',
  false
from normalized
where trim(both '-' from raw_slug) <> ''
on conflict (slug) do nothing;

with profile_skill_names as (
  select
    p.user_id,
    trim(both '-' from regexp_replace(lower(trim(skill_name)), '[^a-z0-9]+', '-', 'g')) as slug
  from public.profiles p
  cross join unnest(p.skills) as skill_name
  where trim(skill_name) <> ''
)
insert into public.profile_skills (user_id, skill_id)
select psn.user_id, s.id
from profile_skill_names psn
join public.skills s on s.slug = psn.slug
on conflict do nothing;

grant select, insert, update, delete on public.skills to authenticated;
grant select, insert, delete on public.profile_skills to authenticated;

alter table public.skills enable row level security;
alter table public.profile_skills enable row level security;

drop policy if exists "Authenticated users can read skills" on public.skills;
create policy "Authenticated users can read skills"
on public.skills
for select
to authenticated
using (true);

drop policy if exists "Users can create custom skills" on public.skills;
create policy "Users can create custom skills"
on public.skills
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  or (select private.has_role('admin'))
);

drop policy if exists "Admins can update skills" on public.skills;
create policy "Admins can update skills"
on public.skills
for update
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));

drop policy if exists "Admins can delete skills" on public.skills;
create policy "Admins can delete skills"
on public.skills
for delete
to authenticated
using ((select private.has_role('admin')));

drop policy if exists "Users can read own profile skills" on public.profile_skills;
create policy "Users can read own profile skills"
on public.profile_skills
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_role('admin'))
);

drop policy if exists "Users can add own profile skills" on public.profile_skills;
create policy "Users can add own profile skills"
on public.profile_skills
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  or (select private.has_role('admin'))
);

drop policy if exists "Users can remove own profile skills" on public.profile_skills;
create policy "Users can remove own profile skills"
on public.profile_skills
for delete
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_role('admin'))
);

create index if not exists skills_category_idx on public.skills (category);
create index if not exists skills_slug_idx on public.skills (slug);
create index if not exists profile_skills_user_id_idx on public.profile_skills (user_id);
create index if not exists profile_skills_skill_id_idx on public.profile_skills (skill_id);

# LIMA

LIMA es una plataforma academica para gestionar hackatones dentro de CERTUS.

La base actual implementa identidad, perfiles, roles base, catalogo de
habilidades, CRUD de hackatones e inscripcion de participantes.

## Stack

- Next.js 16 App Router + TypeScript
- React 19
- Tailwind CSS v4
- COSS UI / shadcn-compatible components
- Supabase Auth, PostgreSQL y RLS
- Server Actions
- Next `proxy.ts` para refresco de sesion SSR

## Setup local

Instala dependencias:

```bash
pnpm install
```

Copia variables:

```bash
cp .env.example .env.local
```

Variables requeridas:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Supabase setup

1. En Supabase Auth, habilita el provider Google.
2. Agrega estos redirect URLs en Supabase:
   - `http://localhost:3000/auth/callback`
   - la URL de Vercel con `/auth/callback`
3. Ejecuta en Supabase SQL Editor:
   - `supabase/migrations/202606160001_identity.sql`
   - `supabase/migrations/202606160002_skills.sql`
   - `supabase/migrations/202606160003_hackathons.sql`

La migracion crea:

- `public.users`
- `public.profiles`
- `public.roles`
- `public.user_roles`
- trigger para sincronizar nuevos usuarios Auth
- backfill para usuarios existentes
- RLS y grants explicitos para la Data API
- catalogo inicial de habilidades
- relacion `profile_skills` para busqueda y matching futuro
- `hackathons`
- `hackathon_registrations`
- semilla publicada para probar inscripciones

## Roles

Cada cuenta de Supabase Auth tiene un perfil y uno o mas roles:

- `participant`: rol default para estudiantes/postulantes.
- `judge`: rol adicional para jurados, docentes o mentores evaluadores.
- `admin`: rol adicional para coordinadores que gestionan hackatones y usuarios.

Para convertir un usuario en admin mientras aun no existe `/admin/users`:

```sql
insert into public.user_roles (user_id, role_id)
select u.id, r.id
from public.users u
join public.roles r on r.slug = 'admin'
where u.email = 'correo@ejemplo.com'
on conflict do nothing;
```

Para convertir un usuario en jurado:

```sql
insert into public.user_roles (user_id, role_id)
select u.id, r.id
from public.users u
join public.roles r on r.slug = 'judge'
where u.email = 'correo@ejemplo.com'
on conflict do nothing;
```

Para quitar un rol:

```sql
delete from public.user_roles ur
using public.users u, public.roles r
where ur.user_id = u.id
  and ur.role_id = r.id
  and u.email = 'correo@ejemplo.com'
  and r.slug = 'judge';
```

## Desarrollo

```bash
pnpm dev
```

Abre `http://localhost:3000`.

## Verificacion Scale 1

```bash
pnpm lint
pnpm test
pnpm build
```

Flujo manual:

1. Abrir `/dashboard` sin sesion debe redirigir a `/login`.
2. Iniciar sesion con Google.
3. Volver a `/dashboard`.
4. Abrir `/profile/[id]`.
5. Completar perfil.
6. Confirmar que el QR se renderiza en blanco y negro.

## Verificacion Scale 2

```bash
pnpm lint
pnpm test
pnpm build
```

Flujo manual:

1. Entrar como admin y abrir `/admin`.
2. Abrir `/admin/hackathons`.
3. Crear un hackaton en borrador.
4. Cambiarlo a publicado.
5. Entrar como participante a `/hackathons`.
6. Abrir el detalle del hackaton.
7. Inscribirse con perfil completo.
8. Confirmar que el estado cambia a `Inscrito`.

Rutas disponibles en esta escala:

- `/dashboard`
- `/hackathons`
- `/hackathons/[id]`
- `/admin`
- `/admin/hackathons`
- `/admin/users`

## Notas de colaboracion

- `.agents/` y `skills-lock.json` son locales y estan ignorados por Git.
- No subir `.env.local`.
- La UI inicial es blanco y negro, inspirada en la sobriedad de Luma, sin copiar su marca.

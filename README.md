# LIMA

LIMA es una plataforma academica para gestionar hackatones dentro de CERTUS.

Esta primera escala implementa identidad: Google Auth con Supabase, roles base,
perfil editable y QR de perfil.

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

La migracion crea:

- `public.users`
- `public.profiles`
- `public.roles`
- `public.user_roles`
- trigger para sincronizar nuevos usuarios Auth
- backfill para usuarios existentes
- RLS y grants explicitos para la Data API

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

## Notas de colaboracion

- `.agents/` y `skills-lock.json` son locales y estan ignorados por Git.
- No subir `.env.local`.
- La UI inicial es blanco y negro, inspirada en la sobriedad de Luma, sin copiar su marca.

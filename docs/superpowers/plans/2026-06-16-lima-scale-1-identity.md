# LIMA Scale 1 Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first viable slice of LIMA: repository hygiene, Supabase Google authentication, role-aware session access, editable participant profile, generated profile QR, and a minimal authenticated dashboard.

**Architecture:** Next.js 16 App Router renders protected pages as Server Components and uses Server Actions for all mutations. Supabase Auth manages Google login with SSR cookies through `@supabase/ssr`, while Postgres RLS enforces data access for `users`, `profiles`, `roles`, and `user_roles`. UI uses the installed COSS/shadcn-compatible components in a black-and-white, Luma-inspired event-platform style: spacious, calm, list/card oriented, and focused on the user's next action.

**Tech Stack:** Next.js 16.2.9, React 19.2.4, TypeScript strict mode, Tailwind CSS v4, COSS UI/Base UI, Supabase Auth/Postgres/RLS, Server Actions, Next `proxy.ts`, Vitest for focused unit tests.

---

## Context And Constraints

- The repo is `C:\Users\Peruf\Desktop\Workspace\lima`.
- Current app is still the create-next-app starter.
- Installed UI base: `@base-ui/react`, `shadcn`, COSS registry in `components.json`, Tailwind v4, and many `components/ui/*` primitives.
- `.env.local` currently contains:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- No `supabase/` directory exists yet.
- Supabase CLI is not available in the current shell, so create SQL migration files directly in the repo for now.
- Supabase current behavior requires explicit `GRANT` statements for tables exposed via the Data API.
- Next.js 16 calls middleware `proxy.ts`; use `proxy.ts`, not `middleware.ts`.
- Server code must not trust `supabase.auth.getSession()` for authorization. Use `getClaims()`/`getUser()` in server paths and validate authorization again inside each Server Action.
- `.agents/` and `skills-lock.json` are local skill artifacts and should stay out of Git.
- Luma inspiration is interaction/layout inspiration only: discovery-style cards, restrained typography, search/list rhythm, and clear CTAs. Do not copy Luma branding or protected visual identity.

## Phase Boundary

This plan implements only Scale 0 and Scale 1.

In scope:
- Git hygiene for local skills.
- Required dependencies and scripts.
- Identity database schema: `users`, `profiles`, `roles`, `user_roles`.
- RLS and grants for the identity slice.
- Google login and OAuth callback.
- SSR Supabase clients and auth token refresh proxy.
- Role-aware session helpers.
- `/login`, `/dashboard`, `/profile/[id]`.
- Profile edit form with validation and feedback.
- QR card generated from the profile URL.

Out of scope:
- Hackathon CRUD.
- Teams.
- Deliverables.
- Storage buckets.
- Jury evaluation.
- Ranking and results.
- Admin user management beyond recognizing the `admin` role.

## File Map

Create:
- `C:\Users\Peruf\Desktop\Workspace\lima\.env.example` documents safe public env names.
- `C:\Users\Peruf\Desktop\Workspace\lima\supabase\migrations\202606160001_identity.sql` creates identity schema, grants, RLS, and auth trigger.
- `C:\Users\Peruf\Desktop\Workspace\lima\lib\supabase\client.ts` browser Supabase client.
- `C:\Users\Peruf\Desktop\Workspace\lima\lib\supabase\server.ts` server Supabase client using cookies.
- `C:\Users\Peruf\Desktop\Workspace\lima\lib\supabase\proxy.ts` session refresh helper for Next proxy.
- `C:\Users\Peruf\Desktop\Workspace\lima\proxy.ts` Next 16 proxy entrypoint.
- `C:\Users\Peruf\Desktop\Workspace\lima\lib\auth\session.ts` current-user and role helpers.
- `C:\Users\Peruf\Desktop\Workspace\lima\lib\auth\routes.ts` protected route metadata.
- `C:\Users\Peruf\Desktop\Workspace\lima\lib\validation\profile.ts` Zod profile schema.
- `C:\Users\Peruf\Desktop\Workspace\lima\lib\qr.ts` profile QR helpers.
- `C:\Users\Peruf\Desktop\Workspace\lima\app\auth\callback\route.ts` OAuth code exchange route.
- `C:\Users\Peruf\Desktop\Workspace\lima\app\login\page.tsx` login page.
- `C:\Users\Peruf\Desktop\Workspace\lima\app\dashboard\page.tsx` authenticated dashboard.
- `C:\Users\Peruf\Desktop\Workspace\lima\app\profile\[id]\page.tsx` profile page.
- `C:\Users\Peruf\Desktop\Workspace\lima\app\actions\auth.ts` sign-in and sign-out Server Actions.
- `C:\Users\Peruf\Desktop\Workspace\lima\app\actions\profile.ts` profile update Server Action.
- `C:\Users\Peruf\Desktop\Workspace\lima\components\auth\google-login-form.tsx` Google login form.
- `C:\Users\Peruf\Desktop\Workspace\lima\components\auth\sign-out-button.tsx` logout control.
- `C:\Users\Peruf\Desktop\Workspace\lima\components\layout\app-shell.tsx` authenticated shell.
- `C:\Users\Peruf\Desktop\Workspace\lima\components\profile\profile-form.tsx` profile form client component.
- `C:\Users\Peruf\Desktop\Workspace\lima\components\profile\profile-qr-card.tsx` QR display.
- `C:\Users\Peruf\Desktop\Workspace\lima\vitest.config.ts` unit test config.
- `C:\Users\Peruf\Desktop\Workspace\lima\tests\profile-validation.test.ts` validation tests.
- `C:\Users\Peruf\Desktop\Workspace\lima\tests\qr.test.ts` QR helper tests.

Modify:
- `C:\Users\Peruf\Desktop\Workspace\lima\.gitignore` to ignore local skill artifacts.
- `C:\Users\Peruf\Desktop\Workspace\lima\package.json` to add dependencies and test scripts.
- `C:\Users\Peruf\Desktop\Workspace\lima\app\layout.tsx` to update metadata, language, and toast provider.
- `C:\Users\Peruf\Desktop\Workspace\lima\app\page.tsx` to redirect to `/dashboard`.
- `C:\Users\Peruf\Desktop\Workspace\lima\app\globals.css` only if the black-and-white theme needs token refinement.
- `C:\Users\Peruf\Desktop\Workspace\lima\README.md` to document Scale 1 setup and Supabase SQL application.

---

### Task 1: Repository Hygiene And Dependencies

**Files:**
- Modify: `C:\Users\Peruf\Desktop\Workspace\lima\.gitignore`
- Modify: `C:\Users\Peruf\Desktop\Workspace\lima\package.json`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\.env.example`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\vitest.config.ts`

- [ ] **Step 1: Add local skill artifacts to `.gitignore`**

Append exactly:

```gitignore

# local agent skills
.agents/
skills-lock.json
```

- [ ] **Step 2: Install runtime dependencies**

Run:

```powershell
Set-Location -LiteralPath 'C:\Users\Peruf\Desktop\Workspace\lima'
pnpm add @supabase/supabase-js @supabase/ssr zod qrcode server-only
```

Expected: `package.json` includes those dependencies and `pnpm-lock.yaml` updates.

- [ ] **Step 3: Install test dependencies**

Run:

```powershell
Set-Location -LiteralPath 'C:\Users\Peruf\Desktop\Workspace\lima'
pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom @types/qrcode
```

Expected: dev dependencies are added and lockfile updates.

- [ ] **Step 4: Add test scripts to `package.json`**

Update scripts to include:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 5: Create `.env.example`**

Create:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 6: Create Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
```

- [ ] **Step 7: Verify**

Run:

```powershell
Set-Location -LiteralPath 'C:\Users\Peruf\Desktop\Workspace\lima'
pnpm lint
pnpm test
```

Expected:
- `pnpm lint` passes or reports only pre-existing starter issues.
- `pnpm test` reports no test files or passes once test files are added in later tasks.

---

### Task 2: Identity Database Migration

**Files:**
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\supabase\migrations\202606160001_identity.sql`
- Modify: `C:\Users\Peruf\Desktop\Workspace\lima\README.md`

- [ ] **Step 1: Create migration folder**

Run:

```powershell
Set-Location -LiteralPath 'C:\Users\Peruf\Desktop\Workspace\lima'
New-Item -ItemType Directory -Force supabase\migrations
```

- [ ] **Step 2: Create identity migration SQL**

Create `supabase/migrations/202606160001_identity.sql` with:

```sql
create schema if not exists private;

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

grant usage on schema public to anon, authenticated;
grant select on public.roles to authenticated;
grant select on public.users to authenticated;
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
```

- [ ] **Step 3: Apply migration in Supabase SQL Editor**

Because the Supabase CLI is not installed, open the Supabase SQL Editor and run the full content of `supabase/migrations/202606160001_identity.sql`.

Expected:
- Four public tables exist.
- Three roles exist.
- RLS is enabled on all four public tables.
- New Google users are mirrored into `public.users`, `public.profiles`, and `public.user_roles`.

- [ ] **Step 4: Document migration in README**

Add a "Supabase setup" section explaining:

```md
1. Copy `.env.example` to `.env.local` and fill the Supabase project URL and publishable key.
2. In Supabase Auth, enable Google provider.
3. Add `http://localhost:3000/auth/callback` and the Vercel callback URL to the Supabase redirect allow list.
4. Run `supabase/migrations/202606160001_identity.sql` in the Supabase SQL Editor.
```

---

### Task 3: Supabase SSR Clients And Proxy

**Files:**
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\lib\supabase\client.ts`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\lib\supabase\server.ts`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\lib\supabase\proxy.ts`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\proxy.ts`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\app\auth\callback\route.ts`

- [ ] **Step 1: Create browser client**

Create `lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

- [ ] **Step 2: Create server client**

Create `lib/supabase/server.ts`:

```ts
import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies; proxy handles refresh writes.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Create proxy session refresh helper**

Create `lib/supabase/proxy.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getClaims();
  return supabaseResponse;
}
```

- [ ] **Step 4: Create Next proxy entrypoint**

Create `proxy.ts`:

```ts
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 5: Create OAuth callback route**

Create `app/auth/callback/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
```

- [ ] **Step 6: Verify types**

Run:

```powershell
Set-Location -LiteralPath 'C:\Users\Peruf\Desktop\Workspace\lima'
pnpm build
```

Expected: build reaches compilation. It may fail later if pages still import removed starter code during future tasks; fix as part of Task 7.

---

### Task 4: Session, Roles, And Profile Validation

**Files:**
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\lib\auth\session.ts`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\lib\auth\routes.ts`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\lib\validation\profile.ts`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\tests\profile-validation.test.ts`

- [ ] **Step 1: Write failing validation tests**

Create `tests/profile-validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { profileSchema, splitSkills } from "@/lib/validation/profile";

describe("profile validation", () => {
  it("accepts a complete profile", () => {
    const result = profileSchema.safeParse({
      fullName: "Ada Lovelace",
      careerArea: "Ingenieria de Software",
      skills: "React, Supabase, UX",
      experience: "He trabajado en proyectos academicos con equipos pequenos.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing full name", () => {
    const result = profileSchema.safeParse({
      fullName: "",
      careerArea: "Diseno",
      skills: "Figma",
      experience: "Portafolio academico.",
    });

    expect(result.success).toBe(false);
  });

  it("splits skills into trimmed unique values", () => {
    expect(splitSkills("React, Supabase, react, UX")).toEqual([
      "React",
      "Supabase",
      "UX",
    ]);
  });
});
```

Run:

```powershell
Set-Location -LiteralPath 'C:\Users\Peruf\Desktop\Workspace\lima'
pnpm test tests/profile-validation.test.ts
```

Expected: fail because `lib/validation/profile.ts` does not exist yet.

- [ ] **Step 2: Implement profile validation**

Create `lib/validation/profile.ts`:

```ts
import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresa tu nombre completo."),
  careerArea: z.string().trim().min(2, "Indica tu carrera o area."),
  skills: z.string().trim().min(2, "Agrega al menos una habilidad."),
  experience: z
    .string()
    .trim()
    .min(10, "Cuéntanos un poco mas sobre tu experiencia.")
    .max(600, "Mantén tu experiencia debajo de 600 caracteres."),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export function splitSkills(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)
    .filter((skill) => {
      const key = skill.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
```

- [ ] **Step 3: Implement route metadata**

Create `lib/auth/routes.ts`:

```ts
export type AppRole = "admin" | "participant" | "judge";

export const protectedPrefixes = ["/dashboard", "/profile"] as const;

export const roleProtectedPrefixes: Record<string, AppRole[]> = {
  "/admin": ["admin"],
  "/judge": ["judge", "admin"],
};
```

- [ ] **Step 4: Implement session helper**

Create `lib/auth/session.ts`:

```ts
import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/auth/routes";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  roles: AppRole[];
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) return null;

  const { data: userRow } = await supabase
    .from("users")
    .select("id,email,full_name,avatar_url")
    .eq("id", userData.user.id)
    .single();

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("roles(slug)")
    .eq("user_id", userData.user.id);

  const roles = (roleRows ?? [])
    .map((row) => {
      const role = row.roles as { slug?: AppRole } | null;
      return role?.slug;
    })
    .filter((role): role is AppRole => Boolean(role));

  return {
    id: userData.user.id,
    email: userRow?.email ?? userData.user.email ?? "",
    fullName: userRow?.full_name ?? userData.user.user_metadata?.full_name ?? null,
    avatarUrl: userRow?.avatar_url ?? userData.user.user_metadata?.avatar_url ?? null,
    roles,
  };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(allowedRoles: AppRole[]) {
  const user = await requireUser();
  const allowed = allowedRoles.some((role) => user.roles.includes(role));
  if (!allowed) redirect("/dashboard");
  return user;
}
```

- [ ] **Step 5: Verify validation tests**

Run:

```powershell
Set-Location -LiteralPath 'C:\Users\Peruf\Desktop\Workspace\lima'
pnpm test tests/profile-validation.test.ts
```

Expected: pass.

---

### Task 5: Login And Logout Flow

**Files:**
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\app\actions\auth.ts`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\app\login\page.tsx`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\components\auth\google-login-form.tsx`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\components\auth\sign-out-button.tsx`
- Modify: `C:\Users\Peruf\Desktop\Workspace\lima\app\layout.tsx`

- [ ] **Step 1: Create auth actions**

Create `app/actions/auth.ts`:

```ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInWithGoogle() {
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    redirect("/login?error=google");
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect("/login?error=google");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 2: Create Google login form**

Create `components/auth/google-login-form.tsx`:

```tsx
import { ChromeIcon } from "lucide-react";
import { signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function GoogleLoginForm() {
  return (
    <form action={signInWithGoogle}>
      <Button className="w-full" size="lg" type="submit">
        <ChromeIcon />
        Continuar con Google
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Create sign-out button**

Create `components/auth/sign-out-button.tsx`:

```tsx
import { LogOutIcon } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button size="sm" type="submit" variant="outline">
        <LogOutIcon />
        Salir
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Create login page**

Create `app/login/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { GoogleLoginForm } from "@/components/auth/google-login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            CERTUS
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-foreground">
            LIMA
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Gestiona tu identidad para participar en hackatones academicos.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acceso institucional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                No pudimos iniciar sesion con Google. Intentalo nuevamente.
              </p>
            ) : null}
            <GoogleLoginForm />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Update app metadata and toast provider**

Modify `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LIMA",
  description: "Plataforma para gestionar hackatones academicos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn("h-full antialiased", geistSans.variable, geistMono.variable, inter.variable)}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verify login page build**

Run:

```powershell
Set-Location -LiteralPath 'C:\Users\Peruf\Desktop\Workspace\lima'
pnpm build
```

Expected: no TypeScript errors from auth actions or login route.

---

### Task 6: Profile Update Action And QR Helpers

**Files:**
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\app\actions\profile.ts`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\lib\qr.ts`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\tests\qr.test.ts`

- [ ] **Step 1: Write failing QR tests**

Create `tests/qr.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getProfileUrl } from "@/lib/qr";

describe("profile QR helpers", () => {
  it("builds an absolute profile URL", () => {
    expect(getProfileUrl("http://localhost:3000", "user-123")).toBe(
      "http://localhost:3000/profile/user-123",
    );
  });

  it("removes trailing slash from site URL", () => {
    expect(getProfileUrl("https://lima.certus.edu.pe/", "abc")).toBe(
      "https://lima.certus.edu.pe/profile/abc",
    );
  });
});
```

Run:

```powershell
Set-Location -LiteralPath 'C:\Users\Peruf\Desktop\Workspace\lima'
pnpm test tests/qr.test.ts
```

Expected: fail because `lib/qr.ts` does not exist yet.

- [ ] **Step 2: Implement QR helpers**

Create `lib/qr.ts`:

```ts
import QRCode from "qrcode";

export function getProfileUrl(siteUrl: string, userId: string) {
  return `${siteUrl.replace(/\/$/, "")}/profile/${userId}`;
}

export async function createProfileQrDataUrl(siteUrl: string, userId: string) {
  return QRCode.toDataURL(getProfileUrl(siteUrl, userId), {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 6,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}
```

- [ ] **Step 3: Create profile update action**

Create `app/actions/profile.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { profileSchema, splitSkills } from "@/lib/validation/profile";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export const initialProfileFormState: ProfileFormState = {
  ok: false,
  message: "",
};

export async function updateProfile(
  _state: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    careerArea: formData.get("careerArea"),
    skills: formData.get("skills"),
    experience: formData.get("experience"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los campos marcados.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const skills = splitSkills(parsed.data.skills);
  const completedAt = parsed.data.fullName && parsed.data.careerArea && skills.length > 0
    ? new Date().toISOString()
    : null;

  const { error: userError } = await supabase
    .from("users")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  if (userError) {
    return { ok: false, message: "No pudimos actualizar tu nombre." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      career_area: parsed.data.careerArea,
      skills,
      experience: parsed.data.experience,
      qr_payload: `/profile/${user.id}`,
      completed_at: completedAt,
    })
    .eq("user_id", user.id);

  if (profileError) {
    return { ok: false, message: "No pudimos actualizar tu perfil." };
  }

  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/dashboard");

  return { ok: true, message: "Perfil actualizado." };
}
```

- [ ] **Step 4: Verify tests**

Run:

```powershell
Set-Location -LiteralPath 'C:\Users\Peruf\Desktop\Workspace\lima'
pnpm test tests/profile-validation.test.ts tests/qr.test.ts
```

Expected: pass.

---

### Task 7: Authenticated UI Shell, Dashboard, And Profile

**Files:**
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\components\layout\app-shell.tsx`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\components\profile\profile-form.tsx`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\components\profile\profile-qr-card.tsx`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\app\dashboard\page.tsx`
- Create: `C:\Users\Peruf\Desktop\Workspace\lima\app\profile\[id]\page.tsx`
- Modify: `C:\Users\Peruf\Desktop\Workspace\lima\app\page.tsx`

- [ ] **Step 1: Create app shell**

Create `components/layout/app-shell.tsx`:

```tsx
import Link from "next/link";
import { LayoutDashboardIcon, UserIcon } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/lib/auth/session";

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link className="text-lg font-semibold tracking-normal" href="/dashboard">
            LIMA
          </Link>
          <nav className="flex items-center gap-2">
            <Button render={<Link href="/dashboard" />} size="sm" variant="ghost">
              <LayoutDashboardIcon />
              Dashboard
            </Button>
            <Button render={<Link href={`/profile/${user.id}`} />} size="sm" variant="ghost">
              <UserIcon />
              Perfil
            </Button>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create profile form**

Create `components/profile/profile-form.tsx`:

```tsx
"use client";

import { useActionState, useEffect } from "react";
import { toastManager } from "@/components/ui/toast";
import {
  initialProfileFormState,
  updateProfile,
} from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type ProfileFormValues = {
  fullName: string;
  careerArea: string;
  skills: string;
  experience: string;
};

export function ProfileForm({ values }: { values: ProfileFormValues }) {
  const [state, action, pending] = useActionState(
    updateProfile,
    initialProfileFormState,
  );

  useEffect(() => {
    if (!state.message) return;
    toastManager.add({
      title: state.message,
      type: state.ok ? "success" : "error",
    });
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil academico</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fullName">Nombre</FieldLabel>
              <Input id="fullName" name="fullName" defaultValue={values.fullName} />
              <FieldError>{state.errors?.fullName?.[0]}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="careerArea">Carrera o area</FieldLabel>
              <Input id="careerArea" name="careerArea" defaultValue={values.careerArea} />
              <FieldError>{state.errors?.careerArea?.[0]}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="skills">Habilidades</FieldLabel>
              <Input id="skills" name="skills" defaultValue={values.skills} />
              <FieldError>{state.errors?.skills?.[0]}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="experience">Experiencia breve</FieldLabel>
              <Textarea
                id="experience"
                name="experience"
                defaultValue={values.experience}
                rows={5}
              />
              <FieldError>{state.errors?.experience?.[0]}</FieldError>
            </Field>
          </FieldGroup>
          <Button loading={pending} type="submit">
            Guardar perfil
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create QR card**

Create `components/profile/profile-qr-card.tsx`:

```tsx
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileQrCard({
  qrDataUrl,
  profileUrl,
}: {
  qrDataUrl: string;
  profileUrl: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>QR de perfil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex aspect-square items-center justify-center rounded-lg border bg-white p-4">
          <Image alt="QR del perfil LIMA" height={240} src={qrDataUrl} width={240} />
        </div>
        <p className="break-all text-xs text-muted-foreground">{profileUrl}</p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create dashboard**

Create `app/dashboard/page.tsx`:

```tsx
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("career_area,skills,experience,completed_at")
    .eq("user_id", user.id)
    .single();

  const profileComplete = Boolean(profile?.completed_at);

  return (
    <AppShell user={user}>
      <section className="mb-8">
        <Badge variant="outline">Escala 1</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal">
          Hola{user.fullName ? `, ${user.fullName}` : ""}.
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Este es tu punto de partida en LIMA. Primero dejamos lista tu identidad institucional.
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">
                {profileComplete ? "Perfil completo" : "Completa tu perfil"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tu perfil se usara para inscripciones, equipos y evaluaciones.
              </p>
            </div>
            <Button render={<Link href={`/profile/${user.id}`} />}>
              {profileComplete ? "Ver perfil" : "Completar"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rol actual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{user.roles.join(", ") || "participant"}</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 5: Create profile page**

Create `app/profile/[id]/page.tsx`:

```tsx
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileQrCard } from "@/components/profile/profile-qr-card";
import { createProfileQrDataUrl, getProfileUrl } from "@/lib/qr";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  if (id !== user.id && !user.roles.includes("admin")) {
    redirect(`/profile/${user.id}`);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("career_area,skills,experience,users(full_name)")
    .eq("user_id", id)
    .single();

  if (!data) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const profileUrl = getProfileUrl(siteUrl, id);
  const qrDataUrl = await createProfileQrDataUrl(siteUrl, id);
  const owner = data.users as { full_name?: string | null } | null;

  return (
    <AppShell user={user}>
      <section className="mb-8">
        <h1 className="text-3xl font-semibold tracking-normal">Tu perfil</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Mantén tus datos claros para formar equipos y participar en hackatones.
        </p>
      </section>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <ProfileForm
          values={{
            fullName: owner?.full_name ?? user.fullName ?? "",
            careerArea: data.career_area ?? "",
            skills: (data.skills ?? []).join(", "),
            experience: data.experience ?? "",
          }}
        />
        <ProfileQrCard profileUrl={profileUrl} qrDataUrl={qrDataUrl} />
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 6: Redirect root to dashboard**

Replace `app/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 7: Verify build**

Run:

```powershell
Set-Location -LiteralPath 'C:\Users\Peruf\Desktop\Workspace\lima'
pnpm lint
pnpm build
pnpm test
```

Expected: all pass after resolving any exact COSS import mismatches found by TypeScript.

---

### Task 8: Manual Auth Verification

**Files:**
- Modify: `C:\Users\Peruf\Desktop\Workspace\lima\README.md`

- [ ] **Step 1: Start development server**

Run:

```powershell
Set-Location -LiteralPath 'C:\Users\Peruf\Desktop\Workspace\lima'
pnpm dev
```

Expected: Next starts on `http://localhost:3000`.

- [ ] **Step 2: Test unauthenticated redirect**

Open `http://localhost:3000/dashboard`.

Expected:
- User is redirected to `/login`.
- Login page shows LIMA and the Google button.

- [ ] **Step 3: Test Google sign-in**

Click "Continuar con Google".

Expected:
- Google OAuth opens.
- After authorization, Supabase redirects to `/auth/callback`.
- The app redirects to `/dashboard`.

- [ ] **Step 4: Verify profile rows**

In Supabase Table Editor or SQL Editor, verify:

```sql
select u.email, u.full_name, r.slug
from public.users u
join public.user_roles ur on ur.user_id = u.id
join public.roles r on r.id = ur.role_id
order by u.created_at desc
limit 5;
```

Expected: the signed-in Google user exists and has `participant`.

- [ ] **Step 5: Test profile update**

Open `/profile/<signed-in-user-id>` from the dashboard.

Fill:
- Nombre: `Usuario LIMA`
- Carrera o area: `Ingenieria de Software`
- Habilidades: `React, Supabase, UI`
- Experiencia breve: `He participado en proyectos academicos colaborativos.`

Submit.

Expected:
- Toast says `Perfil actualizado.`
- Refresh keeps the saved values.
- Dashboard shows profile complete.
- QR image renders in black and white.

- [ ] **Step 6: Document result in README**

Add a short "Scale 1 verification" section:

```md
## Scale 1 verification

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- Manual Google OAuth sign-in
- Profile update through `/profile/[id]`
- QR rendering in profile page
```

---

## Self-Review Checklist

- Spec coverage:
  - Repo hygiene covered by Task 1.
  - Google Auth covered by Tasks 3, 5, and 8.
  - Role control foundation covered by Tasks 2 and 4.
  - Profile fields covered by Tasks 2, 4, 6, and 7.
  - QR generation covered by Tasks 6 and 7.
  - Luma-inspired black-and-white UI covered by Tasks 5 and 7.
- Red-flag scan:
  - No unfinished-marker instructions are present.
- Type consistency:
  - Role type is `AppRole`.
  - Profile validation type is `ProfileInput`.
  - Current user shape is `CurrentUser`.
  - Server Action state is `ProfileFormState`.
- Scope check:
  - Hackathons, teams, deliverables, judging, ranking, and results are explicitly out of scope for this plan.

## Handoff

After this plan is approved, execute with either:

1. **Subagent-Driven (recommended):** one task per fresh worker, review between tasks.
2. **Inline Execution:** implement tasks in this thread with checkpoints after each task.

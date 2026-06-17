# LIMA Scale 1.1 Skills And Roles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve participant profiles with reusable predefined/custom skills and document role bootstrap for admin and judge accounts.

**Architecture:** Keep `profiles.skills` as a compatibility text array, then add normalized `skills` and `profile_skills` tables for future search, team matching, and admin analytics. The profile form sends selected skills through the existing Server Action, which updates both the legacy array and the relational tables when the new migration is applied.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, COSS UI primitives, Supabase PostgreSQL/RLS, Server Actions, Vitest.

---

## Tasks

- [x] Add failing tests for skill normalization, slug generation, and deduplication.
- [x] Implement `lib/skills.ts` with a broad CERTUS-friendly skill catalog.
- [x] Add `supabase/migrations/202606160002_skills.sql` with `skills`, `profile_skills`, seed data, grants, and RLS policies.
- [x] Update the profile Server Action to create missing custom skills and sync `profile_skills`.
- [x] Replace the free-text skills input with a chip-based selector that supports suggestions and new skills.
- [x] Document role bootstrap SQL for `admin` and `judge` in `README.md`.

## Verification

Run:

```bash
pnpm lint
pnpm test
pnpm build
```

Manual check:

1. Run `supabase/migrations/202606160002_skills.sql` in Supabase SQL Editor.
2. Open `/profile/[id]`.
3. Select suggested skills.
4. Create a custom skill that does not exist.
5. Save the profile and refresh.
6. Confirm selected skills remain visible.

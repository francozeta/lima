import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  roles: AppRole[];
};

type UserRoleRow = {
  roles: { slug?: AppRole } | { slug?: AppRole }[] | null;
};

function normalizeRole(row: UserRoleRow): AppRole | null {
  const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
  return role?.slug ?? null;
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) return null;

  const { data: userRow } = await supabase
    .from("users")
    .select("id,email,full_name,avatar_url")
    .eq("id", userData.user.id)
    .maybeSingle();

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("roles(slug)")
    .eq("user_id", userData.user.id);

  const roles = ((roleRows ?? []) as UserRoleRow[])
    .map(normalizeRole)
    .filter((role): role is AppRole => Boolean(role));

  return {
    id: userData.user.id,
    email: userRow?.email ?? userData.user.email ?? "",
    fullName:
      userRow?.full_name ??
      (userData.user.user_metadata?.full_name as string | undefined) ??
      null,
    avatarUrl:
      userRow?.avatar_url ??
      (userData.user.user_metadata?.avatar_url as string | undefined) ??
      null,
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

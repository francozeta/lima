import Link from "next/link";
import { updateUserRoles } from "@/app/actions/admin";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/hackathons";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type UserRow = {
  created_at: string;
  email: string;
  full_name: string | null;
  id: string;
};

type ProfileRow = {
  completed_at: string | null;
  user_id: string;
};

type UserRoleRow = {
  roles: { slug?: string } | { slug?: string }[] | null;
  user_id: string;
};

function getRoleSlug(row: UserRoleRow) {
  const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
  return role?.slug ?? null;
}

export default async function AdminUsersPage() {
  const user = await requireRole(["admin"]);
  const supabase = await createClient();

  const [{ data: users, error }, { data: profiles }, { data: userRoles }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id,email,full_name,created_at")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id,completed_at"),
      supabase.from("user_roles").select("user_id,roles(slug)"),
    ]);

  const profileByUserId = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [
      profile.user_id,
      profile,
    ]),
  );
  const rolesByUserId = new Map<string, string[]>();

  ((userRoles ?? []) as UserRoleRow[]).forEach((row) => {
    const role = getRoleSlug(row);
    if (!role) return;
    const roles = rolesByUserId.get(row.user_id) ?? [];
    roles.push(role);
    rolesByUserId.set(row.user_id, roles);
  });

  return (
    <AppShell user={user}>
      <section className="mb-8">
        <Button render={<Link href="/admin" />} size="sm" variant="ghost">
          Volver
        </Button>
        <Badge className="mt-4" variant="outline">
          Admin
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal">
          Usuarios
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Lectura base de cuentas, roles y perfiles completos.
        </p>
      </section>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>No pudimos cargar usuarios</CardTitle>
            <CardDescription>
              Revisa que la migracion de identidad este ejecutada.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Table variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead>Accion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {((users ?? []) as UserRow[]).map((row) => {
              const profile = profileByUserId.get(row.id);
              const roles = rolesByUserId.get(row.id) ?? [];

              return (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-normal">
                    <div className="font-medium">{row.full_name || "Sin nombre"}</div>
                    <div className="mt-1 text-muted-foreground">{row.email}</div>
                  </TableCell>
                  <TableCell>
                    <form action={updateUserRoles} className="grid gap-2">
                      <input name="userId" type="hidden" value={row.id} />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          defaultChecked={roles.includes("participant")}
                          name="roles"
                          type="checkbox"
                          value="participant"
                        />
                        participant
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          defaultChecked={roles.includes("judge")}
                          name="roles"
                          type="checkbox"
                          value="judge"
                        />
                        judge
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          defaultChecked={roles.includes("admin")}
                          name="roles"
                          type="checkbox"
                          value="admin"
                        />
                        admin
                      </label>
                      <Button size="sm" type="submit" variant="outline">
                        Guardar
                      </Button>
                    </form>
                  </TableCell>
                  <TableCell>
                    {profile?.completed_at ? (
                      <Badge variant="success">Completo</Badge>
                    ) : (
                      <Badge variant="outline">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(row.created_at)}</TableCell>
                  <TableCell>
                    <Button
                      render={<Link href={`/profile/${row.id}`} />}
                      size="sm"
                      variant="ghost"
                    >
                      Perfil
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </AppShell>
  );
}

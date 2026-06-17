import {
  CalendarDaysIcon,
  ClipboardListIcon,
  UsersIcon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function StatCard({
  description,
  icon: Icon,
  label,
  value,
}: {
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4" />
          {label}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-normal">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function AdminPage() {
  const user = await requireRole(["admin"]);
  const supabase = await createClient();

  const [
    { count: hackathonCount },
    { count: profileCount },
    { count: registrationCount },
  ] = await Promise.all([
    supabase.from("hackathons").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("hackathon_registrations")
      .select("*", { count: "exact", head: true })
      .eq("status", "registered"),
  ]);

  return (
    <AppShell user={user}>
      <section className="mb-8">
        <Badge variant="outline">Admin</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal">
          Panel de control
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Vista operativa para coordinar hackatones, usuarios e inscripciones.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          description="Creados en LIMA"
          icon={CalendarDaysIcon}
          label="Hackatones"
          value={hackathonCount ?? "-"}
        />
        <StatCard
          description="Perfiles registrados"
          icon={UsersIcon}
          label="Participantes"
          value={profileCount ?? "-"}
        />
        <StatCard
          description="Inscripciones activas"
          icon={ClipboardListIcon}
          label="Inscritos"
          value={registrationCount ?? "-"}
        />
        <StatCard
          description="Se implementa en la siguiente escala"
          icon={UserRoundIcon}
          label="Equipos"
          value="0"
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hackatones</CardTitle>
            <CardDescription>
              Crear, editar, publicar o eliminar eventos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/admin/hackathons" />}>
              Gestionar hackatones
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>
              Revisar cuentas, roles y estado de perfil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/admin/users" />} variant="outline">
              Ver usuarios
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

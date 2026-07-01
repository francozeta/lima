import Link from "next/link";
import { CalendarDaysIcon } from "lucide-react";
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
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [
    { data: profile },
    { count: registrationCount },
    { count: teamMembershipCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("career_area,skills,experience,completed_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("hackathon_registrations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "registered"),
    supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const profileComplete = Boolean(profile?.completed_at);

  return (
    <AppShell user={user}>
      <section className="mb-8">
        <Badge variant="outline">Escala 2</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal">
          Hola{user.fullName ? `, ${user.fullName}` : ""}.
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Ya puedes completar tu perfil, explorar hackatones publicados e
          inscribirte con tu cuenta institucional.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
              Datos visibles para inscripciones y formacion de equipos.
            </CardDescription>
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
            <CardTitle className="flex items-center gap-2">
              <CalendarDaysIcon className="size-5" />
              Hackatones
            </CardTitle>
            <CardDescription>Eventos activos e inscripciones.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {registrationCount ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              inscripciones activas
            </p>
            <Button
              className="mt-4"
              render={<Link href="/hackathons" />}
              variant="outline"
            >
              Explorar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipos</CardTitle>
            <CardDescription>Participaciones activas.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {teamMembershipCount ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              equipos vinculados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rol actual</CardTitle>
            <CardDescription>Permisos activos para esta sesion.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {user.roles.join(", ") || "participant"}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

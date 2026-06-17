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
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("career_area,skills,experience,completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const profileComplete = Boolean(profile?.completed_at);

  return (
    <AppShell user={user}>
      <section className="mb-8">
        <Badge variant="outline">Escala 1</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal">
          Hola{user.fullName ? `, ${user.fullName}` : ""}.
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Este es tu punto de partida en LIMA. Primero dejamos lista tu
          identidad institucional.
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

import { CalendarDaysIcon, MapPinIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createTeam, joinTeam } from "@/app/actions/teams";
import { RegistrationPanel } from "@/components/hackathons/registration-panel";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  formatDateRange,
  formatDateTime,
  getHackathonModalityLabel,
  getHackathonStatusLabel,
  isRegistrationOpen,
  type HackathonModality,
  type HackathonStatus,
} from "@/lib/hackathons";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type HackathonDetailRow = {
  description: string | null;
  ends_at: string;
  id: string;
  location: string | null;
  max_team_size: number;
  modality: HackathonModality;
  registration_deadline: string | null;
  starts_at: string;
  status: HackathonStatus;
  summary: string;
  title: string;
};

type RegistrationRow = {
  status: string;
};

type TeamRow = {
  id: string;
  join_code: string;
  name: string;
  team_members: { user_id: string }[] | null;
};

function noticeText(notice?: string) {
  if (notice === "registered") return "Inscripcion confirmada.";
  if (notice === "cancelled") return "Inscripcion cancelada.";
  if (notice === "closed") return "Las inscripciones ya no estan abiertas.";
  if (notice === "error") return "No pudimos procesar la inscripcion.";
  if (notice === "team-not-found") return "No encontramos un equipo con ese codigo.";
  if (notice === "team-full") return "Ese equipo ya esta completo.";
  if (notice === "team-error" || notice === "join-error") return "No pudimos procesar el equipo.";
  return null;
}

export default async function HackathonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const [
    { data: hackathonData, error: hackathonError },
    { data: registrationData },
    { data: profile },
    { data: teamsData },
    { data: publication },
  ] = await Promise.all([
    supabase
      .from("hackathons")
      .select(
        "id,title,summary,description,location,modality,status,starts_at,ends_at,registration_deadline,max_team_size",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("hackathon_registrations")
      .select("status")
      .eq("hackathon_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("completed_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("teams")
      .select("id,name,join_code,team_members(user_id)")
      .eq("hackathon_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("results_publications")
      .select("published_at")
      .eq("hackathon_id", id)
      .maybeSingle(),
  ]);

  if (hackathonError) {
    return (
      <AppShell user={user}>
        <Card>
          <CardHeader>
            <CardTitle>Falta una migracion</CardTitle>
            <CardDescription>
              Ejecuta `supabase/migrations/202606160003_hackathons.sql` en
              Supabase.
            </CardDescription>
          </CardHeader>
        </Card>
      </AppShell>
    );
  }

  if (!hackathonData) notFound();

  const hackathon = hackathonData as HackathonDetailRow;
  const registration = registrationData as RegistrationRow | null;
  const isRegistered = registration?.status === "registered";
  const teams = (teamsData ?? []) as TeamRow[];
  const myTeam = teams.find((team) =>
    (team.team_members ?? []).some((member) => member.user_id === user.id),
  );
  const isOpen = isRegistrationOpen({
    registrationDeadline: hackathon.registration_deadline,
    status: hackathon.status,
  });
  const notice = noticeText(query.notice);

  return (
    <AppShell user={user}>
      <section className="mb-8">
        <Button render={<Link href="/hackathons" />} size="sm" variant="ghost">
          Volver
        </Button>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">
            {getHackathonStatusLabel(hackathon.status)}
          </Badge>
          <Badge variant="secondary">
            {getHackathonModalityLabel(hackathon.modality)}
          </Badge>
          {isRegistered ? <Badge variant="success">Inscrito</Badge> : null}
        </div>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-normal">
          {hackathon.title}
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          {hackathon.summary}
        </p>
      </section>

      {notice ? (
        <div className="mb-4 rounded-lg border bg-card px-4 py-3 text-sm">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Detalle</CardTitle>
            <CardDescription>
              Informacion principal para decidir tu participacion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <CalendarDaysIcon className="mt-0.5 size-4 shrink-0" />
                <span>{formatDateRange(hackathon.starts_at, hackathon.ends_at)}</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                <span>{hackathon.location || "Ubicacion por confirmar"}</span>
              </p>
              <p className="flex items-start gap-2">
                <UsersIcon className="mt-0.5 size-4 shrink-0" />
                <span>Hasta {hackathon.max_team_size} integrantes por equipo</span>
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold tracking-normal">
                Descripcion
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {hackathon.description ||
                  "El administrador aun no agrego una descripcion extendida."}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold tracking-normal">
                Cierre de inscripcion
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatDateTime(hackathon.registration_deadline)}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <RegistrationPanel
            hackathonId={hackathon.id}
            isOpen={isOpen}
            isProfileComplete={Boolean(profile?.completed_at)}
            isRegistered={isRegistered}
            profileUrl={`/profile/${user.id}`}
            registrationDeadline={hackathon.registration_deadline}
          />

          {publication ? (
            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>El ranking final ya fue publicado.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button render={<Link href={`/results/${hackathon.id}`} />}>
                  Ver ranking
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {isRegistered ? (
        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Equipos</CardTitle>
              <CardDescription>
                Crea uno nuevo o usa un codigo para unirte.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {teams.length > 0 ? (
                teams.map((team) => (
                  <div
                    className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                    key={team.id}
                  >
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {(team.team_members ?? []).length} integrante(s)
                      </p>
                    </div>
                    <Button
                      render={<Link href={`/teams/${team.id}`} />}
                      size="sm"
                      variant="outline"
                    >
                      Ver equipo
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Todavia no hay equipos.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {myTeam ? (
              <Card>
                <CardHeader>
                  <CardTitle>Tu equipo</CardTitle>
                  <CardDescription>{myTeam.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button render={<Link href={`/teams/${myTeam.id}`} />}>
                    Abrir equipo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Crear equipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form action={createTeam} className="space-y-3">
                      <input name="hackathonId" type="hidden" value={hackathon.id} />
                      <Field>
                        <FieldLabel htmlFor="teamName">Nombre</FieldLabel>
                        <Input id="teamName" name="name" />
                      </Field>
                      <Button type="submit">Crear equipo</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Unirse</CardTitle>
                    <CardDescription>Usa el codigo de invitacion.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form action={joinTeam} className="space-y-3">
                      <input name="hackathonId" type="hidden" value={hackathon.id} />
                      <Field>
                        <FieldLabel htmlFor="joinCode">Codigo</FieldLabel>
                        <Input id="joinCode" name="joinCode" />
                      </Field>
                      <Button type="submit" variant="outline">
                        Unirme
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}

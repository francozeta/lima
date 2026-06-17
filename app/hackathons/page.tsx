import { SearchIcon } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { HackathonCard, type HackathonCardData } from "@/components/hackathons/hackathon-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type RegistrationRow = {
  hackathon_id: string;
  status: string;
};

function noticeText(notice?: string) {
  if (notice === "invalid") return "El hackaton solicitado no es valido.";
  if (notice === "missing") return "No encontramos ese hackaton.";
  return null;
}

export default async function HackathonsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const params = await searchParams;

  const [{ data, error }, { data: registrations }] = await Promise.all([
    supabase
      .from("hackathons")
      .select(
        "id,title,summary,location,modality,status,starts_at,ends_at,registration_deadline,max_team_size",
      )
      .eq("status", "published")
      .order("starts_at", { ascending: true }),
    supabase
      .from("hackathon_registrations")
      .select("hackathon_id,status")
      .eq("user_id", user.id),
  ]);

  const notice = noticeText(params.notice);
  const hackathons = (data ?? []) as HackathonCardData[];
  const registeredIds = new Set(
    ((registrations ?? []) as RegistrationRow[])
      .filter((registration) => registration.status === "registered")
      .map((registration) => registration.hackathon_id),
  );

  return (
    <AppShell user={user}>
      <section className="mb-8">
        <Badge variant="outline">Escala 2</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal">
          Hackatones disponibles
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Explora eventos publicados, revisa fechas y gestiona tu inscripcion.
        </p>
      </section>

      {notice ? (
        <div className="mb-4 rounded-lg border bg-card px-4 py-3 text-sm">
          {notice}
        </div>
      ) : null}

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Falta una migracion</CardTitle>
            <CardDescription>
              Ejecuta `supabase/migrations/202606160003_hackathons.sql` en
              Supabase.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : hackathons.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {hackathons.map((hackathon) => (
            <HackathonCard
              hackathon={hackathon}
              key={hackathon.id}
              registered={registeredIds.has(hackathon.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchIcon className="size-5" />
              Sin hackatones publicados
            </CardTitle>
            <CardDescription>
              Cuando un administrador publique uno, aparecera aqui.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Puedes completar tu perfil mientras tanto para estar listo.
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

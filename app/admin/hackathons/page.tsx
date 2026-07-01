import { Trash2Icon } from "lucide-react";
import Link from "next/link";
import { deleteHackathon } from "@/app/actions/hackathons";
import {
  CreateHackathonForm,
  type HackathonFormValues,
  UpdateHackathonForm,
} from "@/components/admin/hackathon-form";
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
  toDateTimeLocalValue,
  type HackathonModality,
  type HackathonStatus,
} from "@/lib/hackathons";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type AdminHackathonRow = {
  description: string | null;
  ends_at: string;
  id: string;
  location: string | null;
  max_team_size: number;
  modality: HackathonModality;
  registration_deadline: string | null;
  slug: string;
  starts_at: string;
  status: HackathonStatus;
  summary: string;
  title: string;
};

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setMinutes(0, 0, 0);
  return date.toISOString();
}

function defaultCreateValues(): HackathonFormValues {
  return {
    description: "",
    endsAt: toDateTimeLocalValue(addDays(15)),
    location: "Campus CERTUS",
    maxTeamSize: 5,
    modality: "hybrid",
    registrationDeadline: toDateTimeLocalValue(addDays(13)),
    slug: "",
    startsAt: toDateTimeLocalValue(addDays(14)),
    status: "draft",
    summary: "",
    title: "",
  };
}

function toFormValues(hackathon: AdminHackathonRow): HackathonFormValues {
  return {
    description: hackathon.description ?? "",
    endsAt: toDateTimeLocalValue(hackathon.ends_at),
    id: hackathon.id,
    location: hackathon.location ?? "",
    maxTeamSize: hackathon.max_team_size,
    modality: hackathon.modality,
    registrationDeadline: toDateTimeLocalValue(hackathon.registration_deadline),
    slug: hackathon.slug,
    startsAt: toDateTimeLocalValue(hackathon.starts_at),
    status: hackathon.status,
    summary: hackathon.summary,
    title: hackathon.title,
  };
}

export default async function AdminHackathonsPage() {
  const user = await requireRole(["admin"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hackathons")
    .select(
      "id,title,slug,summary,description,location,modality,status,starts_at,ends_at,registration_deadline,max_team_size",
    )
    .order("created_at", { ascending: false });

  const hackathons = (data ?? []) as AdminHackathonRow[];

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
          Hackatones
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Crea, prepara y publica hackatones para los participantes.
        </p>
      </section>

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
      ) : (
        <div className="grid gap-6">
          <CreateHackathonForm values={defaultCreateValues()} />

          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-normal">
              Hackatones creados
            </h2>
            {hackathons.length > 0 ? (
              <div className="grid gap-4">
                {hackathons.map((hackathon) => (
                  <div className="grid gap-2" key={hackathon.id}>
                    <UpdateHackathonForm values={toFormValues(hackathon)} />
                    <div className="flex justify-end gap-2">
                      <Button
                        render={<Link href={`/admin/hackathons/${hackathon.id}`} />}
                        variant="outline"
                      >
                        Configurar
                      </Button>
                      <form action={deleteHackathon}>
                        <input name="id" type="hidden" value={hackathon.id} />
                        <Button type="submit" variant="destructive-outline">
                          <Trash2Icon />
                          Eliminar
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No hay hackatones creados</CardTitle>
                  <CardDescription>
                    Usa el formulario superior para crear el primero.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}

import { Trash2Icon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  assignJudge,
  deleteCriterion,
  publishResults,
  removeJudgeAssignment,
  upsertCriterion,
} from "@/app/actions/admin";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type CriterionRow = {
  description: string | null;
  id: string;
  max_score: number;
  name: string;
  position: number;
  weight: number;
};

type UserRoleRow = {
  roles: { slug?: string } | { slug?: string }[] | null;
  user_id: string;
  users:
    | { email: string; full_name: string | null }
    | { email: string; full_name: string | null }[]
    | null;
};

type AssignmentRow = {
  judge_id: string;
  users:
    | { email: string; full_name: string | null }
    | { email: string; full_name: string | null }[]
    | null;
};

function getRoleSlug(row: UserRoleRow) {
  const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
  return role?.slug ?? null;
}

function getUserLabel(
  user:
    | { email: string; full_name: string | null }
    | { email: string; full_name: string | null }[]
    | null,
  fallback: string,
) {
  const row = Array.isArray(user) ? user[0] : user;
  return row?.full_name || row?.email || fallback;
}

export default async function AdminHackathonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["admin"]);
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: hackathon },
    { data: criteria },
    { data: userRoles },
    { data: assignments },
    { count: projectCount },
    { count: teamCount },
    { data: publication },
  ] = await Promise.all([
    supabase.from("hackathons").select("id,title").eq("id", id).maybeSingle(),
    supabase
      .from("evaluation_criteria")
      .select("id,name,description,weight,max_score,position")
      .eq("hackathon_id", id)
      .order("position", { ascending: true }),
    supabase.from("user_roles").select("user_id,users(full_name,email),roles(slug)"),
    supabase
      .from("judge_assignments")
      .select("judge_id,users(full_name,email)")
      .eq("hackathon_id", id),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("hackathon_id", id)
      .eq("status", "submitted"),
    supabase
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("hackathon_id", id),
    supabase
      .from("results_publications")
      .select("published_at")
      .eq("hackathon_id", id)
      .maybeSingle(),
  ]);

  if (!hackathon) notFound();

  const judgeUsers = ((userRoles ?? []) as unknown as UserRoleRow[]).filter(
    (row) => getRoleSlug(row) === "judge",
  );
  const assignedJudges = (assignments ?? []) as unknown as AssignmentRow[];

  return (
    <AppShell user={user}>
      <section className="mb-8">
        <Button render={<Link href="/admin/hackathons" />} size="sm" variant="ghost">
          Volver
        </Button>
        <Badge className="mt-4" variant="outline">
          Admin
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal">
          {hackathon.title}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Configura evaluacion, jurados y publicacion de resultados.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Equipos</CardTitle>
            <CardDescription>Formados</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">
            {teamCount ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Proyectos</CardTitle>
            <CardDescription>Enviados</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">
            {projectCount ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
            <CardDescription>
              {publication ? "Publicados" : "Pendientes"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={publishResults} className="space-y-3">
              <input name="hackathonId" type="hidden" value={id} />
              <Textarea name="note" placeholder="Nota final opcional" rows={3} />
              <Button type="submit">
                {publication ? "Republicar" : "Publicar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Criterios</CardTitle>
            <CardDescription>
              Pesos usados para el ranking ponderado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form action={upsertCriterion} className="grid gap-4 md:grid-cols-2">
              <input name="hackathonId" type="hidden" value={id} />
              <Field>
                <FieldLabel htmlFor="criterionName">Nombre</FieldLabel>
                <Input id="criterionName" name="name" />
              </Field>
              <Field>
                <FieldLabel htmlFor="criterionWeight">Peso</FieldLabel>
                <Input
                  defaultValue="0.25"
                  id="criterionWeight"
                  max="1"
                  min="0.01"
                  name="weight"
                  nativeInput
                  step="0.01"
                  type="number"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="criterionMax">Puntaje max.</FieldLabel>
                <Input
                  defaultValue="10"
                  id="criterionMax"
                  min="1"
                  name="maxScore"
                  nativeInput
                  type="number"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="criterionPosition">Orden</FieldLabel>
                <Input
                  defaultValue="0"
                  id="criterionPosition"
                  min="0"
                  name="position"
                  nativeInput
                  type="number"
                />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="criterionDescription">Descripcion</FieldLabel>
                <Textarea id="criterionDescription" name="description" rows={3} />
              </Field>
              <div className="md:col-span-2">
                <Button type="submit">Guardar criterio</Button>
              </div>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criterio</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Max</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {((criteria ?? []) as CriterionRow[]).map((criterion) => (
                  <TableRow key={criterion.id}>
                    <TableCell>
                      <div className="font-medium">{criterion.name}</div>
                      <div className="mt-1 text-muted-foreground">
                        {criterion.description}
                      </div>
                    </TableCell>
                    <TableCell>{criterion.weight}</TableCell>
                    <TableCell>{criterion.max_score}</TableCell>
                    <TableCell>
                      <form action={deleteCriterion}>
                        <input name="id" type="hidden" value={criterion.id} />
                        <input name="hackathonId" type="hidden" value={id} />
                        <Button size="sm" type="submit" variant="destructive-outline">
                          <Trash2Icon />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jurados</CardTitle>
            <CardDescription>Usuarios con rol `judge`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={assignJudge} className="space-y-3">
              <input name="hackathonId" type="hidden" value={id} />
              <select
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                name="judgeId"
              >
                {judgeUsers.map((judge) => (
                  <option key={judge.user_id} value={judge.user_id}>
                    {getUserLabel(judge.users, judge.user_id)}
                  </option>
                ))}
              </select>
              <Button disabled={judgeUsers.length === 0} type="submit">
                Asignar jurado
              </Button>
            </form>

            <div className="grid gap-2">
              {assignedJudges.length > 0 ? (
                assignedJudges.map((assignment) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    key={assignment.judge_id}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {getUserLabel(assignment.users, assignment.judge_id)}
                      </p>
                    </div>
                    <form action={removeJudgeAssignment}>
                      <input name="hackathonId" type="hidden" value={id} />
                      <input
                        name="judgeId"
                        type="hidden"
                        value={assignment.judge_id}
                      />
                      <Button size="sm" type="submit" variant="outline">
                        Quitar
                      </Button>
                    </form>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aun no hay jurados asignados.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

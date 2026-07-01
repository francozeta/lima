import { ClipboardCheckIcon, ExternalLinkIcon } from "lucide-react";
import { submitEvaluation } from "@/app/actions/judge";
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
import { formatDateRange } from "@/lib/hackathons";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type AssignmentRow = {
  hackathon_id: string;
  hackathons:
    | {
        ends_at: string;
        id: string;
        starts_at: string;
        title: string;
      }
    | {
        ends_at: string;
        id: string;
        starts_at: string;
        title: string;
      }[]
    | null;
};

type CriterionRow = {
  description: string | null;
  hackathon_id: string;
  id: string;
  max_score: number;
  name: string;
  position: number;
  weight: number;
};

type ProjectRow = {
  demo_url: string | null;
  description: string;
  evaluations: EvaluationRow[] | null;
  hackathon_id: string;
  id: string;
  project_files: ProjectFileRow[] | null;
  repository_url: string | null;
  teams: { name: string } | { name: string }[] | null;
  title: string;
};

type EvaluationRow = {
  comments: string | null;
  evaluation_scores: { criteria_id: string; score: number }[] | null;
  id: string;
  judge_id: string;
  validated_at: string | null;
};

type ProjectFileRow = {
  filename: string;
  id: string;
  storage_path: string;
};

function noticeText(notice?: string) {
  if (notice === "evaluation-saved") return "Evaluacion guardada.";
  if (notice === "no-criteria") return "Este hackaton aun no tiene criterios.";
  if (notice === "evaluation-error") return "No pudimos guardar la evaluacion.";
  return null;
}

function getScore(evaluation: EvaluationRow | null, criteriaId: string) {
  const score = evaluation?.evaluation_scores?.find(
    (item) => item.criteria_id === criteriaId,
  );
  return score?.score ?? "";
}

function getHackathon(row: AssignmentRow["hackathons"]) {
  return Array.isArray(row) ? row[0] : row;
}

function getTeamName(row: ProjectRow["teams"]) {
  const team = Array.isArray(row) ? row[0] : row;
  return team?.name ?? "Equipo";
}

export default async function JudgePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireRole(["judge", "admin"]);
  const query = await searchParams;
  const supabase = await createClient();

  const [{ data: assignments }, { data: criteria }, { data: projects }] =
    await Promise.all([
      supabase
        .from("judge_assignments")
        .select("hackathon_id,hackathons(id,title,starts_at,ends_at)")
        .order("created_at", { ascending: false }),
      supabase
        .from("evaluation_criteria")
        .select("id,hackathon_id,name,description,weight,max_score,position")
        .order("position", { ascending: true }),
      supabase
        .from("projects")
        .select(
          "id,hackathon_id,title,description,repository_url,demo_url,teams(name),project_files(id,filename,storage_path),evaluations(id,judge_id,comments,validated_at,evaluation_scores(criteria_id,score))",
        )
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false }),
    ]);

  const assignmentRows = (assignments ?? []) as unknown as AssignmentRow[];
  const criteriaRows = (criteria ?? []) as CriterionRow[];
  const projectRows = (projects ?? []) as unknown as ProjectRow[];
  const signedProjects = await Promise.all(
    projectRows.map(async (project) => {
      const signedFiles = await Promise.all(
        (project.project_files ?? []).map(async (file) => {
          const { data: signed } = await supabase.storage
            .from("project-deliverables")
            .createSignedUrl(file.storage_path, 60 * 10);

          return { ...file, signedUrl: signed?.signedUrl ?? null };
        }),
      );

      return { ...project, signedFiles };
    }),
  );
  const notice = noticeText(query.notice);

  return (
    <AppShell user={user}>
      <section className="mb-8">
        <Badge variant="outline">Jurado</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal">
          Evaluaciones
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Revisa proyectos enviados y valida puntajes por criterio.
        </p>
      </section>

      {notice ? (
        <div className="mb-4 rounded-lg border bg-card px-4 py-3 text-sm">
          {notice}
        </div>
      ) : null}

      {assignmentRows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No tienes hackatones asignados</CardTitle>
            <CardDescription>
              Un administrador debe asignarte como jurado.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6">
          {assignmentRows.map((assignment) => {
            const hackathon = getHackathon(assignment.hackathons);
            const hackathonCriteria = criteriaRows.filter(
              (criterion) => criterion.hackathon_id === assignment.hackathon_id,
            );
            const hackathonProjects = signedProjects.filter(
              (project) => project.hackathon_id === assignment.hackathon_id,
            );

            return (
              <section className="grid gap-4" key={assignment.hackathon_id}>
                <div>
                  <h2 className="text-xl font-semibold tracking-normal">
                    {hackathon?.title ?? "Hackaton"}
                  </h2>
                  {hackathon ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateRange(hackathon.starts_at, hackathon.ends_at)}
                    </p>
                  ) : null}
                </div>

                {hackathonProjects.length > 0 ? (
                  hackathonProjects.map((project) => {
                    const evaluation =
                      project.evaluations?.find(
                        (item) => item.judge_id === user.id,
                      ) ?? null;

                    return (
                      <Card key={project.id}>
                        <CardHeader>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={evaluation?.validated_at ? "success" : "outline"}>
                              {evaluation?.validated_at ? "Validado" : "Pendiente"}
                            </Badge>
                            <Badge variant="secondary">
                              {getTeamName(project.teams)}
                            </Badge>
                          </div>
                          <CardTitle>{project.title}</CardTitle>
                          <CardDescription>{project.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          <div className="flex flex-wrap gap-2">
                            {project.repository_url ? (
                              <Button render={<a href={project.repository_url} />} size="sm" variant="outline">
                                <ExternalLinkIcon />
                                Repo
                              </Button>
                            ) : null}
                            {project.demo_url ? (
                              <Button render={<a href={project.demo_url} />} size="sm" variant="outline">
                                <ExternalLinkIcon />
                                Demo
                              </Button>
                            ) : null}
                            {project.signedFiles.map((file) =>
                              file.signedUrl ? (
                                <Button
                                  key={file.id}
                                  render={<a href={file.signedUrl} />}
                                  size="sm"
                                  variant="outline"
                                >
                                  {file.filename}
                                </Button>
                              ) : null,
                            )}
                          </div>

                          <form action={submitEvaluation} className="space-y-4">
                            <input name="projectId" type="hidden" value={project.id} />
                            <input
                              name="hackathonId"
                              type="hidden"
                              value={assignment.hackathon_id}
                            />
                            <div className="grid gap-4 md:grid-cols-2">
                              {hackathonCriteria.map((criterion) => (
                                <Field key={criterion.id}>
                                  <FieldLabel htmlFor={`${project.id}-${criterion.id}`}>
                                    {criterion.name} / {criterion.max_score}
                                  </FieldLabel>
                                  <Input
                                    defaultValue={getScore(evaluation, criterion.id)}
                                    id={`${project.id}-${criterion.id}`}
                                    max={criterion.max_score}
                                    min={0}
                                    name={`score:${criterion.id}`}
                                    nativeInput
                                    step="0.1"
                                    type="number"
                                  />
                                </Field>
                              ))}
                            </div>
                            <Field>
                              <FieldLabel htmlFor={`comments-${project.id}`}>
                                Comentarios
                              </FieldLabel>
                              <Textarea
                                defaultValue={evaluation?.comments ?? ""}
                                id={`comments-${project.id}`}
                                name="comments"
                                rows={4}
                              />
                            </Field>
                            <Button type="submit">
                              <ClipboardCheckIcon />
                              Validar evaluacion
                            </Button>
                          </form>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No hay proyectos enviados</CardTitle>
                      <CardDescription>
                        Apareceran cuando los equipos envien sus entregables.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

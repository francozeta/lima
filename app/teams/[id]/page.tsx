import { FileArchiveIcon, LinkIcon, UploadIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  deleteProjectFile,
  leaveTeam,
  saveProject,
  uploadProjectFile,
} from "@/app/actions/teams";
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
import { formatDateTime } from "@/lib/hackathons";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type TeamPageRow = {
  hackathon_id: string;
  hackathons:
    | { id: string; max_team_size: number; title: string }
    | { id: string; max_team_size: number; title: string }[]
    | null;
  id: string;
  join_code: string;
  name: string;
  projects:
    | {
        demo_url: string | null;
        description: string;
        id: string;
        project_files: ProjectFileRow[] | null;
        repository_url: string | null;
        status: string;
        submitted_at: string | null;
        title: string;
      }[]
    | null;
  team_members: TeamMemberRow[] | null;
};

type TeamMemberRow = {
  role: string;
  user_id: string;
  users:
    | { email: string; full_name: string | null }
    | { email: string; full_name: string | null }[]
    | null;
};

type ProjectFileRow = {
  content_type: string | null;
  created_at: string;
  filename: string;
  id: string;
  size_bytes: number;
  storage_path: string;
};

function noticeText(notice?: string) {
  if (notice === "team-created") return "Equipo creado.";
  if (notice === "joined") return "Te uniste al equipo.";
  if (notice === "already-in-team") return "Ya tienes equipo en este hackaton.";
  if (notice === "project-saved") return "Proyecto guardado.";
  if (notice === "file-uploaded") return "Entregable subido.";
  if (notice === "file-deleted") return "Entregable eliminado.";
  if (notice === "file-type") return "Solo se permiten PDF, PPT/PPTX o ZIP hasta 50 MB.";
  if (notice === "project-error" || notice === "file-error") return "No pudimos procesar la accion.";
  return null;
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${Math.round((value / (1024 * 1024)) * 10) / 10} MB`;
}

function getHackathon(row: TeamPageRow["hackathons"]) {
  return Array.isArray(row) ? row[0] : row;
}

function getMemberUser(row: TeamMemberRow["users"]) {
  return Array.isArray(row) ? row[0] : row;
}

export default async function TeamPage({
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

  const { data, error } = await supabase
    .from("teams")
    .select(
      "id,name,join_code,hackathon_id,hackathons(id,title,max_team_size),team_members(role,user_id,users(full_name,email)),projects(id,title,description,repository_url,demo_url,status,submitted_at,project_files(id,filename,storage_path,content_type,size_bytes,created_at))",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) redirect("/hackathons?notice=team-error");
  if (!data) notFound();

  const team = data as unknown as TeamPageRow;
  const hackathon = getHackathon(team.hackathons);
  const members = team.team_members ?? [];
  const isMember = members.some((member) => member.user_id === user.id);
  const project = team.projects?.[0] ?? null;
  const files = project?.project_files ?? [];
  const signedFiles = await Promise.all(
    files.map(async (file) => {
      const { data: signed } = await supabase.storage
        .from("project-deliverables")
        .createSignedUrl(file.storage_path, 60 * 10);

      return {
        ...file,
        signedUrl: signed?.signedUrl ?? null,
      };
    }),
  );
  const notice = noticeText(query.notice);

  return (
    <AppShell user={user}>
      <section className="mb-8">
        <Button
          render={<Link href={`/hackathons/${team.hackathon_id}`} />}
          size="sm"
          variant="ghost"
        >
          Volver
        </Button>
        <Badge className="mt-4" variant="outline">
          Equipo
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal">
          {team.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {hackathon?.title ?? "Hackaton"}
        </p>
      </section>

      {notice ? (
        <div className="mb-4 rounded-lg border bg-card px-4 py-3 text-sm">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proyecto</CardTitle>
              <CardDescription>
                Guarda el avance y marca como enviado cuando este listo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={saveProject} className="space-y-4">
                <input name="teamId" type="hidden" value={team.id} />
                <Field>
                  <FieldLabel htmlFor="title">Titulo</FieldLabel>
                  <Input
                    defaultValue={project?.title ?? ""}
                    id="title"
                    name="title"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="description">Descripcion</FieldLabel>
                  <Textarea
                    defaultValue={project?.description ?? ""}
                    id="description"
                    name="description"
                    rows={6}
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="repositoryUrl">Repositorio</FieldLabel>
                    <Input
                      defaultValue={project?.repository_url ?? ""}
                      id="repositoryUrl"
                      name="repositoryUrl"
                      placeholder="https://github.com/..."
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="demoUrl">Demo</FieldLabel>
                    <Input
                      defaultValue={project?.demo_url ?? ""}
                      id="demoUrl"
                      name="demoUrl"
                      placeholder="https://..."
                    />
                  </Field>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button name="status" type="submit" value="draft" variant="outline">
                    Guardar borrador
                  </Button>
                  <Button name="status" type="submit" value="submitted">
                    Enviar proyecto
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Entregables</CardTitle>
              <CardDescription>PDF, PPTX o ZIP del proyecto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {project ? (
                <form action={uploadProjectFile} className="flex flex-col gap-3 sm:flex-row">
                  <input name="projectId" type="hidden" value={project.id} />
                  <input name="teamId" type="hidden" value={team.id} />
                  <Input name="file" nativeInput type="file" />
                  <Button type="submit">
                    <UploadIcon />
                    Subir
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Guarda primero la ficha del proyecto para subir archivos.
                </p>
              )}

              <div className="grid gap-2">
                {signedFiles.length > 0 ? (
                  signedFiles.map((file) => (
                    <div
                      className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                      key={file.id}
                    >
                      <div>
                        <p className="flex items-center gap-2 font-medium">
                          <FileArchiveIcon className="size-4" />
                          {file.filename}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatBytes(file.size_bytes)} · {formatDateTime(file.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {file.signedUrl ? (
                          <Button render={<a href={file.signedUrl} />} size="sm" variant="outline">
                            Abrir
                          </Button>
                        ) : null}
                        {isMember ? (
                          <form action={deleteProjectFile}>
                            <input name="fileId" type="hidden" value={file.id} />
                            <input name="teamId" type="hidden" value={team.id} />
                            <Button size="sm" type="submit" variant="destructive-outline">
                              Eliminar
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aun no hay entregables.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="size-5" />
                Integrantes
              </CardTitle>
              <CardDescription>
                Codigo para unirse: <span className="font-mono">{team.join_code}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map((member) => (
                <div key={member.user_id} className="rounded-lg border bg-background p-3">
                  <p className="font-medium">
                    {getMemberUser(member.users)?.full_name ||
                      getMemberUser(member.users)?.email ||
                      "Usuario"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
                </div>
              ))}
              <p className="text-sm text-muted-foreground">
                {members.length}/{hackathon?.max_team_size ?? 5} integrantes
              </p>
              {isMember ? (
                <form action={leaveTeam}>
                  <input name="teamId" type="hidden" value={team.id} />
                  <Button type="submit" variant="outline">
                    Salir del equipo
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>

          {project?.repository_url || project?.demo_url ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="size-5" />
                  Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.repository_url ? (
                  <Button render={<a href={project.repository_url} />} variant="outline">
                    Repositorio
                  </Button>
                ) : null}
                {project.demo_url ? (
                  <Button render={<a href={project.demo_url} />} variant="outline">
                    Demo
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

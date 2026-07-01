import Link from "next/link";
import { notFound } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateRanking, type RankingProject } from "@/lib/ranking";
import { formatDateTime } from "@/lib/hackathons";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type ProjectRow = {
  evaluations: EvaluationRow[] | null;
  id: string;
  teams: { id: string; name: string } | { id: string; name: string }[] | null;
  title: string;
};

type EvaluationRow = {
  evaluation_scores: { criteria_id: string; score: number }[] | null;
  id: string;
  validated_at: string | null;
};

type CriterionRow = {
  id: string;
  max_score: number;
  weight: number;
};

function getTeam(row: ProjectRow["teams"]) {
  return Array.isArray(row) ? row[0] : row;
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ hackathonId: string }>;
}) {
  const user = await requireUser();
  const { hackathonId } = await params;
  const supabase = await createClient();

  const [
    { data: hackathon },
    { data: publication },
    { data: judgeAssignment },
    { data: criteria },
    { data: projects },
  ] = await Promise.all([
    supabase
      .from("hackathons")
      .select("id,title")
      .eq("id", hackathonId)
      .maybeSingle(),
    supabase
      .from("results_publications")
      .select("published_at,note")
      .eq("hackathon_id", hackathonId)
      .maybeSingle(),
    supabase
      .from("judge_assignments")
      .select("hackathon_id")
      .eq("hackathon_id", hackathonId)
      .eq("judge_id", user.id)
      .maybeSingle(),
    supabase
      .from("evaluation_criteria")
      .select("id,weight,max_score")
      .eq("hackathon_id", hackathonId),
    supabase
      .from("projects")
      .select(
        "id,title,teams(id,name),evaluations(id,validated_at,evaluation_scores(criteria_id,score))",
      )
      .eq("hackathon_id", hackathonId)
      .eq("status", "submitted"),
  ]);

  if (!hackathon) notFound();

  const canPreview =
    Boolean(publication) ||
    user.roles.includes("admin") ||
    Boolean(judgeAssignment);

  if (!canPreview) {
    return (
      <AppShell user={user}>
        <Card>
          <CardHeader>
            <CardTitle>Resultados no publicados</CardTitle>
            <CardDescription>
              El administrador aun no publico el ranking final.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href={`/hackathons/${hackathonId}`} />}>
              Volver al hackaton
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const criteriaMap = new Map(
    ((criteria ?? []) as CriterionRow[]).map((criterion) => [
      criterion.id,
      criterion,
    ]),
  );
  const rankingInput: RankingProject[] = (
    (projects ?? []) as unknown as ProjectRow[]
  ).map(
    (project) => ({
      evaluations: (project.evaluations ?? [])
        .filter((evaluation) => evaluation.validated_at)
        .map((evaluation) => ({
          scores: (evaluation.evaluation_scores ?? []).map((score) => {
            const criterion = criteriaMap.get(score.criteria_id);
            return {
              criteriaId: score.criteria_id,
              maxScore: criterion?.max_score ?? 10,
              score: Number(score.score),
              weight: Number(criterion?.weight ?? 1),
            };
          }),
        })),
      projectId: project.id,
      teamId: getTeam(project.teams)?.id ?? project.id,
      teamName: getTeam(project.teams)?.name ?? "Equipo",
    }),
  );
  const ranking = calculateRanking(rankingInput);

  return (
    <AppShell user={user}>
      <section className="mb-8">
        <Button
          render={<Link href={`/hackathons/${hackathonId}`} />}
          size="sm"
          variant="ghost"
        >
          Volver
        </Button>
        <Badge className="mt-4" variant={publication ? "success" : "outline"}>
          {publication ? "Publicado" : "Preview admin/jurado"}
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal">
          Resultados · {hackathon.title}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {publication
            ? `Publicado el ${formatDateTime(publication.published_at)}`
            : "Vista previa antes de publicar resultados finales."}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Ranking</CardTitle>
          <CardDescription>
            Ordenado por promedio ponderado de evaluaciones validadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ranking.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posicion</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Puntaje</TableHead>
                  <TableHead>Evaluaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((item) => (
                  <TableRow key={item.projectId}>
                    <TableCell>#{item.rank}</TableCell>
                    <TableCell className="font-medium">{item.teamName}</TableCell>
                    <TableCell>{item.totalScore.toFixed(2)}</TableCell>
                    <TableCell>{item.evaluationsCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aun no hay proyectos evaluados para calcular ranking.
            </p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

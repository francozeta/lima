"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/mvp";

export async function submitEvaluation(formData: FormData) {
  const user = await requireRole(["judge", "admin"]);
  const projectId = uuidSchema.safeParse(formData.get("projectId"));
  const hackathonId = uuidSchema.safeParse(formData.get("hackathonId"));
  const comments = String(formData.get("comments") ?? "").trim();

  if (!projectId.success || !hackathonId.success) {
    redirect("/judge?notice=evaluation-error");
  }

  const supabase = await createClient();
  const { data: criteria } = await supabase
    .from("evaluation_criteria")
    .select("id,max_score")
    .eq("hackathon_id", hackathonId.data);

  if (!criteria || criteria.length === 0) {
    redirect("/judge?notice=no-criteria");
  }

  const { data: evaluation, error } = await supabase
    .from("evaluations")
    .upsert(
      {
        comments,
        judge_id: user.id,
        project_id: projectId.data,
        validated_at: new Date().toISOString(),
      },
      { onConflict: "project_id,judge_id" },
    )
    .select("id")
    .single();

  if (error || !evaluation?.id) redirect("/judge?notice=evaluation-error");

  const scoreRows = criteria.map((criterion) => {
    const rawScore = Number(formData.get(`score:${criterion.id}`) ?? 0);
    const maxScore = Number(criterion.max_score ?? 10);
    const score = Math.min(Math.max(rawScore, 0), maxScore);

    return {
      criteria_id: criterion.id,
      evaluation_id: evaluation.id,
      score,
    };
  });

  const { error: scoresError } = await supabase
    .from("evaluation_scores")
    .upsert(scoreRows, { onConflict: "evaluation_id,criteria_id" });

  if (scoresError) redirect("/judge?notice=evaluation-error");

  revalidatePath("/judge");
  revalidatePath(`/results/${hackathonId.data}`);
  redirect("/judge?notice=evaluation-saved");
}

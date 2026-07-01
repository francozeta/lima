"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  criterionSchema,
  judgeAssignmentSchema,
  publicationSchema,
  roleUpdateSchema,
  uuidSchema,
} from "@/lib/validation/mvp";

export async function updateUserRoles(formData: FormData) {
  await requireRole(["admin"]);

  const parsed = roleUpdateSchema.safeParse({
    roles: formData.getAll("roles"),
    userId: formData.get("userId"),
  });

  if (!parsed.success) redirect("/admin/users?notice=roles-error");

  const supabase = await createClient();
  const { data: roles } = await supabase
    .from("roles")
    .select("id,slug")
    .in("slug", parsed.data.roles);

  if (!roles || roles.length === 0) redirect("/admin/users?notice=roles-error");

  await supabase.from("user_roles").delete().eq("user_id", parsed.data.userId);

  const { error } = await supabase.from("user_roles").insert(
    roles.map((role) => ({
      role_id: role.id,
      user_id: parsed.data.userId,
    })),
  );

  if (error) redirect("/admin/users?notice=roles-error");

  revalidatePath("/admin/users");
  redirect("/admin/users?notice=roles-updated");
}

export async function upsertCriterion(formData: FormData) {
  await requireRole(["admin"]);

  const parsed = criterionSchema.safeParse({
    description: formData.get("description"),
    hackathonId: formData.get("hackathonId"),
    maxScore: formData.get("maxScore"),
    name: formData.get("name"),
    position: formData.get("position"),
    weight: formData.get("weight"),
  });

  if (!parsed.success) redirect("/admin/hackathons?notice=criteria-error");

  const supabase = await createClient();
  const { error } = await supabase.from("evaluation_criteria").upsert(
    {
      description: parsed.data.description || null,
      hackathon_id: parsed.data.hackathonId,
      max_score: parsed.data.maxScore,
      name: parsed.data.name,
      position: parsed.data.position,
      weight: parsed.data.weight,
    },
    { onConflict: "hackathon_id,name" },
  );

  if (error) {
    redirect(`/admin/hackathons/${parsed.data.hackathonId}?notice=criteria-error`);
  }

  revalidatePath(`/admin/hackathons/${parsed.data.hackathonId}`);
  revalidatePath(`/results/${parsed.data.hackathonId}`);
  redirect(`/admin/hackathons/${parsed.data.hackathonId}?notice=criteria-saved`);
}

export async function deleteCriterion(formData: FormData) {
  await requireRole(["admin"]);

  const id = uuidSchema.safeParse(formData.get("id"));
  const hackathonId = uuidSchema.safeParse(formData.get("hackathonId"));

  if (!id.success || !hackathonId.success) redirect("/admin/hackathons");

  const supabase = await createClient();
  await supabase.from("evaluation_criteria").delete().eq("id", id.data);

  revalidatePath(`/admin/hackathons/${hackathonId.data}`);
  redirect(`/admin/hackathons/${hackathonId.data}?notice=criteria-deleted`);
}

export async function assignJudge(formData: FormData) {
  const admin = await requireRole(["admin"]);
  const parsed = judgeAssignmentSchema.safeParse({
    hackathonId: formData.get("hackathonId"),
    judgeId: formData.get("judgeId"),
  });

  if (!parsed.success) redirect("/admin/hackathons?notice=judge-error");

  const supabase = await createClient();
  const { error } = await supabase.from("judge_assignments").upsert(
    {
      assigned_by: admin.id,
      hackathon_id: parsed.data.hackathonId,
      judge_id: parsed.data.judgeId,
    },
    { onConflict: "hackathon_id,judge_id" },
  );

  if (error) {
    redirect(`/admin/hackathons/${parsed.data.hackathonId}?notice=judge-error`);
  }

  revalidatePath(`/admin/hackathons/${parsed.data.hackathonId}`);
  revalidatePath("/judge");
  redirect(`/admin/hackathons/${parsed.data.hackathonId}?notice=judge-assigned`);
}

export async function removeJudgeAssignment(formData: FormData) {
  await requireRole(["admin"]);
  const parsed = judgeAssignmentSchema.safeParse({
    hackathonId: formData.get("hackathonId"),
    judgeId: formData.get("judgeId"),
  });

  if (!parsed.success) redirect("/admin/hackathons?notice=judge-error");

  const supabase = await createClient();
  await supabase
    .from("judge_assignments")
    .delete()
    .eq("hackathon_id", parsed.data.hackathonId)
    .eq("judge_id", parsed.data.judgeId);

  revalidatePath(`/admin/hackathons/${parsed.data.hackathonId}`);
  revalidatePath("/judge");
  redirect(`/admin/hackathons/${parsed.data.hackathonId}?notice=judge-removed`);
}

export async function publishResults(formData: FormData) {
  const admin = await requireRole(["admin"]);
  const parsed = publicationSchema.safeParse({
    hackathonId: formData.get("hackathonId"),
    note: formData.get("note"),
  });

  if (!parsed.success) redirect("/admin/hackathons?notice=publish-error");

  const supabase = await createClient();
  const { error } = await supabase.from("results_publications").upsert(
    {
      hackathon_id: parsed.data.hackathonId,
      note: parsed.data.note || null,
      published_at: new Date().toISOString(),
      published_by: admin.id,
    },
    { onConflict: "hackathon_id" },
  );

  if (error) {
    redirect(`/admin/hackathons/${parsed.data.hackathonId}?notice=publish-error`);
  }

  revalidatePath(`/admin/hackathons/${parsed.data.hackathonId}`);
  revalidatePath(`/results/${parsed.data.hackathonId}`);
  redirect(`/results/${parsed.data.hackathonId}`);
}

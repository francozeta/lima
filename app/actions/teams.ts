"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createTeamJoinCode, normalizeTeamName } from "@/lib/teams";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  joinTeamSchema,
  projectSchema,
  teamSchema,
  uuidSchema,
} from "@/lib/validation/mvp";

const allowedFileTypes = new Set([
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
]);

const maxFileSize = 50 * 1024 * 1024;

type TeamJoinRow = {
  hackathons: { max_team_size?: number } | { max_team_size?: number }[] | null;
  id: string;
};

function nullableUrl(value?: string) {
  return value && value.length > 0 ? value : null;
}

function safeFilename(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function userTeamInHackathon({
  hackathonId,
  userId,
}: {
  hackathonId: string;
  userId: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("team_id,teams(id,hackathon_id)")
    .eq("user_id", userId);

  return (data ?? []).find((row) => {
    const team = Array.isArray(row.teams) ? row.teams[0] : row.teams;
    return team?.hackathon_id === hackathonId;
  });
}

export async function createTeam(formData: FormData) {
  const user = await requireUser();
  const parsed = teamSchema.safeParse({
    hackathonId: formData.get("hackathonId"),
    name: formData.get("name"),
  });

  if (!parsed.success) redirect("/hackathons?notice=team-error");

  const existingMembership = await userTeamInHackathon({
    hackathonId: parsed.data.hackathonId,
    userId: user.id,
  });

  if (existingMembership) {
    redirect(`/teams/${existingMembership.team_id}?notice=already-in-team`);
  }

  const supabase = await createClient();
  const name = normalizeTeamName(parsed.data.name);
  let createdTeamId: string | null = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await supabase
      .from("teams")
      .insert({
        created_by: user.id,
        hackathon_id: parsed.data.hackathonId,
        join_code: createTeamJoinCode(),
        name,
      })
      .select("id")
      .single();

    if (!error && data?.id) {
      createdTeamId = data.id as string;
      break;
    }

    if (error?.code !== "23505") redirect(`/hackathons/${parsed.data.hackathonId}?notice=team-error`);
  }

  if (!createdTeamId) redirect(`/hackathons/${parsed.data.hackathonId}?notice=team-error`);

  const { error: memberError } = await supabase.from("team_members").insert({
    role: "owner",
    team_id: createdTeamId,
    user_id: user.id,
  });

  if (memberError) redirect(`/hackathons/${parsed.data.hackathonId}?notice=team-error`);

  revalidatePath(`/hackathons/${parsed.data.hackathonId}`);
  revalidatePath("/dashboard");
  redirect(`/teams/${createdTeamId}?notice=team-created`);
}

export async function joinTeam(formData: FormData) {
  const user = await requireUser();
  const parsed = joinTeamSchema.safeParse({
    hackathonId: formData.get("hackathonId"),
    joinCode: formData.get("joinCode"),
  });

  if (!parsed.success) redirect("/hackathons?notice=join-error");

  const existingMembership = await userTeamInHackathon({
    hackathonId: parsed.data.hackathonId,
    userId: user.id,
  });

  if (existingMembership) {
    redirect(`/teams/${existingMembership.team_id}?notice=already-in-team`);
  }

  const supabase = await createClient();
  const { data: team } = await supabase
    .from("teams")
    .select("id,hackathon_id,hackathons(max_team_size)")
    .eq("join_code", parsed.data.joinCode)
    .eq("hackathon_id", parsed.data.hackathonId)
    .maybeSingle();

  if (!team) redirect(`/hackathons/${parsed.data.hackathonId}?notice=team-not-found`);

  const teamRow = team as TeamJoinRow;
  const relatedHackathon = Array.isArray(teamRow.hackathons)
    ? teamRow.hackathons[0]
    : teamRow.hackathons;
  const maxTeamSize = relatedHackathon?.max_team_size ?? 5;
  const { count } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", team.id);

  if ((count ?? 0) >= (maxTeamSize ?? 5)) {
    redirect(`/hackathons/${parsed.data.hackathonId}?notice=team-full`);
  }

  const { error } = await supabase.from("team_members").insert({
    role: "member",
    team_id: team.id,
    user_id: user.id,
  });

  if (error) redirect(`/hackathons/${parsed.data.hackathonId}?notice=join-error`);

  revalidatePath(`/hackathons/${parsed.data.hackathonId}`);
  revalidatePath(`/teams/${team.id}`);
  revalidatePath("/dashboard");
  redirect(`/teams/${team.id}?notice=joined`);
}

export async function leaveTeam(formData: FormData) {
  const user = await requireUser();
  const teamId = uuidSchema.safeParse(formData.get("teamId"));
  if (!teamId.success) redirect("/hackathons?notice=team-error");

  const supabase = await createClient();
  await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId.data)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
  revalidatePath(`/teams/${teamId.data}`);
  redirect("/hackathons?notice=left-team");
}

export async function saveProject(formData: FormData) {
  await requireUser();
  const parsed = projectSchema.safeParse({
    demoUrl: formData.get("demoUrl"),
    description: formData.get("description"),
    repositoryUrl: formData.get("repositoryUrl"),
    status: formData.get("status"),
    teamId: formData.get("teamId"),
    title: formData.get("title"),
  });

  if (!parsed.success) redirect("/hackathons?notice=project-error");

  const supabase = await createClient();
  const { data: team } = await supabase
    .from("teams")
    .select("id,hackathon_id")
    .eq("id", parsed.data.teamId)
    .maybeSingle();

  if (!team) redirect("/hackathons?notice=project-error");

  const { error } = await supabase.from("projects").upsert(
    {
      demo_url: nullableUrl(parsed.data.demoUrl),
      description: parsed.data.description,
      hackathon_id: team.hackathon_id,
      repository_url: nullableUrl(parsed.data.repositoryUrl),
      status: parsed.data.status,
      submitted_at:
        parsed.data.status === "submitted" ? new Date().toISOString() : null,
      team_id: parsed.data.teamId,
      title: parsed.data.title,
    },
    { onConflict: "team_id" },
  );

  if (error) redirect(`/teams/${parsed.data.teamId}?notice=project-error`);

  revalidatePath(`/teams/${parsed.data.teamId}`);
  revalidatePath(`/hackathons/${team.hackathon_id}`);
  redirect(`/teams/${parsed.data.teamId}?notice=project-saved`);
}

export async function uploadProjectFile(formData: FormData) {
  const user = await requireUser();
  const teamId = uuidSchema.safeParse(formData.get("teamId"));
  const projectId = uuidSchema.safeParse(formData.get("projectId"));
  const file = formData.get("file");

  if (!teamId.success || !projectId.success || !(file instanceof File)) {
    redirect("/hackathons?notice=file-error");
  }

  if (!allowedFileTypes.has(file.type) || file.size > maxFileSize) {
    redirect(`/teams/${teamId.data}?notice=file-type`);
  }

  const supabase = await createClient();
  const filename = safeFilename(file.name) || "entregable";
  const storagePath = `${teamId.data}/${projectId.data}/${crypto.randomUUID()}-${filename}`;
  const { error: uploadError } = await supabase.storage
    .from("project-deliverables")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) redirect(`/teams/${teamId.data}?notice=file-error`);

  const { error } = await supabase.from("project_files").insert({
    content_type: file.type,
    filename,
    project_id: projectId.data,
    size_bytes: file.size,
    storage_bucket: "project-deliverables",
    storage_path: storagePath,
    uploaded_by: user.id,
  });

  if (error) redirect(`/teams/${teamId.data}?notice=file-error`);

  revalidatePath(`/teams/${teamId.data}`);
  redirect(`/teams/${teamId.data}?notice=file-uploaded`);
}

export async function deleteProjectFile(formData: FormData) {
  await requireUser();
  const fileId = uuidSchema.safeParse(formData.get("fileId"));
  const teamId = uuidSchema.safeParse(formData.get("teamId"));

  if (!fileId.success || !teamId.success) redirect("/hackathons?notice=file-error");

  const supabase = await createClient();
  const { data: file } = await supabase
    .from("project_files")
    .select("storage_path")
    .eq("id", fileId.data)
    .maybeSingle();

  if (file?.storage_path) {
    await supabase.storage
      .from("project-deliverables")
      .remove([file.storage_path]);
  }

  await supabase.from("project_files").delete().eq("id", fileId.data);

  revalidatePath(`/teams/${teamId.data}`);
  redirect(`/teams/${teamId.data}?notice=file-deleted`);
}

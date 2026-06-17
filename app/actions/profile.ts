"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { dedupeSkillNames, toSkillSlug } from "@/lib/skills";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/profile";

type ProfileFormState = {
  errors?: Record<string, string[] | undefined>;
  message: string;
  ok: boolean;
};

function isMissingSkillsSchema(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "42501";
}

async function syncProfileSkills({
  skillNames,
  supabase,
  userId,
}: {
  skillNames: string[];
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}) {
  const { error: deleteError } = await supabase
    .from("profile_skills")
    .delete()
    .eq("user_id", userId);

  if (isMissingSkillsSchema(deleteError)) return "missing-schema" as const;
  if (deleteError) return "error" as const;

  const skillIds: string[] = [];

  for (const name of skillNames) {
    const slug = toSkillSlug(name);
    if (!slug) continue;

    const { data: existingSkill, error: selectError } = await supabase
      .from("skills")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (isMissingSkillsSchema(selectError)) return "missing-schema" as const;
    if (selectError) return "error" as const;

    if (existingSkill?.id) {
      skillIds.push(existingSkill.id as string);
      continue;
    }

    const { data: createdSkill, error: insertError } = await supabase
      .from("skills")
      .insert({
        category: "General",
        created_by: userId,
        name,
        slug,
      })
      .select("id")
      .single();

    if (isMissingSkillsSchema(insertError)) return "missing-schema" as const;
    if (insertError || !createdSkill?.id) return "error" as const;
    skillIds.push(createdSkill.id as string);
  }

  if (skillIds.length === 0) return "ok" as const;

  const { error: insertRelationsError } = await supabase
    .from("profile_skills")
    .insert(skillIds.map((skillId) => ({ skill_id: skillId, user_id: userId })));

  if (isMissingSkillsSchema(insertRelationsError)) return "missing-schema" as const;
  if (insertRelationsError) return "error" as const;

  return "ok" as const;
}

export async function updateProfile(
  _state: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    careerArea: formData.get("careerArea"),
    experience: formData.get("experience"),
    fullName: formData.get("fullName"),
    skills: formData.get("skills"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Revisa los campos marcados.",
      ok: false,
    };
  }

  const supabase = await createClient();
  const skills = dedupeSkillNames(parsed.data.skills.split(","));
  const completedAt = new Date().toISOString();

  const { error: userError } = await supabase
    .from("users")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  if (userError) {
    return {
      message: "No pudimos actualizar tu nombre.",
      ok: false,
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      career_area: parsed.data.careerArea,
      completed_at: completedAt,
      experience: parsed.data.experience,
      qr_payload: `/profile/${user.id}`,
      skills,
    })
    .eq("user_id", user.id);

  if (profileError) {
    return {
      message: "No pudimos actualizar tu perfil.",
      ok: false,
    };
  }

  const skillsSync = await syncProfileSkills({
    skillNames: skills,
    supabase,
    userId: user.id,
  });

  if (skillsSync === "error") {
    return {
      message: "Perfil guardado, pero no pudimos sincronizar habilidades.",
      ok: false,
    };
  }

  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/dashboard");

  return {
    message:
      skillsSync === "missing-schema"
        ? "Perfil actualizado. Falta ejecutar la migracion de habilidades."
        : "Perfil actualizado.",
    ok: true,
  };
}

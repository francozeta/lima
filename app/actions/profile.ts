"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, splitSkills } from "@/lib/validation/profile";

type ProfileFormState = {
  errors?: Record<string, string[] | undefined>;
  message: string;
  ok: boolean;
};

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
  const skills = splitSkills(parsed.data.skills);
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

  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/dashboard");

  return {
    message: "Perfil actualizado.",
    ok: true,
  };
}

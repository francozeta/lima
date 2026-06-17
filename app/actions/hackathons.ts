"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  type HackathonStatus,
  isRegistrationOpen,
  toHackathonSlug,
} from "@/lib/hackathons";
import { requireRole, requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { hackathonFormSchema } from "@/lib/validation/hackathon";

type HackathonFormState = {
  errors?: Record<string, string[] | undefined>;
  message: string;
  ok: boolean;
};

const uuidSchema = z.string().uuid();

function nullableText(value?: string) {
  return value && value.length > 0 ? value : null;
}

function toIsoDate(value: string) {
  return new Date(value).toISOString();
}

function getHackathonPayload(formData: FormData) {
  const parsed = hackathonFormSchema.safeParse({
    description: formData.get("description"),
    endsAt: formData.get("endsAt"),
    location: formData.get("location"),
    maxTeamSize: formData.get("maxTeamSize"),
    modality: formData.get("modality"),
    registrationDeadline: formData.get("registrationDeadline"),
    slug: formData.get("slug"),
    startsAt: formData.get("startsAt"),
    status: formData.get("status"),
    summary: formData.get("summary"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      ok: false as const,
    };
  }

  const slug = toHackathonSlug(parsed.data.slug || parsed.data.title);
  if (!slug) {
    return {
      errors: { slug: ["No pudimos generar un slug valido."] },
      ok: false as const,
    };
  }

  return {
    ok: true as const,
    payload: {
      description: nullableText(parsed.data.description),
      ends_at: toIsoDate(parsed.data.endsAt),
      location: nullableText(parsed.data.location),
      max_team_size: parsed.data.maxTeamSize,
      modality: parsed.data.modality,
      registration_deadline: parsed.data.registrationDeadline
        ? toIsoDate(parsed.data.registrationDeadline)
        : null,
      slug,
      starts_at: toIsoDate(parsed.data.startsAt),
      status: parsed.data.status,
      summary: parsed.data.summary,
      title: parsed.data.title,
    },
  };
}

function getHackathonId(formData: FormData) {
  return uuidSchema.safeParse(formData.get("id"));
}

export async function createHackathon(
  _state: HackathonFormState,
  formData: FormData,
): Promise<HackathonFormState> {
  const user = await requireRole(["admin"]);
  const parsed = getHackathonPayload(formData);

  if (!parsed.ok) {
    return {
      errors: parsed.errors,
      message: "Revisa los campos marcados.",
      ok: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("hackathons").insert({
    ...parsed.payload,
    created_by: user.id,
  });

  if (error) {
    return {
      message:
        error.code === "23505"
          ? "Ya existe un hackaton con ese slug."
          : "No pudimos crear el hackaton.",
      ok: false,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/hackathons");
  revalidatePath("/hackathons");

  return {
    message: "Hackaton creado.",
    ok: true,
  };
}

export async function updateHackathon(
  _state: HackathonFormState,
  formData: FormData,
): Promise<HackathonFormState> {
  await requireRole(["admin"]);

  const id = getHackathonId(formData);
  const parsed = getHackathonPayload(formData);

  if (!id.success) {
    return {
      message: "Hackaton invalido.",
      ok: false,
    };
  }

  if (!parsed.ok) {
    return {
      errors: parsed.errors,
      message: "Revisa los campos marcados.",
      ok: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("hackathons")
    .update(parsed.payload)
    .eq("id", id.data);

  if (error) {
    return {
      message:
        error.code === "23505"
          ? "Ya existe un hackaton con ese slug."
          : "No pudimos actualizar el hackaton.",
      ok: false,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/hackathons");
  revalidatePath(`/hackathons/${id.data}`);
  revalidatePath("/hackathons");

  return {
    message: "Hackaton actualizado.",
    ok: true,
  };
}

export async function deleteHackathon(formData: FormData) {
  await requireRole(["admin"]);

  const id = getHackathonId(formData);
  if (!id.success) redirect("/admin/hackathons");

  const supabase = await createClient();
  await supabase.from("hackathons").delete().eq("id", id.data);

  revalidatePath("/admin");
  revalidatePath("/admin/hackathons");
  revalidatePath("/hackathons");
  redirect("/admin/hackathons");
}

export async function registerForHackathon(formData: FormData) {
  const user = await requireUser();
  const id = uuidSchema.safeParse(formData.get("hackathonId"));
  if (!id.success) redirect("/hackathons?notice=invalid");

  const supabase = await createClient();
  const [{ data: profile }, { data: hackathon }] = await Promise.all([
    supabase
      .from("profiles")
      .select("completed_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("hackathons")
      .select("id,status,registration_deadline")
      .eq("id", id.data)
      .maybeSingle(),
  ]);

  if (!profile?.completed_at) redirect(`/profile/${user.id}`);
  if (!hackathon) redirect("/hackathons?notice=missing");

  const open = isRegistrationOpen({
    registrationDeadline: hackathon.registration_deadline,
    status: hackathon.status as HackathonStatus,
  });

  if (!open) redirect(`/hackathons/${id.data}?notice=closed`);

  const { error } = await supabase.from("hackathon_registrations").upsert(
    {
      hackathon_id: id.data,
      status: "registered",
      user_id: user.id,
    },
    { onConflict: "hackathon_id,user_id" },
  );

  if (error) redirect(`/hackathons/${id.data}?notice=error`);

  revalidatePath("/dashboard");
  revalidatePath("/hackathons");
  revalidatePath(`/hackathons/${id.data}`);
  redirect(`/hackathons/${id.data}?notice=registered`);
}

export async function cancelHackathonRegistration(formData: FormData) {
  const user = await requireUser();
  const id = uuidSchema.safeParse(formData.get("hackathonId"));
  if (!id.success) redirect("/hackathons?notice=invalid");

  const supabase = await createClient();
  const { error } = await supabase
    .from("hackathon_registrations")
    .update({ status: "cancelled" })
    .eq("hackathon_id", id.data)
    .eq("user_id", user.id);

  if (error) redirect(`/hackathons/${id.data}?notice=error`);

  revalidatePath("/dashboard");
  revalidatePath("/hackathons");
  revalidatePath(`/hackathons/${id.data}`);
  redirect(`/hackathons/${id.data}?notice=cancelled`);
}

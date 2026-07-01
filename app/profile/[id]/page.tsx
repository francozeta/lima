import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileQrCard } from "@/components/profile/profile-qr-card";
import { requireUser } from "@/lib/auth/session";
import { createProfileQrDataUrl, getProfileUrl } from "@/lib/qr";
import { getSiteUrl } from "@/lib/site-url";
import { DEFAULT_SKILLS } from "@/lib/skills";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  career_area: string | null;
  experience: string | null;
  skills: string[] | null;
  users: { full_name: string | null } | { full_name: string | null }[] | null;
};

type SkillRow = {
  category: string | null;
  name: string;
};

type ProfileSkillRow = {
  skills: { name: string } | { name: string }[] | null;
};

function getOwnerName(profile: ProfileRow) {
  const owner = Array.isArray(profile.users) ? profile.users[0] : profile.users;
  return owner?.full_name ?? "";
}

function getProfileSkillName(row: ProfileSkillRow) {
  const skill = Array.isArray(row.skills) ? row.skills[0] : row.skills;
  return skill?.name ?? null;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  if (id !== user.id && !user.roles.includes("admin")) {
    redirect(`/profile/${user.id}`);
  }

  const supabase = await createClient();
  const [{ data }, { data: skillsData }, { data: profileSkillsData }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("career_area,skills,experience,users(full_name)")
        .eq("user_id", id)
        .maybeSingle(),
      supabase
        .from("skills")
        .select("name,category")
        .order("category", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("profile_skills")
        .select("skills(name)")
        .eq("user_id", id),
    ]);

  if (!data) notFound();

  const profile = data as ProfileRow;
  const availableSkills =
    skillsData && skillsData.length > 0
      ? (skillsData as SkillRow[]).map((skill) => ({
          category: skill.category ?? "General",
          name: skill.name,
        }))
      : DEFAULT_SKILLS;
  const selectedSkillsFromRelation = ((profileSkillsData ??
    []) as ProfileSkillRow[])
    .map(getProfileSkillName)
    .filter((skill): skill is string => Boolean(skill));
  const selectedSkills =
    selectedSkillsFromRelation.length > 0
      ? selectedSkillsFromRelation
      : (profile.skills ?? []);
  const siteUrl = getSiteUrl();
  const profileUrl = getProfileUrl(siteUrl, id);
  const qrDataUrl = await createProfileQrDataUrl(siteUrl, id);

  return (
    <AppShell user={user}>
      <section className="mb-8">
        <h1 className="text-3xl font-semibold tracking-normal">Tu perfil</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Manten tus datos claros para formar equipos y participar en
          hackatones.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <ProfileForm
          availableSkills={availableSkills}
          values={{
            careerArea: profile.career_area ?? "",
            experience: profile.experience ?? "",
            fullName: getOwnerName(profile) || user.fullName || "",
            skills: selectedSkills,
          }}
        />
        <ProfileQrCard profileUrl={profileUrl} qrDataUrl={qrDataUrl} />
      </div>
    </AppShell>
  );
}

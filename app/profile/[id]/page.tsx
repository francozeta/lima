import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileQrCard } from "@/components/profile/profile-qr-card";
import { requireUser } from "@/lib/auth/session";
import { createProfileQrDataUrl, getProfileUrl } from "@/lib/qr";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  career_area: string | null;
  experience: string | null;
  skills: string[] | null;
  users: { full_name: string | null } | { full_name: string | null }[] | null;
};

function getOwnerName(profile: ProfileRow) {
  const owner = Array.isArray(profile.users) ? profile.users[0] : profile.users;
  return owner?.full_name ?? "";
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
  const { data } = await supabase
    .from("profiles")
    .select("career_area,skills,experience,users(full_name)")
    .eq("user_id", id)
    .maybeSingle();

  if (!data) notFound();

  const profile = data as ProfileRow;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
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
          values={{
            careerArea: profile.career_area ?? "",
            experience: profile.experience ?? "",
            fullName: getOwnerName(profile) || user.fullName || "",
            skills: (profile.skills ?? []).join(", "),
          }}
        />
        <ProfileQrCard profileUrl={profileUrl} qrDataUrl={qrDataUrl} />
      </div>
    </AppShell>
  );
}

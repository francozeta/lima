"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthCallbackUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function signInWithGoogle() {
  const headerStore = await headers();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl(headerStore.get("origin")),
    },
  });

  if (error || !data.url) {
    redirect("/login?error=google");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

import { redirect } from "next/navigation";
import { GoogleLoginForm } from "@/components/auth/google-login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            CERTUS
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-foreground">
            LIMA
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Tu identidad para participar en hackatones academicos.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acceso institucional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                No pudimos iniciar sesion con Google. Intentalo nuevamente.
              </p>
            ) : null}
            <GoogleLoginForm />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

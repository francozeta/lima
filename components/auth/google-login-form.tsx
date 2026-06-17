import { LogInIcon } from "lucide-react";
import { signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function GoogleLoginForm() {
  return (
    <form action={signInWithGoogle}>
      <Button className="w-full" size="lg" type="submit">
        <LogInIcon />
        Continuar con Google
      </Button>
    </form>
  );
}

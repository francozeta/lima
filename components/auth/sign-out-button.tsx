import { LogOutIcon } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button size="sm" type="submit" variant="outline">
        <LogOutIcon />
        Salir
      </Button>
    </form>
  );
}

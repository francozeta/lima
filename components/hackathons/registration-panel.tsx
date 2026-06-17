import Link from "next/link";
import {
  cancelHackathonRegistration,
  registerForHackathon,
} from "@/app/actions/hackathons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/hackathons";

export function RegistrationPanel({
  hackathonId,
  isOpen,
  isProfileComplete,
  isRegistered,
  profileUrl,
  registrationDeadline,
}: {
  hackathonId: string;
  isOpen: boolean;
  isProfileComplete: boolean;
  isRegistered: boolean;
  profileUrl: string;
  registrationDeadline: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscripcion</CardTitle>
        <CardDescription>
          Cierre: {formatDateTime(registrationDeadline)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isProfileComplete ? (
          <>
            <p className="text-sm text-muted-foreground">
              Completa tu perfil academico antes de inscribirte.
            </p>
            <Button render={<Link href={profileUrl} />}>Completar perfil</Button>
          </>
        ) : isRegistered ? (
          <>
            <p className="text-sm text-muted-foreground">
              Ya estas inscrito. Luego podras crear o unirte a un equipo desde
              esta vista.
            </p>
            <form action={cancelHackathonRegistration}>
              <input name="hackathonId" type="hidden" value={hackathonId} />
              <Button type="submit" variant="outline">
                Cancelar inscripcion
              </Button>
            </form>
          </>
        ) : isOpen ? (
          <>
            <p className="text-sm text-muted-foreground">
              Inscribete para participar y desbloquear el flujo de equipos.
            </p>
            <form action={registerForHackathon}>
              <input name="hackathonId" type="hidden" value={hackathonId} />
              <Button type="submit">Inscribirme</Button>
            </form>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Las inscripciones ya no estan abiertas para este hackaton.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

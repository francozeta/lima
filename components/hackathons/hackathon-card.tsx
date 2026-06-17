import { CalendarDaysIcon, MapPinIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatDateRange,
  getHackathonModalityLabel,
  getHackathonStatusLabel,
  type HackathonModality,
  type HackathonStatus,
} from "@/lib/hackathons";

export type HackathonCardData = {
  ends_at: string;
  id: string;
  location: string | null;
  max_team_size: number;
  modality: HackathonModality;
  registration_deadline: string | null;
  starts_at: string;
  status: HackathonStatus;
  summary: string;
  title: string;
};

export function HackathonCard({
  hackathon,
  registered,
}: {
  hackathon: HackathonCardData;
  registered?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge variant="outline">
            {getHackathonStatusLabel(hackathon.status)}
          </Badge>
          <Badge variant="secondary">
            {getHackathonModalityLabel(hackathon.modality)}
          </Badge>
          {registered ? <Badge variant="success">Inscrito</Badge> : null}
        </div>
        <CardTitle>{hackathon.title}</CardTitle>
        <CardDescription>{hackathon.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <CalendarDaysIcon className="mt-0.5 size-4 shrink-0" />
            <span>{formatDateRange(hackathon.starts_at, hackathon.ends_at)}</span>
          </p>
          <p className="flex items-start gap-2">
            <MapPinIcon className="mt-0.5 size-4 shrink-0" />
            <span>{hackathon.location || "Ubicacion por confirmar"}</span>
          </p>
          <p className="flex items-start gap-2">
            <UsersIcon className="mt-0.5 size-4 shrink-0" />
            <span>Hasta {hackathon.max_team_size} integrantes por equipo</span>
          </p>
        </div>
        <Button render={<Link href={`/hackathons/${hackathon.id}`} />}>
          Ver hackaton
        </Button>
      </CardContent>
    </Card>
  );
}

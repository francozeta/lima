export const HACKATHON_STATUSES = [
  "draft",
  "published",
  "closed",
  "archived",
] as const;

export const HACKATHON_MODALITIES = [
  "online",
  "in_person",
  "hybrid",
] as const;

export type HackathonStatus = (typeof HACKATHON_STATUSES)[number];
export type HackathonModality = (typeof HACKATHON_MODALITIES)[number];

const statusLabels: Record<HackathonStatus, string> = {
  archived: "Archivado",
  closed: "Cerrado",
  draft: "Borrador",
  published: "Publicado",
};

const modalityLabels: Record<HackathonModality, string> = {
  hybrid: "Hibrido",
  in_person: "Presencial",
  online: "Online",
};

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function toHackathonSlug(value: string) {
  return stripAccents(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getHackathonStatusLabel(status: HackathonStatus) {
  return statusLabels[status];
}

export function getHackathonModalityLabel(modality: HackathonModality) {
  return modalityLabels[modality];
}

export function isRegistrationOpen({
  now = new Date(),
  registrationDeadline,
  status,
}: {
  now?: Date;
  registrationDeadline: string | null;
  status: HackathonStatus;
}) {
  if (status !== "published") return false;
  if (!registrationDeadline) return true;

  return now.getTime() <= new Date(registrationDeadline).getTime();
}

export function formatDateTime(value: string | null) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDateRange(startsAt: string, endsAt: string) {
  return `${formatDateTime(startsAt)} - ${formatDateTime(endsAt)}`;
}

export function toDateTimeLocalValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

import { z } from "zod";
import { HACKATHON_MODALITIES, HACKATHON_STATUSES } from "@/lib/hackathons";

const dateTimeField = z
  .string()
  .trim()
  .min(1, "Indica una fecha.")
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Usa una fecha valida.",
  });

export const hackathonFormSchema = z
  .object({
    description: z.string().trim().max(4000).optional(),
    endsAt: dateTimeField,
    location: z.string().trim().max(120).optional(),
    maxTeamSize: z.coerce
      .number()
      .int("Usa un numero entero.")
      .min(1, "Minimo 1 integrante.")
      .max(10, "Maximo 10 integrantes."),
    modality: z.enum(HACKATHON_MODALITIES),
    registrationDeadline: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => !value || !Number.isNaN(Date.parse(value)),
        "Usa una fecha valida.",
      ),
    slug: z.string().trim().max(90).optional(),
    startsAt: dateTimeField,
    status: z.enum(HACKATHON_STATUSES),
    summary: z
      .string()
      .trim()
      .min(12, "Escribe un resumen breve.")
      .max(240, "Manten el resumen debajo de 240 caracteres."),
    title: z
      .string()
      .trim()
      .min(4, "Escribe un titulo.")
      .max(120, "Manten el titulo debajo de 120 caracteres."),
  })
  .superRefine((data, context) => {
    const startsAt = new Date(data.startsAt).getTime();
    const endsAt = new Date(data.endsAt).getTime();

    if (endsAt <= startsAt) {
      context.addIssue({
        code: "custom",
        message: "La fecha de fin debe ser posterior al inicio.",
        path: ["endsAt"],
      });
    }

    if (data.registrationDeadline) {
      const registrationDeadline = new Date(data.registrationDeadline).getTime();
      if (registrationDeadline > startsAt) {
        context.addIssue({
          code: "custom",
          message: "El cierre de inscripcion debe ser antes del inicio.",
          path: ["registrationDeadline"],
        });
      }
    }
  });

export type HackathonFormInput = z.infer<typeof hackathonFormSchema>;

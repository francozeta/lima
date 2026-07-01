import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const teamSchema = z.object({
  hackathonId: uuidSchema,
  name: z
    .string()
    .trim()
    .min(3, "El nombre del equipo debe tener al menos 3 caracteres.")
    .max(80, "El nombre del equipo es demasiado largo."),
});

export const joinTeamSchema = z.object({
  hackathonId: uuidSchema,
  joinCode: z
    .string()
    .trim()
    .min(6, "Ingresa un codigo valido.")
    .max(12, "Ingresa un codigo valido.")
    .transform((value) => value.toUpperCase()),
});

export const projectSchema = z.object({
  demoUrl: z.string().trim().url("Usa una URL valida.").optional().or(z.literal("")),
  description: z
    .string()
    .trim()
    .min(20, "Describe mejor el proyecto.")
    .max(1600, "La descripcion es demasiado larga."),
  repositoryUrl: z
    .string()
    .trim()
    .url("Usa una URL valida.")
    .optional()
    .or(z.literal("")),
  status: z.enum(["draft", "submitted"]),
  teamId: uuidSchema,
  title: z
    .string()
    .trim()
    .min(4, "Escribe un titulo.")
    .max(120, "El titulo es demasiado largo."),
});

export const criterionSchema = z.object({
  description: z.string().trim().max(600).optional(),
  hackathonId: uuidSchema,
  maxScore: z.coerce.number().int().min(1).max(100),
  name: z.string().trim().min(3).max(80),
  position: z.coerce.number().int().min(0).max(50),
  weight: z.coerce.number().min(0.01).max(1),
});

export const judgeAssignmentSchema = z.object({
  hackathonId: uuidSchema,
  judgeId: uuidSchema,
});

export const publicationSchema = z.object({
  hackathonId: uuidSchema,
  note: z.string().trim().max(800).optional(),
});

export const roleUpdateSchema = z.object({
  roles: z.array(z.enum(["admin", "participant", "judge"])).min(1),
  userId: uuidSchema,
});

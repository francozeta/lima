import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresa tu nombre completo."),
  careerArea: z.string().trim().min(2, "Indica tu carrera o area."),
  skills: z.string().trim().min(2, "Agrega al menos una habilidad."),
  experience: z
    .string()
    .trim()
    .min(10, "Cuentanos un poco mas sobre tu experiencia.")
    .max(600, "Manten tu experiencia debajo de 600 caracteres."),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export function splitSkills(value: string): string[] {
  const seen = new Set<string>();

  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)
    .filter((skill) => {
      const key = skill.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

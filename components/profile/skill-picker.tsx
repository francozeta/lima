"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { dedupeSkillNames, normalizeSkillName, toSkillSlug } from "@/lib/skills";

export type SkillOption = {
  category: string;
  name: string;
};

export function SkillPicker({
  availableSkills,
  error,
  initialSkills,
}: {
  availableSkills: SkillOption[];
  error?: string;
  initialSkills: string[];
}) {
  const [query, setQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState(() =>
    dedupeSkillNames(initialSkills),
  );

  const normalizedQuery = normalizeSkillName(query);
  const selectedSlugs = useMemo(
    () => new Set(selectedSkills.map(toSkillSlug)),
    [selectedSkills],
  );

  const filteredSkills = useMemo(() => {
    const querySlug = toSkillSlug(query);
    return availableSkills
      .filter((skill) => !selectedSlugs.has(toSkillSlug(skill.name)))
      .filter((skill) => {
        if (!querySlug) return true;
        return (
          toSkillSlug(skill.name).includes(querySlug) ||
          toSkillSlug(skill.category).includes(querySlug)
        );
      })
      .slice(0, 10);
  }, [availableSkills, query, selectedSlugs]);

  const canCreate =
    toSkillSlug(normalizedQuery).length > 1 &&
    !selectedSlugs.has(toSkillSlug(normalizedQuery)) &&
    !availableSkills.some(
      (skill) => toSkillSlug(skill.name) === toSkillSlug(normalizedQuery),
    );

  function addSkill(name: string) {
    setSelectedSkills((current) => dedupeSkillNames([...current, name]));
    setQuery("");
  }

  function removeSkill(name: string) {
    const slug = toSkillSlug(name);
    setSelectedSkills((current) =>
      current.filter((skill) => toSkillSlug(skill) !== slug),
    );
  }

  return (
    <Field invalid={Boolean(error)}>
      <FieldLabel htmlFor="skillsSearch">Habilidades</FieldLabel>
      <input name="skills" type="hidden" value={selectedSkills.join(", ")} />

      <div className="flex w-full flex-col gap-3">
        <div className="flex flex-wrap gap-2 rounded-lg border bg-background p-2">
          {selectedSkills.length > 0 ? (
            selectedSkills.map((skill) => (
              <Badge
                className="gap-1.5 px-2 py-1 text-sm"
                key={toSkillSlug(skill)}
                variant="outline"
              >
                {skill}
                <button
                  aria-label={`Quitar ${skill}`}
                  className="-me-1 inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => removeSkill(skill)}
                  type="button"
                >
                  <XIcon className="size-3.5" />
                </button>
              </Badge>
            ))
          ) : (
            <p className="px-1 py-1 text-sm text-muted-foreground">
              Aun no agregaste habilidades.
            </p>
          )}
        </div>

        <Input
          aria-invalid={Boolean(error)}
          id="skillsSearch"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Busca o crea una habilidad"
          value={query}
        />

        <div className="rounded-lg border bg-card p-2">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-muted-foreground text-xs font-medium">
              Sugerencias
            </span>
            <span className="text-muted-foreground text-xs">
              {selectedSkills.length} seleccionadas
            </span>
          </div>

          <div className="grid max-h-56 gap-1 overflow-y-auto">
            {canCreate ? (
              <Button
                className="justify-start"
                onClick={() => addSkill(normalizedQuery)}
                type="button"
                variant="ghost"
              >
                <PlusIcon />
                Crear &quot;{normalizedQuery}&quot;
              </Button>
            ) : null}

            {filteredSkills.map((skill) => (
              <button
                className="flex min-h-9 items-center justify-between rounded-md px-2 text-left text-sm hover:bg-accent"
                key={`${skill.category}-${skill.name}`}
                onClick={() => addSkill(skill.name)}
                type="button"
              >
                <span>{skill.name}</span>
                <span className="text-muted-foreground text-xs">
                  {skill.category}
                </span>
              </button>
            ))}

            {filteredSkills.length === 0 && !canCreate ? (
              <p className="px-2 py-3 text-center text-muted-foreground text-sm">
                No hay coincidencias.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <FieldDescription>
        Elige habilidades existentes o crea una nueva si no aparece.
      </FieldDescription>
      <FieldError>{error}</FieldError>
    </Field>
  );
}

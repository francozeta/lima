"use client";

import { useActionState, useEffect } from "react";
import {
  createHackathon,
  updateHackathon,
} from "@/app/actions/hackathons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import {
  getHackathonModalityLabel,
  getHackathonStatusLabel,
  type HackathonModality,
  type HackathonStatus,
} from "@/lib/hackathons";
import { cn } from "@/lib/utils";

type HackathonFormState = {
  errors?: Record<string, string[] | undefined>;
  message: string;
  ok: boolean;
};

export type HackathonFormValues = {
  description: string;
  endsAt: string;
  id?: string;
  location: string;
  maxTeamSize: number;
  modality: HackathonModality;
  registrationDeadline: string;
  slug: string;
  startsAt: string;
  status: HackathonStatus;
  summary: string;
  title: string;
};

const initialHackathonFormState: HackathonFormState = {
  errors: {},
  message: "",
  ok: false,
};

const selectClassName = cn(
  "h-8.5 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground shadow-xs/5 outline-none transition-shadow",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/24 sm:h-7.5 sm:text-sm",
);

function FormFields({
  pending,
  state,
  submitLabel,
  values,
}: {
  pending: boolean;
  state: HackathonFormState;
  submitLabel: string;
  values: HackathonFormValues;
}) {
  return (
    <>
      {values.id ? <input name="id" type="hidden" value={values.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field invalid={Boolean(state.errors?.title?.[0])}>
          <FieldLabel htmlFor={`title-${values.id ?? "new"}`}>Titulo</FieldLabel>
          <Input
            aria-invalid={Boolean(state.errors?.title?.[0])}
            defaultValue={values.title}
            id={`title-${values.id ?? "new"}`}
            name="title"
          />
          <FieldError>{state.errors?.title?.[0]}</FieldError>
        </Field>

        <Field invalid={Boolean(state.errors?.slug?.[0])}>
          <FieldLabel htmlFor={`slug-${values.id ?? "new"}`}>Slug</FieldLabel>
          <Input
            aria-invalid={Boolean(state.errors?.slug?.[0])}
            defaultValue={values.slug}
            id={`slug-${values.id ?? "new"}`}
            name="slug"
            placeholder="se-genera-desde-el-titulo"
          />
          <FieldError>{state.errors?.slug?.[0]}</FieldError>
        </Field>
      </div>

      <Field invalid={Boolean(state.errors?.summary?.[0])}>
        <FieldLabel htmlFor={`summary-${values.id ?? "new"}`}>Resumen</FieldLabel>
        <Textarea
          aria-invalid={Boolean(state.errors?.summary?.[0])}
          defaultValue={values.summary}
          id={`summary-${values.id ?? "new"}`}
          name="summary"
          rows={3}
        />
        <FieldError>{state.errors?.summary?.[0]}</FieldError>
      </Field>

      <Field invalid={Boolean(state.errors?.description?.[0])}>
        <FieldLabel htmlFor={`description-${values.id ?? "new"}`}>
          Descripcion
        </FieldLabel>
        <Textarea
          aria-invalid={Boolean(state.errors?.description?.[0])}
          defaultValue={values.description}
          id={`description-${values.id ?? "new"}`}
          name="description"
          rows={5}
        />
        <FieldError>{state.errors?.description?.[0]}</FieldError>
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field invalid={Boolean(state.errors?.startsAt?.[0])}>
          <FieldLabel htmlFor={`startsAt-${values.id ?? "new"}`}>
            Inicio
          </FieldLabel>
          <Input
            aria-invalid={Boolean(state.errors?.startsAt?.[0])}
            defaultValue={values.startsAt}
            id={`startsAt-${values.id ?? "new"}`}
            name="startsAt"
            nativeInput
            type="datetime-local"
          />
          <FieldError>{state.errors?.startsAt?.[0]}</FieldError>
        </Field>

        <Field invalid={Boolean(state.errors?.endsAt?.[0])}>
          <FieldLabel htmlFor={`endsAt-${values.id ?? "new"}`}>Fin</FieldLabel>
          <Input
            aria-invalid={Boolean(state.errors?.endsAt?.[0])}
            defaultValue={values.endsAt}
            id={`endsAt-${values.id ?? "new"}`}
            name="endsAt"
            nativeInput
            type="datetime-local"
          />
          <FieldError>{state.errors?.endsAt?.[0]}</FieldError>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field invalid={Boolean(state.errors?.registrationDeadline?.[0])}>
          <FieldLabel htmlFor={`registrationDeadline-${values.id ?? "new"}`}>
            Cierre de inscripcion
          </FieldLabel>
          <Input
            aria-invalid={Boolean(state.errors?.registrationDeadline?.[0])}
            defaultValue={values.registrationDeadline}
            id={`registrationDeadline-${values.id ?? "new"}`}
            name="registrationDeadline"
            nativeInput
            type="datetime-local"
          />
          <FieldError>{state.errors?.registrationDeadline?.[0]}</FieldError>
        </Field>

        <Field invalid={Boolean(state.errors?.location?.[0])}>
          <FieldLabel htmlFor={`location-${values.id ?? "new"}`}>
            Ubicacion
          </FieldLabel>
          <Input
            aria-invalid={Boolean(state.errors?.location?.[0])}
            defaultValue={values.location}
            id={`location-${values.id ?? "new"}`}
            name="location"
          />
          <FieldError>{state.errors?.location?.[0]}</FieldError>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field invalid={Boolean(state.errors?.modality?.[0])}>
          <FieldLabel htmlFor={`modality-${values.id ?? "new"}`}>
            Modalidad
          </FieldLabel>
          <select
            aria-invalid={Boolean(state.errors?.modality?.[0])}
            className={selectClassName}
            defaultValue={values.modality}
            id={`modality-${values.id ?? "new"}`}
            name="modality"
          >
            {(["hybrid", "in_person", "online"] as HackathonModality[]).map(
              (modality) => (
                <option key={modality} value={modality}>
                  {getHackathonModalityLabel(modality)}
                </option>
              ),
            )}
          </select>
          <FieldError>{state.errors?.modality?.[0]}</FieldError>
        </Field>

        <Field invalid={Boolean(state.errors?.status?.[0])}>
          <FieldLabel htmlFor={`status-${values.id ?? "new"}`}>Estado</FieldLabel>
          <select
            aria-invalid={Boolean(state.errors?.status?.[0])}
            className={selectClassName}
            defaultValue={values.status}
            id={`status-${values.id ?? "new"}`}
            name="status"
          >
            {(["draft", "published", "closed", "archived"] as HackathonStatus[]).map(
              (status) => (
                <option key={status} value={status}>
                  {getHackathonStatusLabel(status)}
                </option>
              ),
            )}
          </select>
          <FieldError>{state.errors?.status?.[0]}</FieldError>
        </Field>

        <Field invalid={Boolean(state.errors?.maxTeamSize?.[0])}>
          <FieldLabel htmlFor={`maxTeamSize-${values.id ?? "new"}`}>
            Equipo max.
          </FieldLabel>
          <Input
            aria-invalid={Boolean(state.errors?.maxTeamSize?.[0])}
            defaultValue={values.maxTeamSize}
            id={`maxTeamSize-${values.id ?? "new"}`}
            max={10}
            min={1}
            name="maxTeamSize"
            nativeInput
            type="number"
          />
          <FieldError>{state.errors?.maxTeamSize?.[0]}</FieldError>
        </Field>
      </div>

      <Button loading={pending} type="submit">
        {submitLabel}
      </Button>
    </>
  );
}

function useHackathonToast(state: HackathonFormState) {
  useEffect(() => {
    if (!state.message) return;
    toastManager.add({
      title: state.message,
      type: state.ok ? "success" : "error",
    });
  }, [state]);
}

export function CreateHackathonForm({
  values,
}: {
  values: HackathonFormValues;
}) {
  const [state, action, pending] = useActionState(
    createHackathon,
    initialHackathonFormState,
  );
  useHackathonToast(state);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear hackaton</CardTitle>
        <CardDescription>
          Publicalo cuando este listo para inscripciones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          <FormFields
            pending={pending}
            state={state}
            submitLabel="Crear hackaton"
            values={values}
          />
        </form>
      </CardContent>
    </Card>
  );
}

export function UpdateHackathonForm({
  values,
}: {
  values: HackathonFormValues;
}) {
  const [state, action, pending] = useActionState(
    updateHackathon,
    initialHackathonFormState,
  );
  useHackathonToast(state);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{values.title}</CardTitle>
        <CardDescription>Editar datos, fechas y estado.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          <FormFields
            pending={pending}
            state={state}
            submitLabel="Guardar cambios"
            values={values}
          />
        </form>
      </CardContent>
    </Card>
  );
}

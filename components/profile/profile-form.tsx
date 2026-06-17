"use client";

import { useActionState, useEffect } from "react";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";

export type ProfileFormValues = {
  careerArea: string;
  experience: string;
  fullName: string;
  skills: string;
};

const initialProfileFormState = {
  errors: {},
  message: "",
  ok: false,
};

export function ProfileForm({ values }: { values: ProfileFormValues }) {
  const [state, action, pending] = useActionState(
    updateProfile,
    initialProfileFormState,
  );

  useEffect(() => {
    if (!state.message) return;
    toastManager.add({
      title: state.message,
      type: state.ok ? "success" : "error",
    });
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil academico</CardTitle>
        <CardDescription>
          Esta informacion sera la base para inscripciones, equipos y jurado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          <Field invalid={Boolean(state.errors?.fullName?.[0])}>
            <FieldLabel htmlFor="fullName">Nombre</FieldLabel>
            <Input
              aria-invalid={Boolean(state.errors?.fullName?.[0])}
              defaultValue={values.fullName}
              id="fullName"
              name="fullName"
            />
            <FieldError>{state.errors?.fullName?.[0]}</FieldError>
          </Field>

          <Field invalid={Boolean(state.errors?.careerArea?.[0])}>
            <FieldLabel htmlFor="careerArea">Carrera o area</FieldLabel>
            <Input
              aria-invalid={Boolean(state.errors?.careerArea?.[0])}
              defaultValue={values.careerArea}
              id="careerArea"
              name="careerArea"
            />
            <FieldError>{state.errors?.careerArea?.[0]}</FieldError>
          </Field>

          <Field invalid={Boolean(state.errors?.skills?.[0])}>
            <FieldLabel htmlFor="skills">Habilidades</FieldLabel>
            <Input
              aria-invalid={Boolean(state.errors?.skills?.[0])}
              defaultValue={values.skills}
              id="skills"
              name="skills"
              placeholder="React, Supabase, investigacion"
            />
            <FieldDescription>Separalas con comas.</FieldDescription>
            <FieldError>{state.errors?.skills?.[0]}</FieldError>
          </Field>

          <Field invalid={Boolean(state.errors?.experience?.[0])}>
            <FieldLabel htmlFor="experience">Experiencia breve</FieldLabel>
            <Textarea
              aria-invalid={Boolean(state.errors?.experience?.[0])}
              defaultValue={values.experience}
              id="experience"
              name="experience"
              rows={5}
            />
            <FieldError>{state.errors?.experience?.[0]}</FieldError>
          </Field>

          <Button loading={pending} type="submit">
            Guardar perfil
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

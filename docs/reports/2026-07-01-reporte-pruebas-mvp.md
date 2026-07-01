# Reporte de pruebas - MVP LIMA

Fecha: 1 de julio de 2026  
Proyecto: LIMA - Plataforma de gestion de hackatones CERTUS  
Rama evaluada: `feat/lima-mvp-completion`  
Commit evaluado: `7ecc4d6`  
Entorno productivo: `https://lima-certus.vercel.app`

## 1. Resumen ejecutivo

El MVP de LIMA fue verificado a nivel de pruebas automatizadas, build de produccion, rutas protegidas sin sesion, estado de despliegue en Vercel y conectividad basica con Supabase.

Resultado general: **apto para demo tecnica controlada**, con una configuracion externa pendiente para cerrar el login Google end-to-end.

Hallazgo principal pendiente:

- Google OAuth todavia debe actualizar sus redirect URIs para trabajar con Supabase Auth en produccion.
- Supabase Auth tambien debe tener configurado el `Site URL` productivo y la lista de redirect URLs permitidas.

Esto no es un bug de compilacion ni de UI. Es una configuracion de proveedor OAuth.

## 2. Alcance probado

Se validaron los siguientes bloques del MVP:

- Compilacion Next.js App Router con TypeScript.
- Pruebas unitarias de helpers de negocio.
- Lint de codigo.
- Proteccion basica de rutas sin sesion.
- Disponibilidad de rutas publicas.
- Estado de deployment en Vercel.
- Ausencia de errores runtime recientes en logs de Vercel.
- Conectividad de Supabase Auth.
- Generacion de URL canonica para OAuth y QR de perfil.

## 3. Comandos ejecutados y evidencia

| Tipo | Comando | Resultado |
| --- | --- | --- |
| Unit tests | `.\node_modules\.bin\vitest.cmd run` | 7 archivos, 19 tests pasaron |
| Lint | `.\node_modules\.bin\eslint.cmd` | Sin errores |
| Build | `.\node_modules\.bin\next.cmd build` | Build exitoso |
| Rutas produccion | `Invoke-WebRequest` a `/`, `/login`, `/hackathons`, `/dashboard` | Todas respondieron `200` con redireccion esperada a `/login` cuando no hay sesion |
| Supabase Auth health | `GET https://nyrmjfnpxpplmwkscmgu.supabase.co/auth/v1/health` | `401 Unauthorized`, esperado sin credenciales; confirma que el endpoint responde |
| Vercel logs | `vercel logs ... --level error --since 20m` | Sin errores reportados |

## 4. Resultados de pruebas automatizadas

| Area | Caso | Estado |
| --- | --- | --- |
| Perfil | Validacion de formulario de perfil | Paso |
| Habilidades | Normalizacion y busqueda de habilidades | Paso |
| QR | Construccion de URL absoluta de perfil | Paso |
| Hackatones | Helpers de estado/fecha | Paso |
| Equipos | Helpers de equipos | Paso |
| Ranking | Calculo y ordenamiento de ranking | Paso |
| URL canonica | Prioriza URL productiva sobre localhost | Paso |

Resultado: **19/19 pruebas pasaron**.

## 5. Pruebas de integracion/manuales

| Caso | Resultado observado | Estado |
| --- | --- | --- |
| Abrir `/` sin sesion | Redirige a `/login` | Paso |
| Abrir `/login` | Renderiza pantalla de acceso | Paso |
| Abrir `/hackathons` sin sesion | Redirige a `/login` | Paso |
| Abrir `/dashboard` sin sesion | Redirige a `/login` | Paso |
| Logs runtime de Vercel | Sin errores recientes | Paso |
| Login Google end-to-end | Pendiente de actualizar redirect URIs en Google/Supabase | Bloqueado por config externa |

## 6. Configuracion OAuth requerida

### 6.1 Google Cloud Console

En el OAuth Client de Google de tipo Web Application, agregar:

Authorized JavaScript origins:

- `http://localhost:3000`
- `https://lima-certus.vercel.app`

Authorized redirect URIs:

- `https://nyrmjfnpxpplmwkscmgu.supabase.co/auth/v1/callback`

Importante: usando Supabase Auth, Google debe redirigir hacia el callback de Supabase, no directamente hacia `/auth/callback` de Next.js. Luego Supabase redirige a la aplicacion usando el `redirectTo` que genera LIMA.

Referencia oficial:

- [Google OAuth 2.0 Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Supabase Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

### 6.2 Supabase Auth URL Configuration

En Supabase Dashboard > Authentication > URL Configuration:

Site URL:

- `https://lima-certus.vercel.app`

Redirect URLs:

- `https://lima-certus.vercel.app/**`
- `http://localhost:3000/**`
- `https://*-franco-zetas-projects.vercel.app/**`

Referencia oficial:

- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

## 7. Cambios tecnicos aplicados para corregir localhost

Se agrego `lib/site-url.ts` para centralizar la URL canonica de la aplicacion:

Prioridad usada:

1. `NEXT_PUBLIC_SITE_URL`
2. `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`
3. `VERCEL_PROJECT_PRODUCTION_URL`
4. `NEXT_PUBLIC_VERCEL_URL`
5. `VERCEL_URL`
6. `requestOrigin`
7. `http://localhost:3000` solo como fallback local final

Archivos impactados:

- `app/actions/auth.ts`
- `app/profile/[id]/page.tsx`
- `lib/site-url.ts`
- `tests/site-url.test.ts`

Objetivo: evitar que produccion genere callbacks o QRs apuntando a `localhost`.

## 8. Riesgos y pruebas pendientes

| Riesgo | Impacto | Accion recomendada |
| --- | --- | --- |
| Google OAuth no actualizado | Login social puede fallar con `redirect_uri_mismatch` o volver a localhost | Actualizar Google Cloud Console |
| Supabase `Site URL` en localhost | Login puede terminar en localhost despues de autenticar | Actualizar Supabase Auth URL Configuration |
| Roles no probados con cuentas reales | Admin/Jurado/Participante pueden requerir ajuste de permisos o seed | Crear usuarios de prueba por rol |
| Subida de archivos no probada end-to-end | Storage puede requerir validacion manual de bucket/RLS | Probar upload PDF/PPTX/ZIP autenticado |
| Evaluacion jurado no probada end-to-end | Puede requerir datos seed reales | Crear hackaton + equipo + proyecto + jurado |

## 9. Plan de pruebas final para demo

Despues de actualizar Google y Supabase Auth:

1. Iniciar sesion con Google en `https://lima-certus.vercel.app/login`.
2. Confirmar que vuelve a `/dashboard`, no a localhost.
3. Completar perfil con carrera, experiencia y habilidades.
4. Verificar QR en perfil.
5. Inscribirse a un hackaton activo.
6. Crear o unirse a un equipo.
7. Subir un archivo de proyecto valido.
8. Acceder como jurado y registrar evaluacion.
9. Acceder como admin y publicar resultados.
10. Verificar ranking en `/results/[hackathonId]`.

## 10. Conclusion

El MVP esta estable a nivel de build, pruebas unitarias, rutas protegidas y deployment. El punto critico restante para una demo completa es configurar correctamente Google OAuth y Supabase Auth URLs.

Una vez completada esa configuracion externa, el flujo esperado debe ser:

`Login Google -> Supabase callback -> /auth/callback de LIMA -> /dashboard`

Estado final: **MVP listo para prueba funcional guiada, con OAuth pendiente de ajuste en consola externa**.

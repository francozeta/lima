# Contribuir a LIMA

Gracias por ayudar a mejorar LIMA. Esta guia resume el flujo recomendado para
trabajar desde un fork y proponer cambios al repositorio principal.

## Flujo de trabajo

1. Sincroniza tu fork con el repositorio principal:

```bash
git checkout main
git fetch upstream
git pull --ff-only upstream main
git push origin main
```

2. Crea una rama para tu cambio:

```bash
git checkout -b feat/descripcion-corta
```

3. Haz cambios pequenos y enfocados. Evita mezclar refactors, cambios visuales y
   ajustes de base de datos en el mismo pull request.

4. Verifica el proyecto antes de abrir el pull request:

```bash
pnpm lint
pnpm test
pnpm build
```

5. Sube la rama a tu fork:

```bash
git push -u origin feat/descripcion-corta
```

6. Abre un pull request hacia `francozeta/lima:main`.

## Antes de enviar

- No subas `.env.local` ni credenciales.
- Documenta cualquier migracion nueva de Supabase en el README.
- Si agregas rutas o flujos nuevos, incluye los pasos manuales para probarlos.
- Manten el pull request pequeno y con una descripcion clara del cambio.

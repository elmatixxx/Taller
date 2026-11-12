# Service — Taller Automotriz

## Puesta en marcha

1. En Supabase, abre **SQL Editor**, pega y ejecuta `supabase/schema.sql`.
2. En **Authentication > Providers > Email**, habilita el acceso por correo. Para pruebas rápidas puedes desactivar la confirmación de email; en producción configura la URL de redirección de Vercel.
3. Copia `.env.example` como `.env.local` e ingresa la URL y clave anónima de tu proyecto Supabase.
4. Ejecuta `npm install` y `npm run dev`.

## Despliegue en Vercel

1. Sube esta carpeta a un repositorio GitHub (`git init`, `git add .`, `git commit -m "Taller"`, crea el repositorio y ejecuta `git push`).
2. En Vercel importa el repositorio. En **Settings > Environment Variables**, agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para Production, Preview y Development.
3. Despliega. Copia la URL final y agréguela en Supabase: **Authentication > URL Configuration > Site URL** y **Redirect URLs**.

El PDF se prepara completamente en el navegador: no usa almacenamiento local ni funciones serverless para generar archivos. Reemplaza `public/logo.png` si deseas actualizar la identidad visual.

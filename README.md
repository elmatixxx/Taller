# Service — Taller Automotriz

Gestión de taller mecánico para **Jhonny Cisternas · Técnico mecánico**: dashboard, cotizaciones, órdenes de trabajo (OT), clientes y vehículos.

Stack: Next.js (App Router) + TypeScript + Tailwind · Supabase (Auth + PostgreSQL + RLS) con `@supabase/ssr` · PDF con `jspdf` y Excel con `xlsx`, ambos generados en el navegador.

## Puesta en marcha

1. En Supabase, abre **SQL Editor**, pega y ejecuta `supabase/schema.sql` (solo si la base de datos es nueva).
2. **Migración de mejoras** (ver sección siguiente): ejecuta `supabase/migracion-mejoras-taller.sql`.
3. En **Authentication > Providers > Email**, habilita el acceso por correo. Para pruebas rápidas puedes desactivar la confirmación de email; en producción configura la URL de redirección de Vercel.
4. Copia `.env.example` como `.env.local` e ingresa la URL y la clave anónima de tu proyecto Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Ejecuta `npm install` y `npm run dev`.

> La aplicación solo usa la clave **anon** (pública). Nunca uses ni expongas la clave `service_role`.

## Migración de mejoras (ejecutar una sola vez)

Archivo: `supabase/migracion-mejoras-taller.sql`. En Supabase: **SQL Editor > New query**, pega el contenido completo y pulsa **Run**.

Qué hace (no borra ni modifica datos existentes; es idempotente, repetirla es seguro):

- Agrega `vigencia_hasta` (fecha) y `observaciones_cotizacion` a `ordenes_trabajo`.
- Crea el estado de aprobación `estado_cotizacion`: `en_espera`, `aceptada`, `rechazada`.
- Agrega `cotizacion_id`, que enlaza una OT con su cotización.
- Crea el trigger `validar_ot_con_cotizacion`: **impide crear una OT** que no esté vinculada a una cotización **aceptada del mismo cliente y vehículo**. Las OT anteriores a la migración (sin cotización) siguen siendo editables.

Incluye todo lo que hacían `migracion-cotizaciones.sql` y `migracion-vinculo-cotizacion-ot.sql`; no es necesario ejecutarlas (quedan solo como historial).

## Cómo se usa

- **Dashboard**: ingresos del mes (cotizaciones aceptadas creadas en el mes actual, con IVA si corresponde), total de clientes y vehículos, cotizaciones en espera, OT en proceso, accesos directos y el botón **Descargar respaldo Excel**.
- **Cotizaciones**: elige cliente, luego uno de sus vehículos; agrega mano de obra, repuestos/insumos y extras (IVA 19 % opcional); define vigencia y observaciones. El estado (En espera / Aceptada / Rechazada) se cambia desde la tarjeta o al editar. Cada tarjeta permite descargar el PDF.
- **Órdenes de trabajo**: 1) elige el cliente, 2) elige una de sus cotizaciones **aceptadas**, 3) el vehículo y los trabajos se cargan solos. Estados: En proceso (azul), En espera (amarillo), Terminado (verde). Las tarjetas de OT no muestran precios ni PDF.
- **Clientes** y **Vehículos**: secciones separadas, cada una con su formulario, listado y contador. Los formularios se limpian al guardar.
- **Respaldo Excel**: `respaldo-taller-AAAA-MM-DD.xlsx` con las hojas Clientes, Vehículos, Cotizaciones y Órdenes de trabajo. Se genera en el navegador con los datos de tu cuenta.

## Despliegue en Vercel

1. Sube esta carpeta a un repositorio GitHub (`git init`, `git add .`, `git commit -m "Taller"`, crea el repositorio y ejecuta `git push`).
2. En Vercel importa el repositorio. En **Settings > Environment Variables**, agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para Production, Preview y Development.
3. Ejecuta la migración `supabase/migracion-mejoras-taller.sql` en Supabase (una sola vez) **antes** de usar la versión desplegada.
4. Despliega. Copia la URL final y agréguela en Supabase: **Authentication > URL Configuration > Site URL** y **Redirect URLs**.

El PDF y el Excel se preparan completamente en el navegador: no usan almacenamiento local ni funciones serverless para generar archivos, y los datos del taller viven solo en Supabase. Reemplaza `public/logo.png` si deseas actualizar la identidad visual.

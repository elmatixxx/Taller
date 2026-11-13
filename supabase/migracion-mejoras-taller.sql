-- Ejecutar una sola vez en Supabase SQL Editor. No elimina ni modifica datos existentes.
-- Es idempotente: si ya se ejecutó, volver a ejecutarla es seguro (solo actualiza la regla de validación).
-- Reemplaza a migracion-cotizaciones.sql y migracion-vinculo-cotizacion-ot.sql: no necesitas ejecutarlas.

-- Tipo de documento (cotización / OT). Las filas existentes quedan como órdenes de trabajo.
do $$ begin
  create type public.tipo_documento as enum ('orden_trabajo','cotizacion');
exception when duplicate_object then null; end $$;
alter table public.ordenes_trabajo
  add column if not exists tipo public.tipo_documento not null default 'orden_trabajo';

alter table public.ordenes_trabajo
  add column if not exists vigencia_hasta date,
  add column if not exists observaciones_cotizacion text;

-- Estado de aprobación y vínculo OT ↔ cotización, si aún no existen.
do $$ begin
  create type public.estado_cotizacion as enum ('en_espera','aceptada','rechazada');
exception when duplicate_object then null; end $$;
alter table public.ordenes_trabajo
  add column if not exists estado_cotizacion public.estado_cotizacion not null default 'en_espera',
  add column if not exists cotizacion_id uuid references public.ordenes_trabajo(id);

-- Regla: no se puede CREAR una OT sin una cotización aceptada del mismo cliente y vehículo.
-- En UPDATE solo se revalida si cambia el vínculo (cotización, cliente, vehículo o tipo); así las OT
-- anteriores a esta migración (sin cotización) y las OT cuya cotización cambió de estado siguen
-- siendo editables (estado, observaciones, etc.).
create or replace function public.validar_ot_con_cotizacion()
returns trigger language plpgsql security definer set search_path = public as $$
declare revisar boolean := false;
begin
  if new.tipo = 'orden_trabajo' then
    -- IF anidados: Postgres no garantiza cortocircuito en OR y OLD no existe en INSERT.
    if tg_op = 'INSERT' then
      revisar := true;
    else
      revisar := new.cotizacion_id is distinct from old.cotizacion_id
              or new.cliente_id    is distinct from old.cliente_id
              or new.vehiculo_id   is distinct from old.vehiculo_id
              or new.tipo          is distinct from old.tipo;
    end if;
    if revisar then
      if new.cotizacion_id is null then
        raise exception 'Una OT requiere una cotización aceptada.';
      end if;
      if not exists (
        select 1 from public.ordenes_trabajo c
        where c.id = new.cotizacion_id and c.tipo = 'cotizacion'
          and c.estado_cotizacion = 'aceptada'
          and c.cliente_id = new.cliente_id and c.vehiculo_id = new.vehiculo_id
      ) then
        raise exception 'La cotización debe estar aceptada y corresponder al mismo cliente y vehículo.';
      end if;
    end if;
  end if;
  return new;
end $$;

-- Trigger de la migración anterior (migracion-vinculo-cotizacion-ot.sql), si se llegó a ejecutar:
-- su regla queda incluida arriba, así que se retira para que no bloquee ediciones.
drop trigger if exists validar_vinculo_cotizacion on public.ordenes_trabajo;
drop function if exists public.validar_vinculo_cotizacion();

drop trigger if exists validar_ot_con_cotizacion on public.ordenes_trabajo;
create trigger validar_ot_con_cotizacion before insert or update on public.ordenes_trabajo
for each row execute function public.validar_ot_con_cotizacion();

-- Ejecutar una sola vez en Supabase SQL Editor. No elimina datos.
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

create or replace function public.validar_ot_con_cotizacion()
returns trigger language plpgsql security definer as $$
begin
  if new.tipo = 'orden_trabajo' then
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
  return new;
end $$;
drop trigger if exists validar_ot_con_cotizacion on public.ordenes_trabajo;
create trigger validar_ot_con_cotizacion before insert or update on public.ordenes_trabajo
for each row execute function public.validar_ot_con_cotizacion();

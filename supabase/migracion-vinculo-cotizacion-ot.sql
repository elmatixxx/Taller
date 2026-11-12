-- Ejecutar una vez en Supabase SQL Editor.
create type public.estado_cotizacion as enum ('en_espera', 'aceptada', 'rechazada');
alter table public.ordenes_trabajo add column estado_cotizacion public.estado_cotizacion not null default 'en_espera';
alter table public.ordenes_trabajo add column cotizacion_id uuid references public.ordenes_trabajo(id);

-- Una OT solo puede apuntar a una cotización aceptada.
create or replace function public.validar_vinculo_cotizacion()
returns trigger language plpgsql security definer as $$
begin
  if new.tipo = 'orden_trabajo' and new.cotizacion_id is not null then
    if not exists (
      select 1 from public.ordenes_trabajo c
      where c.id = new.cotizacion_id
        and c.tipo = 'cotizacion'
        and c.estado_cotizacion = 'aceptada'
        and c.cliente_id = new.cliente_id
        and c.vehiculo_id = new.vehiculo_id
    ) then
      raise exception 'La OT solo puede vincularse a una cotización aceptada del mismo cliente y vehículo.';
    end if;
  end if;
  return new;
end;
$$;
create trigger validar_vinculo_cotizacion before insert or update on public.ordenes_trabajo for each row execute function public.validar_vinculo_cotizacion();

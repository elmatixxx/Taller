-- Ejecutar solo si ya ejecutaste schema.sql previamente.
-- Las órdenes existentes se conservan como órdenes de trabajo.
create type public.tipo_documento as enum ('orden_trabajo','cotizacion');
alter table public.ordenes_trabajo add column tipo public.tipo_documento not null default 'orden_trabajo';

import type { EstadoCotizacion, EstadoOT, ItemOrden } from './types';

export const TALLER = {
  nombre: 'Jhonny Cisternas',
  cargo: 'Técnico mecánico',
  direccion: 'AVENIDA COSTANERA NORTE 4429',
} as const;

// Zona horaria fija para que servidor (Vercel, UTC) y navegador muestren las mismas fechas.
const TZ = 'America/Santiago';
const IVA = 0.19;

export const price = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

/** Neto, IVA (19% opcional) y total de un conjunto de ítems. */
export function totales(items: Pick<ItemOrden, 'cantidad' | 'precio_unitario'>[] | undefined, incluirIva: boolean) {
  const neto = Math.round((items || []).reduce((s, i) => s + i.cantidad * i.precio_unitario, 0));
  const iva = incluirIva ? Math.round(neto * IVA) : 0;
  return { neto, iva, total: neto + iva };
}

/** Fecha/hora ISO (timestamptz) -> dd-mm-aaaa en hora de Chile. */
export const fecha = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat('es-CL', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso)).replace(/\//g, '-') : '—';

/** Columna `date` (aaaa-mm-dd) -> dd-mm-aaaa, sin conversión de zona horaria. */
export const vigencia = (d?: string | null) => (d ? d.slice(0, 10).split('-').reverse().join('-') : 'Sin vigencia');

/** Año y mes (aaaa-mm) de un timestamp, en hora de Chile. */
export const anioMes = (iso: string | Date) => {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' }).formatToParts(new Date(iso));
  return `${p.find(x => x.type === 'year')?.value}-${p.find(x => x.type === 'month')?.value}`;
};

export const CATEGORIAS = [
  ['mano_obra', 'Mano de obra'],
  ['repuesto', 'Repuestos / insumos'],
  ['extra', 'Extras'],
] as const;
export const categoriaLabel = (c: ItemOrden['categoria']) => CATEGORIAS.find(([k]) => k === c)?.[1] || c;

// Estados de cotización: valor en BD, etiqueta y color.
export const ESTADOS_COT: readonly (readonly [EstadoCotizacion, string, string])[] = [
  ['en_espera', 'En espera', 'bg-amber-100 text-amber-800 ring-amber-300'],
  ['aceptada', 'Aceptada', 'bg-emerald-100 text-emerald-800 ring-emerald-300'],
  ['rechazada', 'Rechazada', 'bg-red-100 text-red-800 ring-red-300'],
];
export const estadoCot = (e?: EstadoCotizacion | null) => ESTADOS_COT.find(([k]) => k === e) || ESTADOS_COT[0];

// Estados de OT: únicamente En proceso (azul), En espera (amarillo) y Terminado (verde).
export const ESTADOS_OT_UI: readonly (readonly [EstadoOT, string, string])[] = [
  ['En Diagnóstico', 'En proceso', 'bg-blue-100 text-blue-800 ring-blue-300'],
  ['Esperando Repuestos', 'En espera', 'bg-amber-100 text-amber-800 ring-amber-300'],
  ['Listo para Entrega', 'Terminado', 'bg-emerald-100 text-emerald-800 ring-emerald-300'],
];

/** Normaliza cualquier valor del enum `estado_ot` (incluidos los antiguos) a uno de los 3 estados vigentes. */
export function estadoOTNormalizado(estado: string): EstadoOT {
  if (estado === 'Esperando Repuestos') return 'Esperando Repuestos';
  if (estado === 'Listo para Entrega' || estado === 'Entregado') return 'Listo para Entrega';
  return 'En Diagnóstico';
}
export const estadoOT = (estado: string) => ESTADOS_OT_UI.find(([k]) => k === estadoOTNormalizado(estado))!;

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Cliente, Orden, Vehiculo } from './types';
import { categoriaLabel, estadoCot, estadoOT, totales, vigencia } from './formato';

type Valor = string | number | Date | null;
type Fila = Record<string, Valor>;
export type HojaRespaldo = { nombre: string; columnas: string[]; filas: Fila[] };

const PAGINA = 1000; // PostgREST devuelve como máximo 1000 filas por consulta.

async function traerTodo<T>(db: SupabaseClient, tabla: string, select: string, orden: string): Promise<T[]> {
  const out: T[] = [];
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await db.from(tabla).select(select).order(orden).order('id').range(desde, desde + PAGINA - 1);
    if (error) throw new Error(`${tabla}: ${error.message}`);
    out.push(...((data || []) as unknown as T[]));
    if (!data || data.length < PAGINA) return out;
  }
}

const dia = (iso?: string | null) => (iso ? new Date(iso) : null);
// 'aaaa-mm-dd' como fecha local (evita el desfase de un día por zona horaria).
const diaLocal = (d?: string | null) => (d ? new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) : null);
const veh = (v?: Pick<Vehiculo, 'patente' | 'marca' | 'modelo'> | null) => (v ? `${v.patente} · ${v.marca} ${v.modelo}` : '');

function hoja<T>(nombre: string, datos: T[], cols: [string, (x: T) => Valor][]): HojaRespaldo {
  return {
    nombre,
    columnas: cols.map(([k]) => k),
    filas: datos.map(d => Object.fromEntries(cols.map(([k, f]) => [k, f(d)]))),
  };
}

/** Construye las 4 hojas del respaldo con relaciones, estados, fechas, vigencias, trabajos e importes. */
export function construirHojas(clientes: Cliente[], vehiculos: Vehiculo[], ordenes: Orden[]): HojaRespaldo[] {
  const cliente = new Map(clientes.map(c => [c.id, c]));
  const vehiculo = new Map(vehiculos.map(v => [v.id, v]));
  const cotizaciones = ordenes.filter(o => o.tipo === 'cotizacion');
  const ots = ordenes.filter(o => o.tipo === 'orden_trabajo');
  const cotPorId = new Map(cotizaciones.map(c => [c.id, c]));
  const otsDeCot = new Map<string, number[]>();
  ots.forEach(o => o.cotizacion_id && otsDeCot.set(o.cotizacion_id, [...(otsDeCot.get(o.cotizacion_id) || []), o.numero]));
  const nombreCliente = (o: Orden) => cliente.get(o.cliente_id)?.nombre_completo || o.clientes?.nombre_completo || '';
  const vehiculoDe = (o: Orden) => veh(vehiculo.get(o.vehiculo_id) || o.vehiculos);

  return [
    hoja('Clientes', clientes, [
      ['Nombre completo', c => c.nombre_completo],
      ['RUT / ID', c => c.rut || ''],
      ['Teléfono', c => c.telefono || ''],
      ['Correo electrónico', c => c.email || ''],
      ['Vehículos (patentes)', c => vehiculos.filter(v => v.cliente_id === c.id).map(v => v.patente).join(', ')],
      ['Cotizaciones', c => cotizaciones.filter(o => o.cliente_id === c.id).length],
      ['Órdenes de trabajo', c => ots.filter(o => o.cliente_id === c.id).length],
      ['Fecha de creación', c => dia(c.created_at)],
    ]),
    hoja('Vehículos', vehiculos, [
      ['Patente', v => v.patente],
      ['Marca', v => v.marca],
      ['Modelo', v => v.modelo],
      ['Año', v => v.anio],
      ['Kilometraje', v => v.kilometraje],
      ['VIN / chasis', v => v.vin || ''],
      ['Color', v => v.color || ''],
      ['Cliente', v => cliente.get(v.cliente_id)?.nombre_completo || ''],
      ['RUT cliente', v => cliente.get(v.cliente_id)?.rut || ''],
    ]),
    hoja('Cotizaciones', cotizaciones, [
      ['N° cotización', c => c.numero],
      ['Fecha', c => dia(c.created_at)],
      ['Vigencia hasta', c => diaLocal(c.vigencia_hasta)],
      ['Estado', c => estadoCot(c.estado_cotizacion)[1]],
      ['Cliente', nombreCliente],
      ['Vehículo', vehiculoDe],
      ['Trabajos / diagnóstico', c => c.trabajos || ''],
      ['Observaciones al cliente', c => c.observaciones_cotizacion || ''],
      ['Detalle de ítems', c => (c.items_orden || []).map(i => `${categoriaLabel(i.categoria)}: ${i.descripcion} (${i.cantidad} x ${i.precio_unitario})`).join(' | ')],
      ['Neto', c => totales(c.items_orden, c.incluir_iva).neto],
      ['Incluye IVA 19%', c => (c.incluir_iva ? 'Sí' : 'No')],
      ['IVA', c => totales(c.items_orden, c.incluir_iva).iva],
      ['Total', c => totales(c.items_orden, c.incluir_iva).total],
      ['OT vinculadas', c => (otsDeCot.get(c.id) || []).join(', ')],
    ]),
    hoja('Órdenes de trabajo', ots, [
      ['N° OT', o => o.numero],
      ['Fecha', o => dia(o.created_at)],
      ['Estado', o => estadoOT(o.estado)[1]],
      ['Cliente', nombreCliente],
      ['Vehículo', vehiculoDe],
      ['N° cotización vinculada', o => (o.cotizacion_id ? cotPorId.get(o.cotizacion_id)?.numero ?? '' : '')],
      ['Estado cotización', o => { const c = o.cotizacion_id ? cotPorId.get(o.cotizacion_id) : undefined; return c ? estadoCot(c.estado_cotizacion)[1] : ''; }],
      ['Vigencia cotización', o => { const c = o.cotizacion_id ? cotPorId.get(o.cotizacion_id) : undefined; return c ? vigencia(c.vigencia_hasta) : ''; }],
      ['Total cotización', o => { const c = o.cotizacion_id ? cotPorId.get(o.cotizacion_id) : undefined; return c ? totales(c.items_orden, c.incluir_iva).total : ''; }],
      ['Trabajos', o => o.trabajos || ''],
      ['Observaciones de entrada', o => o.observaciones_entrada || ''],
      ['Observaciones de salida', o => o.observaciones_salida || ''],
    ]),
  ];
}

/** Lee los datos actuales desde Supabase (con RLS) y descarga un .xlsx generado en el navegador. */
export async function descargarRespaldoExcel(db: SupabaseClient) {
  const [clientes, vehiculos, ordenes, XLSX] = await Promise.all([
    traerTodo<Cliente>(db, 'clientes', '*', 'nombre_completo'),
    traerTodo<Vehiculo>(db, 'vehiculos', '*', 'patente'),
    traerTodo<Orden>(db, 'ordenes_trabajo', '*, items_orden(*)', 'numero'),
    import('xlsx'),
  ]);
  const wb = XLSX.utils.book_new();
  for (const { nombre, columnas, filas } of construirHojas(clientes, vehiculos, ordenes)) {
    const ws = XLSX.utils.json_to_sheet(filas, { header: columnas, dateNF: 'dd-mm-yyyy' });
    ws['!cols'] = columnas.map(k => ({
      wch: Math.min(60, filas.reduce((m, f) => Math.max(m, f[k] instanceof Date ? 12 : String(f[k] ?? '').length + 2), k.length + 2)),
    }));
    XLSX.utils.book_append_sheet(wb, ws, nombre);
  }
  XLSX.writeFile(wb, `respaldo-taller-${new Date().toISOString().slice(0, 10)}.xlsx`);
  return { clientes: clientes.length, vehiculos: vehiculos.length, ordenes: ordenes.length };
}

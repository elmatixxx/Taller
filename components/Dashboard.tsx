'use client';
import { useState } from 'react';
import type { Cliente, Orden, Vehiculo } from '@/lib/types';
import { anioMes, estadoOT, price, totales } from '@/lib/formato';

type Props = {
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  docs: Orden[];
  hayAceptadas: boolean;
  nuevaCotizacion: () => void;
  nuevaOT: () => void;
  nuevoCliente: () => void;
  nuevoVehiculo: () => void;
  respaldo: () => Promise<void>;
};

export default function Dashboard({ clientes, vehiculos, docs, hayAceptadas, nuevaCotizacion, nuevaOT, nuevoCliente, nuevoVehiculo, respaldo }: Props) {
  const [bajando, setBajando] = useState(false);
  const cotizaciones = docs.filter(d => d.tipo === 'cotizacion');
  const ots = docs.filter(d => d.tipo === 'orden_trabajo');
  const mes = anioMes(new Date());
  // Ingresos del mes: cotizaciones aceptadas creadas este mes (con IVA si corresponde).
  const ingresos = cotizaciones
    .filter(c => c.estado_cotizacion === 'aceptada' && anioMes(c.created_at) === mes)
    .reduce((s, c) => s + totales(c.items_orden, c.incluir_iva).total, 0);
  const enEspera = cotizaciones.filter(c => (c.estado_cotizacion || 'en_espera') === 'en_espera').length;
  const enProceso = ots.filter(o => estadoOT(o.estado)[1] === 'En proceso').length;

  const stats = [
    ['Ingresos del mes', price(ingresos), 'Cotizaciones aceptadas este mes', 'border-emerald-500 text-emerald-700'],
    ['Clientes', String(clientes.length), 'Total registrados', 'border-slate-400 text-slate-800'],
    ['Vehículos', String(vehiculos.length), 'Total registrados', 'border-slate-400 text-slate-800'],
    ['Cotizaciones en espera', String(enEspera), 'Pendientes de respuesta', 'border-amber-500 text-amber-700'],
    ['OT en proceso', String(enProceso), 'Trabajos en curso', 'border-blue-500 text-blue-700'],
  ] as const;

  const accesos = [
    ['+ Crear cotización', nuevaCotizacion, false, 'bg-brand text-white hover:bg-red-700'],
    ['+ Crear OT', nuevaOT, !hayAceptadas, 'bg-slate-900 text-white hover:bg-slate-700'],
    ['+ Nuevo cliente', nuevoCliente, false, 'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50'],
    ['+ Nuevo vehículo', nuevoVehiculo, false, 'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50'],
  ] as const;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(([titulo, valor, nota, color]) => (
          <article key={titulo} className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ${color.split(' ')[0]}`}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{titulo}</p>
            <p className={`mt-1 text-2xl font-bold ${color.split(' ')[1]}`}>{valor}</p>
            <p className="mt-1 text-xs text-slate-500">{nota}</p>
          </article>
        ))}
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">Accesos directos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {accesos.map(([texto, accion, off, estilo]) => (
            <button key={texto} onClick={accion} disabled={off} className={estilo} title={off ? 'Necesitas al menos una cotización aceptada' : undefined}>
              {texto}
            </button>
          ))}
        </div>
        {!hayAceptadas && <p className="mt-3 text-sm text-slate-500">Para crear una OT primero debe existir una cotización aceptada.</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold">Respaldo de datos</h2>
          <p className="text-sm text-slate-500">Archivo Excel con clientes, vehículos, cotizaciones y órdenes de trabajo. Se genera en tu navegador.</p>
        </div>
        <button
          disabled={bajando}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={async () => {
            setBajando(true);
            try { await respaldo(); } finally { setBajando(false); }
          }}
        >
          {bajando ? 'Generando…' : 'Descargar respaldo Excel'}
        </button>
      </div>
    </section>
  );
}

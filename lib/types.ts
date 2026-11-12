export const ESTADOS_OT = ['En Diagnóstico', 'Esperando Repuestos', 'Listo para Entrega'] as const;
export type EstadoOT = typeof ESTADOS_OT[number];
export type TipoDocumento = 'orden_trabajo' | 'cotizacion';
export type EstadoCotizacion = 'en_espera' | 'aceptada' | 'rechazada';
export type Cliente = { id: string; nombre_completo: string; rut: string | null; telefono: string | null; email: string | null; created_at?: string };
export type Vehiculo = { id: string; cliente_id: string; patente: string; marca: string; modelo: string; anio: number | null; kilometraje: number | null; vin: string | null; color: string | null };
export type ItemOrden = { id?: string; categoria: 'mano_obra' | 'repuesto' | 'extra'; descripcion: string; cantidad: number; precio_unitario: number };
export type Orden = { id: string; numero: number; tipo: TipoDocumento; cliente_id: string; vehiculo_id: string; estado: EstadoOT; estado_cotizacion?: EstadoCotizacion; cotizacion_id?: string | null; trabajos: string | null; observaciones_entrada: string | null; observaciones_salida: string | null; incluir_iva: boolean; created_at: string; clientes?: Cliente; vehiculos?: Vehiculo; items_orden?: ItemOrden[] };

'use client';
import type { Orden } from '@/lib/types';
import { TALLER, categoriaLabel, estadoCot, estadoOT, fecha, price as money, totales, vigencia } from '@/lib/formato';

// Carga el logo y lo reduce a JPEG liviano para que el PDF no pese cientos de KB; conserva la proporción real.
async function cargarLogo() {
  const img = new Image(); img.src = '/logo.png';
  await new Promise<void>(r => { img.onload = () => r(); img.onerror = () => r(); });
  if (!(img.complete && img.naturalWidth)) return null;
  const k = Math.min(1, 400 / img.naturalWidth), c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  const g = c.getContext('2d'); if (!g) return null;
  g.drawImage(img, 0, 0, c.width, c.height);
  return { data: c.toDataURL('image/jpeg', 0.85), ratio: img.naturalWidth / img.naturalHeight };
}

export function DescargarPDF({orden}:{orden:Orden}) {
 async function descargar(){
  const [{jsPDF},{default:autoTable}]=await Promise.all([import('jspdf'),import('jspdf-autotable')]);
  const pdf=new jsPDF({unit:'mm',format:'a4'}), items=orden.items_orden||[], esCot=orden.tipo==='cotizacion';
  const {neto,iva,total}=totales(items,orden.incluir_iva);
  const LIM=262; let y=0; // límite inferior del contenido: debajo van las líneas de firma
  const asegurar=(alto:number)=>{ if(y+alto>LIM){ pdf.addPage(); y=20; } };
  const bloque=(titulo:string,texto:string)=>{ const lineas=pdf.splitTextToSize(texto,182) as string[]; asegurar(12); pdf.setFont('helvetica','bold'); pdf.setFontSize(11); pdf.text(titulo,14,y); y+=5; pdf.setFont('helvetica','normal'); pdf.setFontSize(9); for(const l of lineas){ asegurar(4); pdf.text(l,14,y); y+=4; } y+=4; };

  // Encabezado: logo + identidad del taller + datos del documento
  const logo=await cargarLogo(), alto=26, ancho=logo?alto*logo.ratio:0;
  if(logo) pdf.addImage(logo.data,'JPEG',14,12,ancho,alto);
  const x0=14+(logo?ancho+6:0), titulo=esCot?'COTIZACIÓN':'ORDEN DE TRABAJO';
  pdf.setFont('helvetica','bold'); pdf.setFontSize(16); pdf.text(titulo+' #'+orden.numero,x0,19);
  pdf.setFontSize(11); pdf.text(TALLER.nombre,x0,26);
  pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.text(TALLER.cargo,x0,31); pdf.text(TALLER.direccion,x0,36);
  pdf.text('Fecha: '+fecha(orden.created_at),196,19,{align:'right'});
  if(esCot) pdf.text('Vigencia hasta: '+vigencia(orden.vigencia_hasta),196,25,{align:'right'});
  pdf.text('Estado: '+(esCot?estadoCot(orden.estado_cotizacion)[1]:estadoOT(orden.estado)[1]),196,esCot?31:25,{align:'right'});

  y=48; pdf.setFont('helvetica','bold'); pdf.setFontSize(11); pdf.text('CLIENTE Y VEHÍCULO',14,y); y+=6; pdf.setFont('helvetica','normal'); pdf.setFontSize(9);
  pdf.text('Cliente: '+(orden.clientes?.nombre_completo||'')+' · RUT: '+(orden.clientes?.rut||'—')+' · Tel: '+(orden.clientes?.telefono||'—'),14,y); y+=5;
  pdf.text('Vehículo: '+(orden.vehiculos?.patente||'')+' · '+(orden.vehiculos?.marca||'')+' '+(orden.vehiculos?.modelo||'')+' · KM: '+(orden.vehiculos?.kilometraje||0),14,y); y+=10;
  bloque('TRABAJOS / DIAGNÓSTICO',orden.trabajos||'Sin detalle.');
  if(!esCot){ bloque('OBSERVACIONES DE ENTRADA',orden.observaciones_entrada||'Sin observaciones.'); bloque('OBSERVACIONES DE SALIDA',orden.observaciones_salida||'Pendiente.'); }

  // Detalle de ítems
  autoTable(pdf,{startY:y,head:[['Categoría','Descripción','Cant.','P. Unit.','Subtotal']],body:items.map(i=>[categoriaLabel(i.categoria),i.descripcion,String(i.cantidad),money(i.precio_unitario),money(i.cantidad*i.precio_unitario)]),styles:{fontSize:8},headStyles:{fillColor:[220,38,38]},columnStyles:{2:{halign:'right'},3:{halign:'right'},4:{halign:'right'}},didParseCell:d=>{ if(d.section==='head'&&d.column.index>=2) d.cell.styles.halign='right'; },margin:{left:14,right:14,bottom:20}});
  y=(pdf as any).lastAutoTable.finalY+8;

  // Totales
  asegurar(22); pdf.setFontSize(9); pdf.text('Subtotal: '+money(neto),196,y,{align:'right'}); pdf.text('IVA '+(orden.incluir_iva?'(19%)':'(sin IVA)')+': '+money(iva),196,y+5,{align:'right'});
  pdf.setFont('helvetica','bold'); pdf.setFontSize(11); pdf.text('TOTAL: '+money(total),196,y+12,{align:'right'}); pdf.setFont('helvetica','normal'); y+=22;

  // Vigencia y observaciones para el cliente (cotización)
  if(esCot){
   if(orden.vigencia_hasta) bloque('VIGENCIA','Esta cotización es válida hasta el '+vigencia(orden.vigencia_hasta)+'.');
   if(orden.observaciones_cotizacion?.trim()) bloque('OBSERVACIONES Y RECOMENDACIONES',orden.observaciones_cotizacion);
  }

  // Firmas en la última página
  pdf.setDrawColor(60); pdf.line(25,270,85,270); pdf.line(125,270,185,270); pdf.setFontSize(8); pdf.text('Firma cliente',44,275); pdf.text(TALLER.nombre+' · '+TALLER.cargo,128,275);
  pdf.save((esCot?'Cotizacion-':'OT-')+orden.numero+'.pdf');
 }
 return <button onClick={descargar} className="bg-slate-800 text-white">Descargar PDF</button>;
}

'use client';
import type { Orden } from '@/lib/types';
const money=(n:number)=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n);
export function DescargarPDF({orden}:{orden:Orden}) {
 async function descargar(){
  const [{jsPDF},{default:autoTable}]=await Promise.all([import('jspdf'),import('jspdf-autotable')]);
  const pdf=new jsPDF({unit:'mm',format:'a4'}), items=orden.items_orden||[];
  const neto=items.reduce((s,i)=>s+i.cantidad*i.precio_unitario,0),iva=orden.incluir_iva?Math.round(neto*.19):0;
  const img=new Image(); img.src='/logo.png'; await new Promise<void>(r=>{img.onload=()=>r();img.onerror=()=>r();});
  if(img.complete&&img.naturalWidth) pdf.addImage(img,'PNG',14,12,24,24);
  const titulo=orden.tipo==='cotizacion'?'COTIZACIÓN':'ORDEN DE TRABAJO';
  pdf.setFontSize(16);pdf.text(titulo+' #'+orden.numero,44,18);pdf.setFontSize(9);pdf.text('Johnny Cisternas · AVENIDA COSTANERA NORTE 4429',44,24);pdf.text('Fecha: '+new Date(orden.created_at).toLocaleDateString('es-CL')+' · Estado: '+orden.estado,44,29);
  let y=45;pdf.setFontSize(11);pdf.text('CLIENTE Y VEHÍCULO',14,y);y+=6;pdf.setFontSize(9);pdf.text('Cliente: '+(orden.clientes?.nombre_completo||'')+' · RUT: '+(orden.clientes?.rut||'—')+' · Tel: '+(orden.clientes?.telefono||'—'),14,y);y+=5;pdf.text('Vehículo: '+(orden.vehiculos?.patente||'')+' · '+(orden.vehiculos?.marca||'')+' '+(orden.vehiculos?.modelo||'')+' · KM: '+(orden.vehiculos?.kilometraje||0),14,y);
  y+=10;pdf.setFontSize(11);pdf.text('TRABAJOS / DIAGNÓSTICO',14,y);y+=5;pdf.setFontSize(9);const trabajo=pdf.splitTextToSize(orden.trabajos||'Sin detalle.',180);pdf.text(trabajo,14,y);y+=trabajo.length*4+5;
  if(orden.tipo!=='cotizacion'){pdf.setFontSize(11);pdf.text('OBSERVACIONES DE ENTRADA',14,y);y+=5;pdf.setFontSize(9);const entrada=pdf.splitTextToSize(orden.observaciones_entrada||'Sin observaciones.',180);pdf.text(entrada,14,y);y+=entrada.length*4+5;pdf.setFontSize(11);pdf.text('OBSERVACIONES DE SALIDA',14,y);y+=5;pdf.setFontSize(9);const salida=pdf.splitTextToSize(orden.observaciones_salida||'Pendiente.',180);pdf.text(salida,14,y);y+=salida.length*4+5;}
  autoTable(pdf,{startY:y,head:[['Categoría','Descripción','Cant.','P. Unit.','Total']],body:items.map(i=>[i.categoria==='mano_obra'?'Mano de obra':i.categoria==='repuesto'?'Repuesto':'Extra',i.descripcion,String(i.cantidad),money(i.precio_unitario),money(i.cantidad*i.precio_unitario)]),styles:{fontSize:8},headStyles:{fillColor:[220,38,38]}});
  const fin=(pdf as any).lastAutoTable.finalY+8;pdf.setFontSize(9);pdf.text('Subtotal: '+money(neto),145,fin);pdf.text('IVA '+(orden.incluir_iva?'(19%)':'(sin IVA)')+': '+money(iva),145,fin+5);pdf.setFontSize(11);pdf.text('TOTAL: '+money(neto+iva),145,fin+12);pdf.setDrawColor(60);pdf.line(25,270,85,270);pdf.line(125,270,185,270);pdf.setFontSize(8);pdf.text('Firma cliente',44,275);pdf.text('Johnny Cisternas · Mecánico',132,275);
  pdf.save((orden.tipo==='cotizacion'?'Cotizacion-':'OT-')+orden.numero+'.pdf');
 }
 return <button onClick={descargar} className="bg-slate-800 text-white">Descargar PDF</button>;
}

"use client";

import React, { useState, useEffect } from 'react';
import ModalFactura from '../components/modalFactura';
import { supabase } from '../src/context/supabaseClient';

interface Factura {
  id: string;
  proveedor: string;
  fecha: string;
  monto: number;
  categoria: string;
  tipo: 'Gasto' | 'Ingreso';
  observaciones?: string;
  urlArchivo?: string;
}

export default function InicioPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroMes, setFiltroMes] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [cargando, setCargando] = useState(true);
  const [historial, setHistorial] = useState<any[]>([]);
  const [verHistorial, setVerHistorial] = useState(false);

  // ── CARGAR FACTURAS ──────────────────────────────────────
  const cargarFacturas = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('facturas')
      .select('*')
      .order('fecha', { ascending: false });
    if (!error && data) {
      setFacturas(data.map((f: any) => ({
        id: f.id,
        proveedor: f.proveedor,
        fecha: f.fecha,
        monto: f.monto,
        categoria: f.categoria,
        tipo: f.tipo,
        observaciones: f.observaciones,
        urlArchivo: f.url_archivo,
      })));
    }
    setCargando(false);
  };

  // ── CARGAR HISTORIAL ─────────────────────────────────────
  const cargarHistorial = async () => {
    const { data, error } = await supabase
      .from('historial_envios')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    console.log('Historial:', data, 'Error:', error);
    if (data) setHistorial(data);
  };

  useEffect(() => {
    cargarFacturas();
    cargarHistorial();
  }, []);

  // ── GUARDAR FACTURA ──────────────────────────────────────
  const handleGuardarFactura = async (facturaGuardada: Factura) => {
    const payload = {
      proveedor: facturaGuardada.proveedor,
      fecha: facturaGuardada.fecha,
      monto: facturaGuardada.monto,
      categoria: facturaGuardada.categoria,
      tipo: facturaGuardada.tipo,
      observaciones: facturaGuardada.observaciones || null,
      url_archivo: facturaGuardada.urlArchivo || null,
    };
    if (facturaSeleccionada) {
      await supabase.from('facturas').update(payload).eq('id', facturaGuardada.id);
    } else {
      await supabase.from('facturas').insert(payload);
    }
    setFacturaSeleccionada(null);
    cargarFacturas();
  };

  // ── ELIMINAR FACTURA ─────────────────────────────────────
  const handleEliminarFactura = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este comprobante?')) {
      await supabase.from('facturas').delete().eq('id', id);
      cargarFacturas();
    }
  };

  // ── GENERAR PDF ──────────────────────────────────────────
  const handleGenerarPDF = () => {
    const contenido = `
      <html><head><style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
        h1 { color: #0f3460; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #0f3460; color: white; padding: 10px; text-align: left; font-size: 12px; }
        td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 12px; }
        .ingreso { color: #00a884; font-weight: bold; }
        .gasto { color: #e53e3e; font-weight: bold; }
        .resumen { margin-top: 20px; padding: 15px; background: #f7f7f7; border-radius: 8px; }
      </style></head>
      <body>
        <h1>Reporte de Facturas</h1>
        <p>Período: ${filtroMes === 'Todos' ? 'Todos los meses' : filtroMes} | Categoría: ${filtroCategoria}</p>
        <table>
          <thead><tr><th>Tipo</th><th>Proveedor</th><th>Fecha</th><th>Categoría</th><th>Monto (L.)</th></tr></thead>
          <tbody>
            ${facturasFiltradas.map(f => `
              <tr>
                <td class="${f.tipo === 'Ingreso' ? 'ingreso' : 'gasto'}">${f.tipo}</td>
                <td>${f.proveedor}</td><td>${f.fecha}</td><td>${f.categoria}</td>
                <td>L. ${f.monto.toFixed(2)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div class="resumen">
          <p><strong>Total Ingresos:</strong> L. ${totalIngresos.toFixed(2)}</p>
          <p><strong>Total Gastos:</strong> L. ${totalGastos.toFixed(2)}</p>
          <p><strong>Balance Neto:</strong> L. ${balanceNeto.toFixed(2)}</p>
        </div>
      </body></html>`;
    const ventana = window.open('', '_blank');
    if (ventana) { ventana.document.write(contenido); ventana.document.close(); ventana.print(); }
  };

  // ── WHATSAPP ─────────────────────────────────────────────
  const handleCompartirWhatsApp = async () => {
    const resumen = `📊 *Reporte de Facturas*\n\n` +
      `📅 Período: ${filtroMes === 'Todos' ? 'Todos los meses' : filtroMes}\n` +
      `📁 Categoría: ${filtroCategoria}\n\n` +
      `✅ Ingresos: L. ${totalIngresos.toFixed(2)}\n` +
      `❌ Gastos: L. ${totalGastos.toFixed(2)}\n` +
      `💰 Balance Neto: L. ${balanceNeto.toFixed(2)}\n\n` +
      `📋 Facturas (${facturasFiltradas.length}):\n` +
      facturasFiltradas.map(f => `• ${f.tipo} - ${f.proveedor} - L. ${f.monto.toFixed(2)} (${f.fecha})`).join('\n');

    await supabase.from('historial_envios').insert({
      tipo: 'WhatsApp',
      destinatario: 'WhatsApp',
      periodo: filtroMes === 'Todos' ? 'Todos los meses' : filtroMes,
      categoria: filtroCategoria,
      total_facturas: facturasFiltradas.length,
      total_ingresos: totalIngresos,
      total_gastos: totalGastos,
      balance_neto: balanceNeto,
    });
    await cargarHistorial();
    window.open(`https://wa.me/?text=${encodeURIComponent(resumen)}`, '_blank');
  };

  // ── CORREO ───────────────────────────────────────────────
  const handleEnviarCorreo = async () => {
    const destinatario = prompt('¿A qué correo deseas enviar el reporte?');
    if (!destinatario) return;

    const resumenHTML = `
      <h2 style="color:#0f3460">Reporte de Facturas</h2>
      <p>Período: ${filtroMes === 'Todos' ? 'Todos los meses' : filtroMes} | Categoría: ${filtroCategoria}</p>
      <table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px">
        <thead style="background:#0f3460;color:white">
          <tr><th>Tipo</th><th>Proveedor</th><th>Fecha</th><th>Categoría</th><th>Monto</th></tr>
        </thead>
        <tbody>
          ${facturasFiltradas.map(f => `
            <tr>
              <td style="color:${f.tipo === 'Ingreso' ? '#00a884' : '#e53e3e'}">${f.tipo}</td>
              <td>${f.proveedor}</td><td>${f.fecha}</td><td>${f.categoria}</td>
              <td>L. ${f.monto.toFixed(2)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div style="margin-top:20px;padding:15px;background:#f7f7f7;border-radius:8px">
        <p><strong>Total Ingresos:</strong> L. ${totalIngresos.toFixed(2)}</p>
        <p><strong>Total Gastos:</strong> L. ${totalGastos.toFixed(2)}</p>
        <p><strong>Balance Neto:</strong> L. ${balanceNeto.toFixed(2)}</p>
      </div>`;

    try {
      const res = await fetch('/api/enviar-correo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatario,
          asunto: `Reporte de Facturas - ${filtroMes === 'Todos' ? 'Todos los meses' : filtroMes}`,
          resumen: resumenHTML,
        }),
      });
      const { success, error } = await res.json();
      if (!success) throw new Error(error);

      await supabase.from('historial_envios').insert({
        tipo: 'Correo',
        destinatario,
        periodo: filtroMes === 'Todos' ? 'Todos los meses' : filtroMes,
        categoria: filtroCategoria,
        total_facturas: facturasFiltradas.length,
        total_ingresos: totalIngresos,
        total_gastos: totalGastos,
        balance_neto: balanceNeto,
      });
      await cargarHistorial();
      alert('✅ Correo enviado exitosamente!');
    } catch (err: any) {
      alert(`Error al enviar correo: ${err.message}`);
    }
  };

  const handleAbrirEditar = (factura: Factura) => { setFacturaSeleccionada(factura); setIsModalOpen(true); };
  const handleAbrirCrear = () => { setFacturaSeleccionada(null); setIsModalOpen(true); };

  const facturasFiltradas = facturas.filter((f) => {
    const pasaCategoria = filtroCategoria === 'Todas' || f.categoria === filtroCategoria;
    const mesFactura = f.fecha.split('-')[1];
    const pasaMes = filtroMes === 'Todos' || mesFactura === filtroMes;
    return pasaCategoria && pasaMes;
  });

  const totalIngresos = facturasFiltradas.filter(f => f.tipo === 'Ingreso').reduce((acc, curr) => acc + curr.monto, 0);
  const totalGastos = facturasFiltradas.filter(f => f.tipo === 'Gasto').reduce((acc, curr) => acc + curr.monto, 0);
  const balanceNeto = totalIngresos - totalGastos;

  return (
    <div className="space-y-6">

      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0f3460] dark:text-white">Gestión de Facturas</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Sprint 4: Reporte mensual y envío</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleGenerarPDF} className="px-5 py-2.5 bg-[#00a884] hover:bg-[#0f3460] text-white text-sm font-bold rounded-xl transition-all shadow-md">📄 Generar PDF</button>
          <button onClick={handleCompartirWhatsApp} className="px-5 py-2.5 bg-[#25D366] hover:bg-[#1da851] text-white text-sm font-bold rounded-xl transition-all shadow-md">📱 WhatsApp</button>
          <button onClick={handleEnviarCorreo} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md">📧 Enviar Correo</button>
          <button onClick={() => setVerHistorial(!verHistorial)} className="px-5 py-2.5 bg-zinc-700 hover:bg-zinc-900 text-white text-sm font-bold rounded-xl transition-all shadow-md">🕓 Historial</button>
          <button onClick={handleAbrirCrear} className="px-5 py-2.5 bg-[#0f3460] hover:bg-[#00a884] text-white text-sm font-bold rounded-xl transition-all shadow-md">+ Registrar Factura</button>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ingresos del Período</p>
          <p className="text-2xl font-black text-[#00a884] mt-1">L. {totalIngresos.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Gastos del Período</p>
          <p className="text-2xl font-black text-red-500 mt-1">L. {totalGastos.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Balance Neto</p>
          <p className={`text-2xl font-black mt-1 ${balanceNeto >= 0 ? 'text-[#0f3460] dark:text-white' : 'text-red-600'}`}>L. {balanceNeto.toFixed(2)}</p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase">🔍 Filtros:</div>
        <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium">
          <option value="Todos">Todos los Meses</option>
          <option value="01">Enero</option><option value="02">Febrero</option><option value="03">Marzo</option>
          <option value="04">Abril</option><option value="05">Mayo</option><option value="06">Junio</option>
          <option value="07">Julio</option><option value="08">Agosto</option><option value="09">Septiembre</option>
          <option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option>
        </select>
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium">
          <option value="Todas">Todas las Categorías</option>
          <option value="Alimentación">Alimentación</option><option value="Transporte">Transporte</option>
          <option value="Combustible">Combustible</option><option value="Servicios">Servicios</option>
          <option value="Compras de Oficina">Compras de Oficina</option><option value="Salud">Salud</option>
          <option value="Otros">Otros</option>
        </select>
        <div className="text-xs text-zinc-400 ml-auto font-medium">Mostrando {facturasFiltradas.length} documentos</div>
      </div>

      {/* TABLA DE FACTURAS */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-400 text-xs font-bold uppercase border-b border-zinc-100 dark:border-zinc-700">
                <th className="py-3 px-5">Tipo</th><th className="py-3 px-5">Proveedor / Detalle</th>
                <th className="py-3 px-5">Fecha</th><th className="py-3 px-5">Categoría</th>
                <th className="py-3 px-5 text-right">Monto</th><th className="py-3 px-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700 text-sm text-zinc-700 dark:text-zinc-300">
              {cargando ? (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-400">Cargando facturas...</td></tr>
              ) : facturasFiltradas.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-400 font-medium">Ningún comprobante coincide con los filtros aplicados.</td></tr>
              ) : (
                facturasFiltradas.map((f) => (
                  <tr key={f.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-700/20 transition-colors">
                    <td className="py-4 px-5">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${f.tipo === 'Ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{f.tipo}</span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-semibold text-zinc-900 dark:text-white">{f.proveedor}</div>
                      {f.observaciones && <p className="text-xs text-zinc-400 truncate max-w-[180px]">{f.observaciones}</p>}
                    </td>
                    <td className="py-4 px-5 text-zinc-500">{f.fecha}</td>
                    <td className="py-4 px-5"><span className="text-xs font-medium bg-zinc-100 dark:bg-zinc-700 px-2.5 py-1 rounded-full">{f.categoria}</span></td>
                    <td className={`py-4 px-5 text-right font-bold ${f.tipo === 'Ingreso' ? 'text-[#00a884]' : 'text-zinc-900 dark:text-white'}`}>L. {f.monto.toFixed(2)}</td>
                    <td className="py-4 px-5 text-center space-x-2">
                      {f.urlArchivo && <a href={f.urlArchivo} target="_blank" rel="noreferrer" className="p-1.5 text-zinc-400 hover:text-blue-500 transition-colors">👁️</a>}
                      <button onClick={() => handleAbrirEditar(f)} className="p-1.5 text-zinc-400 hover:text-yellow-500 transition-colors">✏️</button>
                      <button onClick={() => handleEliminarFactura(f.id)} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors">🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HISTORIAL DE ENVÍOS */}
      {verHistorial && (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-700">
            <h2 className="text-sm font-bold text-zinc-700 dark:text-white">🕓 Historial de Envíos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-400 text-xs font-bold uppercase border-b border-zinc-100 dark:border-zinc-700">
                  <th className="py-3 px-5">Tipo</th><th className="py-3 px-5">Destinatario</th>
                  <th className="py-3 px-5">Período</th><th className="py-3 px-5">Facturas</th>
                  <th className="py-3 px-5">Balance</th><th className="py-3 px-5">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700 text-sm">
                {historial.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-zinc-400">No hay envíos registrados aún.</td></tr>
                ) : (
                  historial.map((h) => (
                    <tr key={h.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/20">
                      <td className="py-3 px-5">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${h.tipo === 'WhatsApp' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {h.tipo === 'WhatsApp' ? '📱' : '📧'} {h.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-zinc-600 dark:text-zinc-300">{h.destinatario}</td>
                      <td className="py-3 px-5 text-zinc-500">{h.periodo}</td>
                      <td className="py-3 px-5 text-zinc-500">{h.total_facturas}</td>
                      <td className={`py-3 px-5 font-bold ${h.balance_neto >= 0 ? 'text-[#00a884]' : 'text-red-500'}`}>
                        L. {parseFloat(h.balance_neto).toFixed(2)}
                      </td>
                      <td className="py-3 px-5 text-zinc-400 text-xs">
                        {new Date(h.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ModalFactura
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setFacturaSeleccionada(null); }}
        onGuardar={handleGuardarFactura}
        facturaEditar={facturaSeleccionada}
      />
    </div>
  );
}
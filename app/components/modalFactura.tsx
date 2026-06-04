"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../src/context/supabaseClient'; // Ajusta la ruta según dónde pongas el cliente

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

interface ModalFacturaProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (factura: Factura) => void;
  facturaEditar?: Factura | null; // Si viene, el modal entra en modo Edición
}

const CATEGORIAS = ['Alimentación', 'Transporte', 'Combustible', 'Servicios', 'Compras de Oficina', 'Salud', 'Otros'];

export default function ModalFactura({ isOpen, onClose, onGuardar, facturaEditar }: ModalFacturaProps) {
  const [proveedor, setProveedor] = useState('');
  const [fecha, setFecha] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('Alimentación');
  const [tipo, setTipo] = useState<'Gasto' | 'Ingreso'>('Gasto');
  const [observaciones, setObservaciones] = useState('');
  const [urlArchivo, setUrlArchivo] = useState('');
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);

  // Efecto para rellenar campos si estamos editando
  useEffect(() => {
    if (facturaEditar) {
      setProveedor(facturaEditar.proveedor);
      setFecha(facturaEditar.fecha);
      setMonto(facturaEditar.monto.toString());
      setCategoria(facturaEditar.categoria);
      setTipo(facturaEditar.tipo);
      setObservaciones(facturaEditar.observaciones || '');
      setUrlArchivo(facturaEditar.urlArchivo || '');
    } else {
      // Limpiar si es creación limpia
      setProveedor('');
      setFecha('');
      setMonto('');
      setCategoria('Alimentación');
      setTipo('Gasto');
      setObservaciones('');
      setUrlArchivo('');
    }
  }, [facturaEditar, isOpen]);

  if (!isOpen) return null;

  /// Lógica de carga real a Supabase Storage
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files || e.target.files.length === 0) return;
  const file = e.target.files[0];
  
  setSubiendoArchivo(true); // ← AGREGAR al inicio

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `comprobantes/${fileName}`;

    const NOMBRE_DEL_BUCKET = 'facturas'; // ← minúsculas

    const { error: uploadError } = await supabase.storage
      .from(NOMBRE_DEL_BUCKET)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(NOMBRE_DEL_BUCKET)
      .getPublicUrl(filePath);

    setUrlArchivo(data.publicUrl);
    await extraerDatosConGemini(data.publicUrl); 
    alert("¡Éxito! Archivo subido correctamente.");

  } catch (error: any) {
    alert(`Error: ${error.message}`);
  } finally {
    setSubiendoArchivo(false); // ← AGREGAR al final
  }
}; 
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedor || !fecha || !monto) return;

    onGuardar({
      id: facturaEditar ? facturaEditar.id : Math.random().toString(),
      proveedor,
      fecha,
      monto: parseFloat(monto),
      categoria,
      tipo,
      observaciones,
      urlArchivo
    });

    onClose();
  };

  const extraerDatosConGemini = async (url: string) => {
  try {
    alert('🤖 Analizando factura con IA...');
    
    const res = await fetch('/api/extraer-factura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: url })
    });

    const { success, datos, error } = await res.json();
    if (!success) throw new Error(error);

    // Rellenar campos automáticamente
    if (datos.proveedor) setProveedor(datos.proveedor);
    if (datos.fecha) setFecha(datos.fecha);
    if (datos.monto) setMonto(datos.monto.toString());
    if (datos.categoria) setCategoria(datos.categoria);

    alert('✅ ¡Datos extraídos automáticamente!');
  } catch (err: any) {
    alert(`Error al analizar: ${err.message}`);
  }
};

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-700 overflow-hidden max-h-[90vh] flex flex-col">
        
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-700 flex justify-between items-center bg-[#0f3460] text-white">
          <div>
            <h2 className="text-lg font-bold">{facturaEditar ? 'Editar Comprobante' : 'Subir y Registrar Factura'}</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm text-zinc-800 dark:text-zinc-200">
          
          {/* Campo de Selector de Tipo (Ingreso / Gasto) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Tipo de Registro</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo('Gasto')}
                className={`py-2 rounded-xl font-bold border transition-all ${tipo === 'Gasto' ? 'bg-red-500/10 border-red-500 text-red-500' : 'border-zinc-200 dark:border-zinc-700'}`}
              >
                🔴 Gasto
              </button>
              <button
                type="button"
                onClick={() => setTipo('Ingreso')}
                className={`py-2 rounded-xl font-bold border transition-all ${tipo === 'Ingreso' ? 'bg-[#00a884]/10 border-[#00a884] text-[#00a884]' : 'border-zinc-200 dark:border-zinc-700'}`}
              >
                🟢 Ingreso
              </button>
            </div>
          </div>

          {/* Carga de Archivo adjunto */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Archivo Adjunto (Supabase Storage)</label>
            <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-center relative hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
              <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={subiendoArchivo} />
              <p className="text-xs font-medium">
                {subiendoArchivo ? '⏳ Subiendo a Supabase...' : urlArchivo ? '✅ Archivo Vinculado con Éxito' : 'Click para adjuntar Imagen o PDF'}
              </p>
            </div>
            {urlArchivo && (
              <a href={urlArchivo} target="_blank" rel="noreferrer" className="text-xs text-[#00a884] hover:underline mt-1 block font-semibold">
                🔗 Ver archivo subido original
              </a>
            )}
          </div>

          {/* Formulario Manual */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Proveedor</label>
              <input type="text" required value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Fecha</label>
                <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Monto (L.)</label>
                <input type="number" step="0.01" required value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Categoría</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Observaciones</label>
              <textarea rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl resize-none" />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-zinc-200 dark:border-zinc-600 rounded-xl font-semibold">Cancelar</button>
            <button type="submit" disabled={subiendoArchivo} className="flex-1 py-2 bg-[#0f3460] hover:bg-[#00a884] text-white rounded-xl font-semibold transition-all">
              {facturaEditar ? 'Actualizar Cambios' : 'Guardar Factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
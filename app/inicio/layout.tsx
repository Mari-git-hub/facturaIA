"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../src/context/AuthContext';
import logotipo from '../src/Gemini_Generated_Image_arp2zoarp2zoarp2.png';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-zinc-100 dark:bg-zinc-900">
      
      {/* SIDEBAR (Escritorio) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0f3460] text-white border-r border-zinc-200/10">
        {/* Logo */}
        <div className="p-6 bg-white flex items-center justify-center border-b border-zinc-100">
          <Image src={logotipo} alt="Factura Rápida" width={140} height={45} priority className="object-contain" />
        </div>
        
        {/* Navegación del Sidebar */}
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <Link href="/inicio" className="flex items-center gap-3 px-4 py-3 bg-[#00a884] text-white font-medium rounded-xl transition-colors">
            📊 Panel de Inicio
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-300 hover:bg-white/10 hover:text-white rounded-xl transition-colors text-left cursor-not-allowed opacity-60">
            📄 Mis Facturas (Próximamente)
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-300 hover:bg-white/10 hover:text-white rounded-xl transition-colors text-left cursor-not-allowed opacity-60">
            📤 Subir Documento (Próximamente)
          </button>
        </nav>

        {/* Footer Sidebar / Perfil */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs text-zinc-400 font-medium">Cuenta Activa</p>
              <p className="text-sm font-semibold truncate text-zinc-200">{user?.email || 'usuario@correo.com'}</p>
            </div>
            <button 
              onClick={logout} 
              className="p-2 text-zinc-400 hover:text-red-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO DERECHO (Navbar + Contenido Variable) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* NAVBAR SUPERIOR */}
        <header className="h-16 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between px-6 z-10">
          {/* Espaciador / Título móvil */}
          <div className="flex items-center gap-3 md:hidden">
            <Image src={logotipo} alt="Logo" width={100} height={30} className="object-contain" />
          </div>
          <div className="hidden md:block text-xl font-bold text-[#0f3460] dark:text-white">
            Sistema de Gestión Contable
          </div>

          {/* Menú de Perfil de Usuario */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 focus:outline-none p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {user?.email ? user.email[0].toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Mi Perfil ▼
              </span>
            </button>

            {/* Dropdown del perfil */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-700 py-1 z-20">
                <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-700">
                  <p className="text-xs text-zinc-400">Sesión iniciada</p>
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">{user?.email}</p>
                </div>
                <button 
                  onClick={logout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium transition-colors flex items-center gap-2"
                >
                  <span>🚪</span> Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL INYECTADO */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>

      </div>
    </div>
  );
}
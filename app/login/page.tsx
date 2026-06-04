"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../src/context/AuthContext';
import logotipo from '../src/Gemini_Generated_Image_arp2zoarp2zoarp2.png'; // Ruta a tu asset corporativo

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!login(email, password)) {
      setError('Credenciales inválidas. Por favor intente de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-700">
        
        {/* Logo e Identidad */}
        <div className="flex flex-col items-center">
          <Image 
            src={logotipo} 
            alt="Factura Rápida Logo" 
            width={180} 
            height={60} 
            className="object-contain mb-2"
            priority
          />
          <h2 className="mt-4 text-center text-3xl font-extrabold text-[#0f3460] dark:text-white">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400">
            ¿Aún no tienes una cuenta?{' '}
            <Link href="/registro" className="font-semibold text-[#00a884] hover:text-[#008f70] transition-colors">
              Regístrate aquí
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                className="mt-1 block w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-[#00a884] text-zinc-900 dark:text-white"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Contraseña
              </label>
              <input
                type="password"
                required
                className="mt-1 block w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-[#00a884] text-zinc-900 dark:text-white"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-[#0f3460] hover:bg-[#00a884] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0f3460] transition-all duration-300 shadow-md transform hover:-translate-y-0.5"
            >
              Ingresar al Sistema
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
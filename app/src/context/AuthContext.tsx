"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  registerUser: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Simulación de Login
  const login = (email: string, password: string) => {
    if (email && password) {
      setUser({ email });
      router.push('/inicio'); // Envia al usuario a la pantalla de inicio
      return true;
    }
    return false;
  };

  // Simulación de Registro
  const registerUser = (email: string, password: string) => {
    if (email && password) {
      setUser({ email });
      router.push('/inicio'); // Envia al usuario a la pantalla de inicio directo
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, registerUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};
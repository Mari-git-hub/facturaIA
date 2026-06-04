"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirige automáticamente a la pantalla de iniciar sesión
    router.push("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="p-4 text-center">
        <p className="text-sm text-zinc-500 animate-pulse">Cargando sistema...</p>
      </div>
    </div>
  );
}
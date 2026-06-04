import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Esto nos ayudará a ver en la consola del navegador si las credenciales están llegando vacías
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ ¡ALERTA!: Next.js no está leyendo las variables de entorno correctamente.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
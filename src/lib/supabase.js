import { createClient } from '@supabase/supabase-js'

// As chaves vêm do arquivo .env (não vão para o git).
// VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY — veja o README.
const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

// Enquanto as chaves não forem preenchidas, o app cai no login local
// automaticamente (nada quebra). Assim que o .env for configurado,
// a autenticação passa a usar o Supabase.
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

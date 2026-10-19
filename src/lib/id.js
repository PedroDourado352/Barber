// Gera um UUID v4. Usado como id de todos os registros — compatível tanto
// com o localStorage quanto com as colunas uuid do Supabase/Postgres.
export function uuid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Mantido por compatibilidade (login local).
export function createId(prefix = 'id') {
  return `${prefix}_${uuid()}`
}

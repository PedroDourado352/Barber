// Camada de persistência.
//
// Hoje os dados ficam no localStorage do navegador. Toda a aplicação fala
// apenas com o `store` (store.jsx) e nunca com o localStorage diretamente,
// então para migrar para o Firebase basta reimplementar estas funções
// (load/save) e os métodos do store usando Firestore — as telas não mudam.

const DB_KEY = 'barberly:db:v1'
const SESSION_KEY = 'barberly:session:v1'

export const emptyDatabase = () => ({
  users: [],
  barbers: [],
  services: [],
  clients: [],
  appointments: [],
  transactions: [],
  shop: null,
})

// Serviços padrão criados junto com a conta — o dono ajusta depois.
export const DEFAULT_SERVICES = [
  { name: 'Corte tradicional', durationMin: 30, price: 45 },
  { name: 'Corte + Barba', durationMin: 50, price: 70 },
  { name: 'Barba', durationMin: 20, price: 30 },
  { name: 'Barba + Pezinho', durationMin: 30, price: 40 },
  { name: 'Corte infantil', durationMin: 30, price: 40 },
  { name: 'Sobrancelha', durationMin: 10, price: 15 },
]

export function loadDatabase() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) return emptyDatabase()
    const parsed = JSON.parse(raw)
    return { ...emptyDatabase(), ...parsed }
  } catch (error) {
    console.error('Falha ao carregar os dados locais:', error)
    return emptyDatabase()
  }
}

export function saveDatabase(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch (error) {
    console.error('Falha ao salvar os dados locais:', error)
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch (error) {
    console.error('Falha ao salvar a sessão:', error)
  }
}

// Hash leve e síncrono. NÃO é segurança de produção — serve apenas para
// não guardar a senha em texto puro no armazenamento local. A autenticação
// real virá do Firebase Auth na próxima fase.
export function hashPassword(password) {
  let hash = 0
  const salt = 'barberly'
  const text = `${salt}:${password}`
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0
  }
  return `h${(hash >>> 0).toString(36)}`
}

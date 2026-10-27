import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_SERVICES,
  emptyDatabase,
  hashPassword,
  loadDatabase,
  loadSession,
  saveDatabase,
  saveSession,
} from './db'
import { uuid } from './id'
import { todayISO } from './format'
import { isSupabaseConfigured, supabase } from './supabase'
import {
  createShop,
  deleteRow,
  deleteTransactionsByAppointment,
  fetchAll,
  fetchShop,
  insertRow,
  insertRows,
  updateRow,
  updateShopRow,
} from './supabaseData'

const StoreContext = createContext(null)

// Gera um "slug" (identificador de URL) a partir do nome da barbearia.
function slugify(text) {
  const base = String(text || 'barbearia')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base || 'barbearia'}-${suffix}`
}

function mapSupabaseUser(user) {
  if (!user) return null
  const meta = user.user_metadata || {}
  return {
    id: user.id,
    email: user.email || '',
    name: meta.name || meta.full_name || (user.email || '').split('@')[0],
    business: meta.business || '',
    phone: meta.phone || '',
  }
}

function translateAuthError(message = '') {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Já existe uma conta com este e-mail.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (m.includes('password should be at least')) return 'A senha é muito curta.'
  if (m.includes('unable to validate email')) return 'E-mail inválido.'
  if (m.includes('rate limit')) return 'Muitas tentativas. Aguarde um momento.'
  return message || 'Não foi possível concluir. Tente novamente.'
}

const reportError = (context) => (error) => console.error(`[Supabase] ${context}:`, error?.message || error)

export function StoreProvider({ children }) {
  const [db, setDb] = useState(() => loadDatabase())
  const [localSession, setLocalSession] = useState(() => loadSession())
  const [supaUser, setSupaUser] = useState(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [dataReady, setDataReady] = useState(!isSupabaseConfigured)
  const [dbReady, setDbReady] = useState(false)
  const firstRun = useRef(true)

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      setDbReady(true)
      return
    }
    if (!isSupabaseConfigured) saveDatabase(db)
  }, [db])

  useEffect(() => {
    if (!isSupabaseConfigured) saveSession(localSession)
  }, [localSession])

  // Sessão do Supabase.
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSupaUser(mapSupabaseUser(data.session?.user))
      setAuthReady(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupaUser(mapSupabaseUser(session?.user))
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const currentUser = useMemo(() => {
    if (isSupabaseConfigured) return supaUser
    const user = db.users.find((u) => u.id === localSession?.userId)
    if (!user) return null
    return { id: user.id, email: user.email, name: user.name, business: user.business, phone: user.phone }
  }, [supaUser, db.users, localSession])

  // Carrega os dados do Supabase quando o usuário entra.
  useEffect(() => {
    if (!isSupabaseConfigured) return
    if (!currentUser) {
      setDb(emptyDatabase())
      setDataReady(true)
      return
    }
    let active = true
    setDataReady(false)
    ;(async () => {
      try {
        const data = await fetchAll()
        if (data.services.length === 0 && data.barbers.length === 0) {
          const ownerBarber = await insertRow('barbers', {
            name: currentUser.name || 'Barbeiro',
            commissionRate: 1,
            active: true,
          })
          const seededServices = await insertRows(
            'services',
            DEFAULT_SERVICES.map((s) => ({ ...s, active: true })),
          )
          data.barbers = [ownerBarber]
          data.services = seededServices
        }
        // Loja (link de agendamento online): cria na primeira vez.
        let shop = await fetchShop()
        if (!shop) {
          try {
            shop = await createShop({
              slug: slugify(currentUser.business || currentUser.name),
              business_name: currentUser.business || '',
              whatsapp: currentUser.phone || '',
            })
          } catch (err) {
            reportError('criar loja')(err)
          }
        }
        data.shop = shop || null
        if (active) setDb({ ...emptyDatabase(), ...data })
      } catch (error) {
        reportError('carregar dados')(error)
      } finally {
        if (active) setDataReady(true)
      }
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id])

  // Seed para o modo LOCAL (sem Supabase).
  useEffect(() => {
    if (isSupabaseConfigured) return
    if (!currentUser) return
    if (db.services.length === 0 && db.barbers.length === 0) {
      const ownerBarber = { id: 1, name: currentUser.name || 'Barbeiro', commissionRate: 1, active: true }
      const seeded = DEFAULT_SERVICES.map((s, i) => ({ id: i + 1, ...s, active: true }))
      setDb((cur) => ({ ...cur, barbers: [ownerBarber], services: seeded }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id])

  // --- Autenticação -------------------------------------------------------
  const register = async ({ name, business, email, phone, password }) => {
    const normalizedEmail = String(email).trim().toLowerCase()
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { name: name.trim(), business: business.trim(), phone: phone.trim() } },
      })
      if (error) return { ok: false, error: translateAuthError(error.message) }
      return { ok: true, needsConfirmation: !data.session }
    }
    if (db.users.some((u) => u.email === normalizedEmail)) {
      return { ok: false, error: 'Já existe uma conta com este e-mail.' }
    }
    const userId = uuid()
    const newUser = {
      id: userId,
      name: name.trim(),
      business: business.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    }
    setDb((cur) => ({ ...cur, users: [...cur.users, newUser] }))
    setLocalSession({ userId })
    return { ok: true }
  }

  const login = async ({ email, password }) => {
    const normalizedEmail = String(email).trim().toLowerCase()
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      if (error) return { ok: false, error: translateAuthError(error.message) }
      return { ok: true }
    }
    const user = db.users.find((u) => u.email === normalizedEmail)
    if (!user || user.passwordHash !== hashPassword(password)) {
      return { ok: false, error: 'E-mail ou senha incorretos.' }
    }
    setLocalSession({ userId: user.id })
    return { ok: true }
  }

  const logout = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    else setLocalSession(null)
  }

  // --- CRUD ---------------------------------------------------------------
  const nextLocalId = (collection) => {
    const ids = db[collection].map((x) => Number(x.id)).filter(Number.isFinite)
    return ids.length ? Math.max(...ids) + 1 : 1
  }

  const addTo = async (collection, record) => {
    if (isSupabaseConfigured) {
      try {
        const saved = await insertRow(collection, record)
        setDb((current) => ({ ...current, [collection]: [...current[collection], saved] }))
        return saved
      } catch (error) {
        reportError(`inserir ${collection}`)(error)
        return null
      }
    }
    const item = { ...record, id: nextLocalId(collection), createdAt: record.createdAt || new Date().toISOString() }
    setDb((current) => ({ ...current, [collection]: [...current[collection], item] }))
    return item
  }

  const updateIn = (collection, id, patch) => {
    setDb((current) => ({
      ...current,
      [collection]: current[collection].map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
    if (isSupabaseConfigured) updateRow(collection, id, patch).catch(reportError(`atualizar ${collection}`))
  }

  const removeFrom = (collection, id) => {
    setDb((current) => ({ ...current, [collection]: current[collection].filter((item) => item.id !== id) }))
    if (isSupabaseConfigured) deleteRow(collection, id).catch(reportError(`excluir ${collection}`))
  }

  // --- Serviços -----------------------------------------------------------
  const addService = (data) => addTo('services', { active: true, ...data })
  const updateService = (id, patch) => updateIn('services', id, patch)
  const removeService = (id) => removeFrom('services', id)

  // --- Barbeiros ----------------------------------------------------------
  const addBarber = (data) => addTo('barbers', { active: true, commissionRate: 0.5, ...data })
  const updateBarber = (id, patch) => updateIn('barbers', id, patch)
  const removeBarber = (id) => removeFrom('barbers', id)

  // --- Clientes -----------------------------------------------------------
  const addClient = (data) => addTo('clients', data)
  const updateClient = (id, patch) => updateIn('clients', id, patch)
  const removeClient = (id) => removeFrom('clients', id)

  // --- Agendamentos -------------------------------------------------------
  const addAppointment = (data) => addTo('appointments', { status: 'confirmado', ...data })
  const updateAppointment = (id, patch) => updateIn('appointments', id, patch)
  const removeAppointment = (id) => {
    setDb((current) => ({
      ...current,
      appointments: current.appointments.filter((item) => item.id !== id),
      transactions: current.transactions.filter((t) => t.appointmentId !== id),
    }))
    if (isSupabaseConfigured) {
      deleteTransactionsByAppointment(id)
        .then(() => deleteRow('appointments', id))
        .catch(reportError('excluir agendamento'))
    }
  }

  const completeAppointment = (id, { method = 'Dinheiro' } = {}) => {
    const appt = db.appointments.find((item) => item.id === id)
    if (!appt) return
    updateAppointment(id, { status: 'concluido' })
    const already = db.transactions.find((t) => t.appointmentId === id)
    if (already) return
    addTo('transactions', {
      type: 'entrada',
      source: 'agendamento',
      appointmentId: id,
      amount: Number(appt.price) || 0,
      method,
      barberId: appt.barberId || null,
      description: appt.serviceName || 'Atendimento',
      date: appt.date || todayISO(),
    })
  }

  // --- Caixa / transações -------------------------------------------------
  const addTransaction = (data) =>
    addTo('transactions', { type: 'entrada', source: 'manual', method: 'Dinheiro', date: todayISO(), ...data })
  const updateTransaction = (id, patch) => updateIn('transactions', id, patch)
  const removeTransaction = (id) => removeFrom('transactions', id)

  const resetData = () => {
    if (isSupabaseConfigured) return
    const base = emptyDatabase()
    base.users = db.users
    setDb(base)
  }

  // --- Loja (agendamento online) ------------------------------------------
  const updateShop = (patch) => {
    setDb((current) => ({ ...current, shop: { ...current.shop, ...patch } }))
    if (isSupabaseConfigured && db.shop?.owner_id) {
      updateShopRow(db.shop.owner_id, patch).catch(reportError('atualizar loja'))
    }
  }

  const value = {
    ready: dbReady && authReady && dataReady,
    usingSupabase: isSupabaseConfigured,
    db,
    currentUser,
    isAuthenticated: Boolean(currentUser),
    register,
    login,
    logout,
    addService,
    updateService,
    removeService,
    addBarber,
    updateBarber,
    removeBarber,
    addClient,
    updateClient,
    removeClient,
    addAppointment,
    updateAppointment,
    removeAppointment,
    completeAppointment,
    addTransaction,
    updateTransaction,
    removeTransaction,
    updateShop,
    resetData,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore precisa estar dentro de <StoreProvider>')
  return context
}

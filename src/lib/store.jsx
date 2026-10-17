import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_SERVICES,
  emptyDatabase,
  hashPassword,
  loadDatabase,
  loadSession,
  saveDatabase,
  saveSession,
} from './db'
import { createId } from './id'
import { todayISO } from './format'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [db, setDb] = useState(() => loadDatabase())
  const [session, setSession] = useState(() => loadSession())
  const [ready, setReady] = useState(false)
  const firstRun = useRef(true)

  // Persiste o banco sempre que ele muda (menos na montagem inicial).
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      setReady(true)
      return
    }
    saveDatabase(db)
  }, [db])

  useEffect(() => {
    saveSession(session)
  }, [session])

  // --- Autenticação -------------------------------------------------------
  const register = ({ name, business, email, phone, password }) => {
    const normalizedEmail = String(email).trim().toLowerCase()
    if (db.users.some((user) => user.email === normalizedEmail)) {
      return { ok: false, error: 'Já existe uma conta com este e-mail.' }
    }
    const userId = createId('user')
    const barberId = createId('barber')
    const newUser = {
      id: userId,
      name: name.trim(),
      business: business.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    }
    // O dono vira o primeiro barbeiro (comissão 100% por padrão).
    const ownerBarber = {
      id: barberId,
      name: name.trim(),
      commissionRate: 1,
      active: true,
    }
    const seededServices = DEFAULT_SERVICES.map((service) => ({
      id: createId('svc'),
      name: service.name,
      durationMin: service.durationMin,
      price: service.price,
      active: true,
    }))
    setDb((current) => ({
      ...current,
      users: [...current.users, newUser],
      barbers: [...current.barbers, ownerBarber],
      services: [...current.services, ...seededServices],
    }))
    setSession({ userId })
    return { ok: true }
  }

  const login = ({ email, password }) => {
    const normalizedEmail = String(email).trim().toLowerCase()
    const user = db.users.find((item) => item.email === normalizedEmail)
    if (!user || user.passwordHash !== hashPassword(password)) {
      return { ok: false, error: 'E-mail ou senha incorretos.' }
    }
    setSession({ userId: user.id })
    return { ok: true }
  }

  const logout = () => setSession(null)

  const currentUser = useMemo(
    () => db.users.find((user) => user.id === session?.userId) || null,
    [db.users, session],
  )

  // --- Helpers de mutação genéricos --------------------------------------
  const addTo = (collection, record, prefix) => {
    const id = record.id || createId(prefix)
    const item = { ...record, id, createdAt: record.createdAt || new Date().toISOString() }
    setDb((current) => ({ ...current, [collection]: [...current[collection], item] }))
    return item
  }

  const updateIn = (collection, id, patch) => {
    setDb((current) => ({
      ...current,
      [collection]: current[collection].map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }))
  }

  const removeFrom = (collection, id) => {
    setDb((current) => ({
      ...current,
      [collection]: current[collection].filter((item) => item.id !== id),
    }))
  }

  // --- Serviços -----------------------------------------------------------
  const addService = (data) =>
    addTo('services', { active: true, ...data }, 'svc')
  const updateService = (id, patch) => updateIn('services', id, patch)
  const removeService = (id) => removeFrom('services', id)

  // --- Barbeiros ----------------------------------------------------------
  const addBarber = (data) =>
    addTo('barbers', { active: true, commissionRate: 0.5, ...data }, 'barber')
  const updateBarber = (id, patch) => updateIn('barbers', id, patch)
  const removeBarber = (id) => removeFrom('barbers', id)

  // --- Clientes -----------------------------------------------------------
  const addClient = (data) => addTo('clients', data, 'client')
  const updateClient = (id, patch) => updateIn('clients', id, patch)
  const removeClient = (id) => removeFrom('clients', id)

  // --- Agendamentos -------------------------------------------------------
  const addAppointment = (data) =>
    addTo('appointments', { status: 'confirmado', ...data }, 'appt')
  const updateAppointment = (id, patch) => updateIn('appointments', id, patch)
  const removeAppointment = (id) => {
    // Remove também a transação gerada por este agendamento, se houver.
    setDb((current) => ({
      ...current,
      appointments: current.appointments.filter((item) => item.id !== id),
      transactions: current.transactions.filter((t) => t.appointmentId !== id),
    }))
  }

  // Concluir um agendamento: marca como concluído e lança a entrada no caixa.
  const completeAppointment = (id, { method = 'Dinheiro' } = {}) => {
    setDb((current) => {
      const appt = current.appointments.find((item) => item.id === id)
      if (!appt) return current
      const already = current.transactions.find((t) => t.appointmentId === id)
      const appointments = current.appointments.map((item) =>
        item.id === id ? { ...item, status: 'concluido' } : item,
      )
      if (already) {
        return { ...current, appointments }
      }
      const transaction = {
        id: createId('tx'),
        type: 'entrada',
        source: 'agendamento',
        appointmentId: id,
        amount: Number(appt.price) || 0,
        method,
        barberId: appt.barberId || null,
        description: appt.serviceName || 'Atendimento',
        date: appt.date || todayISO(),
        createdAt: new Date().toISOString(),
      }
      return {
        ...current,
        appointments,
        transactions: [...current.transactions, transaction],
      }
    })
  }

  // --- Caixa / transações -------------------------------------------------
  const addTransaction = (data) =>
    addTo(
      'transactions',
      { type: 'entrada', source: 'manual', method: 'Dinheiro', date: todayISO(), ...data },
      'tx',
    )
  const updateTransaction = (id, patch) => updateIn('transactions', id, patch)
  const removeTransaction = (id) => removeFrom('transactions', id)

  // --- Manutenção ---------------------------------------------------------
  const resetData = () => {
    const base = emptyDatabase()
    // Preserva os usuários para não perder o login.
    base.users = db.users
    setDb(base)
  }

  const value = {
    ready,
    db,
    currentUser,
    isAuthenticated: Boolean(currentUser),
    // auth
    register,
    login,
    logout,
    // services
    addService,
    updateService,
    removeService,
    // barbers
    addBarber,
    updateBarber,
    removeBarber,
    // clients
    addClient,
    updateClient,
    removeClient,
    // appointments
    addAppointment,
    updateAppointment,
    removeAppointment,
    completeAppointment,
    // transactions
    addTransaction,
    updateTransaction,
    removeTransaction,
    // misc
    resetData,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore precisa estar dentro de <StoreProvider>')
  }
  return context
}

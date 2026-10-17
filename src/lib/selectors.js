// Funções puras de leitura/cálculo sobre o banco.
// Mantêm as telas livres de lógica de agregação.

import { monthKey, todayISO } from './format'

export const byName = (a, b) => a.name.localeCompare(b.name, 'pt-BR')

export function activeServices(db) {
  return db.services.filter((s) => s.active !== false).sort(byName)
}

export function activeBarbers(db) {
  return db.barbers.filter((b) => b.active !== false).sort(byName)
}

export function barberName(db, barberId) {
  return db.barbers.find((b) => b.id === barberId)?.name || '—'
}

export function clientName(db, clientId) {
  return db.clients.find((c) => c.id === clientId)?.name || 'Cliente avulso'
}

export function serviceName(db, serviceId) {
  return db.services.find((s) => s.id === serviceId)?.name || '—'
}

// Agendamentos de uma data (YYYY-MM-DD), ordenados por horário.
export function appointmentsOnDate(db, date) {
  return db.appointments
    .filter((appt) => appt.date === date)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
}

// Histórico de atendimentos de um cliente (mais recentes primeiro).
export function clientHistory(db, clientId) {
  return db.appointments
    .filter((appt) => appt.clientId === clientId)
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
}

export function clientStats(db, clientId) {
  const history = clientHistory(db, clientId)
  const concluded = history.filter((a) => a.status === 'concluido')
  const total = concluded.reduce((sum, a) => sum + (Number(a.price) || 0), 0)
  return {
    visits: concluded.length,
    total,
    lastVisit: concluded[0]?.date || null,
  }
}

// Transações de uma data.
export function transactionsOnDate(db, date) {
  return db.transactions.filter((t) => t.date === date)
}

export function transactionsInRange(db, startISO, endISO) {
  return db.transactions.filter((t) => t.date >= startISO && t.date <= endISO)
}

function sumByType(transactions) {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    const amount = Number(t.amount) || 0
    if (t.type === 'saida') expense += amount
    else income += amount
  }
  return { income, expense, net: income - expense }
}

export function cashSummary(db, date) {
  return sumByType(transactionsOnDate(db, date))
}

export function rangeSummary(db, startISO, endISO) {
  return sumByType(transactionsInRange(db, startISO, endISO))
}

// Comissão por barbeiro em um período: entradas de atendimento * taxa.
export function commissionsInRange(db, startISO, endISO) {
  const entries = transactionsInRange(db, startISO, endISO).filter(
    (t) => t.type === 'entrada' && t.barberId,
  )
  const map = new Map()
  for (const t of entries) {
    const current = map.get(t.barberId) || { barberId: t.barberId, revenue: 0 }
    current.revenue += Number(t.amount) || 0
    map.set(t.barberId, current)
  }
  return [...map.values()].map((row) => {
    const barber = db.barbers.find((b) => b.id === row.barberId)
    const rate = barber?.commissionRate ?? 0
    return {
      barberId: row.barberId,
      name: barber?.name || '—',
      revenue: row.revenue,
      rate,
      commission: row.revenue * rate,
    }
  }).sort((a, b) => b.revenue - a.revenue)
}

// Serviços mais populares em um período (por nº de atendimentos concluídos).
export function popularServices(db, startISO, endISO, limit = 5) {
  const concluded = db.appointments.filter(
    (a) => a.status === 'concluido' && a.date >= startISO && a.date <= endISO,
  )
  const map = new Map()
  for (const appt of concluded) {
    const key = appt.serviceId || appt.serviceName || 'outro'
    const current = map.get(key) || {
      name: appt.serviceName || serviceName(db, appt.serviceId),
      count: 0,
      revenue: 0,
    }
    current.count += 1
    current.revenue += Number(appt.price) || 0
    map.set(key, current)
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit)
}

// Métricas do topo do dashboard.
export function dashboardStats(db, date = todayISO()) {
  const today = cashSummary(db, date)
  const todaysAppointments = appointmentsOnDate(db, date).filter(
    (a) => a.status !== 'cancelado',
  )
  const month = monthKey(date)
  const newClientsThisMonth = db.clients.filter(
    (c) => monthKey((c.createdAt || '').slice(0, 10)) === month,
  ).length

  // Ocupação: horas agendadas vs. uma jornada de 9h (540 min) por barbeiro ativo.
  const minutesBooked = todaysAppointments.reduce(
    (sum, a) => sum + (Number(a.durationMin) || 30),
    0,
  )
  const barbers = Math.max(activeBarbers(db).length, 1)
  const capacity = barbers * 540
  const occupancy = capacity ? Math.min(100, Math.round((minutesBooked / capacity) * 100)) : 0

  return {
    revenueToday: today.income,
    appointmentsToday: todaysAppointments.length,
    newClientsThisMonth,
    occupancy,
  }
}

// Faturamento dos últimos 7 dias para o gráfico.
export function last7DaysRevenue(db, endISO = todayISO()) {
  const [y, m, d] = endISO.split('-').map(Number)
  const end = new Date(y, m - 1, d)
  const days = []
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(end)
    day.setDate(end.getDate() - i)
    const iso = day.toISOString().slice(0, 10)
    const { income } = cashSummary(db, iso)
    days.push({ iso, income, weekday: day.getDay() })
  }
  return days
}

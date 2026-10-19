// Camada de acesso ao banco (Supabase/Postgres).
// Converte entre o formato camelCase usado no app e o snake_case das colunas.

import { supabase } from './supabase'

export const TABLES = ['services', 'barbers', 'clients', 'appointments', 'transactions']

// Campos que mudam de nome entre app (camelCase) e banco (snake_case).
const COLUMN_MAP = {
  services: { durationMin: 'duration_min' },
  barbers: { commissionRate: 'commission_rate' },
  clients: {},
  appointments: {
    clientId: 'client_id',
    clientName: 'client_name',
    serviceId: 'service_id',
    serviceName: 'service_name',
    durationMin: 'duration_min',
    barberId: 'barber_id',
  },
  transactions: { appointmentId: 'appointment_id', barberId: 'barber_id' },
}

const mapFor = (table) => ({ ...COLUMN_MAP[table], createdAt: 'created_at' })

// Objeto do app -> linha do banco. Nunca envia owner_id (preenchido pelo banco
// com auth.uid()) nem id (gerado automaticamente pelo banco, sequencial).
function toRow(table, obj) {
  const map = mapFor(table)
  const row = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'ownerId' || key === 'owner_id' || key === 'id') continue
    row[map[key] || key] = value
  }
  return row
}

// Linha do banco -> objeto do app.
function fromRow(table, row) {
  const map = mapFor(table)
  const inverse = Object.fromEntries(Object.entries(map).map(([camel, snake]) => [snake, camel]))
  const obj = {}
  for (const [key, value] of Object.entries(row)) {
    if (key === 'owner_id') continue
    obj[inverse[key] || key] = value
  }
  return obj
}

// Carrega todos os dados do usuário logado (RLS garante que só vêm os dele).
export async function fetchAll() {
  const results = await Promise.all(TABLES.map((t) => supabase.from(t).select('*')))
  const data = {}
  TABLES.forEach((table, i) => {
    const { data: rows, error } = results[i]
    if (error) throw error
    data[table] = (rows || []).map((r) => fromRow(table, r))
  })
  return data
}

// Insere e devolve o registro já com o id gerado pelo banco.
export async function insertRow(table, obj) {
  const { data, error } = await supabase.from(table).insert(toRow(table, obj)).select().single()
  if (error) throw error
  return fromRow(table, data)
}

export async function insertRows(table, arr) {
  if (!arr.length) return []
  const { data, error } = await supabase.from(table).insert(arr.map((o) => toRow(table, o))).select()
  if (error) throw error
  return (data || []).map((r) => fromRow(table, r))
}

export async function updateRow(table, id, patch) {
  const { error } = await supabase.from(table).update(toRow(table, patch)).eq('id', id)
  if (error) throw error
}

export async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

export async function deleteTransactionsByAppointment(appointmentId) {
  const { error } = await supabase.from('transactions').delete().eq('appointment_id', appointmentId)
  if (error) throw error
}

// Chamadas públicas (cliente sem login) para o agendamento online.
import { supabase, isSupabaseConfigured } from './supabase'

export async function getBookingInfo(slug) {
  if (!isSupabaseConfigured) throw new Error('Supabase não configurado')
  const { data, error } = await supabase.rpc('get_booking_info', { p_slug: slug })
  if (error) throw error
  return data // objeto ou null
}

export async function getAvailableTimes(slug, barberId, serviceId, dateISO) {
  const { data, error } = await supabase.rpc('get_available_times', {
    p_slug: slug,
    p_barber_id: barberId ?? null,
    p_service_id: serviceId,
    p_date: dateISO,
  })
  if (error) throw error
  return data || []
}

export async function bookAppointment({ slug, name, phone, barberId, serviceId, dateISO, time }) {
  const { data, error } = await supabase.rpc('book_appointment', {
    p_slug: slug,
    p_client_name: name,
    p_client_phone: phone,
    p_barber_id: barberId ?? null,
    p_service_id: serviceId,
    p_date: dateISO,
    p_time: time,
  })
  if (error) throw error
  return data // { ok, appointment_id } ou { ok:false, error }
}

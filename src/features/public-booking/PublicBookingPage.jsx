import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, MessageCircle, Scissors, UserRound } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { getBookingInfo, getAvailableTimes, bookAppointment } from '../../lib/bookingData'
import { isSupabaseConfigured } from '../../lib/supabase'
import { formatCurrency, formatLongDate, todayISO } from '../../lib/format'

function shiftDate(iso, days) {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function shortDate(iso) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(`${iso}T12:00:00`))
}

function whatsappLink(rawPhone, message) {
  let digits = String(rawPhone || '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.length <= 11) digits = '55' + digits
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

function PublicBookingPage() {
  const { businessSlug = '' } = useParams()
  const today = todayISO()

  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState(null)
  const [loadError, setLoadError] = useState('')

  const [step, setStep] = useState('service')
  const [booking, setBooking] = useState({ service: null, barber: null, date: today, time: '', name: '', phone: '' })
  const [times, setTimes] = useState([])
  const [loadingTimes, setLoadingTimes] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured) {
      setLoadError('Agendamento online indisponível no momento.')
      setLoading(false)
      return
    }
    getBookingInfo(businessSlug)
      .then((data) => {
        if (!active) return
        if (!data) setLoadError('Barbearia não encontrada. Confira o link.')
        else setInfo(data)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setLoadError('Não foi possível carregar. Tente novamente mais tarde.')
        setLoading(false)
      })
    return () => { active = false }
  }, [businessSlug])

  // Busca horários livres ao chegar na etapa de horário.
  useEffect(() => {
    if (step !== 'time' || !booking.service) return
    let active = true
    setLoadingTimes(true)
    getAvailableTimes(businessSlug, booking.barber?.id ?? null, booking.service.id, booking.date)
      .then((list) => active && setTimes(list))
      .catch(() => active && setTimes([]))
      .finally(() => active && setLoadingTimes(false))
    return () => { active = false }
  }, [step, businessSlug, booking.service, booking.barber, booking.date])

  const availableTimes = useMemo(() => {
    if (booking.date !== today) return times
    const now = new Date()
    const nowMin = now.getHours() * 60 + now.getMinutes()
    return times.filter((t) => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m > nowMin
    })
  }, [times, booking.date, today])

  const businessName = info?.business_name || businessSlug.replace(/[-_]+/g, ' ')
  const services = info?.services || []
  const barbers = info?.barbers || []
  const dateOptions = [today, shiftDate(today, 1), shiftDate(today, 2), shiftDate(today, 6)]

  const choose = (key, value, nextStep) => {
    setBooking((current) => ({ ...current, [key]: value }))
    setStep(nextStep)
    setError('')
  }

  const confirmBooking = async (event) => {
    event.preventDefault()
    if (!booking.name.trim() || !booking.phone.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await bookAppointment({
        slug: businessSlug,
        name: booking.name.trim(),
        phone: booking.phone.trim(),
        barberId: booking.barber?.id ?? null,
        serviceId: booking.service.id,
        dateISO: booking.date,
        time: booking.time,
      })
      if (!res?.ok) {
        setError(res?.error || 'Não foi possível confirmar.')
        if (res?.error && res.error.includes('disponível')) {
          getAvailableTimes(businessSlug, booking.barber?.id ?? null, booking.service.id, booking.date).then(setTimes).catch(() => {})
          setStep('time')
        }
      } else {
        setStep('done')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const restart = () => {
    setBooking({ service: null, barber: null, date: today, time: '', name: '', phone: '' })
    setTimes([])
    setStep('service')
    setError('')
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--bg)]">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--text)]" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--bg)] px-4 text-center text-[var(--text)]">
        <div className="grid max-w-[420px] justify-items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--surface-3)] text-[var(--text-muted)]"><Scissors size={22} /></span>
          <h1 className="m-0 text-xl font-semibold">Ops…</h1>
          <p className="m-0 text-sm text-[var(--text-muted)]">{loadError}</p>
        </div>
      </div>
    )
  }

  const waMsg = booking.service
    ? `Olá! Acabei de agendar: ${booking.service.name}${booking.barber ? ' com ' + booking.barber.name : ''} em ${formatLongDate(booking.date)} às ${booking.time}. Nome: ${booking.name}.`
    : ''
  const wa = whatsappLink(info?.whatsapp, waMsg)

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="flex h-[72px] items-center justify-between border-b border-[var(--border-soft)] bg-[var(--topbar-bg)] px-5 backdrop-blur-xl sm:px-10">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[var(--accent)] text-[var(--accent-ink)]"><Scissors size={17} /></span>
          <div className="grid gap-0.5"><strong className="text-sm font-semibold">{businessName}</strong><span className="text-[10px] text-[var(--text-muted)]">Agendamento online</span></div>
        </div>
        <span className="hidden text-[11px] text-[var(--text-dim)] sm:block">Simples, rápido e sem ligação</span>
      </header>

      <main className="mx-auto w-full max-w-[780px] px-4 pb-12 pt-10 sm:px-6 sm:pt-16">
        {step === 'done' ? (
          <section className="mx-auto grid max-w-[520px] justify-items-center gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 text-center shadow-[var(--shadow-pop)] sm:p-10">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)]"><Check size={27} /></span>
            <div className="grid gap-2">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[1.2px] text-[var(--accent)]">Horário reservado</p>
              <h1 className="m-0 text-2xl font-semibold">Até breve, {booking.name.split(' ')[0]}.</h1>
              <p className="m-0 text-sm leading-relaxed text-[var(--text-muted)]">Seu atendimento de {booking.service.name} está confirmado para {formatLongDate(booking.date)} às {booking.time}.</p>
            </div>
            <div className="w-full rounded-lg bg-[var(--surface-2)] p-3 text-left text-xs text-[var(--text-muted)]">
              <span className="block">{booking.barber ? booking.barber.name : 'Qualquer profissional'}</span>
              <strong className="mt-1 block text-base text-[var(--text)]">{formatCurrency(booking.service.price)}</strong>
            </div>
            {wa && (
              <a className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-semibold text-[#07351c] hover:brightness-105" href={wa} target="_blank" rel="noreferrer">
                <MessageCircle size={17} /> Confirmar pelo WhatsApp
              </a>
            )}
            <button className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]" onClick={restart}>Agendar outro horário <ArrowRight size={15} /></button>
          </section>
        ) : (
          <>
            <div className="mb-8 grid gap-3 text-center">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[1.2px] text-[var(--accent)]">Reserve seu horário</p>
              <h1 className="m-0 text-[clamp(28px,6vw,42px)] font-semibold leading-tight">Seu próximo corte começa aqui.</h1>
              <p className="mx-auto m-0 max-w-[430px] text-sm leading-relaxed text-[var(--text-muted)]">Escolha o serviço, o profissional e o melhor horário para você.</p>
            </div>
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-pop)] sm:p-7">
              <div className="mb-7 flex items-center justify-between border-b border-[var(--border-soft)] pb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[1px] text-[var(--text-dim)]">Etapa {['service', 'barber', 'date', 'time', 'client'].indexOf(step) + 1} de 5</span>
                  <h2 className="m-0 mt-1 text-lg font-semibold">{step === 'service' ? 'Qual serviço você deseja?' : step === 'barber' ? 'Escolha seu profissional' : step === 'date' ? 'Qual dia funciona melhor?' : step === 'time' ? 'Escolha um horário' : 'Seus dados para confirmar'}</h2>
                </div>
                <span className="text-xs text-[var(--text-muted)]">{businessName}</span>
              </div>

              {step === 'service' && (
                <div className="grid gap-2.5">
                  {services.length === 0 && <p className="m-0 text-sm text-[var(--text-muted)]">Nenhum serviço disponível no momento.</p>}
                  {services.map((service) => (
                    <button className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]" key={service.id} onClick={() => choose('service', service, 'barber')}>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--surface-3)] text-[var(--accent)]"><Scissors size={16} /></span>
                      <span className="grid min-w-0 flex-1 gap-1"><strong className="text-sm">{service.name}</strong><small className="text-[11px] text-[var(--text-muted)]">{service.duration_min} min · {formatCurrency(service.price)}</small></span>
                      <ArrowRight size={16} className="text-[var(--text-muted)]" />
                    </button>
                  ))}
                </div>
              )}

              {step === 'barber' && (
                <div className="grid gap-2.5">
                  <button className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left hover:border-[var(--border-strong)]" onClick={() => choose('barber', null, 'date')}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--surface-3)] text-[var(--accent)]"><UserRound size={16} /></span>
                    <span className="grid flex-1 gap-1"><strong className="text-sm">Qualquer profissional</strong><small className="text-[11px] text-[var(--text-muted)]">Primeiro horário disponível</small></span>
                    <ArrowRight size={16} />
                  </button>
                  {barbers.map((barber) => (
                    <button className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left hover:border-[var(--border-strong)]" key={barber.id} onClick={() => choose('barber', barber, 'date')}>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-[10px] font-bold text-[var(--accent-ink)]">{barber.name.slice(0, 2).toUpperCase()}</span>
                      <span className="grid flex-1 gap-1"><strong className="text-sm">{barber.name}</strong><small className="text-[11px] text-[var(--text-muted)]">Profissional disponível</small></span>
                      <ArrowRight size={16} />
                    </button>
                  ))}
                </div>
              )}

              {step === 'date' && (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {dateOptions.map((date, index) => (
                    <button className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left hover:border-[var(--border-strong)]" key={date} onClick={() => choose('date', date, 'time')}>
                      <CalendarDays size={17} className="text-[var(--accent)]" />
                      <strong className="text-sm">{index === 0 ? 'Hoje' : index === 1 ? 'Amanhã' : shortDate(date)}</strong>
                      <small className="text-[10px] text-[var(--text-muted)]">{formatLongDate(date)}</small>
                    </button>
                  ))}
                </div>
              )}

              {step === 'time' && (
                <div>
                  {loadingTimes ? (
                    <p className="m-0 text-sm text-[var(--text-muted)]">Buscando horários livres…</p>
                  ) : availableTimes.length === 0 ? (
                    <p className="m-0 text-sm text-[var(--text-muted)]">Nenhum horário livre nesse dia. Volte e escolha outra data.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {availableTimes.map((time) => (
                        <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm hover:border-[var(--border-strong)]" key={time} onClick={() => choose('time', time, 'client')}>
                          <Clock3 size={15} className="text-[var(--accent)]" />{time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 'client' && (
                <form className="grid gap-3" onSubmit={confirmBooking}>
                  <label className="grid gap-1.5 text-xs font-medium">Nome completo
                    <input className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--border-strong)]" value={booking.name} onChange={(event) => setBooking((current) => ({ ...current, name: event.target.value }))} placeholder="Como podemos te chamar?" required />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">WhatsApp
                    <input className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--border-strong)]" value={booking.phone} onChange={(event) => setBooking((current) => ({ ...current, phone: event.target.value }))} placeholder="(00) 00000-0000" type="tel" required />
                  </label>
                  <div className="mt-2 rounded-lg bg-[var(--surface-2)] p-3 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-2"><Scissors size={14} /> {booking.service.name}</span>
                    <span className="mt-2 flex items-center gap-2"><CalendarDays size={14} /> {formatLongDate(booking.date)} às {booking.time}</span>
                  </div>
                  {error && <p className="m-0 text-xs text-[var(--red)]">{error}</p>}
                  <button className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-ink)] disabled:cursor-wait disabled:opacity-60" type="submit" disabled={isSaving}>
                    {isSaving ? 'Confirmando...' : 'Confirmar meu horário'} <Check size={16} />
                  </button>
                </form>
              )}

              {step !== 'service' && (
                <button className="mt-6 inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]" onClick={() => setStep(step === 'barber' ? 'service' : step === 'date' ? 'barber' : step === 'time' ? 'date' : 'time')}>
                  <ArrowLeft size={14} /> Voltar
                </button>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default PublicBookingPage

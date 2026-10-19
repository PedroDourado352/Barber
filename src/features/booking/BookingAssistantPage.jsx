import { useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Check, ChevronLeft, Clock3, MessageCircle, Scissors, Sparkles, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { activeBarbers, activeServices, appointmentsOnDate } from '../../lib/selectors'
import { formatCurrency, formatLongDate, todayISO } from '../../lib/format'

const steps = ['service', 'barber', 'date', 'time', 'client', 'confirm']

function shiftDate(iso, days) {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatShortDate(iso) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(`${iso}T12:00:00`))
}

function BookingAssistantPage() {
  const { db, addAppointment, addClient } = useStore()
  const navigate = useNavigate()
  const services = activeServices(db)
  const barbers = activeBarbers(db)
  const today = todayISO()
  const [step, setStep] = useState('service')
  const [messages, setMessages] = useState([
    { id: 1, from: 'ai', text: 'Olá! Eu sou a assistente da Barberly. Vou encontrar um horário perfeito para o seu corte.' },
    { id: 2, from: 'ai', text: 'Para começar: qual serviço você gostaria de agendar?' },
  ])
  const [booking, setBooking] = useState({ service: null, barber: null, date: today, time: '', clientName: '' })
  const [clientInput, setClientInput] = useState('')
  const [isComplete, setComplete] = useState(false)

  const availableTimes = useMemo(() => {
    const busy = new Set(appointmentsOnDate(db, booking.date).map((appointment) => appointment.time))
    return ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '17:00'].filter((time) => !busy.has(time))
  }, [booking.date, db])

  const addConversation = (userText, aiText) => {
    setMessages((current) => [
      ...current,
      { id: Date.now(), from: 'user', text: userText },
      { id: Date.now() + 1, from: 'ai', text: aiText },
    ])
  }

  const chooseService = (service) => {
    setBooking((current) => ({ ...current, service }))
    setStep('barber')
    addConversation(service.name, `Boa escolha. ${service.name} dura cerca de ${service.durationMin} minutos. Você prefere algum barbeiro específico?`)
  }

  const chooseBarber = (barber) => {
    setBooking((current) => ({ ...current, barber }))
    setStep('date')
    addConversation(barber ? barber.name : 'Qualquer profissional', 'Perfeito. Qual dia funciona melhor para você?')
  }

  const chooseDate = (date) => {
    setBooking((current) => ({ ...current, date }))
    setStep('time')
    addConversation(formatLongDate(date), 'Encontrei estes horários livres. Qual você prefere?')
  }

  const chooseTime = (time) => {
    setBooking((current) => ({ ...current, time }))
    setStep('client')
    addConversation(time, 'Ótimo. Para finalizar, qual é o seu nome?')
  }

  const submitClient = (event) => {
    event.preventDefault()
    const name = clientInput.trim()
    if (!name) return
    setBooking((current) => ({ ...current, clientName: name }))
    setStep('confirm')
    addConversation(name, 'Tudo certo. Confira os detalhes antes de confirmar seu horário:')
  }

  const confirmBooking = () => {
    const existingClient = db.clients.find((client) => client.name.toLowerCase() === booking.clientName.toLowerCase())
    const clientId = existingClient?.id || addClient({ name: booking.clientName, phone: '', email: '', notes: '' }).id
    addAppointment({
      clientId,
      clientName: booking.clientName,
      serviceId: booking.service.id,
      serviceName: booking.service.name,
      durationMin: booking.service.durationMin,
      barberId: booking.barber?.id || null,
      date: booking.date,
      time: booking.time,
      price: booking.service.price,
      note: 'Agendado pela assistente Barberly',
    })
    setComplete(true)
    setMessages((current) => [...current, { id: Date.now(), from: 'ai', text: 'Agendamento confirmado! Seu horário está reservado. Nos vemos em breve.' }])
  }

  const goBack = () => {
    const currentIndex = steps.indexOf(step)
    if (currentIndex === 0) navigate('/')
    else setStep(steps[currentIndex - 1])
  }

  const dateOptions = [today, shiftDate(today, 1), shiftDate(today, 2), shiftDate(today, 6)]

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--topbar-bg)] px-4 backdrop-blur-xl sm:h-[72px] sm:px-[5vw]">
        <button className="inline-flex items-center gap-1.5 bg-transparent py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)]" onClick={() => navigate('/')}><ChevronLeft size={17} /> Voltar</button>
        <div className="flex items-center gap-2.5"><span className="grid h-[31px] w-[31px] place-items-center rounded-[9px] bg-[var(--accent)] text-[var(--accent-ink)]"><Sparkles size={16} /></span><div className="grid gap-0.5"><strong className="text-[13px]">Assistente Barberly</strong><span className="flex items-center gap-1.5 text-[10px] text-[var(--green)]"><i className="h-1.5 w-1.5 rounded-full bg-current" /> online agora</span></div></div>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]"><span>{isComplete ? 100 : Math.round((steps.indexOf(step) / (steps.length - 1)) * 100)}%</span><div className="h-1 w-[70px] overflow-hidden rounded bg-[var(--surface-3)]"><i className="block h-full rounded bg-[var(--accent)] transition-[width]" style={{ width: `${isComplete ? 100 : ((steps.indexOf(step) + 1) / steps.length) * 100}%` }} /></div></div>
      </header>

      <main className="mx-auto w-full max-w-[920px] px-3.5 pb-7 pt-8 sm:px-6 sm:pb-10 sm:pt-12">
        <div className="mb-6 text-center sm:mb-[30px]"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.1px] text-[var(--accent)]">AGENDAMENTO INTELIGENTE</p><h1 className="m-0 font-['Space_Grotesk'] text-[30px] font-semibold leading-tight text-[var(--text)] sm:text-[clamp(28px,4vw,42px)]">Seu próximo corte,<br /><em className="text-[var(--accent)] not-italic">sem complicação.</em></h1><p className="mx-auto mt-2 max-w-[430px] text-[13px] leading-relaxed text-[var(--text-muted)]">Converse com nossa assistente e encontre o horário ideal em menos de um minuto.</p></div>
        <section className="mx-auto flex min-h-[530px] w-full max-w-[690px] flex-col rounded-[11px] border border-[var(--border)] bg-[var(--surface)] p-[18px] shadow-[var(--shadow-pop)] sm:min-h-[480px] sm:rounded-2xl sm:p-6">
          <div className="flex flex-1 flex-col gap-4" aria-live="polite">
            {messages.map((message) => <div className={`flex max-w-[94%] items-end gap-2 ${message.from === 'user' ? 'self-end' : ''}`} key={message.id}>{message.from === 'ai' && <span className="grid h-[27px] w-[27px] shrink-0 place-items-center rounded-[9px] bg-[var(--accent)] text-[var(--accent-ink)]"><Sparkles size={14} /></span>}<p className={`m-0 max-w-[480px] rounded-[14px] px-3.5 py-3 text-[12.5px] leading-relaxed ${message.from === 'user' ? 'rounded-br-[3px] bg-[var(--accent)] text-[var(--accent-ink)]' : 'rounded-bl-[3px] bg-[var(--surface-2)] text-[var(--text)]'}`}>{message.text}</p></div>)}
            {!isComplete && <div className="ml-0 grid max-w-[500px] gap-2 sm:ml-9">
              {step === 'service' && services.map((service) => <button className="flex min-h-[52px] items-center gap-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-[var(--text)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]" key={service.id} onClick={() => chooseService(service)}><span className="grid h-[29px] w-[29px] shrink-0 place-items-center rounded-lg bg-[var(--surface-3)] text-[var(--accent)]"><Scissors size={15} /></span><span className="grid flex-1 gap-0.5"><strong className="text-[11.5px]">{service.name}</strong><small className="text-[10px] text-[var(--text-muted)]">{service.durationMin} min · {formatCurrency(service.price)}</small></span><ArrowRight size={15} /></button>)}
              {step === 'barber' && <><button className="flex min-h-[52px] items-center gap-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-[var(--text)] hover:border-[var(--border-strong)]" onClick={() => chooseBarber(null)}><span className="grid h-[29px] w-[29px] shrink-0 place-items-center rounded-lg bg-[var(--surface-3)] text-[var(--accent)]"><UsersIcon /></span><span className="grid flex-1 gap-0.5"><strong className="text-[11.5px]">Qualquer profissional</strong><small className="text-[10px] text-[var(--text-muted)]">Primeiro horário disponível</small></span><ArrowRight size={15} /></button>{barbers.map((barber) => <button className="flex min-h-[52px] items-center gap-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-[var(--text)] hover:border-[var(--border-strong)]" key={barber.id} onClick={() => chooseBarber(barber)}><span className="grid h-[29px] w-[29px] shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-[9px] font-bold text-[var(--accent-ink)]">{barber.name.slice(0, 2).toUpperCase()}</span><span className="grid flex-1 gap-0.5"><strong className="text-[11.5px]">{barber.name}</strong><small className="text-[10px] text-[var(--text-muted)]">Barbeiro disponível</small></span><ArrowRight size={15} /></button>)}</>}
              {step === 'date' && dateOptions.map((date, index) => <button className="flex min-h-[52px] items-center gap-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-[var(--text)] hover:border-[var(--border-strong)]" key={date} onClick={() => chooseDate(date)}><span className="grid h-[29px] w-[29px] shrink-0 place-items-center rounded-lg bg-[var(--surface-3)] text-[var(--accent)]"><CalendarDays size={15} /></span><span className="grid flex-1 gap-0.5"><strong className="text-[11.5px]">{index === 0 ? 'Hoje' : index === 1 ? 'Amanhã' : formatShortDate(date)}</strong><small className="text-[10px] text-[var(--text-muted)]">{formatLongDate(date)}</small></span><ArrowRight size={15} /></button>)}
              {step === 'time' && (availableTimes.length ? availableTimes : ['09:00', '10:30', '14:00']).map((time) => <button className="flex min-h-[52px] items-center justify-start gap-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-[var(--text)] hover:border-[var(--border-strong)]" key={time} onClick={() => chooseTime(time)}><Clock3 size={15} /><strong className="text-[11.5px]">{time}</strong><span className="text-[10px] text-[var(--text-muted)]">{booking.service.durationMin} min</span></button>)}
              {step === 'client' && <form className="flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] p-2" onSubmit={submitClient}><div className="flex min-w-0 flex-1 items-center gap-2 text-[var(--text-muted)]"><UserRound size={16} /><input className="min-w-0 flex-1 border-0 bg-transparent text-xs text-[var(--text)] outline-none placeholder:text-[var(--text-dim)]" value={clientInput} onChange={(event) => setClientInput(event.target.value)} placeholder="Digite seu nome completo" autoFocus /></div><button className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[var(--accent-ink)]" type="submit" aria-label="Continuar"><ArrowRight size={17} /></button></form>}
              {step === 'confirm' && <div className="grid gap-4"><div className="grid gap-2 rounded-lg bg-[var(--surface-2)] p-3 text-xs text-[var(--text-muted)]"><span className="inline-flex items-center gap-2"><Scissors size={15} /> {booking.service.name}</span><span className="inline-flex items-center gap-2"><CalendarDays size={15} /> {formatLongDate(booking.date)} às {booking.time}</span><span className="inline-flex items-center gap-2"><UserRound size={15} /> {booking.clientName}</span><strong className="text-base text-[var(--text)]">{formatCurrency(booking.service.price)}</strong></div><button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)]" onClick={confirmBooking}><Check size={17} /> Confirmar meu horário</button></div>}
            </div>}
            {isComplete && <button className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)]" onClick={() => navigate('/')}><Check size={16} /> Ir para minha agenda</button>}
          </div>
          {!isComplete && step !== 'service' && <button className="mt-4 inline-flex items-center gap-1.5 bg-transparent text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]" onClick={goBack}><ChevronLeft size={14} /> Alterar resposta anterior</button>}
        </section>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-dim)]"><MessageCircle size={14} /> Você pode alterar ou cancelar seu horário pela agenda.</p>
      </main>
    </div>
  )
}

function UsersIcon() {
  return <UserRound size={15} />
}

export default BookingAssistantPage
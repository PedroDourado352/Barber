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
    <div className="booking-page">
      <header className="booking-header">
        <button className="booking-back" onClick={() => navigate('/')}><ChevronLeft size={17} /> Voltar</button>
        <div className="booking-title"><span className="booking-ai-mark"><Sparkles size={16} /></span><div><strong>Assistente Barberly</strong><span><i /> online agora</span></div></div>
        <div className="booking-progress"><span>{isComplete ? 100 : Math.round((steps.indexOf(step) / (steps.length - 1)) * 100)}%</span><div><i style={{ width: `${isComplete ? 100 : ((steps.indexOf(step) + 1) / steps.length) * 100}%` }} /></div></div>
      </header>

      <main className="booking-main">
        <div className="booking-intro"><p className="eyebrow">AGENDAMENTO INTELIGENTE</p><h1>Seu próximo corte,<br /><em>sem complicação.</em></h1><p>Converse com nossa assistente e encontre o horário ideal em menos de um minuto.</p></div>
        <section className="chat-panel">
          <div className="chat-messages" aria-live="polite">
            {messages.map((message) => <div className={`chat-message ${message.from}`} key={message.id}>{message.from === 'ai' && <span className="chat-avatar"><Sparkles size={14} /></span>}<p>{message.text}</p></div>)}
            {!isComplete && <div className="chat-options">
              {step === 'service' && services.map((service) => <button key={service.id} onClick={() => chooseService(service)}><span className="option-icon"><Scissors size={15} /></span><span><strong>{service.name}</strong><small>{service.durationMin} min · {formatCurrency(service.price)}</small></span><ArrowRight size={15} /></button>)}
              {step === 'barber' && <><button onClick={() => chooseBarber(null)}><span className="option-icon"><UsersIcon /></span><span><strong>Qualquer profissional</strong><small>Primeiro horário disponível</small></span><ArrowRight size={15} /></button>{barbers.map((barber) => <button key={barber.id} onClick={() => chooseBarber(barber)}><span className="option-avatar">{barber.name.slice(0, 2).toUpperCase()}</span><span><strong>{barber.name}</strong><small>Barbeiro disponível</small></span><ArrowRight size={15} /></button>)}</>}
              {step === 'date' && dateOptions.map((date, index) => <button key={date} onClick={() => chooseDate(date)}><span className="option-icon"><CalendarDays size={15} /></span><span><strong>{index === 0 ? 'Hoje' : index === 1 ? 'Amanhã' : formatShortDate(date)}</strong><small>{formatLongDate(date)}</small></span><ArrowRight size={15} /></button>)}
              {step === 'time' && (availableTimes.length ? availableTimes : ['09:00', '10:30', '14:00']).map((time) => <button className="time-option" key={time} onClick={() => chooseTime(time)}><Clock3 size={15} /><strong>{time}</strong><span>{booking.service.durationMin} min</span></button>)}
              {step === 'client' && <form className="chat-input-form" onSubmit={submitClient}><div><UserRound size={16} /><input value={clientInput} onChange={(event) => setClientInput(event.target.value)} placeholder="Digite seu nome completo" autoFocus /></div><button type="submit" aria-label="Continuar"><ArrowRight size={17} /></button></form>}
              {step === 'confirm' && <div className="booking-confirm"><div className="confirm-summary"><span><Scissors size={15} /> {booking.service.name}</span><span><CalendarDays size={15} /> {formatLongDate(booking.date)} às {booking.time}</span><span><UserRound size={15} /> {booking.clientName}</span><strong>{formatCurrency(booking.service.price)}</strong></div><button className="primary-button full" onClick={confirmBooking}><Check size={17} /> Confirmar meu horário</button></div>}
            </div>}
            {isComplete && <button className="booking-dashboard-button" onClick={() => navigate('/')}><Check size={16} /> Ir para minha agenda</button>}
          </div>
          {!isComplete && step !== 'service' && <button className="chat-go-back" onClick={goBack}><ChevronLeft size={14} /> Alterar resposta anterior</button>}
        </section>
        <p className="booking-disclaimer"><MessageCircle size={14} /> Você pode alterar ou cancelar seu horário pela agenda.</p>
      </main>
    </div>
  )
}

function UsersIcon() {
  return <UserRound size={15} />
}

export default BookingAssistantPage
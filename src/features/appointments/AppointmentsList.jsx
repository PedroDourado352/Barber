import { CalendarDays, ChevronDown, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

const appointments = [
  { time: '09:00', name: 'Rafael Martins', service: 'Corte + Barba', barber: 'Pedro', status: 'Confirmado', initials: 'RM', color: 'orange' },
  { time: '10:30', name: 'Lucas Almeida', service: 'Corte tradicional', barber: 'André', status: 'Confirmado', initials: 'LA', color: 'blue' },
  { time: '12:00', name: 'Gustavo Nunes', service: 'Barba', barber: 'Pedro', status: 'Aguardando', initials: 'GN', color: 'purple' },
  { time: '14:30', name: 'Henrique Costa', service: 'Corte + Barba', barber: 'André', status: 'Confirmado', initials: 'HC', color: 'green' },
]

function AppointmentsList() {
  const [date, setDate] = useState('Hoje, 17 out')
  return <section className="panel appointments-panel"><div className="panel-heading"><div><p className="panel-kicker">AGENDA DO DIA</p><h2>Próximos horários</h2></div><button className="date-select"><CalendarDays size={16} />{date}<ChevronDown size={14} /></button></div><div className="appointments-table"><div className="table-header"><span>HORÁRIO</span><span>CLIENTE</span><span>SERVIÇO</span><span>BARBEIRO</span><span>STATUS</span><span /></div>{appointments.map((appointment) => <div className="appointment-row" key={`${appointment.time}-${appointment.name}`}><time>{appointment.time}</time><div className="client-cell"><span className={`client-avatar ${appointment.color}`}>{appointment.initials}</span><strong>{appointment.name}</strong></div><span className="service-name">{appointment.service}</span><span className="barber-name">{appointment.barber}</span><span className={`status ${appointment.status === 'Aguardando' ? 'waiting' : ''}`}><i />{appointment.status}</span><button className="icon-button row-menu" aria-label={`Opções para ${appointment.name}`}><MoreHorizontal size={17} /></button></div>)}</div><button className="view-agenda" onClick={() => setDate('Todos os horários')}>Ver agenda completa <ChevronDown size={15} /></button></section>
}

export default AppointmentsList
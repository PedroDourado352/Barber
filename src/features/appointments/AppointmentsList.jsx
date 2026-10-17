import { CalendarDays, ChevronRight } from 'lucide-react'
import { useStore } from '../../lib/store'
import { appointmentsOnDate, barberName } from '../../lib/selectors'
import { formatCurrency, initialsFrom, todayISO } from '../../lib/format'

const statusLabels = {
  aguardando: 'Aguardando',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

function AppointmentsList({ onSeeAll }) {
  const { db } = useStore()
  const today = todayISO()
  const appointments = appointmentsOnDate(db, today).filter((a) => a.status !== 'cancelado')

  return (
    <section className="panel appointments-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">AGENDA DO DIA</p>
          <h2>Próximos horários</h2>
        </div>
        <button className="date-select" onClick={onSeeAll}>
          <CalendarDays size={16} />
          Hoje
        </button>
      </div>

      {appointments.length === 0 ? (
        <p className="muted-copy empty-inline">Nenhum agendamento para hoje.</p>
      ) : (
        <div className="appointments-table">
          <div className="table-header">
            <span>HORÁRIO</span>
            <span>CLIENTE</span>
            <span>SERVIÇO</span>
            <span>BARBEIRO</span>
            <span>STATUS</span>
          </div>
          {appointments.map((appt) => (
            <div className="appointment-row" key={appt.id}>
              <time>{appt.time}</time>
              <div className="client-cell">
                <span className="client-avatar">{initialsFrom(appt.clientName)}</span>
                <strong>{appt.clientName}</strong>
              </div>
              <span className="service-name">{appt.serviceName}</span>
              <span className="barber-name">{barberName(db, appt.barberId)}</span>
              <span className={`status ${appt.status === 'aguardando' ? 'waiting' : ''} ${appt.status === 'concluido' ? 'done' : ''}`}>
                <i />
                {statusLabels[appt.status]}
              </span>
            </div>
          ))}
        </div>
      )}

      <button className="view-agenda" onClick={onSeeAll}>
        Ver agenda completa <ChevronRight size={15} />
      </button>
    </section>
  )
}

export default AppointmentsList

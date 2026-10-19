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
    <section className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-[22px]">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1px] text-[var(--text-dim)]">AGENDA DO DIA</p>
          <h2 className="m-0 text-[17px] font-semibold text-[var(--text)]">Próximos horários</h2>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={onSeeAll}>
          <CalendarDays size={16} />
          Hoje
        </button>
      </div>

      {appointments.length === 0 ? (
          <p className="py-7 text-center text-xs text-[var(--text-dim)]">Nenhum agendamento para hoje.</p>
      ) : (
        <div className="min-w-[650px]">
            <div className="grid min-w-[650px] grid-cols-[.7fr_1.4fr_1.2fr_1fr_1fr] gap-3 border-b border-[var(--border-soft)] px-2 pb-2 text-[9px] uppercase tracking-[.8px] text-[var(--text-dim)]">
            <span>HORÁRIO</span>
            <span>CLIENTE</span>
            <span>SERVIÇO</span>
            <span>BARBEIRO</span>
            <span>STATUS</span>
          </div>
          {appointments.map((appt) => (
              <div className="grid min-w-[650px] grid-cols-[.7fr_1.4fr_1.2fr_1fr_1fr] items-center gap-3 border-b border-[var(--border-soft)] px-2 py-3 text-xs" key={appt.id}>
                <time className="text-[var(--text)]">{appt.time}</time>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--surface-3)] text-[10px] font-bold text-[var(--text)]">{initialsFrom(appt.clientName)}</span>
                  <strong className="text-[var(--text)]">{appt.clientName}</strong>
              </div>
                <span className="text-[var(--text-muted)]">{appt.serviceName}</span>
                <span className="text-[var(--text-muted)]">{barberName(db, appt.barberId)}</span>
                <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
                  <i className={`h-1.5 w-1.5 rounded-full ${appt.status === 'aguardando' ? 'bg-[var(--amber)]' : appt.status === 'concluido' ? 'bg-[var(--green)]' : 'bg-[var(--blue)]'}`} />
                {statusLabels[appt.status]}
              </span>
            </div>
          ))}
        </div>
      )}

      <button className="mx-auto mt-3 flex items-center gap-1.5 bg-transparent text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]" onClick={onSeeAll}>
        Ver agenda completa <ChevronRight size={15} />
      </button>
    </section>
  )
}

export default AppointmentsList

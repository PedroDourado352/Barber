import { useState } from 'react'
import {
  Ban,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import AppointmentForm from './AppointmentForm'
import PaymentDialog from '../finance/PaymentDialog'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { useStore } from '../../lib/store'
import { appointmentsOnDate, barberName } from '../../lib/selectors'
import { formatCurrency, formatLongDate, initialsFrom, todayISO } from '../../lib/format'

const statusMeta = {
  aguardando: { label: 'Aguardando', className: 'waiting' },
  confirmado: { label: 'Confirmado', className: '' },
  concluido: { label: 'Concluído', className: 'done' },
  cancelado: { label: 'Cancelado', className: 'cancelled' },
}

function shiftDate(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function AgendaPage() {
  const { db, updateAppointment, removeAppointment, completeAppointment } = useStore()
  const [date, setDate] = useState(todayISO())
  const [formModal, setFormModal] = useState(null) // null | 'new' | appointment
  const [payment, setPayment] = useState(null) // appointment awaiting payment method
  const [confirm, setConfirm] = useState(null)
  const [menuFor, setMenuFor] = useState(null)

  const appointments = appointmentsOnDate(db, date)
  const dayTotal = appointments
    .filter((a) => a.status !== 'cancelado')
    .reduce((sum, a) => sum + (Number(a.price) || 0), 0)

  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Agenda</p>
          <h1>Agendamentos</h1>
          <p className="heading-subtitle">
            {appointments.filter((a) => a.status !== 'cancelado').length} horário(s) · {formatCurrency(dayTotal)} previstos
          </p>
        </div>
        <button className="primary-button" onClick={() => setFormModal('new')}>
          <Plus size={18} /> Novo agendamento
        </button>
      </section>

      <div className="date-nav">
        <button className="icon-button" aria-label="Dia anterior" onClick={() => setDate(shiftDate(date, -1))}>
          <ChevronLeft size={18} />
        </button>
        <div className="date-nav-center">
          <CalendarDays size={16} />
          <strong>{formatLongDate(date)}</strong>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value || todayISO())}
            aria-label="Selecionar data"
          />
        </div>
        <button className="icon-button" aria-label="Próximo dia" onClick={() => setDate(shiftDate(date, 1))}>
          <ChevronRight size={18} />
        </button>
        {date !== todayISO() && (
          <button className="text-button" onClick={() => setDate(todayISO())}>
            Hoje
          </button>
        )}
      </div>

      <section className="panel">
        {appointments.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhum agendamento neste dia"
            description="Adicione o primeiro horário para esta data."
            action={
              <button className="primary-button" onClick={() => setFormModal('new')}>
                <Plus size={16} /> Novo agendamento
              </button>
            }
          />
        ) : (
          <div className="agenda-list">
            {appointments.map((appt) => {
              const meta = statusMeta[appt.status] || statusMeta.confirmado
              return (
                <article className={`agenda-item ${appt.status}`} key={appt.id}>
                  <div className="agenda-time">
                    <Clock3 size={14} />
                    <strong>{appt.time}</strong>
                  </div>
                  <div className="agenda-client">
                    <span className="client-avatar">{initialsFrom(appt.clientName)}</span>
                    <div>
                      <strong>{appt.clientName}</strong>
                      <span className="muted-copy">
                        {appt.serviceName} · {barberName(db, appt.barberId)}
                      </span>
                    </div>
                  </div>
                  <b className="agenda-price">{formatCurrency(appt.price)}</b>
                  <span className={`status-pill ${appt.status}`}>{meta.label}</span>

                  <div className="agenda-actions">
                    {appt.status !== 'concluido' && appt.status !== 'cancelado' && (
                      <>
                        {appt.status === 'aguardando' && (
                          <button
                            className="chip-button"
                            onClick={() => updateAppointment(appt.id, { status: 'confirmado' })}
                          >
                            <Check size={14} /> Confirmar
                          </button>
                        )}
                        <button className="chip-button success" onClick={() => setPayment(appt)}>
                          <CheckCheck size={14} /> Concluir
                        </button>
                      </>
                    )}
                    <div className="menu-wrap">
                      <button
                        className="icon-button row-menu"
                        aria-label="Mais opções"
                        onClick={() => setMenuFor(menuFor === appt.id ? null : appt.id)}
                      >
                        <MoreHorizontal size={17} />
                      </button>
                      {menuFor === appt.id && (
                        <>
                          <button className="menu-backdrop" aria-label="Fechar" onClick={() => setMenuFor(null)} />
                          <div className="dropdown">
                            <button
                              onClick={() => {
                                setFormModal(appt)
                                setMenuFor(null)
                              }}
                            >
                              <Pencil size={15} /> Editar
                            </button>
                            {appt.status !== 'cancelado' && (
                              <button
                                onClick={() => {
                                  updateAppointment(appt.id, { status: 'cancelado' })
                                  setMenuFor(null)
                                }}
                              >
                                <Ban size={15} /> Cancelar
                              </button>
                            )}
                            <button
                              className="danger"
                              onClick={() => {
                                setConfirm(appt)
                                setMenuFor(null)
                              }}
                            >
                              <Trash2 size={15} /> Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {formModal && (
        <AppointmentForm
          initial={formModal === 'new' ? null : formModal}
          defaultDate={date}
          onClose={() => setFormModal(null)}
        />
      )}

      {payment && (
        <PaymentDialog
          appointment={payment}
          onClose={() => setPayment(null)}
          onConfirm={(method) => {
            completeAppointment(payment.id, { method })
            setPayment(null)
          }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title="Excluir agendamento"
          message={`Excluir o agendamento de ${confirm.clientName}? Se houver lançamento no caixa, ele também será removido.`}
          onClose={() => setConfirm(null)}
          onConfirm={() => removeAppointment(confirm.id)}
        />
      )}
    </div>
  )
}

export default AgendaPage

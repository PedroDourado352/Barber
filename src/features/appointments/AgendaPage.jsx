import { useState } from 'react'
import { Ban, CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, Clock3, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import AppointmentForm from './AppointmentForm'
import PaymentDialog from '../finance/PaymentDialog'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { useStore } from '../../lib/store'
import { appointmentsOnDate, barberName } from '../../lib/selectors'
import { formatCurrency, formatLongDate, initialsFrom, todayISO } from '../../lib/format'

const statusLabels = { aguardando: 'Aguardando', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' }
const statusClasses = {
  aguardando: 'bg-[var(--amber-bg)] text-[var(--amber)]',
  confirmado: 'bg-[var(--blue-bg)] text-[var(--blue)]',
  concluido: 'bg-[var(--green-bg)] text-[var(--green)]',
  cancelado: 'bg-[var(--red-bg)] text-[var(--red)]',
}
function shiftDate(iso, days) {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function AgendaPage() {
  const { db, updateAppointment, removeAppointment, completeAppointment } = useStore()
  const [date, setDate] = useState(todayISO())
  const [formModal, setFormModal] = useState(null)
  const [payment, setPayment] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [menuFor, setMenuFor] = useState(null)
  const appointments = appointmentsOnDate(db, date)
  const dayTotal = appointments.filter((appointment) => appointment.status !== 'cancelado').reduce((sum, appointment) => sum + (Number(appointment.price) || 0), 0)

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-14 pt-9 sm:px-8 lg:px-11">
      <section className="mb-7 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.1px] text-[var(--text-dim)]">Agenda</p><h1 className="m-0 font-['Space_Grotesk'] text-[clamp(25px,3vw,32px)] font-semibold leading-tight text-[var(--text)]">Agendamentos</h1><p className="mt-2 text-[13px] text-[var(--text-muted)]">{appointments.filter((appointment) => appointment.status !== 'cancelado').length} horário(s) · {formatCurrency(dayTotal)} previstos</p></div><button className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)] shadow-lg hover:brightness-110" onClick={() => setFormModal('new')}><Plus size={18} /> Novo agendamento</button></section>
      <div className="mb-[18px] flex flex-wrap items-center gap-2.5 sm:flex-nowrap"><button className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] text-[var(--text-muted)] hover:bg-[var(--hover)]" aria-label="Dia anterior" onClick={() => setDate(shiftDate(date, -1))}><ChevronLeft size={18} /></button><div className="relative flex min-w-0 flex-1 items-center gap-2 rounded-[11px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[13px] text-[var(--text)] sm:flex-none"><CalendarDays size={16} /><strong className="truncate">{formatLongDate(date)}</strong><input className="absolute inset-0 cursor-pointer opacity-0" type="date" value={date} onChange={(event) => setDate(event.target.value || todayISO())} aria-label="Selecionar data" /></div><button className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] text-[var(--text-muted)] hover:bg-[var(--hover)]" aria-label="Próximo dia" onClick={() => setDate(shiftDate(date, 1))}><ChevronRight size={18} /></button>{date !== todayISO() && <button className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]" onClick={() => setDate(todayISO())}>Hoje</button>}</div>
      <section className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-[22px]">{appointments.length === 0 ? <EmptyState icon={CalendarDays} title="Nenhum agendamento neste dia" description="Adicione o primeiro horário para esta data." action={<button className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)]" onClick={() => setFormModal('new')}><Plus size={16} /> Novo agendamento</button>} /> : <div className="grid min-w-[700px] gap-px md:min-w-0">{appointments.map((appt) => <article className={`grid grid-cols-[82px_minmax(150px,1.4fr)_auto_auto_auto] items-center gap-3.5 border-t border-[var(--border)] py-3.5 max-md:grid-cols-[66px_1fr_auto] ${appt.status === 'concluido' ? 'opacity-60' : appt.status === 'cancelado' ? 'opacity-45' : ''}`} key={appt.id}><div className="inline-flex items-center gap-1.5 text-[var(--text-muted)]"><Clock3 size={14} /><strong className="text-[13px] text-[var(--text)]">{appt.time}</strong></div><div className="flex min-w-0 items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--hover)] text-[10px] font-bold text-[var(--text)]">{initialsFrom(appt.clientName)}</span><div className="min-w-0"><strong className="block truncate text-[13px] text-[var(--text)]">{appt.clientName}</strong><span className="block truncate text-[11px] text-[var(--text-muted)]">{appt.serviceName} · {barberName(db, appt.barberId)}</span></div></div><b className="whitespace-nowrap text-[13px] text-[var(--text)] max-md:col-start-2">{formatCurrency(appt.price)}</b><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold max-md:col-start-3 ${statusClasses[appt.status] || 'bg-[var(--hover)] text-[var(--text-muted)]'}`}>{statusLabels[appt.status]}</span><div className="flex flex-wrap items-center justify-end gap-1.5 max-md:col-span-full max-md:justify-start">{appt.status !== 'concluido' && appt.status !== 'cancelado' && <>{appt.status === 'aguardando' && <button className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={() => updateAppointment(appt.id, { status: 'confirmado' })}><Check size={14} /> Confirmar</button>}<button className="inline-flex items-center gap-1 rounded-full bg-[var(--green-bg)] px-3 py-1.5 text-[11px] font-semibold text-[var(--green)] hover:brightness-110" onClick={() => setPayment(appt)}><CheckCheck size={14} /> Concluir</button></> }<div className="relative"><button className="grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-muted)] hover:bg-[var(--hover)]" aria-label="Mais opções" onClick={() => setMenuFor(menuFor === appt.id ? null : appt.id)}><MoreHorizontal size={17} /></button>{menuFor === appt.id && <><button className="fixed inset-0 z-10" aria-label="Fechar" onClick={() => setMenuFor(null)} /><div className="absolute right-0 top-[calc(100%+5px)] z-20 grid min-w-[156px] gap-px rounded-[11px] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-pop)]"><button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={() => { setFormModal(appt); setMenuFor(null) }}><Pencil size={15} /> Editar</button>{appt.status !== 'cancelado' && <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={() => { updateAppointment(appt.id, { status: 'cancelado' }); setMenuFor(null) }}><Ban size={15} /> Cancelar</button>}<button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-[var(--red)] hover:bg-[var(--red-bg)]" onClick={() => { setConfirm(appt); setMenuFor(null) }}><Trash2 size={15} /> Excluir</button></div></>}</div></div></article>)}</div>}</section>
      {formModal && <AppointmentForm initial={formModal === 'new' ? null : formModal} defaultDate={date} onClose={() => setFormModal(null)} />}{payment && <PaymentDialog appointment={payment} onClose={() => setPayment(null)} onConfirm={(method) => { completeAppointment(payment.id, { method }); setPayment(null) }} />}{confirm && <ConfirmDialog title="Excluir agendamento" message={`Excluir o agendamento de ${confirm.clientName}? Se houver lançamento no caixa, ele também será removido.`} onClose={() => setConfirm(null)} onConfirm={() => removeAppointment(confirm.id)} />}
    </div>
  )
}

export default AgendaPage

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, Mail, Pencil, Phone, Plus, Search, Trash2, Users } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { useStore } from '../../lib/store'
import { clientHistory, clientStats, serviceName, barberName } from '../../lib/selectors'
import { formatCurrency, formatDate, initialsFrom } from '../../lib/format'

const statusLabels = {
  aguardando: 'Aguardando',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

function ClientForm({ initial, onSubmit, onClose }) {
  const [form, setForm] = useState(
    initial || { name: '', phone: '', email: '', notes: '' },
  )
  const update = (field) => (event) =>
    setForm((c) => ({ ...c, [field]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    if (!form.name.trim()) return
    onSubmit({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
    })
    onClose()
  }

  return (
    <Modal title={initial ? 'Editar cliente' : 'Novo cliente'} kicker="Clientes" onClose={onClose}>
      <form className="grid gap-[15px]" onSubmit={submit}>
        <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
          Nome
          <input value={form.name} onChange={update('name')} placeholder="Ex.: Lucas Almeida" autoFocus />
        </label>
        <div className="grid gap-[15px] sm:grid-cols-2">
          <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
            Telefone
            <input value={form.phone} onChange={update('phone')} placeholder="(11) 99999-9999" />
          </label>
          <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
            E-mail
            <input type="email" value={form.email} onChange={update('email')} placeholder="opcional" />
          </label>
        </div>
        <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
          Observações
          <textarea value={form.notes} onChange={update('notes')} rows={3} placeholder="Preferências, alergias, histórico..." />
        </label>
        <button className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)] hover:brightness-110" type="submit">
          {initial ? 'Salvar alterações' : 'Adicionar cliente'}
        </button>
      </form>
    </Modal>
  )
}

function ClientDetail({ client, onClose, onEdit, onGoToAgenda }) {
  const { db } = useStore()
  const history = clientHistory(db, client.id)
  const stats = clientStats(db, client.id)

  return (
    <Modal title={client.name} kicker="Ficha do cliente" size="wide" onClose={onClose}>
      <div className="grid gap-[18px]">
        <div className="flex items-center gap-3.5">
          <div className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full bg-[var(--surface-3)] text-base font-bold text-[var(--text)]">{initialsFrom(client.name)}</div>
          <div className="grid min-w-0 flex-1 gap-1 text-xs text-[var(--text-muted)]">
            {client.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} /> {client.phone}
              </span>
            )}
            {client.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail size={14} /> {client.email}
              </span>
            )}
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={onEdit}>
            <Pencil size={15} /> Editar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="grid gap-1 rounded-[11px] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
            <span className="text-[10px] text-[var(--text-dim)]">Visitas</span>
            <strong className="font-['Inter'] text-lg font-semibold text-[var(--text)]">{stats.visits}</strong>
          </div>
          <div className="grid gap-1 rounded-[11px] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
            <span className="text-[10px] text-[var(--text-dim)]">Total gasto</span>
            <strong className="font-['Inter'] text-lg font-semibold text-[var(--text)]">{formatCurrency(stats.total)}</strong>
          </div>
          <div className="grid gap-1 rounded-[11px] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
            <span className="text-[10px] text-[var(--text-dim)]">Última visita</span>
            <strong className="font-['Inter'] text-lg font-semibold text-[var(--text)]">{stats.lastVisit ? formatDate(stats.lastVisit) : '—'}</strong>
          </div>
        </div>

        {client.notes && <p className="m-0 rounded-[11px] border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs leading-relaxed text-[var(--text-muted)]">{client.notes}</p>}

        <div className="flex items-center justify-between gap-4">
          <h3 className="m-0 text-[15px] font-semibold text-[var(--text)]">Histórico de atendimentos</h3>
          <button className="inline-flex items-center gap-1.5 bg-transparent text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]" onClick={onGoToAgenda}>
            <CalendarPlus size={15} /> Agendar
          </button>
        </div>

        {history.length === 0 ? (
          <p className="m-0 py-7 text-center text-xs text-[var(--text-dim)]">Este cliente ainda não tem atendimentos registrados.</p>
        ) : (
          <ul className="m-0 grid list-none gap-px p-0">
            {history.map((appt) => (
              <li className="grid grid-cols-[72px_1fr_auto] items-center gap-3 border-t border-[var(--border-soft)] py-3 text-xs sm:grid-cols-[92px_1fr_auto_auto]" key={appt.id}>
                <div className="grid gap-0.5">
                  <strong className="text-xs text-[var(--text)]">{formatDate(appt.date)}</strong>
                  <span className="text-[10px] text-[var(--text-dim)]">{appt.time}</span>
                </div>
                <div className="grid min-w-0 gap-0.5">
                  <strong className="truncate text-xs text-[var(--text)]">{appt.serviceName || serviceName(db, appt.serviceId)}</strong>
                  <span className="text-[10px] text-[var(--text-dim)]">com {barberName(db, appt.barberId)}</span>
                </div>
                <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${appt.status === 'concluido' ? 'bg-[var(--green-bg)] text-[var(--green)]' : appt.status === 'aguardando' ? 'bg-[var(--amber-bg)] text-[var(--amber)]' : appt.status === 'cancelado' ? 'bg-[var(--red-bg)] text-[var(--red)]' : 'bg-[var(--blue-bg)] text-[var(--blue)]'}`}>{statusLabels[appt.status]}</span>
                <b className="text-[var(--text)]">{formatCurrency(appt.price)}</b>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}

function ClientsPage() {
  const { db, addClient, updateClient, removeClient } = useStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [formModal, setFormModal] = useState(null) // null | 'new' | client
  const [detail, setDetail] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const clients = useMemo(() => {
    const term = query.trim().toLowerCase()
    return db.clients
      .filter(
        (c) =>
          !term ||
          c.name.toLowerCase().includes(term) ||
          (c.phone || '').includes(term),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [db.clients, query])

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-14 pt-9 sm:px-8 lg:px-11">
      <section className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.1px] text-[var(--text-dim)]">Relacionamento</p>
          <h1 className="m-0 font-['Inter'] text-[clamp(25px,3vw,32px)] font-semibold leading-tight text-[var(--text)]">Clientes</h1>
          <p className="mt-2 text-[13px] text-[var(--text-muted)]">{db.clients.length} cliente(s) cadastrado(s).</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)] hover:brightness-110" onClick={() => setFormModal('new')}>
          <Plus size={18} /> Novo cliente
        </button>
      </section>

      <div className="mb-4 flex items-center gap-2.5 rounded-[11px] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-[var(--text-dim)] focus-within:border-[var(--border-strong)]">
        <Search size={17} />
        <input
          placeholder="Buscar por nome ou telefone..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-[22px]">
        {db.clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum cliente ainda"
            description="Cadastre seus clientes para acompanhar o histórico e as preferências de cada um."
            action={
              <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)]" onClick={() => setFormModal('new')}>
                <Plus size={16} /> Adicionar cliente
              </button>
            }
          />
        ) : clients.length === 0 ? (
          <p className="m-0 py-7 text-center text-xs text-[var(--text-dim)]">Nenhum cliente encontrado para "{query}".</p>
        ) : (
          <div className="grid gap-px">
            {clients.map((client) => {
              const stats = clientStats(db, client.id)
              return (
                <button className="flex w-full items-center gap-3 border-0 border-t border-[var(--border-soft)] bg-transparent px-2.5 py-3 text-left first:border-t-0 hover:bg-[var(--surface-2)]" key={client.id} onClick={() => setDetail(client)}>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--surface-3)] text-[10px] font-bold text-[var(--text)]">{initialsFrom(client.name)}</span>
                  <div className="min-w-0 flex-1">
                    <strong className="block text-[13px] text-[var(--text)]">{client.name}</strong>
                    <span className="text-[10px] text-[var(--text-dim)]">{client.phone || 'sem telefone'}</span>
                  </div>
                  <div className="grid gap-0.5 text-right">
                    <span className="text-[10px] text-[var(--text-dim)]">{stats.visits} visita(s)</span>
                    <b className="text-xs text-[var(--text)]">{formatCurrency(stats.total)}</b>
                  </div>
                  <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <button className="grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-muted)] hover:bg-[var(--hover)]" aria-label="Editar" onClick={() => setFormModal(client)}>
                      <Pencil size={16} />
                    </button>
                    <button
                      className="grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-dim)] hover:bg-[var(--red-bg)] hover:text-[var(--red)]"
                      aria-label="Excluir"
                      onClick={() => setConfirm(client)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {formModal && (
        <ClientForm
          initial={formModal === 'new' ? null : formModal}
          onClose={() => setFormModal(null)}
          onSubmit={(data) =>
            formModal === 'new' ? addClient(data) : updateClient(formModal.id, data)
          }
        />
      )}

      {detail && (
        <ClientDetail
          client={db.clients.find((c) => c.id === detail.id) || detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setFormModal(detail)
            setDetail(null)
          }}
          onGoToAgenda={() => {
            setDetail(null)
            navigate('/agenda')
          }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title="Excluir cliente"
          message={`Excluir "${confirm.name}"? O histórico de atendimentos dele continuará no sistema, mas sem vínculo.`}
          onClose={() => setConfirm(null)}
          onConfirm={() => removeClient(confirm.id)}
        />
      )}
    </div>
  )
}

export default ClientsPage

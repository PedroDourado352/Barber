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
      <form className="form" onSubmit={submit}>
        <label>
          Nome
          <input value={form.name} onChange={update('name')} placeholder="Ex.: Lucas Almeida" autoFocus />
        </label>
        <div className="form-row">
          <label>
            Telefone
            <input value={form.phone} onChange={update('phone')} placeholder="(11) 99999-9999" />
          </label>
          <label>
            E-mail
            <input type="email" value={form.email} onChange={update('email')} placeholder="opcional" />
          </label>
        </div>
        <label>
          Observações
          <textarea value={form.notes} onChange={update('notes')} rows={3} placeholder="Preferências, alergias, histórico..." />
        </label>
        <button className="primary-button full" type="submit">
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
      <div className="client-detail">
        <div className="client-detail-head">
          <div className="client-avatar big">{initialsFrom(client.name)}</div>
          <div className="client-detail-contacts">
            {client.phone && (
              <span>
                <Phone size={14} /> {client.phone}
              </span>
            )}
            {client.email && (
              <span>
                <Mail size={14} /> {client.email}
              </span>
            )}
          </div>
          <button className="ghost-button" onClick={onEdit}>
            <Pencil size={15} /> Editar
          </button>
        </div>

        <div className="client-stats">
          <div>
            <span className="muted-copy">Visitas</span>
            <strong>{stats.visits}</strong>
          </div>
          <div>
            <span className="muted-copy">Total gasto</span>
            <strong>{formatCurrency(stats.total)}</strong>
          </div>
          <div>
            <span className="muted-copy">Última visita</span>
            <strong>{stats.lastVisit ? formatDate(stats.lastVisit) : '—'}</strong>
          </div>
        </div>

        {client.notes && <p className="client-notes">{client.notes}</p>}

        <div className="panel-heading compact">
          <h3>Histórico de atendimentos</h3>
          <button className="text-button" onClick={onGoToAgenda}>
            <CalendarPlus size={15} /> Agendar
          </button>
        </div>

        {history.length === 0 ? (
          <p className="muted-copy empty-inline">Este cliente ainda não tem atendimentos registrados.</p>
        ) : (
          <ul className="history-list">
            {history.map((appt) => (
              <li key={appt.id}>
                <div className="history-date">
                  <strong>{formatDate(appt.date)}</strong>
                  <span>{appt.time}</span>
                </div>
                <div className="history-info">
                  <strong>{appt.serviceName || serviceName(db, appt.serviceId)}</strong>
                  <span className="muted-copy">com {barberName(db, appt.barberId)}</span>
                </div>
                <span className={`status-pill ${appt.status}`}>{statusLabels[appt.status]}</span>
                <b>{formatCurrency(appt.price)}</b>
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
    <div className="page-content">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Relacionamento</p>
          <h1>Clientes</h1>
          <p className="heading-subtitle">{db.clients.length} cliente(s) cadastrado(s).</p>
        </div>
        <button className="primary-button" onClick={() => setFormModal('new')}>
          <Plus size={18} /> Novo cliente
        </button>
      </section>

      <div className="search-bar">
        <Search size={17} />
        <input
          placeholder="Buscar por nome ou telefone..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <section className="panel">
        {db.clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum cliente ainda"
            description="Cadastre seus clientes para acompanhar o histórico e as preferências de cada um."
            action={
              <button className="primary-button" onClick={() => setFormModal('new')}>
                <Plus size={16} /> Adicionar cliente
              </button>
            }
          />
        ) : clients.length === 0 ? (
          <p className="muted-copy empty-inline">Nenhum cliente encontrado para "{query}".</p>
        ) : (
          <div className="client-list">
            {clients.map((client) => {
              const stats = clientStats(db, client.id)
              return (
                <button className="client-row" key={client.id} onClick={() => setDetail(client)}>
                  <span className="client-avatar">{initialsFrom(client.name)}</span>
                  <div className="client-row-main">
                    <strong>{client.name}</strong>
                    <span className="muted-copy">{client.phone || 'sem telefone'}</span>
                  </div>
                  <div className="client-row-meta">
                    <span>{stats.visits} visita(s)</span>
                    <b>{formatCurrency(stats.total)}</b>
                  </div>
                  <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="icon-button" aria-label="Editar" onClick={() => setFormModal(client)}>
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button danger"
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

import { useState } from 'react'
import { Clock3, Pencil, Plus, Scissors, Trash2, UserCog, Users } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { useStore } from '../../lib/store'
import { activeBarbers, activeServices } from '../../lib/selectors'
import { formatCurrency, formatDuration, parseCurrency } from '../../lib/format'

function ServiceForm({ initial, onSubmit, onClose }) {
  const [form, setForm] = useState(
    initial || { name: '', durationMin: 30, price: '' },
  )
  const update = (field) => (event) =>
    setForm((c) => ({ ...c, [field]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    if (!form.name.trim()) return
    onSubmit({
      name: form.name.trim(),
      durationMin: Number(form.durationMin) || 30,
      price: parseCurrency(form.price),
    })
    onClose()
  }

  return (
    <Modal title={initial ? 'Editar serviço' : 'Novo serviço'} kicker="Serviços" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          Nome do serviço
          <input value={form.name} onChange={update('name')} placeholder="Ex.: Corte + Barba" autoFocus />
        </label>
        <div className="form-row">
          <label>
            Duração (minutos)
            <input type="number" min="5" step="5" value={form.durationMin} onChange={update('durationMin')} />
          </label>
          <label>
            Preço (R$)
            <input value={form.price} onChange={update('price')} placeholder="Ex.: 70,00" inputMode="decimal" />
          </label>
        </div>
        <button className="primary-button full" type="submit">
          {initial ? 'Salvar alterações' : 'Adicionar serviço'}
        </button>
      </form>
    </Modal>
  )
}

function BarberForm({ initial, onSubmit, onClose }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, commissionPct: Math.round((initial.commissionRate ?? 0) * 100) }
      : { name: '', commissionPct: 50 },
  )
  const update = (field) => (event) =>
    setForm((c) => ({ ...c, [field]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    if (!form.name.trim()) return
    const pct = Math.min(100, Math.max(0, Number(form.commissionPct) || 0))
    onSubmit({ name: form.name.trim(), commissionRate: pct / 100 })
    onClose()
  }

  return (
    <Modal title={initial ? 'Editar barbeiro' : 'Novo barbeiro'} kicker="Equipe" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          Nome
          <input value={form.name} onChange={update('name')} placeholder="Ex.: André Lima" autoFocus />
        </label>
        <label>
          Comissão (%)
          <input type="number" min="0" max="100" value={form.commissionPct} onChange={update('commissionPct')} />
          <small className="field-hint">Percentual sobre o faturamento gerado por este barbeiro.</small>
        </label>
        <button className="primary-button full" type="submit">
          {initial ? 'Salvar alterações' : 'Adicionar barbeiro'}
        </button>
      </form>
    </Modal>
  )
}

function ServicesPage() {
  const { db, addService, updateService, removeService, addBarber, updateBarber, removeBarber } = useStore()
  const [tab, setTab] = useState('services')
  const [serviceModal, setServiceModal] = useState(null) // null | 'new' | service
  const [barberModal, setBarberModal] = useState(null)
  const [confirm, setConfirm] = useState(null) // { kind, id, name }

  const services = activeServices(db)
  const barbers = activeBarbers(db)

  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Configuração</p>
          <h1>Serviços e equipe</h1>
          <p className="heading-subtitle">Defina o que sua barbearia oferece e quem atende.</p>
        </div>
        {tab === 'services' ? (
          <button className="primary-button" onClick={() => setServiceModal('new')}>
            <Plus size={18} /> Novo serviço
          </button>
        ) : (
          <button className="primary-button" onClick={() => setBarberModal('new')}>
            <Plus size={18} /> Novo barbeiro
          </button>
        )}
      </section>

      <div className="segmented">
        <button className={tab === 'services' ? 'active' : ''} onClick={() => setTab('services')}>
          <Scissors size={16} /> Serviços
        </button>
        <button className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>
          <Users size={16} /> Equipe
        </button>
      </div>

      {tab === 'services' && (
        <section className="panel">
          {services.length === 0 ? (
            <EmptyState
              icon={Scissors}
              title="Nenhum serviço cadastrado"
              description="Cadastre os serviços que sua barbearia oferece para começar a agendar."
              action={
                <button className="primary-button" onClick={() => setServiceModal('new')}>
                  <Plus size={16} /> Adicionar serviço
                </button>
              }
            />
          ) : (
            <div className="card-grid">
              {services.map((service) => (
                <article className="item-card" key={service.id}>
                  <span className="service-icon dark">
                    <Scissors size={18} />
                  </span>
                  <div className="item-card-body">
                    <strong>{service.name}</strong>
                    <span className="muted-copy">
                      <Clock3 size={13} /> {formatDuration(service.durationMin)}
                    </span>
                  </div>
                  <b className="item-price">{formatCurrency(service.price)}</b>
                  <div className="item-actions">
                    <button className="icon-button" aria-label="Editar" onClick={() => setServiceModal(service)}>
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label="Excluir"
                      onClick={() => setConfirm({ kind: 'service', id: service.id, name: service.name })}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'team' && (
        <section className="panel">
          {barbers.length === 0 ? (
            <EmptyState
              icon={UserCog}
              title="Nenhum barbeiro cadastrado"
              description="Adicione os profissionais que atendem na sua barbearia."
              action={
                <button className="primary-button" onClick={() => setBarberModal('new')}>
                  <Plus size={16} /> Adicionar barbeiro
                </button>
              }
            />
          ) : (
            <div className="card-grid">
              {barbers.map((barber) => (
                <article className="item-card" key={barber.id}>
                  <span className="service-icon light">
                    <UserCog size={18} />
                  </span>
                  <div className="item-card-body">
                    <strong>{barber.name}</strong>
                    <span className="muted-copy">
                      Comissão {Math.round((barber.commissionRate ?? 0) * 100)}%
                    </span>
                  </div>
                  <div className="item-actions">
                    <button className="icon-button" aria-label="Editar" onClick={() => setBarberModal(barber)}>
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label="Excluir"
                      onClick={() => setConfirm({ kind: 'barber', id: barber.id, name: barber.name })}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {serviceModal && (
        <ServiceForm
          initial={serviceModal === 'new' ? null : serviceModal}
          onClose={() => setServiceModal(null)}
          onSubmit={(data) =>
            serviceModal === 'new' ? addService(data) : updateService(serviceModal.id, data)
          }
        />
      )}

      {barberModal && (
        <BarberForm
          initial={barberModal === 'new' ? null : barberModal}
          onClose={() => setBarberModal(null)}
          onSubmit={(data) =>
            barberModal === 'new' ? addBarber(data) : updateBarber(barberModal.id, data)
          }
        />
      )}

      {confirm && (
        <ConfirmDialog
          title="Excluir registro"
          message={`Tem certeza que deseja excluir "${confirm.name}"? Esta ação não pode ser desfeita.`}
          onClose={() => setConfirm(null)}
          onConfirm={() =>
            confirm.kind === 'service' ? removeService(confirm.id) : removeBarber(confirm.id)
          }
        />
      )}
    </div>
  )
}

export default ServicesPage

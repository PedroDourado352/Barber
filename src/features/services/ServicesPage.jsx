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
      <form className="grid gap-[15px]" onSubmit={submit}>
        <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
          Nome do serviço
          <input value={form.name} onChange={update('name')} placeholder="Ex.: Corte + Barba" autoFocus />
        </label>
        <div className="grid gap-[15px] sm:grid-cols-2">
          <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
            Duração (minutos)
            <input type="number" min="5" step="5" value={form.durationMin} onChange={update('durationMin')} />
          </label>
          <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
            Preço (R$)
            <input value={form.price} onChange={update('price')} placeholder="Ex.: 70,00" inputMode="decimal" />
          </label>
        </div>
        <button className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)] hover:brightness-110" type="submit">
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
      <form className="grid gap-[15px]" onSubmit={submit}>
        <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
          Nome
          <input value={form.name} onChange={update('name')} placeholder="Ex.: André Lima" autoFocus />
        </label>
        <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
          Comissão (%)
          <input type="number" min="0" max="100" value={form.commissionPct} onChange={update('commissionPct')} />
          <small className="text-[10px] font-normal text-[var(--text-dim)]">Percentual sobre o faturamento gerado por este barbeiro.</small>
        </label>
        <button className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)] hover:brightness-110" type="submit">
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
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-14 pt-9 sm:px-8 lg:px-11">
      <section className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.1px] text-[var(--text-dim)]">Configuração</p>
          <h1 className="m-0 font-['Space_Grotesk'] text-[clamp(25px,3vw,32px)] font-semibold leading-tight text-[var(--text)]">Serviços e equipe</h1>
          <p className="mt-2 text-[13px] text-[var(--text-muted)]">Defina o que sua barbearia oferece e quem atende.</p>
        </div>
        {tab === 'services' ? (
          <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)] hover:brightness-110" onClick={() => setServiceModal('new')}>
            <Plus size={18} /> Novo serviço
          </button>
        ) : (
          <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)] hover:brightness-110" onClick={() => setBarberModal('new')}>
            <Plus size={18} /> Novo barbeiro
          </button>
        )}
      </section>

      <div className="mb-[22px] inline-flex gap-[3px] rounded-[11px] border border-[var(--border)] bg-[var(--surface-2)] p-1">
        <button className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-[var(--text-muted)] ${tab === 'services' ? 'bg-[var(--surface-3)] text-[var(--text)]' : ''}`} onClick={() => setTab('services')}>
          <Scissors size={16} /> Serviços
        </button>
        <button className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-[var(--text-muted)] ${tab === 'team' ? 'bg-[var(--surface-3)] text-[var(--text)]' : ''}`} onClick={() => setTab('team')}>
          <Users size={16} /> Equipe
        </button>
      </div>

      {tab === 'services' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-[22px]">
          {services.length === 0 ? (
            <EmptyState
              icon={Scissors}
              title="Nenhum serviço cadastrado"
              description="Cadastre os serviços que sua barbearia oferece para começar a agendar."
              action={
                <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)]" onClick={() => setServiceModal('new')}>
                  <Plus size={16} /> Adicionar serviço
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => (
                <article className="flex items-center gap-3 border border-[var(--border)] rounded-[11px] bg-[var(--surface-2)] p-[15px] hover:border-[var(--border-strong)]" key={service.id}>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[var(--accent)] text-[var(--accent-ink)]">
                    <Scissors size={18} />
                  </span>
                  <div className="grid min-w-0 flex-1 gap-1">
                    <strong className="text-[13px] text-[var(--text)]">{service.name}</strong>
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-[var(--text-dim)]">
                      <Clock3 size={13} /> {formatDuration(service.durationMin)}
                    </span>
                  </div>
                  <b className="text-sm font-semibold text-[var(--text)]">{formatCurrency(service.price)}</b>
                  <div className="flex gap-0.5">
                    <button className="grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-muted)] hover:bg-[var(--hover)]" aria-label="Editar" onClick={() => setServiceModal(service)}>
                      <Pencil size={16} />
                    </button>
                    <button
                      className="grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-dim)] hover:bg-[var(--red-bg)] hover:text-[var(--red)]"
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
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-[22px]">
          {barbers.length === 0 ? (
            <EmptyState
              icon={UserCog}
              title="Nenhum barbeiro cadastrado"
              description="Adicione os profissionais que atendem na sua barbearia."
              action={
                <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)]" onClick={() => setBarberModal('new')}>
                  <Plus size={16} /> Adicionar barbeiro
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {barbers.map((barber) => (
                <article className="flex items-center gap-3 border border-[var(--border)] rounded-[11px] bg-[var(--surface-2)] p-[15px] hover:border-[var(--border-strong)]" key={barber.id}>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[var(--surface-3)] text-[var(--text-muted)]">
                    <UserCog size={18} />
                  </span>
                  <div className="grid min-w-0 flex-1 gap-1">
                    <strong className="text-[13px] text-[var(--text)]">{barber.name}</strong>
                    <span className="text-[10px] text-[var(--text-dim)]">
                      Comissão {Math.round((barber.commissionRate ?? 0) * 100)}%
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    <button className="grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-muted)] hover:bg-[var(--hover)]" aria-label="Editar" onClick={() => setBarberModal(barber)}>
                      <Pencil size={16} />
                    </button>
                    <button
                      className="grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-dim)] hover:bg-[var(--red-bg)] hover:text-[var(--red)]"
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

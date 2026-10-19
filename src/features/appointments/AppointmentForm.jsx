import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { useStore } from '../../lib/store'
import { activeBarbers, activeServices } from '../../lib/selectors'
import { parseCurrency, todayISO } from '../../lib/format'

function AppointmentForm({ initial, defaultDate, onClose }) {
  const { db, addAppointment, updateAppointment, addClient } = useStore()
  const services = activeServices(db)
  const barbers = activeBarbers(db)

  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        clientMode: initial.clientId ? 'existing' : 'walkin',
        clientId: initial.clientId || '',
        clientName: initial.clientName || '',
        serviceId: initial.serviceId || '',
        barberId: initial.barberId || '',
        date: initial.date || defaultDate || todayISO(),
        time: initial.time || '09:00',
        price: initial.price ?? '',
        note: initial.note || '',
      }
    }
    return {
      clientMode: 'existing',
      clientId: '',
      clientName: '',
      serviceId: services[0]?.id || '',
      barberId: barbers[0]?.id || '',
      date: defaultDate || todayISO(),
      time: '09:00',
      price: services[0]?.price ?? '',
      note: '',
    }
  })

  const update = (field, value) => setForm((c) => ({ ...c, [field]: value }))

  const onServiceChange = (serviceId) => {
    const service = services.find((s) => s.id === serviceId)
    setForm((c) => ({
      ...c,
      serviceId,
      price: service ? service.price : c.price,
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const service = services.find((s) => s.id === form.serviceId)
    if (!service) return

    let clientId = form.clientMode === 'existing' ? form.clientId : ''
    let clientName = ''
    if (form.clientMode === 'existing') {
      clientName = db.clients.find((c) => c.id === clientId)?.name || ''
    } else {
      clientName = form.clientName.trim()
      // Cliente avulso com nome vira cadastro automático para alimentar o histórico.
      // Esperamos o cliente ser gravado no banco ANTES de criar o agendamento,
      // senão a chave estrangeira falha (409 Conflict).
      if (clientName) {
        const created = await addClient({ name: clientName, phone: '', email: '', notes: '' })
        if (!created) return // falhou ao salvar o cliente; não cria o agendamento
        clientId = created.id
      }
    }

    const payload = {
      clientId: clientId || null,
      clientName: clientName || 'Cliente avulso',
      serviceId: service.id,
      serviceName: service.name,
      durationMin: service.durationMin,
      barberId: form.barberId || null,
      date: form.date,
      time: form.time,
      price: parseCurrency(form.price),
      note: form.note.trim(),
    }

    if (initial) updateAppointment(initial.id, payload)
    else addAppointment(payload)
    onClose()
  }

  const noServices = services.length === 0

  return (
    <Modal title={initial ? 'Editar agendamento' : 'Novo agendamento'} kicker="Agenda" onClose={onClose}>
      {noServices ? (
        <p className="m-0 py-7 text-center text-xs text-[var(--text-dim)]">
          Cadastre pelo menos um serviço antes de criar um agendamento (menu Serviços).
        </p>
      ) : (
        <form className="grid gap-[15px]" onSubmit={submit}>
          <div className="flex gap-[3px] rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1">
            <button
              type="button"
              className={`flex-1 rounded-md px-2 py-2 text-xs font-semibold text-[var(--text-muted)] ${form.clientMode === 'existing' ? 'bg-[var(--surface-3)] text-[var(--text)]' : ''}`}
              onClick={() => update('clientMode', 'existing')}
            >
              Cliente cadastrado
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md px-2 py-2 text-xs font-semibold text-[var(--text-muted)] ${form.clientMode === 'walkin' ? 'bg-[var(--surface-3)] text-[var(--text)]' : ''}`}
              onClick={() => update('clientMode', 'walkin')}
            >
              Cliente avulso
            </button>
          </div>

          {form.clientMode === 'existing' ? (
            <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
              Cliente
              {db.clients.length === 0 ? (
                <small className="text-[10px] font-normal text-[var(--text-dim)]">
                  Nenhum cliente cadastrado — use "Cliente avulso" ou cadastre no menu Clientes.
                </small>
              ) : (
                <select value={form.clientId} onChange={(e) => update('clientId', e.target.value)} required>
                  <option value="">Selecione...</option>
                  {db.clients
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                    .map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                </select>
              )}
            </label>
          ) : (
            <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
              Nome do cliente
              <input
                value={form.clientName}
                onChange={(e) => update('clientName', e.target.value)}
                placeholder="Ex.: Lucas Almeida"
                autoFocus
              />
            </label>
          )}

          <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
            Serviço
            <select value={form.serviceId} onChange={(e) => onServiceChange(e.target.value)}>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
            Barbeiro
            <select value={form.barberId} onChange={(e) => update('barberId', e.target.value)}>
              {barbers.length === 0 && <option value="">—</option>}
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-[15px] sm:grid-cols-2">
            <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
              Data
              <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
            </label>
            <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
              Horário
              <input type="time" value={form.time} onChange={(e) => update('time', e.target.value)} />
            </label>
          </div>

          <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
            Valor (R$)
            <input value={form.price} onChange={(e) => update('price', e.target.value)} inputMode="decimal" />
          </label>

          <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
            Observação
            <input value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="opcional" />
          </label>

          <button className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)] hover:brightness-110" type="submit">
            {initial ? 'Salvar alterações' : 'Adicionar à agenda'}
          </button>
        </form>
      )}
    </Modal>
  )
}

export default AppointmentForm

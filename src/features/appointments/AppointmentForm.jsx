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

  const submit = (event) => {
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
      if (clientName) {
        const created = addClient({ name: clientName, phone: '', email: '', notes: '' })
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
        <p className="muted-copy empty-inline">
          Cadastre pelo menos um serviço antes de criar um agendamento (menu Serviços).
        </p>
      ) : (
        <form className="form" onSubmit={submit}>
          <div className="mode-toggle">
            <button
              type="button"
              className={form.clientMode === 'existing' ? 'active' : ''}
              onClick={() => update('clientMode', 'existing')}
            >
              Cliente cadastrado
            </button>
            <button
              type="button"
              className={form.clientMode === 'walkin' ? 'active' : ''}
              onClick={() => update('clientMode', 'walkin')}
            >
              Cliente avulso
            </button>
          </div>

          {form.clientMode === 'existing' ? (
            <label>
              Cliente
              {db.clients.length === 0 ? (
                <small className="field-hint">
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
            <label>
              Nome do cliente
              <input
                value={form.clientName}
                onChange={(e) => update('clientName', e.target.value)}
                placeholder="Ex.: Lucas Almeida"
                autoFocus
              />
            </label>
          )}

          <label>
            Serviço
            <select value={form.serviceId} onChange={(e) => onServiceChange(e.target.value)}>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          <label>
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

          <div className="form-row">
            <label>
              Data
              <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
            </label>
            <label>
              Horário
              <input type="time" value={form.time} onChange={(e) => update('time', e.target.value)} />
            </label>
          </div>

          <label>
            Valor (R$)
            <input value={form.price} onChange={(e) => update('price', e.target.value)} inputMode="decimal" />
          </label>

          <label>
            Observação
            <input value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="opcional" />
          </label>

          <button className="primary-button full" type="submit">
            {initial ? 'Salvar alterações' : 'Adicionar à agenda'}
          </button>
        </form>
      )}
    </Modal>
  )
}

export default AppointmentForm

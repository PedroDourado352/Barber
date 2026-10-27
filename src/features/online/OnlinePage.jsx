import { useState } from 'react'
import { Check, Copy, ExternalLink, Globe } from 'lucide-react'
import { useStore } from '../../lib/store'

const WEEKDAYS = [
  { key: '1', label: 'Segunda' },
  { key: '2', label: 'Terça' },
  { key: '3', label: 'Quarta' },
  { key: '4', label: 'Quinta' },
  { key: '5', label: 'Sexta' },
  { key: '6', label: 'Sábado' },
  { key: '0', label: 'Domingo' },
]

const card = 'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6'
const inputCls = 'rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--border-strong)]'

function OnlinePage() {
  const { db, updateShop, usingSupabase } = useStore()
  const shop = db.shop
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState(() => ({
    whatsapp: shop?.whatsapp || '',
    address: shop?.address || '',
    slot_minutes: shop?.slot_minutes || 30,
    hours: shop?.hours || {},
  }))

  const wrapper = 'mx-auto w-full max-w-[1100px] px-5 py-8 sm:px-8 lg:px-11'

  if (!usingSupabase || !shop) {
    return (
      <div className={wrapper}>
        <h1 className="m-0 text-2xl font-semibold text-[var(--text)]">Online</h1>
        <div className={`mt-6 grid justify-items-center gap-3 py-12 text-center ${card}`}>
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-dim)]"><Globe size={24} /></span>
          <strong className="text-base text-[var(--text)]">Disponível com o Supabase conectado</strong>
          <p className="m-0 max-w-[340px] text-sm text-[var(--text-muted)]">O link de agendamento funciona quando o sistema roda com o Supabase. Configure as chaves e recarregue.</p>
        </div>
      </div>
    )
  }

  const link = `${window.location.origin}/b/${shop.slug}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* ignore */ }
  }

  const setDayOpen = (key, open) =>
    setForm((f) => ({ ...f, hours: { ...f.hours, [key]: open ? { open: '09:00', close: '19:00' } : null } }))
  const setDayTime = (key, field, value) =>
    setForm((f) => ({ ...f, hours: { ...f.hours, [key]: { ...(f.hours[key] || { open: '09:00', close: '19:00' }), [field]: value } } }))

  const save = () => {
    updateShop({
      whatsapp: form.whatsapp.trim(),
      address: form.address.trim(),
      slot_minutes: Number(form.slot_minutes) || 30,
      hours: form.hours,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className={wrapper}>
      <div className="mb-6">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[1.1px] text-[var(--text-dim)]">Agendamento</p>
        <h1 className="m-0 mt-1 text-2xl font-semibold text-[var(--text)]">Online</h1>
        <p className="m-0 mt-1.5 text-sm text-[var(--text-muted)]">Compartilhe seu link e defina os horários de atendimento.</p>
      </div>

      <section className={card}>
        <h2 className="m-0 flex items-center gap-2 text-base font-semibold text-[var(--text)]"><Globe size={17} /> Seu link de agendamento</h2>
        <p className="m-0 mt-1.5 text-sm text-[var(--text-muted)]">Mande este link para os clientes agendarem sozinhos. O que marcarem cai na sua Agenda.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input readOnly value={link} onFocus={(e) => e.target.select()} className={`flex-1 min-w-[200px] ${inputCls}`} />
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]" onClick={copy}>
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copiado' : 'Copiar'}
          </button>
          <a className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]" href={link} target="_blank" rel="noreferrer">
            <ExternalLink size={15} /> Abrir
          </a>
        </div>
      </section>

      <section className={`mt-4 ${card}`}>
        <h2 className="m-0 text-base font-semibold text-[var(--text)]">Configurações</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-semibold text-[var(--text-muted)]">WhatsApp (para confirmação)
            <input className={inputCls} value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-[var(--text-muted)]">Intervalo entre horários (min)
            <input type="number" min="5" step="5" className={inputCls} value={form.slot_minutes} onChange={(e) => setForm((f) => ({ ...f, slot_minutes: e.target.value }))} />
          </label>
        </div>
        <label className="mt-4 grid gap-1.5 text-xs font-semibold text-[var(--text-muted)]">Endereço (opcional)
          <input className={inputCls} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Rua, número, bairro" />
        </label>

        <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-[1px] text-[var(--text-dim)]">Horários de funcionamento</h3>
        <div className="grid gap-2">
          {WEEKDAYS.map(({ key, label }) => {
            const day = form.hours[key]
            const open = !!day
            return (
              <div key={key} className={`flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 ${open ? '' : 'opacity-60'}`}>
                <label className="flex min-w-[120px] items-center gap-2.5 text-sm font-medium text-[var(--text)]">
                  <input type="checkbox" checked={open} onChange={(e) => setDayOpen(key, e.target.checked)} className="accent-[var(--accent)]" />
                  {label}
                </label>
                {open ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={day.open} onChange={(e) => setDayTime(key, 'open', e.target.value)} className="rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-2 py-1.5 text-sm text-[var(--text)] outline-none" />
                    <span className="text-xs text-[var(--text-dim)]">até</span>
                    <input type="time" value={day.close} onChange={(e) => setDayTime(key, 'close', e.target.value)} className="rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-2 py-1.5 text-sm text-[var(--text)] outline-none" />
                  </div>
                ) : (
                  <span className="text-xs text-[var(--text-dim)]">Fechado</span>
                )}
              </div>
            )
          })}
        </div>

        <button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] hover:brightness-110" onClick={save}>
          {saved ? <Check size={17} /> : null} {saved ? 'Salvo!' : 'Salvar configurações'}
        </button>
      </section>
    </div>
  )
}

export default OnlinePage

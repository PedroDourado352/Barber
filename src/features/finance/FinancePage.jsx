import { useMemo, useState } from 'react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Scissors,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { PAYMENT_METHODS } from './PaymentDialog'
import { useStore } from '../../lib/store'
import {
  activeBarbers,
  barberName,
  commissionsInRange,
  popularServices,
  rangeSummary,
  transactionsInRange,
} from '../../lib/selectors'
import { formatCurrency, formatDate, parseCurrency, todayISO } from '../../lib/format'

function startOfMonth(iso) {
  return `${iso.slice(0, 7)}-01`
}
function shiftDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function TransactionForm({ onClose }) {
  const { addTransaction, db } = useStore()
  const barbers = activeBarbers(db)
  const [form, setForm] = useState({
    type: 'entrada',
    description: '',
    amount: '',
    method: 'Dinheiro',
    barberId: '',
    date: todayISO(),
  })
  const update = (field) => (e) => setForm((c) => ({ ...c, [field]: e.target.value }))

  const submit = (event) => {
    event.preventDefault()
    const amount = parseCurrency(form.amount)
    if (!amount) return
    addTransaction({
      type: form.type,
      source: 'manual',
      description: form.description.trim() || (form.type === 'entrada' ? 'Entrada avulsa' : 'Despesa'),
      amount,
      method: form.method,
      barberId: form.barberId || null,
      date: form.date,
    })
    onClose()
  }

  return (
    <Modal title="Novo lançamento" kicker="Caixa" onClose={onClose}>
      <form className="grid gap-[15px]" onSubmit={submit}>
        <div className="flex gap-[3px] rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1">
          <button type="button" className={`flex-1 rounded-md px-2 py-2 text-xs font-semibold text-[var(--text-muted)] ${form.type === 'entrada' ? 'bg-[var(--surface-3)] text-[var(--text)]' : ''}`} onClick={() => setForm((c) => ({ ...c, type: 'entrada' }))}>
            Entrada
          </button>
          <button type="button" className={`flex-1 rounded-md px-2 py-2 text-xs font-semibold text-[var(--text-muted)] ${form.type === 'saida' ? 'bg-[var(--surface-3)] text-[var(--text)]' : ''}`} onClick={() => setForm((c) => ({ ...c, type: 'saida' }))}>
            Saída
          </button>
        </div>
        <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
          Descrição
          <input value={form.description} onChange={update('description')} placeholder="Ex.: Venda de pomada / Conta de luz" autoFocus />
        </label>
        <div className="grid gap-[15px] sm:grid-cols-2">
          <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
            Valor (R$)
            <input value={form.amount} onChange={update('amount')} inputMode="decimal" placeholder="0,00" />
          </label>
          <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
            Data
            <input type="date" value={form.date} onChange={update('date')} />
          </label>
        </div>
        <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
          Forma
          <select value={form.method} onChange={update('method')}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.key}
              </option>
            ))}
            <option value="Outro">Outro</option>
          </select>
        </label>
        {form.type === 'entrada' && barbers.length > 0 && (
          <label className="grid gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
            Barbeiro (para comissão)
            <select value={form.barberId} onChange={update('barberId')}>
              <option value="">Sem vínculo</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)] hover:brightness-110" type="submit">
          Lançar no caixa
        </button>
      </form>
    </Modal>
  )
}

function FinancePage({ initialTab = 'cash' }) {
  const { db, removeTransaction } = useStore()
  const [tab, setTab] = useState(initialTab)
  const [preset, setPreset] = useState('today')
  const [showForm, setShowForm] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const today = todayISO()
  const range = useMemo(() => {
    if (preset === 'today') return { start: today, end: today }
    if (preset === 'week') return { start: shiftDays(today, -6), end: today }
    return { start: startOfMonth(today), end: today }
  }, [preset, today])

  const summary = rangeSummary(db, range.start, range.end)
  const transactions = transactionsInRange(db, range.start, range.end).sort((a, b) =>
    `${b.date}${b.createdAt || ''}`.localeCompare(`${a.date}${a.createdAt || ''}`),
  )
  const commissions = commissionsInRange(db, range.start, range.end)
  const popular = popularServices(db, range.start, range.end)

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-14 pt-9 sm:px-8 lg:px-11">
      <section className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.1px] text-[var(--text-dim)]">Financeiro</p>
          <h1 className="m-0 font-['Inter'] text-[clamp(25px,3vw,32px)] font-semibold leading-tight text-[var(--text)]">Caixa</h1>
          <p className="mt-2 text-[13px] text-[var(--text-muted)]">Acompanhe entradas, saídas e comissões.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)] hover:brightness-110" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Novo lançamento
        </button>
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3.5 max-md:flex-col max-md:items-stretch">
        <div className="inline-flex gap-[3px] rounded-[11px] border border-[var(--border)] bg-[var(--surface-2)] p-1">
          <button className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-[var(--text-muted)] ${tab === 'cash' ? 'bg-[var(--surface-3)] text-[var(--text)]' : ''}`} onClick={() => setTab('cash')}>
            <Wallet size={16} /> Caixa
          </button>
          <button className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-[var(--text-muted)] ${tab === 'reports' ? 'bg-[var(--surface-3)] text-[var(--text)]' : ''}`} onClick={() => setTab('reports')}>
            <TrendingUp size={16} /> Relatórios
          </button>
        </div>
        <div className="inline-flex gap-[3px] rounded-[11px] border border-[var(--border)] bg-[var(--surface-2)] p-1">
          <button className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] ${preset === 'today' ? 'bg-[var(--surface-3)] text-[var(--text)]' : ''}`} onClick={() => setPreset('today')}>
            Hoje
          </button>
          <button className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] ${preset === 'week' ? 'bg-[var(--surface-3)] text-[var(--text)]' : ''}`} onClick={() => setPreset('week')}>
            7 dias
          </button>
          <button className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] ${preset === 'month' ? 'bg-[var(--surface-3)] text-[var(--text)]' : ''}`} onClick={() => setPreset('month')}>
            Mês
          </button>
        </div>
      </div>

      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-[18px] shadow-[var(--shadow-card)]">
          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[var(--green-bg)] text-[var(--green)]">
            <ArrowUpCircle size={18} />
          </span>
          <div>
            <span className="text-[10px] text-[var(--text-dim)]">Entradas</span>
            <strong className="font-['Inter'] text-[22px] font-semibold text-[var(--text)]">{formatCurrency(summary.income)}</strong>
          </div>
        </article>
        <article className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-[18px] shadow-[var(--shadow-card)]">
          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[var(--amber-bg)] text-[var(--amber)]">
            <ArrowDownCircle size={18} />
          </span>
          <div>
            <span className="text-[10px] text-[var(--text-dim)]">Saídas</span>
            <strong className="font-['Inter'] text-[22px] font-semibold text-[var(--text)]">{formatCurrency(summary.expense)}</strong>
          </div>
        </article>
        <article className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-[18px] shadow-[var(--shadow-card)]">
          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[var(--blue-bg)] text-[var(--blue)]">
            <Wallet size={18} />
          </span>
          <div>
            <span className="text-[10px] text-[var(--text-dim)]">Saldo</span>
            <strong className="font-['Inter'] text-[22px] font-semibold text-[var(--text)]">{formatCurrency(summary.net)}</strong>
          </div>
        </article>
      </section>

      {tab === 'cash' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-[22px]">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="m-0 text-[15px] font-semibold text-[var(--text)]">Lançamentos</h3>
          </div>
          {transactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Nenhum lançamento no período"
              description="Conclua atendimentos na agenda ou adicione um lançamento manual."
            />
          ) : (
            <div className="mt-2 grid gap-px">
              {transactions.map((tx) => (
                <div className="flex items-center gap-3 border-t border-[var(--border-soft)] py-3 px-1" key={tx.id}>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${tx.type === 'entrada' ? 'bg-[var(--green-bg)] text-[var(--green)]' : 'bg-[var(--red-bg)] text-[var(--red)]'}`}>
                    {tx.type === 'entrada' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                  </span>
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <strong className="text-[13px] text-[var(--text)]">{tx.description}</strong>
                    <span className="text-[10px] text-[var(--text-dim)]">
                      {formatDate(tx.date)} · {tx.method}
                      {tx.barberId ? ` · ${barberName(db, tx.barberId)}` : ''}
                      {tx.source === 'agendamento' ? ' · agenda' : ''}
                    </span>
                  </div>
                  <b className={`whitespace-nowrap text-[13px] font-semibold ${tx.type === 'entrada' ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                    {tx.type === 'entrada' ? '+' : '−'} {formatCurrency(tx.amount)}
                  </b>
                  <button className="grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-dim)] hover:bg-[var(--red-bg)] hover:text-[var(--red)]" aria-label="Excluir" onClick={() => setConfirm(tx)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'reports' && (
        <div className="grid items-start gap-[13px] lg:grid-cols-[1.2fr_0.9fr]">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-[22px]">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="m-0 inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--text)]">
                <Users size={16} /> Comissões por barbeiro
              </h3>
            </div>
            {commissions.length === 0 ? (
              <p className="m-0 py-7 text-center text-xs text-[var(--text-dim)]">Sem faturamento vinculado a barbeiros no período.</p>
            ) : (
              <div className="mt-2">
                <div className="grid grid-cols-[1.4fr_1fr_.6fr_1fr] gap-2 px-1 pb-1.5 text-[9px] uppercase tracking-[.8px] text-[var(--text-dim)] max-md:grid-cols-[1.2fr_1fr_.9fr]">
                  <span>Barbeiro</span>
                  <span>Faturamento</span>
                  <span>Taxa</span>
                  <span>Comissão</span>
                </div>
                {commissions.map((row) => (
                  <div className="grid grid-cols-[1.4fr_1fr_.6fr_1fr] items-center gap-2 border-t border-[var(--border-soft)] px-1 py-3 text-xs max-md:grid-cols-[1.2fr_1fr_.9fr]" key={row.barberId}>
                    <strong className="text-xs text-[var(--text)]">{row.name}</strong>
                    <span>{formatCurrency(row.revenue)}</span>
                    <span>{Math.round(row.rate * 100)}%</span>
                    <b>{formatCurrency(row.commission)}</b>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-[22px]">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="m-0 inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--text)]">
                <Scissors size={16} /> Serviços mais populares
              </h3>
            </div>
            {popular.length === 0 ? (
              <p className="m-0 py-7 text-center text-xs text-[var(--text-dim)]">Nenhum atendimento concluído no período.</p>
            ) : (
              popular.map((service) => (
                <div className="flex items-center gap-3 border-t border-[var(--border-soft)] py-3.5" key={service.name}>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[var(--accent)] text-[var(--accent-ink)]">
                    <Scissors size={17} />
                  </span>
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <strong className="text-[12px] text-[var(--text)]">{service.name}</strong>
                    <span className="text-[10px] text-[var(--text-dim)]">{service.count} atendimento(s)</span>
                  </div>
                  <b className="text-xs text-[var(--text)]">{formatCurrency(service.revenue)}</b>
                </div>
              ))
            )}
          </section>
        </div>
      )}

      {showForm && <TransactionForm onClose={() => setShowForm(false)} />}

      {confirm && (
        <ConfirmDialog
          title="Excluir lançamento"
          message={`Excluir "${confirm.description}"? ${
            confirm.source === 'agendamento' ? 'Este lançamento veio de um atendimento concluído.' : ''
          }`}
          onClose={() => setConfirm(null)}
          onConfirm={() => removeTransaction(confirm.id)}
        />
      )}
    </div>
  )
}

export default FinancePage

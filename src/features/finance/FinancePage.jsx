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
      <form className="form" onSubmit={submit}>
        <div className="mode-toggle">
          <button type="button" className={form.type === 'entrada' ? 'active' : ''} onClick={() => setForm((c) => ({ ...c, type: 'entrada' }))}>
            Entrada
          </button>
          <button type="button" className={form.type === 'saida' ? 'active' : ''} onClick={() => setForm((c) => ({ ...c, type: 'saida' }))}>
            Saída
          </button>
        </div>
        <label>
          Descrição
          <input value={form.description} onChange={update('description')} placeholder="Ex.: Venda de pomada / Conta de luz" autoFocus />
        </label>
        <div className="form-row">
          <label>
            Valor (R$)
            <input value={form.amount} onChange={update('amount')} inputMode="decimal" placeholder="0,00" />
          </label>
          <label>
            Data
            <input type="date" value={form.date} onChange={update('date')} />
          </label>
        </div>
        <label>
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
          <label>
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
        <button className="primary-button full" type="submit">
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
    <div className="page-content">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Financeiro</p>
          <h1>Caixa</h1>
          <p className="heading-subtitle">Acompanhe entradas, saídas e comissões.</p>
        </div>
        <button className="primary-button" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Novo lançamento
        </button>
      </section>

      <div className="finance-toolbar">
        <div className="segmented">
          <button className={tab === 'cash' ? 'active' : ''} onClick={() => setTab('cash')}>
            <Wallet size={16} /> Caixa
          </button>
          <button className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>
            <TrendingUp size={16} /> Relatórios
          </button>
        </div>
        <div className="segmented subtle">
          <button className={preset === 'today' ? 'active' : ''} onClick={() => setPreset('today')}>
            Hoje
          </button>
          <button className={preset === 'week' ? 'active' : ''} onClick={() => setPreset('week')}>
            7 dias
          </button>
          <button className={preset === 'month' ? 'active' : ''} onClick={() => setPreset('month')}>
            Mês
          </button>
        </div>
      </div>

      <section className="finance-summary">
        <article className="summary-card income">
          <span className="service-icon green">
            <ArrowUpCircle size={18} />
          </span>
          <div>
            <span className="muted-copy">Entradas</span>
            <strong>{formatCurrency(summary.income)}</strong>
          </div>
        </article>
        <article className="summary-card expense">
          <span className="service-icon orange">
            <ArrowDownCircle size={18} />
          </span>
          <div>
            <span className="muted-copy">Saídas</span>
            <strong>{formatCurrency(summary.expense)}</strong>
          </div>
        </article>
        <article className="summary-card net">
          <span className="service-icon blue">
            <Wallet size={18} />
          </span>
          <div>
            <span className="muted-copy">Saldo</span>
            <strong>{formatCurrency(summary.net)}</strong>
          </div>
        </article>
      </section>

      {tab === 'cash' && (
        <section className="panel">
          <div className="panel-heading compact">
            <h3>Lançamentos</h3>
          </div>
          {transactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Nenhum lançamento no período"
              description="Conclua atendimentos na agenda ou adicione um lançamento manual."
            />
          ) : (
            <div className="tx-list">
              {transactions.map((tx) => (
                <div className="tx-row" key={tx.id}>
                  <span className={`tx-icon ${tx.type}`}>
                    {tx.type === 'entrada' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                  </span>
                  <div className="tx-main">
                    <strong>{tx.description}</strong>
                    <span className="muted-copy">
                      {formatDate(tx.date)} · {tx.method}
                      {tx.barberId ? ` · ${barberName(db, tx.barberId)}` : ''}
                      {tx.source === 'agendamento' ? ' · agenda' : ''}
                    </span>
                  </div>
                  <b className={tx.type === 'entrada' ? 'amount-in' : 'amount-out'}>
                    {tx.type === 'entrada' ? '+' : '−'} {formatCurrency(tx.amount)}
                  </b>
                  <button className="icon-button danger" aria-label="Excluir" onClick={() => setConfirm(tx)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'reports' && (
        <div className="reports-grid">
          <section className="panel">
            <div className="panel-heading compact">
              <h3>
                <Users size={16} /> Comissões por barbeiro
              </h3>
            </div>
            {commissions.length === 0 ? (
              <p className="muted-copy empty-inline">Sem faturamento vinculado a barbeiros no período.</p>
            ) : (
              <div className="report-table">
                <div className="report-head">
                  <span>Barbeiro</span>
                  <span>Faturamento</span>
                  <span>Taxa</span>
                  <span>Comissão</span>
                </div>
                {commissions.map((row) => (
                  <div className="report-row" key={row.barberId}>
                    <strong>{row.name}</strong>
                    <span>{formatCurrency(row.revenue)}</span>
                    <span>{Math.round(row.rate * 100)}%</span>
                    <b>{formatCurrency(row.commission)}</b>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading compact">
              <h3>
                <Scissors size={16} /> Serviços mais populares
              </h3>
            </div>
            {popular.length === 0 ? (
              <p className="muted-copy empty-inline">Nenhum atendimento concluído no período.</p>
            ) : (
              popular.map((service) => (
                <div className="service-item" key={service.name}>
                  <span className="service-icon dark">
                    <Scissors size={17} />
                  </span>
                  <div>
                    <strong>{service.name}</strong>
                    <span>{service.count} atendimento(s)</span>
                  </div>
                  <b>{formatCurrency(service.revenue)}</b>
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

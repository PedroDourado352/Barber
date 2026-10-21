import { useState } from 'react'
import { Banknote, CreditCard, QrCode, Smartphone } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { formatCurrency } from '../../lib/format'

export const PAYMENT_METHODS = [
  { key: 'Dinheiro', icon: Banknote },
  { key: 'PIX', icon: QrCode },
  { key: 'Cartão de débito', icon: CreditCard },
  { key: 'Cartão de crédito', icon: Smartphone },
]

function PaymentDialog({ appointment, onConfirm, onClose }) {
  const [method, setMethod] = useState('Dinheiro')

  return (
    <Modal title="Concluir atendimento" kicker="Pagamento" onClose={onClose}>
      <p className="m-0 mb-5 text-[13px] leading-relaxed text-[var(--text-muted)]">
        <strong>{appointment.clientName}</strong> — {appointment.serviceName}
      </p>
      <div className="my-[6px] mb-[22px] text-center font-['Inter'] text-4xl font-semibold text-[var(--text)]">{formatCurrency(appointment.price)}</div>

      <span className="mb-2 block text-[11px] font-semibold text-[var(--text-muted)]">Forma de pagamento</span>
      <div className="mb-5 grid grid-cols-2 gap-[9px]">
        {PAYMENT_METHODS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-xs font-semibold text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)] ${method === key ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)] shadow-[0_0_0_1px_var(--accent)]' : 'border-[var(--border)] bg-[var(--surface-2)]'}`}
            onClick={() => setMethod(key)}
          >
            <Icon size={18} />
            {key}
          </button>
        ))}
      </div>

      <button className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)] hover:brightness-110" onClick={() => onConfirm(method)}>
        Confirmar e lançar no caixa
      </button>
    </Modal>
  )
}

export default PaymentDialog

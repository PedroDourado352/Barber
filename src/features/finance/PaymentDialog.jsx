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
      <p className="confirm-message">
        <strong>{appointment.clientName}</strong> — {appointment.serviceName}
      </p>
      <div className="payment-amount">{formatCurrency(appointment.price)}</div>

      <span className="field-label">Forma de pagamento</span>
      <div className="payment-grid">
        {PAYMENT_METHODS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`payment-option ${method === key ? 'active' : ''}`}
            onClick={() => setMethod(key)}
          >
            <Icon size={18} />
            {key}
          </button>
        ))}
      </div>

      <button className="primary-button full" onClick={() => onConfirm(method)}>
        Confirmar e lançar no caixa
      </button>
    </Modal>
  )
}

export default PaymentDialog

import Modal from './Modal'

function ConfirmDialog({ title, message, confirmLabel = 'Excluir', onConfirm, onClose }) {
  return (
    <Modal title={title} kicker="Confirmação" onClose={onClose}>
      <p className="confirm-message">{message}</p>
      <div className="confirm-actions">
        <button className="ghost-button" onClick={onClose}>
          Cancelar
        </button>
        <button
          className="danger-button"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog

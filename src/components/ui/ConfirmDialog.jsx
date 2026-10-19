import Modal from './Modal'

function ConfirmDialog({ title, message, confirmLabel = 'Excluir', onConfirm, onClose }) {
  return (
    <Modal title={title} kicker="Confirmação" onClose={onClose}>
      <p className="mb-5 text-[13px] leading-relaxed text-[var(--text-muted)]">{message}</p>
      <div className="flex justify-end gap-2.5">
        <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={onClose}>
          Cancelar
        </button>
        <button
          className="rounded-lg bg-[var(--red)] px-4 py-2.5 text-xs font-semibold text-[#140a09] transition hover:brightness-110"
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

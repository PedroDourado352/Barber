import { useEffect } from 'react'
import { X } from 'lucide-react'

function Modal({ title, kicker, children, onClose, size = 'default' }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--overlay)] p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div
        className={`max-h-[min(90vh,760px)] w-full overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-pop)] sm:p-6 ${size === 'wide' ? 'max-w-3xl' : 'max-w-lg'}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {kicker && <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[1px] text-[var(--text-dim)]">{kicker}</p>}
            <h2 className="m-0 font-['Space_Grotesk'] text-xl font-semibold text-[var(--text)]">{title}</h2>
          </div>
          <button className="grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]" aria-label="Fechar" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Modal

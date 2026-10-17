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
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div
        className={`modal ${size === 'wide' ? 'modal-wide' : ''}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            {kicker && <p className="panel-kicker">{kicker}</p>}
            <h2>{title}</h2>
          </div>
          <button className="icon-button" aria-label="Fechar" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Modal

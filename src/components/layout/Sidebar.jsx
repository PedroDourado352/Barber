import { CalendarDays, ChevronDown, Plus, X } from 'lucide-react'

function Sidebar({ activePage, isOpen, navigation, onNavigate, onClose }) {
  return (
    <>
      {isOpen && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><CalendarDays size={19} strokeWidth={2.5} /></div>
          <span className="brand-name">barberly</span>
          <button className="icon-button sidebar-close" aria-label="Fechar menu" onClick={onClose}><X size={19} /></button>
        </div>
        <div className="workspace-switcher">
          <div className="workspace-avatar">BK</div>
          <div className="workspace-copy"><span>Unidade principal</span><strong>Barbearia Kings</strong></div>
          <ChevronDown size={15} />
        </div>
        <div className="sidebar-label">Menu principal</div>
        <nav className="nav-list">
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activePage === label ? 'active' : ''}`} onClick={() => onNavigate(label)}>
              <Icon size={18} /><span>{label}</span>{label === 'Agenda' && <span className="nav-count">8</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card"><span className="upgrade-tag">PLANO PRO</span><strong>Mais tempo para<br />fazer o que importa.</strong><span>Automatize sua agenda e cresça.</span><button>Conhecer recursos <Plus size={14} /></button></div>
          <div className="sidebar-profile"><div className="profile-avatar">PD</div><div><strong>Pedro Duarte</strong><span>Administrador</span></div><ChevronDown size={15} /></div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
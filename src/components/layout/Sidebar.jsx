import { NavLink } from 'react-router-dom'
import { ChevronDown, LogOut, Scissors, X } from 'lucide-react'
import { initialsFrom } from '../../lib/format'

function Sidebar({ isOpen, navigation, user, pendingCount, onNavigate, onLogout, onClose }) {
  return (
    <>
      {isOpen && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark">
            <Scissors size={18} strokeWidth={2.5} />
          </div>
          <span className="brand-name">barberly</span>
          <button className="icon-button sidebar-close" aria-label="Fechar menu" onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">{initialsFrom(user?.business || 'Barbearia')}</div>
          <div className="workspace-copy">
            <span>Unidade principal</span>
            <strong>{user?.business || 'Minha barbearia'}</strong>
          </div>
          <ChevronDown size={15} />
        </div>

        <div className="sidebar-label">Menu principal</div>
        <nav className="nav-list">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onNavigate}
            >
              <Icon size={18} />
              <span>{label}</span>
              {to === '/agenda' && pendingCount > 0 && <span className="nav-count">{pendingCount}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <span className="upgrade-tag">DICA</span>
            <strong>Conclua os atendimentos para alimentar o caixa.</strong>
            <span>Cada atendimento concluído vira uma entrada automática.</span>
          </div>
          <div className="sidebar-profile">
            <div className="profile-avatar">{initialsFrom(user?.name)}</div>
            <div>
              <strong>{user?.name || 'Usuário'}</strong>
              <span>Administrador</span>
            </div>
            <button className="icon-button" aria-label="Sair" onClick={onLogout} title="Sair">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  CalendarDays,
  ChartNoAxesCombined,
  CircleHelp,
  LayoutDashboard,
  Menu,
  Scissors,
  Settings,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import { useStore } from '../lib/store'
import { initialsFrom } from '../lib/format'

export const navigation = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/agendar', label: 'Agendar com IA', icon: Sparkles },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/servicos', label: 'Serviços', icon: Scissors },
  { to: '/caixa', label: 'Caixa', icon: Wallet },
  { to: '/relatorios', label: 'Relatórios', icon: ChartNoAxesCombined },
]

const titles = {
  '/': 'Visão geral',
  '/agendar': 'Agendar com IA',
  '/agenda': 'Agenda',
  '/clientes': 'Clientes',
  '/servicos': 'Serviços',
  '/caixa': 'Caixa',
  '/relatorios': 'Relatórios',
}

function AppLayout() {
  const { currentUser, logout, db } = useStore()
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = titles[location.pathname] || 'Visão geral'

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isSidebarOpen}
        navigation={navigation}
        user={currentUser}
        pendingCount={db.appointments.filter((a) => a.status === 'aguardando').length}
        onNavigate={() => setSidebarOpen(false)}
        onLogout={logout}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="main-content">
        <header className="topbar">
          <button className="icon-button menu-trigger" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>{currentUser?.business || 'Workspace'}</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Ajuda">
              <CircleHelp size={19} />
            </button>
            <button className="icon-button" aria-label="Configurações">
              <Settings size={19} />
            </button>
            <div className="user-avatar" aria-label={`Perfil de ${currentUser?.name}`}>
              {initialsFrom(currentUser?.name)}
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout

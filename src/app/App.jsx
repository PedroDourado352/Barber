import { useState } from 'react'
import {
  CalendarDays,
  ChartNoAxesCombined,
  CircleHelp,
  LayoutDashboard,
  Menu,
  Scissors,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'
import DashboardPage from '../features/dashboard/DashboardPage'
import AgendaPage from '../features/appointments/AgendaPage'
import ClientsPage from '../features/clients/ClientsPage'
import ServicesPage from '../features/services/ServicesPage'
import FinancePage from '../features/finance/FinancePage'
import AuthScreen from '../features/auth/AuthScreen'
import Sidebar from '../components/layout/Sidebar'
import { useStore } from '../lib/store'
import { initialsFrom } from '../lib/format'

const navigation = [
  { key: 'dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { key: 'agenda', label: 'Agenda', icon: CalendarDays },
  { key: 'clients', label: 'Clientes', icon: Users },
  { key: 'services', label: 'Serviços', icon: Scissors },
  { key: 'finance', label: 'Caixa', icon: Wallet },
  { key: 'reports', label: 'Relatórios', icon: ChartNoAxesCombined },
]

const pageTitles = {
  dashboard: 'Visão geral',
  agenda: 'Agenda',
  clients: 'Clientes',
  services: 'Serviços',
  finance: 'Caixa',
  reports: 'Relatórios',
}

function App() {
  const { ready, isAuthenticated, currentUser, logout, db } = useStore()
  const [activePage, setActivePage] = useState('dashboard')
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  if (!ready) return null

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  const renderPage = () => {
    switch (activePage) {
      case 'agenda':
        return <AgendaPage />
      case 'clients':
        return <ClientsPage onGoToAgenda={() => setActivePage('agenda')} />
      case 'services':
        return <ServicesPage />
      case 'finance':
        return <FinancePage />
      case 'reports':
        return <FinancePage initialTab="reports" />
      case 'dashboard':
      default:
        return <DashboardPage onNavigate={setActivePage} />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        isOpen={isSidebarOpen}
        navigation={navigation}
        user={currentUser}
        pendingCount={db.appointments.filter((a) => a.status === 'aguardando').length}
        onNavigate={(page) => {
          setActivePage(page)
          setSidebarOpen(false)
        }}
        onLogout={logout}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button menu-trigger"
            aria-label="Abrir menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>{currentUser?.business || 'Workspace'}</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{pageTitles[activePage]}</strong>
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
        {renderPage()}
      </main>
    </div>
  )
}

export default App

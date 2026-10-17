import { useState } from 'react'
import { CalendarDays, ChartNoAxesCombined, CircleHelp, LayoutDashboard, Menu, Scissors, Settings, Users, X } from 'lucide-react'
import DashboardPage from '../features/dashboard/DashboardPage'
import Sidebar from '../components/layout/Sidebar'

const navigation = [
  { label: 'Visão geral', icon: LayoutDashboard },
  { label: 'Agenda', icon: CalendarDays },
  { label: 'Clientes', icon: Users },
  { label: 'Serviços', icon: Scissors },
  { label: 'Relatórios', icon: ChartNoAxesCombined },
]

function App() {
  const [activePage, setActivePage] = useState('Visão geral')
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        isOpen={isSidebarOpen}
        navigation={navigation}
        onNavigate={(page) => {
          setActivePage(page)
          setSidebarOpen(false)
        }}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="main-content">
        <header className="topbar">
          <button className="icon-button menu-trigger" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>{activePage}</strong></div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Ajuda"><CircleHelp size={19} /></button>
            <button className="icon-button" aria-label="Configurações"><Settings size={19} /></button>
            <div className="user-avatar" aria-label="Perfil de Pedro Duarte">PD</div>
          </div>
        </header>
        <DashboardPage activePage={activePage} />
      </main>
    </div>
  )
}

export default App
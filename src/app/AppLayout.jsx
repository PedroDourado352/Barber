import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  CalendarDays,
  ChartNoAxesCombined,
  CircleHelp,
  LayoutDashboard,
  Menu,
  Moon,
  Scissors,
  Settings,
  Sparkles,
  Sun,
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
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('barberly:theme')
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })
  const location = useLocation()
  const title = titles[location.pathname] || 'Visão geral'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('barberly:theme', theme)
  }, [theme])

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <Sidebar
        isOpen={isSidebarOpen}
        navigation={navigation}
        user={currentUser}
        pendingCount={db.appointments.filter((a) => a.status === 'aguardando').length}
        onNavigate={() => setSidebarOpen(false)}
        onLogout={logout}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-[var(--border-soft)] bg-[var(--topbar-bg)] px-5 backdrop-blur-xl sm:px-8 lg:px-11">
          <button className="hidden h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)] max-md:grid" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-dim)]">
            <span>{currentUser?.business || 'Workspace'}</span>
            <span className="text-[var(--border-strong)]">/</span>
            <strong className="font-semibold text-[var(--text)]">{title}</strong>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              aria-pressed={theme === 'light'}
              title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button className="grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]" aria-label="Ajuda">
              <CircleHelp size={19} />
            </button>
            <button className="grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]" aria-label="Configurações">
              <Settings size={19} />
            </button>
            <div className="ml-2 grid h-8 w-8 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-3)] text-[10px] font-bold text-[var(--text)]" aria-label={`Perfil de ${currentUser?.name}`}>
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

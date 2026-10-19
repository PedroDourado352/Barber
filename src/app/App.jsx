import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './AppLayout'
import DashboardPage from '../features/dashboard/DashboardPage'
import AgendaPage from '../features/appointments/AgendaPage'
import ClientsPage from '../features/clients/ClientsPage'
import ServicesPage from '../features/services/ServicesPage'
import FinancePage from '../features/finance/FinancePage'
import AuthScreen from '../features/auth/AuthScreen'
import { useStore } from '../lib/store'

function App() {
  const { ready, isAuthenticated } = useStore()

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--bg)]">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--text)]" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <AuthScreen />}
        />
        <Route element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/clientes" element={<ClientsPage />} />
          <Route path="/servicos" element={<ServicesPage />} />
          <Route path="/caixa" element={<FinancePage />} />
          <Route path="/relatorios" element={<FinancePage initialTab="reports" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, Clock3, Plus, Scissors, TrendingUp, Users } from 'lucide-react'
import StatCard from './components/StatCard'
import AppointmentsList from '../appointments/AppointmentsList'
import { useStore } from '../../lib/store'
import {
  dashboardStats,
  last7DaysRevenue,
  popularServices,
  rangeSummary,
} from '../../lib/selectors'
import { formatCurrency, formatLongDate, todayISO } from '../../lib/format'

const weekdayShort = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function DashboardPage() {
  const { db, currentUser } = useStore()
  const navigate = useNavigate()

  const today = todayISO()
  const stats = dashboardStats(db, today)
  const chart = last7DaysRevenue(db, today)
  const maxRevenue = Math.max(...chart.map((d) => d.income), 1)
  const weekStart = chart[0]?.iso || today
  const week = rangeSummary(db, weekStart, today)
  const popular = popularServices(db, weekStart, today, 3)
  const firstName = (currentUser?.name || '').split(' ')[0] || 'bem-vindo'

  const statCards = [
    { label: 'Faturamento hoje', value: formatCurrency(stats.revenueToday), note: 'entradas de hoje', icon: TrendingUp, tone: 'green' },
    { label: 'Agendamentos hoje', value: String(stats.appointmentsToday), note: 'horários marcados', icon: CalendarDays, tone: 'orange' },
    { label: 'Novos clientes', value: String(stats.newClientsThisMonth), note: 'este mês', icon: Users, tone: 'blue' },
    { label: 'Ocupação da agenda', value: `${stats.occupancy}%`, note: 'estimada hoje', icon: Clock3, tone: 'purple' },
  ]

  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <p className="eyebrow">{formatLongDate(today)}</p>
          <h1>
            {greeting()}, {firstName} <span className="wave">✦</span>
          </h1>
          <p className="heading-subtitle">Aqui está o que está acontecendo na sua barbearia.</p>
        </div>
        <button className="primary-button" onClick={() => navigate('/agendar')}>
          <Plus size={18} /> Novo agendamento
        </button>
      </section>

      <section className="stats-grid">
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="dashboard-grid">
        <AppointmentsList onSeeAll={() => navigate('/agenda')} />
        <aside className="right-column">
          <section className="panel performance-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">DESEMPENHO</p>
                <h2>Resumo da semana</h2>
              </div>
            </div>
            <div className="performance-value">
              {formatCurrency(week.income)}
              {week.income > 0 && (
                <span>
                  <ArrowUpRight size={15} /> últimos 7 dias
                </span>
              )}
            </div>
            <p className="muted-copy">Faturamento acumulado</p>
            <div className="chart" aria-label="Gráfico de faturamento semanal">
              <div className="chart-line">
                {chart.map((day) => (
                  <i
                    key={day.iso}
                    style={{ height: `${Math.max(6, (day.income / maxRevenue) * 100)}%` }}
                    title={`${formatCurrency(day.income)}`}
                  />
                ))}
              </div>
              <div className="chart-grid">
                {chart.map((day) => (
                  <span key={day.iso}>{weekdayShort[day.weekday]}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="panel services-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">MAIS POPULARES</p>
                <h2>Serviços da semana</h2>
              </div>
              <button className="text-button" onClick={() => navigate('/servicos')}>
                Ver todos
              </button>
            </div>
            {popular.length === 0 ? (
              <p className="muted-copy empty-inline">Sem atendimentos concluídos ainda.</p>
            ) : (
              popular.map((service, index) => (
                <div className="service-item" key={service.name}>
                  <span className={`service-icon ${index === 0 ? 'dark' : 'light'}`}>
                    <Scissors size={17} />
                  </span>
                  <div>
                    <strong>{service.name}</strong>
                    <span>{service.count} agendamento(s)</span>
                  </div>
                  <b>{formatCurrency(service.revenue)}</b>
                </div>
              ))
            )}
          </section>
        </aside>
      </section>

    </div>
  )
}

export default DashboardPage

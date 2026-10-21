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
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-14 pt-9 sm:px-8 lg:px-11">
      <section className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.1px] text-[var(--text-dim)]">{formatLongDate(today)}</p>
          <h1 className="m-0 font-['Inter'] text-[clamp(25px,3vw,32px)] font-semibold leading-tight text-[var(--text)]">
            {greeting()}, {firstName} <span className="wave">✦</span>
          </h1>
          <p className="mt-2 text-[13px] text-[var(--text-muted)]">Aqui está o que está acontecendo na sua barbearia.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)] hover:brightness-110"
          onClick={() => navigate('/agendar')}
        >
          <Plus size={18} /> Novo agendamento
        </button>
      </section>

      <section className="mb-[22px] grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.82fr)]">
        <AppointmentsList onSeeAll={() => navigate('/agenda')} />
        <aside className="grid content-start gap-3">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-[22px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1px] text-[var(--text-dim)]">DESEMPENHO</p>
                <h2 className="m-0 text-[17px] font-semibold text-[var(--text)]">Resumo da semana</h2>
              </div>
            </div>
            <div className="mt-[22px] font-['Inter'] text-[27px] font-semibold text-[var(--text)]">
              {formatCurrency(week.income)}
              {week.income > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-[var(--green)]">
                  <ArrowUpRight size={15} /> últimos 7 dias
                </span>
              )}
            </div>
            <p className="my-1 mb-5 text-[10px] text-[var(--text-dim)]">Faturamento acumulado</p>
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

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-[22px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1px] text-[var(--text-dim)]">MAIS POPULARES</p>
                <h2 className="m-0 text-[17px] font-semibold text-[var(--text)]">Serviços da semana</h2>
              </div>
              <button className="bg-transparent text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]" onClick={() => navigate('/servicos')}>
                Ver todos
              </button>
            </div>
            {popular.length === 0 ? (
              <p className="m-0 py-7 text-center text-xs text-[var(--text-dim)]">Sem atendimentos concluídos ainda.</p>
            ) : (
              popular.map((service, index) => (
                <div className="flex items-center gap-3 border-t border-[var(--border-soft)] py-3.5" key={service.name}>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[9px] ${index === 0 ? 'bg-[var(--accent)] text-[var(--accent-ink)]' : 'bg-[var(--surface-3)] text-[var(--text-muted)]'}`}>
                    <Scissors size={17} />
                  </span>
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <strong className="text-[12px] text-[var(--text)]">{service.name}</strong>
                    <span className="text-[10px] text-[var(--text-dim)]">{service.count} agendamento(s)</span>
                  </div>
                  <b className="text-xs text-[var(--text)]">{formatCurrency(service.revenue)}</b>
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

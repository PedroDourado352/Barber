import { ArrowUpRight, CalendarDays, ChevronDown, Clock3, MoreHorizontal, Plus, Scissors, TrendingUp, Users } from 'lucide-react'
import { useState } from 'react'
import StatCard from './components/StatCard'
import AppointmentsList from '../appointments/AppointmentsList'

const stats = [
  { label: 'Faturamento hoje', value: 'R$ 1.840', change: '+18,4%', note: 'vs. semana passada', icon: TrendingUp, tone: 'green' },
  { label: 'Agendamentos', value: '24', change: '+6', note: 'vs. ontem', icon: CalendarDays, tone: 'orange' },
  { label: 'Novos clientes', value: '08', change: '+33%', note: 'este mês', icon: Users, tone: 'blue' },
  { label: 'Ocupação da agenda', value: '82%', change: 'Ótimo', note: 'média da semana', icon: Clock3, tone: 'purple' },
]

function DashboardPage({ activePage }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="page-content">
      <section className="page-heading">
        <div><p className="eyebrow">Sábado, 17 de outubro de 2026</p><h1>{activePage === 'Visão geral' ? <>Bom dia, Pedro <span className="wave">✦</span></> : activePage}</h1><p className="heading-subtitle">Aqui está o que está acontecendo na sua barbearia.</p></div>
        <button className="primary-button" onClick={() => setShowModal(true)}><Plus size={18} /> Novo agendamento</button>
      </section>
      <section className="stats-grid">{stats.map((stat) => <StatCard key={stat.label} {...stat} />)}</section>
      <section className="dashboard-grid">
        <AppointmentsList />
        <aside className="right-column">
          <section className="panel performance-panel"><div className="panel-heading"><div><p className="panel-kicker">DESEMPENHO</p><h2>Resumo da semana</h2></div><button className="icon-button"><MoreHorizontal size={19} /></button></div><div className="performance-value">R$ 8.420 <span><ArrowUpRight size={15} /> 12,6%</span></div><p className="muted-copy">Faturamento acumulado</p><div className="chart" aria-label="Gráfico de faturamento semanal"><div className="chart-line"><i /><i /><i /><i /><i /><i /><i /></div><div className="chart-grid"><span>seg</span><span>ter</span><span>qua</span><span>qui</span><span>sex</span><span>sáb</span><span>dom</span></div></div></section>
          <section className="panel services-panel"><div className="panel-heading"><div><p className="panel-kicker">MAIS POPULARES</p><h2>Serviços do mês</h2></div><button className="text-button">Ver todos</button></div><div className="service-item"><span className="service-icon dark"><Scissors size={17} /></span><div><strong>Corte + Barba</strong><span>42 agendamentos</span></div><b>R$ 2.940</b></div><div className="service-item"><span className="service-icon light"><Scissors size={17} /></span><div><strong>Corte tradicional</strong><span>31 agendamentos</span></div><b>R$ 1.860</b></div></section>
        </aside>
      </section>
      {showModal && <div className="modal-layer" role="dialog" aria-modal="true"><div className="modal"><div className="modal-heading"><div><p className="panel-kicker">AGENDA</p><h2>Novo agendamento</h2></div><button className="icon-button" onClick={() => setShowModal(false)}>×</button></div><label>Nome do cliente<input placeholder="Ex.: Lucas Almeida" autoFocus /></label><label>Serviço<select defaultValue="Corte + Barba"><option>Corte + Barba</option><option>Corte tradicional</option><option>Barba</option></select></label><div className="form-row"><label>Data<input type="date" defaultValue="2026-10-17" /></label><label>Horário<input type="time" defaultValue="10:30" /></label></div><button className="primary-button full" onClick={() => setShowModal(false)}>Adicionar à agenda</button></div></div>}
    </div>
  )
}

export default DashboardPage
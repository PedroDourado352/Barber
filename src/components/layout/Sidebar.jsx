import { NavLink } from 'react-router-dom'
import { ChevronDown, LogOut, Scissors, X } from 'lucide-react'
import { initialsFrom } from '../../lib/format'

function Sidebar({ isOpen, navigation, user, pendingCount, onNavigate, onLogout, onClose }) {
  return (
    <>
      {isOpen && <button className="fixed inset-0 z-20 bg-black/50 md:hidden" aria-label="Fechar menu" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 shrink-0 flex-col border-r border-[var(--border-soft)] bg-[var(--bg-soft)] p-4 transition-transform md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2.5 px-2.5 pb-6 pt-1">
          <div className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-[var(--accent)] text-[var(--accent-ink)] shadow-lg">
            <Scissors size={18} strokeWidth={2.5} />
          </div>
          <span className="font-['Space_Grotesk'] text-lg font-semibold text-[var(--text)]">barberly</span>
          <button className="ml-auto grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-muted)] hover:bg-[var(--hover)] md:hidden" aria-label="Fechar menu" onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        <div className="mb-6 flex items-center gap-2.5 rounded-[11px] border border-[var(--border)] bg-[var(--surface)] p-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-3)] text-[10px] font-bold text-[var(--text)]">{initialsFrom(user?.business || 'Barbearia')}</div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[10px] text-[var(--text-dim)]">Unidade principal</span>
            <strong className="truncate text-xs text-[var(--text)]">{user?.business || 'Minha barbearia'}</strong>
          </div>
          <ChevronDown size={15} />
        </div>

        <div className="px-3 pb-2.5 text-[10px] font-semibold uppercase tracking-[1px] text-[var(--text-dim)]">Menu principal</div>
        <nav className="grid gap-1">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition ${isActive ? 'bg-[var(--surface-2)] text-[var(--text)]' : 'text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]'}`}
              onClick={onNavigate}
            >
              <Icon size={18} />
              <span>{label}</span>
              {to === '/agenda' && pendingCount > 0 && <span className="ml-auto rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-ink)]">{pendingCount}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="mx-1 mb-4 grid gap-1.5 rounded-[11px] border border-[var(--border)] bg-[var(--surface)] p-3.5">
            <span className="text-[9px] font-bold uppercase tracking-[1.2px] text-[var(--text-dim)]">DICA</span>
            <strong className="font-['Space_Grotesk'] text-[13px] font-semibold leading-tight text-[var(--text)]">Conclua os atendimentos para alimentar o caixa.</strong>
            <span className="text-[10.5px] leading-relaxed text-[var(--text-dim)]">Cada atendimento concluído vira uma entrada automática.</span>
          </div>
          <div className="flex items-center gap-2.5 border-t border-[var(--border-soft)] px-1.5 pb-0 pt-4">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-3)] text-[10px] font-bold text-[var(--text)]">{initialsFrom(user?.name)}</div>
            <div>
              <strong className="text-xs text-[var(--text)]">{user?.name || 'Usuário'}</strong>
              <span className="text-[10px] text-[var(--text-dim)]">Administrador</span>
            </div>
            <button className="ml-auto grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" aria-label="Sair" onClick={onLogout} title="Sair">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

import { Compass, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] p-5">
      <div className="grid w-full max-w-[460px] justify-items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-pop)]">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-dim)]"><Compass size={25} /></span>
        <span className="text-[10px] font-semibold uppercase tracking-[1px] text-[var(--text-dim)]">ERRO 404</span>
        <h1 className="m-0 font-['Space_Grotesk'] text-2xl font-semibold text-[var(--text)]">Esta página não existe</h1>
        <p className="m-0 max-w-[330px] text-[13px] leading-relaxed text-[var(--text-muted)]">O endereço acessado não corresponde a nenhuma área do Barberly.</p>
        <button className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)] hover:brightness-110" onClick={() => navigate('/')}>
          <Home size={17} /> Voltar para o início
        </button>
      </div>
    </main>
  )
}

export default NotFoundPage
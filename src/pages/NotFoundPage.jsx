import { Compass, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-icon"><Compass size={25} /></span>
        <span className="auth-kicker">ERRO 404</span>
        <h1>Esta página não existe</h1>
        <p>O endereço acessado não corresponde a nenhuma área do Barberly.</p>
        <button className="primary-button" onClick={() => navigate('/')}>
          <Home size={17} /> Voltar para o início
        </button>
      </div>
    </main>
  )
}

export default NotFoundPage
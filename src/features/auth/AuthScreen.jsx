import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, Scissors, User } from 'lucide-react'
import { useStore } from '../../lib/store'

const modes = { login: 'login', register: 'register', forgot: 'forgot' }

function Field({ id, label, icon: Icon, type = 'text', value, onChange, placeholder, required = true, suffix }) {
  return (
    <label className="auth-field" htmlFor={id}>
      <span>{label}</span>
      <div className="auth-input-wrap">
        <Icon size={17} />
        <input id={id} name={id} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} />
        {suffix}
      </div>
    </label>
  )
}

function PasswordField({ id, label, value, onChange, visible, onToggle, placeholder }) {
  return (
    <Field
      id={id}
      label={label}
      icon={LockKeyhole}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      suffix={
        <button type="button" className="password-toggle" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={onToggle}>
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      }
    />
  )
}

function AuthScreen() {
  const { login, register } = useStore()
  const [mode, setMode] = useState(modes.login)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    business: '',
    email: '',
    phone: '',
    password: '',
    confirmation: '',
    terms: false,
    remember: true,
  })

  const updateField = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setInfo('')
  }

  const submitForm = async (event) => {
    event.preventDefault()
    setError('')
    setInfo('')

    if (mode === modes.forgot) {
      setInfo('Se o e-mail existir, enviaremos as instruções de recuperação.')
      setMode(modes.login)
      return
    }

    if (mode === modes.register) {
      if (form.password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.')
      if (form.password !== form.confirmation) return setError('As senhas não conferem.')
      if (!form.terms) return setError('É preciso aceitar os termos de uso.')
    }

    setLoading(true)
    const result = mode === modes.register ? await register(form) : await login({ email: form.email, password: form.password })
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }
    if (result.needsConfirmation) {
      setInfo('Conta criada! Confirme pelo link enviado ao seu e-mail e depois faça login.')
      setMode(modes.login)
    }
  }

  const title =
    mode === modes.login
      ? 'Bem-vindo de volta'
      : mode === modes.register
      ? 'Comece a cuidar do seu negócio'
      : 'Recupere seu acesso'
  const description =
    mode === modes.login
      ? 'Acesse sua conta para acompanhar sua agenda.'
      : mode === modes.register
      ? 'Crie sua conta e organize sua barbearia em poucos minutos.'
      : 'Enviaremos um link para você criar uma nova senha.'

  const submitLabel = loading
    ? 'Aguarde...'
    : mode === modes.login
    ? 'Entrar na minha conta'
    : mode === modes.register
    ? 'Criar minha conta'
    : 'Enviar link de recuperação'

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-form-container">
          <div className="auth-mobile-brand">
            <span className="auth-brand-mark">
              <Scissors size={18} />
            </span>
            <strong>barberly</strong>
          </div>

          {mode !== modes.forgot && (
            <div className="auth-tabs">
              <button className={mode === modes.login ? 'active' : ''} onClick={() => switchMode(modes.login)}>
                Entrar
              </button>
              <button className={mode === modes.register ? 'active' : ''} onClick={() => switchMode(modes.register)}>
                Criar conta
              </button>
            </div>
          )}

          <div className="auth-heading">
            <span className="auth-kicker">
              {mode === modes.register ? 'NOVO POR AQUI?' : mode === modes.forgot ? 'ACESSO À CONTA' : 'BEM-VINDO'}
            </span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          {error && <div className="auth-alert error">{error}</div>}
          {info && <div className="auth-alert info">{info}</div>}

          <form className="auth-form" onSubmit={submitForm}>
            {mode === modes.register && (
              <>
                <Field id="name" label="Seu nome completo" icon={User} value={form.name} onChange={updateField} placeholder="Ex.: Pedro Duarte" />
                <Field id="business" label="Nome da barbearia" icon={Scissors} value={form.business} onChange={updateField} placeholder="Ex.: Barbearia Kings" />
                <Field id="phone" label="Telefone" icon={Phone} type="tel" value={form.phone} onChange={updateField} placeholder="(11) 99999-9999" required={false} />
              </>
            )}
            <Field id="email" label="E-mail profissional" icon={Mail} type="email" value={form.email} onChange={updateField} placeholder="voce@barbearia.com" />
            {mode !== modes.forgot && (
              <PasswordField id="password" label="Senha" value={form.password} onChange={updateField} visible={showPassword} onToggle={() => setShowPassword((c) => !c)} placeholder="Mínimo de 8 caracteres" />
            )}
            {mode === modes.register && (
              <PasswordField id="confirmation" label="Confirme sua senha" value={form.confirmation} onChange={updateField} visible={showConfirmation} onToggle={() => setShowConfirmation((c) => !c)} placeholder="Digite a senha novamente" />
            )}

            {mode === modes.login && (
              <div className="auth-options">
                <label className="check-label">
                  <input name="remember" type="checkbox" checked={form.remember} onChange={updateField} />
                  <span>Lembrar de mim</span>
                </label>
                <button type="button" className="auth-link" onClick={() => switchMode(modes.forgot)}>
                  Esqueci minha senha
                </button>
              </div>
            )}

            {mode === modes.register && (
              <label className="check-label terms">
                <input name="terms" type="checkbox" checked={form.terms} onChange={updateField} />
                <span>
                  Eu concordo com os <button type="button" className="auth-link">termos de uso</button> e a política de privacidade.
                </span>
              </label>
            )}

            <button className="auth-submit" type="submit" disabled={loading}>
              {submitLabel}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          {mode === modes.forgot ? (
            <p className="auth-switch">
              <button className="auth-link" onClick={() => switchMode(modes.login)}>
                Voltar para o login
              </button>
            </p>
          ) : (
            <p className="auth-switch">
              {mode === modes.login ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}{' '}
              <button className="auth-link" onClick={() => switchMode(mode === modes.login ? modes.register : modes.login)}>
                {mode === modes.login ? 'Criar agora' : 'Entrar'}
              </button>
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

export default AuthScreen

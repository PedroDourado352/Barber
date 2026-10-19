import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Moon, Phone, Scissors, Sun, User } from 'lucide-react'
import { useStore } from '../../lib/store'

const modes = { login: 'login', register: 'register', forgot: 'forgot' }

function Field({ id, label, icon: Icon, type = 'text', value, onChange, placeholder, required = true, suffix }) {
  return (
    <label className="grid gap-1.5 text-[11px] font-semibold text-[var(--text-muted)]" htmlFor={id}>
      <span>{label}</span>
      <div className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-[var(--text-dim)] transition focus-within:border-[var(--border-strong)] focus-within:ring-2 focus-within:ring-[var(--ring)]">
        <Icon size={17} />
        <input className="min-w-0 flex-1 border-0 bg-transparent text-[13px] font-normal text-[var(--text)] outline-none placeholder:text-[var(--text-dim)]" id={id} name={id} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} />
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
        <button type="button" className="text-[var(--text-dim)] hover:text-[var(--text)]" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={onToggle}>
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
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark')
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('barberly:theme', theme)
  }, [theme])

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
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--bg)] p-5">
      <button
        className="absolute right-5 top-5 grid h-[34px] w-[34px] place-items-center rounded-[9px] text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
        aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
        aria-pressed={theme === 'light'}
        title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
        onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      >
        {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
      </button>
      <section className="w-full max-w-[460px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-pop)] sm:p-10">
        <div className="w-full">
          <div className="mb-8 flex items-center gap-2.5 md:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[var(--accent-ink)]">
              <Scissors size={18} />
            </span>
            <strong className="font-['Space_Grotesk'] text-lg text-[var(--text)]">barberly</strong>
          </div>

          {mode !== modes.forgot && (
            <div className="mb-7 flex gap-6 border-b border-[var(--border-soft)]">
              <button className={`border-b-2 pb-3 text-xs font-semibold ${mode === modes.login ? 'border-[var(--accent)] text-[var(--text)]' : 'border-transparent text-[var(--text-muted)]'}`} onClick={() => switchMode(modes.login)}>
                Entrar
              </button>
              <button className={`border-b-2 pb-3 text-xs font-semibold ${mode === modes.register ? 'border-[var(--accent)] text-[var(--text)]' : 'border-transparent text-[var(--text-muted)]'}`} onClick={() => switchMode(modes.register)}>
                Criar conta
              </button>
            </div>
          )}

          <div className="mb-6">
            <span className="text-[10px] font-semibold uppercase tracking-[1px] text-[var(--text-dim)]">
              {mode === modes.register ? 'NOVO POR AQUI?' : mode === modes.forgot ? 'ACESSO À CONTA' : 'BEM-VINDO'}
            </span>
            <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-[var(--text)]">{title}</h2>
            <p className="mt-2 text-[13px] text-[var(--text-muted)]">{description}</p>
          </div>

          {error && <div className="mb-4 rounded-lg border border-[var(--red)]/30 bg-[var(--red-bg)] px-3 py-2.5 text-xs text-[var(--red)]">{error}</div>}
          {info && <div className="mb-4 rounded-lg border border-[var(--blue)]/30 bg-[var(--blue-bg)] px-3 py-2.5 text-xs text-[var(--blue)]">{info}</div>}

          <form className="grid gap-4" onSubmit={submitForm}>
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
              <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                <label className="flex items-center gap-2">
                  <input name="remember" type="checkbox" checked={form.remember} onChange={updateField} />
                  <span>Lembrar de mim</span>
                </label>
                <button type="button" className="text-xs font-semibold text-[var(--text)] underline-offset-2 hover:underline" onClick={() => switchMode(modes.forgot)}>
                  Esqueci minha senha
                </button>
              </div>
            )}

            {mode === modes.register && (
              <label className="flex items-start gap-2 text-xs leading-relaxed text-[var(--text-muted)]">
                <input name="terms" type="checkbox" checked={form.terms} onChange={updateField} />
                <span>
                  Eu concordo com os <button type="button" className="font-semibold text-[var(--text)] underline-offset-2 hover:underline">termos de uso</button> e a política de privacidade.
                </span>
              </label>
            )}

            <button className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 text-xs font-semibold text-[var(--accent-ink)] shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading}>
              {submitLabel}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          {mode === modes.forgot ? (
            <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
              <button className="font-semibold text-[var(--text)] underline-offset-2 hover:underline" onClick={() => switchMode(modes.login)}>
                Voltar para o login
              </button>
            </p>
          ) : (
            <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
              {mode === modes.login ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}{' '}
              <button className="font-semibold text-[var(--text)] underline-offset-2 hover:underline" onClick={() => switchMode(mode === modes.login ? modes.register : modes.login)}>
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

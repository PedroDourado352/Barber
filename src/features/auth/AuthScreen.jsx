import { useState } from 'react'
import { ArrowRight, CalendarDays, Check, Eye, EyeOff, LockKeyhole, Mail, Phone, Scissors, ShieldCheck, User, Users } from 'lucide-react'

const modes = { login: 'login', register: 'register', forgot: 'forgot' }

function Field({ id, label, icon: Icon, type = 'text', value, onChange, placeholder, required = true, suffix }) {
  return <label className="auth-field" htmlFor={id}><span>{label}</span><div className="auth-input-wrap"><Icon size={17} /><input id={id} name={id} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} />{suffix}</div></label>
}

function PasswordField({ id, label, value, onChange, visible, onToggle, placeholder }) {
  return <Field id={id} label={label} icon={LockKeyhole} type={visible ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} suffix={<button type="button" className="password-toggle" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={onToggle}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>} />
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState(modes.login)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [form, setForm] = useState({ name: '', business: '', email: '', phone: '', password: '', confirmation: '', terms: false, remember: false })

  const updateField = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const submitForm = (event) => {
    event.preventDefault()
    if (mode === modes.forgot) {
      setMode(modes.login)
      return
    }
    onAuthenticated()
  }

  const title = mode === modes.login ? 'Bem-vindo de volta' : mode === modes.register ? 'Comece a cuidar do seu negócio' : 'Recupere seu acesso'
  const description = mode === modes.login ? 'Acesse sua conta para acompanhar sua agenda.' : mode === modes.register ? 'Crie sua conta e organize sua barbearia em poucos minutos.' : 'Enviaremos um link para você criar uma nova senha.'

  return <main className="auth-page">
    <section className="auth-showcase">
      <div className="auth-brand"><span className="auth-brand-mark"><CalendarDays size={20} /></span><strong>barberly</strong></div>
      <div className="showcase-content"><p className="eyebrow">GESTÃO FEITA PARA BARBEIROS</p><h1>Mais tempo<br />para fazer<br /><em>o que importa.</em></h1><p>Uma agenda tranquila, clientes fiéis e uma barbearia crescendo no ritmo certo.</p><div className="showcase-note"><span className="quote-mark">“</span><div><strong>O dia rende muito mais</strong><span>quando a agenda trabalha por você.</span></div><div className="mini-avatars"><i>RM</i><i>LA</i><i>GN</i><b>+2k</b></div></div></div>
      <div className="showcase-footer"><span><ShieldCheck size={15} /> Seus dados estão protegidos</span><span>© 2026 Barberly</span></div>
    </section>
    <section className="auth-panel"><div className="auth-form-container">
      <div className="auth-mobile-brand"><span className="auth-brand-mark"><CalendarDays size={18} /></span><strong>barberly</strong></div>
      {mode !== modes.forgot && <div className="auth-tabs"><button className={mode === modes.login ? 'active' : ''} onClick={() => setMode(modes.login)}>Entrar</button><button className={mode === modes.register ? 'active' : ''} onClick={() => setMode(modes.register)}>Criar conta</button></div>}
      <div className="auth-heading"><span className="auth-kicker">{mode === modes.register ? 'NOVO POR AQUI?' : mode === modes.forgot ? 'ACESSO À CONTA' : 'BEM-VINDO'}</span><h2>{title}</h2><p>{description}</p></div>
      <form className="auth-form" onSubmit={submitForm}>
        {mode === modes.register && <><Field id="name" label="Seu nome completo" icon={User} value={form.name} onChange={updateField} placeholder="Ex.: Pedro Duarte" /><Field id="business" label="Nome da barbearia" icon={Scissors} value={form.business} onChange={updateField} placeholder="Ex.: Barbearia Kings" /><Field id="phone" label="Telefone" icon={Phone} type="tel" value={form.phone} onChange={updateField} placeholder="(11) 99999-9999" /></>}
        <Field id="email" label="E-mail profissional" icon={Mail} type="email" value={form.email} onChange={updateField} placeholder="voce@barbearia.com" />
        {mode !== modes.forgot && <PasswordField id="password" label="Senha" value={form.password} onChange={updateField} visible={showPassword} onToggle={() => setShowPassword((current) => !current)} placeholder="Mínimo de 8 caracteres" />}
        {mode === modes.register && <PasswordField id="confirmation" label="Confirme sua senha" value={form.confirmation} onChange={updateField} visible={showConfirmation} onToggle={() => setShowConfirmation((current) => !current)} placeholder="Digite a senha novamente" />}
        {mode === modes.login && <div className="auth-options"><label className="check-label"><input name="remember" type="checkbox" checked={form.remember} onChange={updateField} /><span>Lembrar de mim</span></label><button type="button" className="auth-link" onClick={() => setMode(modes.forgot)}>Esqueci minha senha</button></div>}
        {mode === modes.register && <label className="check-label terms"><input name="terms" type="checkbox" checked={form.terms} onChange={updateField} required /><span>Eu concordo com os <button type="button" className="auth-link">termos de uso</button> e a política de privacidade.</span></label>}
        <button className="auth-submit" type="submit">{mode === modes.login ? 'Entrar na minha conta' : mode === modes.register ? 'Criar minha conta' : 'Enviar link de recuperação'} <ArrowRight size={17} /></button>
      </form>
      {mode === modes.forgot ? <p className="auth-switch"><button className="auth-link" onClick={() => setMode(modes.login)}>Voltar para o login</button></p> : <p className="auth-switch">{mode === modes.login ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'} <button className="auth-link" onClick={() => setMode(mode === modes.login ? modes.register : modes.login)}>{mode === modes.login ? 'Criar agora' : 'Entrar'}</button></p>}
      {mode !== modes.forgot && <div className="auth-divider"><span>ou continue com</span></div>}
      {mode !== modes.forgot && <button className="google-button" type="button"><span className="google-icon">G</span> Continuar com Google</button>}
      <div className="auth-trust"><Users size={15} /><span>Junte-se a mais de 2.000 barbearias</span></div>
    </div></section>
  </main>
}

export default AuthScreen
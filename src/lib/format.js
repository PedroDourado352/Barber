// Utilitários de formatação (moeda, datas, horas) em pt-BR.

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(value) {
  const number = Number(value) || 0
  return currencyFormatter.format(number)
}

// Converte "1.234,56", "1234.56" ou "R$ 80" em número.
export function parseCurrency(input) {
  if (typeof input === 'number') return input
  if (!input) return 0
  const cleaned = String(input)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.')
  const value = Number.parseFloat(cleaned)
  return Number.isFinite(value) ? value : 0
}

export function todayISO() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60000)
  return local.toISOString().slice(0, 10)
}

// "2026-10-17" -> "17 out 2026"
export function formatDate(iso) {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

// "2026-10-17" -> "Sábado, 17 de outubro de 2026"
export function formatLongDate(iso) {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const text = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatWeekday(iso) {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date)
}

export function initialsFrom(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Duração em minutos -> "1h 30min" / "45min"
export function formatDuration(minutes) {
  const total = Number(minutes) || 0
  const hours = Math.floor(total / 60)
  const mins = total % 60
  if (hours && mins) return `${hours}h ${mins}min`
  if (hours) return `${hours}h`
  return `${mins}min`
}

// Sábado -> índice para agrupar; devolve o nome do mês para relatórios.
export function monthKey(iso) {
  return iso ? iso.slice(0, 7) : ''
}

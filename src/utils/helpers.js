// Formatação de datas
export function formatDate(date) {
  if (!date) return '—'

  const d = new Date(date)
  if (isNaN(d.getTime())) return date

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date) {
  if (!date) return '—'

  const d = new Date(date)
  if (isNaN(d.getTime())) return date

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// Cálculo de status
export function getStatus(obra) {
  if (obra.progresso === 100) return 'Finalizada'

  const hoje = new Date()
  const prazoDate = new Date(obra.prazo_final)
  const diasRestantes = Math.ceil((prazoDate - hoje) / (1000 * 60 * 60 * 24))

  if (diasRestantes <= 0) return 'Atrasada'
  if (diasRestantes <= 7 || obra.progresso < 50) return 'Atenção'

  return 'No prazo'
}

export function getStatusColor(status) {
  const colors = {
    'No prazo': 'bg-green-500/15 text-emerald-300',
    Atenção: 'bg-yellow-500/15 text-yellow-300',
    Atrasada: 'bg-red-500/15 text-red-300',
    Finalizada: 'bg-slate-500/15 text-slate-200',
  }
  return colors[status] || colors['No prazo']
}

// Cálculo de dias restantes
export function diasRestantes(dataFinal) {
  const hoje = new Date()
  const final = new Date(dataFinal)
  const diff = Math.ceil((final - hoje) / (1000 * 60 * 60 * 24))
  return diff
}

// Formatação de moeda
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

// Formatação de percentual
export function formatPercent(value) {
  return `${Math.round(value || 0)}%`
}

// Validação de email
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Truncar texto
export function truncate(text, length = 100) {
  if (!text) return ''
  return text.length > length ? `${text.substring(0, length)}...` : text
}

// Gerar UUID (mock)
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Comparação de datas
export function isDateInPast(date) {
  return new Date(date) < new Date()
}

export function isDateToday(date) {
  const d = new Date(date)
  const today = new Date()
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}

// Sorting
export function sortByDate(items, dateField, ascending = false) {
  return [...items].sort((a, b) => {
    const dateA = new Date(a[dateField])
    const dateB = new Date(b[dateField])
    return ascending ? dateA - dateB : dateB - dateA
  })
}

export function sortByField(items, field, ascending = true) {
  return [...items].sort((a, b) => {
    if (a[field] < b[field]) return ascending ? -1 : 1
    if (a[field] > b[field]) return ascending ? 1 : -1
    return 0
  })
}

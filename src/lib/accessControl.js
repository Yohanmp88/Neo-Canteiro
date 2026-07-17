const ALL_ACCESS = '*'

const ROLE_RULES = {
  administrador: {
    view: ALL_ACCESS,
    edit: ALL_ACCESS,
  },
  engenheiro: {
    view: [
      'dashboard', 'timeline', 'clientes', 'cronograma', 'ia', 'diario', 'fotos',
      'equipe', 'materiais', 'compras', 'fornecedores', 'financeiro', 'orcamento',
      'composicoes', 'abc', 'medicoes', 'documentos', 'templates',
    ],
    edit: [
      'cronograma', 'clientes', 'diario', 'fotos', 'equipe', 'materiais', 'compras',
      'fornecedores', 'financeiro', 'orcamento', 'composicoes', 'abc', 'medicoes',
      'documentos', 'templates',
    ],
  },
  estagiario: {
    view: [
      'dashboard', 'timeline', 'cronograma', 'ia', 'diario', 'fotos', 'equipe',
      'materiais', 'compras', 'fornecedores', 'medicoes', 'documentos',
    ],
    edit: ['cronograma', 'diario', 'fotos', 'equipe', 'materiais', 'compras'],
  },
  compras: {
    view: ['dashboard', 'timeline', 'cronograma', 'ia', 'materiais', 'compras', 'fornecedores', 'documentos'],
    edit: ['materiais', 'compras', 'fornecedores'],
  },
  financeiro: {
    view: ['dashboard', 'timeline', 'cronograma', 'ia', 'financeiro', 'orcamento', 'composicoes', 'abc', 'medicoes', 'documentos'],
    edit: ['financeiro', 'orcamento', 'composicoes', 'abc', 'medicoes'],
  },
  cliente: {
    view: ['dashboard', 'timeline', 'cronograma', 'ia', 'diario', 'fotos', 'medicoes', 'documentos'],
    edit: [],
  },
  investidor: {
    view: ['dashboard', 'timeline', 'cronograma', 'ia', 'diario', 'fotos', 'financeiro', 'orcamento', 'abc', 'medicoes', 'documentos'],
    edit: [],
  },
}

const ROLE_LABELS = {
  administrador: 'Administrador',
  engenheiro: 'Engenheiro',
  estagiario: 'Estagiário',
  compras: 'Compras',
  financeiro: 'Financeiro',
  cliente: 'Cliente',
  investidor: 'Investidor',
}

export function normalizeRole(value) {
  const role = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

  if (role === 'admin') return 'administrador'
  return ROLE_RULES[role] ? role : 'investidor'
}

export function getRoleLabel(value) {
  return ROLE_LABELS[normalizeRole(value)] || 'Membro'
}

function hasPermission(rule, moduleKey) {
  if (rule === ALL_ACCESS) return true
  return Array.isArray(rule) && rule.includes(moduleKey)
}

export function canViewModule(role, moduleKey) {
  return hasPermission(ROLE_RULES[normalizeRole(role)]?.view, moduleKey)
}

export function canEditModule(role, moduleKey) {
  return hasPermission(ROLE_RULES[normalizeRole(role)]?.edit, moduleKey)
}

export function getAllowedModules(role) {
  const normalized = normalizeRole(role)
  const view = ROLE_RULES[normalized]?.view
  return view === ALL_ACCESS ? ALL_ACCESS : [...(view || [])]
}

export function firstAllowedModule(role, preferred = 'dashboard') {
  if (canViewModule(role, preferred)) return preferred
  const allowed = getAllowedModules(role)
  return allowed === ALL_ACCESS ? preferred : allowed[0] || 'dashboard'
}

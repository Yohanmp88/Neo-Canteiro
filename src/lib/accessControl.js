const ALL_ACCESS = '*'
const DEMO_STORAGE_KEY = 'neocanteiro_demo_session'

const ALL_MODULES_EXCEPT_USERS = [
  'dashboard', 'clientes', 'cronograma', 'ia', 'diario', 'fotos', 'planilhas',
  'equipe', 'materiais', 'compras', 'fornecedores', 'financeiro', 'orcamento',
  'composicoes', 'abc', 'medicoes', 'projetos', 'documentos', 'templates', 'obras',
]

const OPERATIONAL_MODULES = [
  'dashboard', 'cronograma', 'diario', 'fotos', 'equipe', 'materiais', 'compras', 'projetos',
]

const PURCHASES_FINANCE_MODULES = [
  'dashboard', 'materiais', 'compras', 'fornecedores', 'documentos', 'planilhas', 'financeiro',
  'orcamento', 'composicoes', 'abc', 'medicoes',
]

const CLIENT_MODULES = [
  'dashboard', 'cronograma', 'ia', 'diario', 'fotos', 'medicoes', 'projetos', 'documentos', 'planilhas',
  'financeiro', 'orcamento', 'abc',
]

const ROLE_RULES = {
  administrador: {
    view: ALL_ACCESS,
    edit: ALL_ACCESS,
  },
  engenheiro: {
    view: ALL_MODULES_EXCEPT_USERS,
    edit: ALL_MODULES_EXCEPT_USERS,
  },
  estagiario: {
    view: OPERATIONAL_MODULES,
    edit: OPERATIONAL_MODULES.filter((moduleKey) => moduleKey !== 'dashboard'),
  },
  compras: {
    view: PURCHASES_FINANCE_MODULES,
    edit: PURCHASES_FINANCE_MODULES.filter((moduleKey) => moduleKey !== 'dashboard'),
  },
  financeiro: {
    view: PURCHASES_FINANCE_MODULES,
    edit: PURCHASES_FINANCE_MODULES.filter((moduleKey) => moduleKey !== 'dashboard'),
  },
  cliente: {
    view: CLIENT_MODULES,
    edit: [],
  },
  investidor: {
    view: ALL_MODULES_EXCEPT_USERS,
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

function isEditableInvestorDemoSession() {
  if (typeof window === 'undefined') return false

  try {
    const value = window.localStorage.getItem(DEMO_STORAGE_KEY)
    if (!value) return false
    if (value === 'true') return true

    const session = JSON.parse(value)
    return session?.accountId === 'demo-investidor'
  } catch {
    return false
  }
}

export function canViewModule(role, moduleKey) {
  return hasPermission(ROLE_RULES[normalizeRole(role)]?.view, moduleKey)
}

export function canEditModule(role, moduleKey) {
  const normalized = normalizeRole(role)

  if (normalized === 'investidor' && moduleKey === 'obras') {
    return isEditableInvestorDemoSession()
  }

  return hasPermission(ROLE_RULES[normalized]?.edit, moduleKey)
}

export function canEditModuleForSession(role, moduleKey, { isDemo = false } = {}) {
  const normalized = normalizeRole(role)

  if (normalized === 'investidor' && moduleKey === 'obras') {
    return isDemo
  }

  return hasPermission(ROLE_RULES[normalized]?.edit, moduleKey)
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

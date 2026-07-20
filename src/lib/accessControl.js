const ALL_ACCESS = '*'
const DEMO_STORAGE_KEY = 'neocanteiro_demo_session'
const CUSTOM_PERMISSIONS_STORAGE_KEY = 'neocanteiro_custom_permissions_v1'

export const ACCESS_MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'timeline', label: 'Linha do Tempo' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'cronograma', label: 'Cronograma' },
  { id: 'ia', label: 'IA da Obra' },
  { id: 'diario', label: 'Diário de Obra' },
  { id: 'fotos', label: 'Fotos' },
  { id: 'equipe', label: 'Equipe' },
  { id: 'materiais', label: 'Materiais e Estoque' },
  { id: 'compras', label: 'Gestão de Compras' },
  { id: 'fornecedores', label: 'Fornecedores' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'orcamento', label: 'Orçamento' },
  { id: 'composicoes', label: 'Composições' },
  { id: 'abc', label: 'Curva ABC' },
  { id: 'medicoes', label: 'Medições' },
  { id: 'planilhas', label: 'Planilhas Excel' },
  { id: 'projetos', label: 'Projetos' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'templates', label: 'Templates' },
  { id: 'obras', label: 'Cadastrar e administrar obras' },
  { id: 'usuarios', label: 'Usuários e Permissões', administratorOnly: true },
]

const ALL_MODULE_KEYS = ACCESS_MODULES.map((module) => module.id)

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

function roleValue(value) {
  if (value && typeof value === 'object') {
    return value.tipo_usuario || value.role || value.tipo || ''
  }
  return value
}

export function normalizeRole(value) {
  const role = String(roleValue(value) || '')
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

function sanitizeModules(values) {
  const valid = new Set(ALL_MODULE_KEYS)
  return Array.from(new Set((Array.isArray(values) ? values : []).filter((moduleKey) => valid.has(moduleKey))))
}

function readStoredCustomPermissions() {
  if (typeof window === 'undefined') return null

  try {
    const stored = window.sessionStorage.getItem(CUSTOM_PERMISSIONS_STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored)
  } catch {
    return null
  }
}

function resolveCustomPermissions(subject) {
  const custom = subject && typeof subject === 'object'
    ? subject.custom_permissions || subject.customPermissions
    : readStoredCustomPermissions()

  if (!custom || custom.enabled !== true) return null

  const view = sanitizeModules(custom.view)
  if (!view.includes('dashboard')) view.unshift('dashboard')
  const edit = sanitizeModules(custom.edit).filter((moduleKey) => view.includes(moduleKey))

  return { enabled: true, view, edit }
}

function expandRule(rule) {
  return rule === ALL_ACCESS ? [...ALL_MODULE_KEYS] : sanitizeModules(rule)
}

export function getDefaultPermissions(role) {
  const normalized = normalizeRole(role)
  return {
    enabled: false,
    view: expandRule(ROLE_RULES[normalized]?.view),
    edit: expandRule(ROLE_RULES[normalized]?.edit),
  }
}

export function getUserPermissions(subject) {
  return resolveCustomPermissions(subject) || getDefaultPermissions(subject)
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

export function canViewModule(subject, moduleKey) {
  const custom = resolveCustomPermissions(subject)
  if (custom) return custom.view.includes(moduleKey)
  return hasPermission(ROLE_RULES[normalizeRole(subject)]?.view, moduleKey)
}

export function canEditModule(subject, moduleKey) {
  const normalized = normalizeRole(subject)
  const custom = resolveCustomPermissions(subject)

  if (custom) return custom.view.includes(moduleKey) && custom.edit.includes(moduleKey)

  if (normalized === 'investidor' && moduleKey === 'obras') {
    return isEditableInvestorDemoSession()
  }

  return hasPermission(ROLE_RULES[normalized]?.edit, moduleKey)
}

export function canEditModuleForSession(subject, moduleKey, { isDemo = false } = {}) {
  const normalized = normalizeRole(subject)
  const custom = resolveCustomPermissions(subject)

  if (custom) return custom.view.includes(moduleKey) && custom.edit.includes(moduleKey)

  if (normalized === 'investidor' && moduleKey === 'obras') {
    return isDemo
  }

  return hasPermission(ROLE_RULES[normalized]?.edit, moduleKey)
}

export function getAllowedModules(subject) {
  const custom = resolveCustomPermissions(subject)
  if (custom) return [...custom.view]

  const view = ROLE_RULES[normalizeRole(subject)]?.view
  return view === ALL_ACCESS ? ALL_ACCESS : [...(view || [])]
}

export function getEditableModules(subject) {
  const custom = resolveCustomPermissions(subject)
  if (custom) return [...custom.edit]

  const edit = ROLE_RULES[normalizeRole(subject)]?.edit
  return edit === ALL_ACCESS ? ALL_ACCESS : [...(edit || [])]
}

export function firstAllowedModule(subject, preferred = 'dashboard') {
  if (canViewModule(subject, preferred)) return preferred
  const allowed = getAllowedModules(subject)
  return allowed === ALL_ACCESS ? preferred : allowed[0] || 'dashboard'
}

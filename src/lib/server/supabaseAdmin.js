import 'server-only'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const STAFF_ROLES = new Set(['administrador', 'admin', 'engenheiro', 'estagiario', 'compras', 'financeiro', 'investidor'])

export function normalizeServerRole(value) {
  const role = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

  return role === 'admin' ? 'administrador' : role
}

export function getAdminSupabase() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null

  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

export async function requireApiUser(request) {
  const admin = getAdminSupabase()
  if (!admin) {
    return {
      error: {
        status: 503,
        message: 'Configuração administrativa indisponível. Verifique SUPABASE_SERVICE_ROLE_KEY na Vercel.',
      },
    }
  }

  const authorization = request.headers.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!token) return { error: { status: 401, message: 'Sessão não informada.' } }

  const { data: authData, error: authError } = await admin.auth.getUser(token)
  const user = authData?.user
  if (authError || !user) return { error: { status: 401, message: 'Sessão inválida ou expirada.' } }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, nome, email, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: { status: 403, message: 'Perfil do NeoCanteiro não encontrado.' } }
  }

  return {
    admin,
    user,
    profile: {
      ...profile,
      role: normalizeServerRole(profile.role),
    },
  }
}

export function roleCanEditPlanilhas(role) {
  return ['administrador', 'engenheiro', 'compras', 'financeiro'].includes(normalizeServerRole(role))
}

export function roleCanImportSinapi(role) {
  return ['administrador', 'engenheiro', 'compras', 'financeiro'].includes(normalizeServerRole(role))
}

export function roleCanUseSinapi(role) {
  return ['administrador', 'engenheiro', 'compras', 'financeiro', 'investidor'].includes(normalizeServerRole(role))
}

export async function canAccessObra(admin, profile, obraId) {
  if (!obraId) return false
  const role = normalizeServerRole(profile?.role)

  if (STAFF_ROLES.has(role)) {
    const { data } = await admin.from('obras').select('id').eq('id', obraId).maybeSingle()
    return Boolean(data?.id)
  }

  if (role !== 'cliente') return false

  const { data } = await admin
    .from('obra_usuarios')
    .select('obra_id')
    .eq('obra_id', obraId)
    .eq('user_id', profile.id)
    .eq('ativo', true)
    .eq('pode_visualizar', true)
    .maybeSingle()

  return Boolean(data?.obra_id)
}

export async function removeImportFile(admin, storagePath) {
  if (!storagePath) return
  await admin.storage.from('importacoes').remove([storagePath])
}

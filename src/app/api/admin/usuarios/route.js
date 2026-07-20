import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ALLOWED_ROLES = new Set([
  'administrador',
  'engenheiro',
  'estagiario',
  'compras',
  'financeiro',
  'cliente',
  'investidor',
])
const ALLOWED_MODULES = new Set([
  'dashboard', 'timeline', 'clientes', 'cronograma', 'ia', 'diario', 'fotos', 'equipe',
  'materiais', 'compras', 'fornecedores', 'financeiro', 'orcamento', 'composicoes',
  'abc', 'medicoes', 'planilhas', 'projetos', 'documentos', 'templates', 'obras', 'usuarios',
])

function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function normalizeRole(value) {
  const role = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

  return role === 'admin' ? 'administrador' : role
}

function sanitizeModules(values) {
  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || '').trim())
    .filter((moduleKey) => ALLOWED_MODULES.has(moduleKey))))
}

function normalizeCustomPermissions(value, role) {
  if (!value || value.enabled !== true) {
    return { enabled: false, view: [], edit: [] }
  }

  const view = sanitizeModules(value.view)
  if (!view.includes('dashboard')) view.unshift('dashboard')
  const edit = sanitizeModules(value.edit).filter((moduleKey) => view.includes(moduleKey))

  if (role !== 'administrador') {
    const adminOnly = new Set(['usuarios'])
    return {
      enabled: true,
      view: view.filter((moduleKey) => !adminOnly.has(moduleKey)),
      edit: edit.filter((moduleKey) => !adminOnly.has(moduleKey)),
    }
  }

  return { enabled: true, view, edit }
}

function getAdminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null

  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

async function requireAdministrator(request) {
  const admin = getAdminClient()
  if (!admin) {
    return {
      error: jsonError('Configuração administrativa indisponível no momento.', 503),
    }
  }

  const authorization = request.headers.get('authorization') || ''
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!accessToken) return { error: jsonError('Sessão não informada.', 401) }

  const { data: authData, error: authError } = await admin.auth.getUser(accessToken)
  const requester = authData?.user
  if (authError || !requester) return { error: jsonError('Sessão inválida ou expirada.', 401) }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', requester.id)
    .single()

  if (profileError || !profile) return { error: jsonError('Perfil administrativo não encontrado.', 403) }

  const role = normalizeRole(profile.role)
  if (role !== 'administrador') {
    return { error: jsonError('Somente administradores podem consultar ou editar usuários e permissões.', 403) }
  }

  return { admin, requester }
}

function userStatus(user) {
  if (user?.banned_until && new Date(user.banned_until) > new Date()) return 'Bloqueado'
  if (user?.email_confirmed_at || user?.confirmed_at) return 'Ativo'
  return 'Convite pendente'
}

export async function GET(request) {
  const auth = await requireAdministrator(request)
  if (auth.error) return auth.error

  try {
    const [{ data: profiles, error: profilesError }, authResult] = await Promise.all([
      auth.admin
        .from('profiles')
        .select('id, nome, email, role, empresa, created_at, updated_at')
        .order('created_at', { ascending: false }),
      auth.admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ])

    if (profilesError) throw profilesError
    if (authResult.error) throw authResult.error

    const authUsers = authResult.data?.users || []
    const profilesById = new Map((profiles || []).map((profile) => [String(profile.id), profile]))
    const usersById = new Map()

    authUsers.forEach((authUser) => {
      const profile = profilesById.get(String(authUser.id)) || {}
      const metadata = authUser.user_metadata || {}
      const role = profile.role || metadata.role || metadata.tipo_usuario || 'investidor'

      usersById.set(String(authUser.id), {
        id: authUser.id,
        nome: profile.nome || metadata.nome || authUser.email?.split('@')[0] || 'Usuário',
        email: profile.email || authUser.email || '',
        role,
        empresa: profile.empresa || metadata.empresa || '',
        status: userStatus(authUser),
        custom_permissions: metadata.custom_permissions || null,
        created_at: profile.created_at || authUser.created_at || '',
        updated_at: profile.updated_at || authUser.updated_at || '',
        last_sign_in_at: authUser.last_sign_in_at || '',
      })
    })

    ;(profiles || []).forEach((profile) => {
      if (usersById.has(String(profile.id))) return
      usersById.set(String(profile.id), {
        id: profile.id,
        nome: profile.nome || profile.email?.split('@')[0] || 'Usuário',
        email: profile.email || '',
        role: profile.role || 'investidor',
        empresa: profile.empresa || '',
        status: 'Ativo',
        custom_permissions: null,
        created_at: profile.created_at || '',
        updated_at: profile.updated_at || '',
        last_sign_in_at: '',
      })
    })

    const usuarios = Array.from(usersById.values()).sort((a, b) => {
      const dateA = new Date(a.last_sign_in_at || a.created_at || 0).getTime()
      const dateB = new Date(b.last_sign_in_at || b.created_at || 0).getTime()
      return dateB - dateA
    })

    return NextResponse.json({ usuarios })
  } catch (error) {
    return jsonError(error?.message || 'Não foi possível carregar os usuários.', 400)
  }
}

export async function PUT(request) {
  const auth = await requireAdministrator(request)
  if (auth.error) return auth.error

  const body = await request.json().catch(() => ({}))
  const userId = String(body.id || '').trim()
  const role = normalizeRole(body.role)

  if (!userId) return jsonError('Usuário não identificado.')
  if (!ALLOWED_ROLES.has(role)) return jsonError('Perfil de acesso inválido.')

  const customPermissions = normalizeCustomPermissions(body.custom_permissions, role)

  if (userId === auth.requester.id) {
    if (role !== 'administrador') {
      return jsonError('O administrador conectado não pode remover o próprio acesso administrativo.')
    }

    if (customPermissions.enabled && (!customPermissions.view.includes('usuarios') || !customPermissions.edit.includes('usuarios'))) {
      return jsonError('O administrador conectado deve manter acesso de visualização e edição em Usuários e Permissões.')
    }
  }

  try {
    const { data: profile, error: profileError } = await auth.admin
      .from('profiles')
      .select('id, nome, email, empresa, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) throw profileError

    const authResult = await auth.admin.auth.admin.getUserById(userId)
    const authUser = authResult.data?.user || null

    if (authResult.error && !profile) throw authResult.error
    if (!authUser && !profile) return jsonError('Usuário não encontrado.', 404)

    const metadata = authUser?.user_metadata || {}
    const now = new Date().toISOString()
    const nome = profile?.nome || metadata.nome || authUser?.email?.split('@')[0] || 'Usuário'
    const email = profile?.email || authUser?.email || ''
    const empresa = profile?.empresa || metadata.empresa || null

    const { error: saveProfileError } = await auth.admin
      .from('profiles')
      .upsert({
        id: userId,
        nome,
        email,
        empresa,
        role,
        updated_at: now,
      }, { onConflict: 'id' })

    if (saveProfileError) throw saveProfileError

    if (authUser) {
      const { error: metadataError } = await auth.admin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...metadata,
          role,
          tipo_usuario: role,
          custom_permissions: customPermissions,
        },
      })

      if (metadataError) throw metadataError
    }

    return NextResponse.json({
      usuario: {
        id: userId,
        nome,
        email,
        role,
        empresa: empresa || '',
        status: authUser ? userStatus(authUser) : 'Ativo',
        custom_permissions: customPermissions,
        created_at: profile?.created_at || authUser?.created_at || '',
        updated_at: now,
        last_sign_in_at: authUser?.last_sign_in_at || '',
      },
    })
  } catch (error) {
    return jsonError(error?.message || 'Não foi possível atualizar as permissões do usuário.', 400)
  }
}

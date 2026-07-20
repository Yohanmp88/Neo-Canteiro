import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
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

  const role = String(profile.role || '').trim().toLowerCase()
  if (!['administrador', 'admin'].includes(role)) {
    return { error: jsonError('Somente administradores podem consultar usuários e permissões.', 403) }
  }

  return { admin }
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

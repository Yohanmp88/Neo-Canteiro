import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function jsonError(message, status = 400, details = null) {
  return NextResponse.json({ error: message, details }, { status })
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function uniqueIds(values) {
  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean)))
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
      error: jsonError(
        'Configuração administrativa pendente. Adicione SUPABASE_SERVICE_ROLE_KEY somente nas variáveis protegidas da Vercel.',
        503,
      ),
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
    return { error: jsonError('Somente administradores podem criar logins e definir obras de clientes.', 403) }
  }

  return { admin, requester }
}

async function loadClientRecords(admin) {
  const [{ data: profiles, error: profilesError }, { data: links, error: linksError }, { data: obras, error: obrasError }, { data: records, error: recordsError }] = await Promise.all([
    admin.from('profiles').select('id, nome, email, role, empresa, created_at').eq('role', 'cliente').order('created_at', { ascending: false }),
    admin.from('obra_usuarios').select('obra_id, user_id, ativo, pode_visualizar').eq('perfil', 'cliente'),
    admin.from('obras').select('id, nome, cliente, status').order('data_criacao', { ascending: false }),
    admin.from('workspace_records').select('id, obra_id, data, archived_at, updated_at').eq('module_key', 'clientes'),
  ])

  if (profilesError) throw profilesError
  if (linksError) throw linksError
  if (obrasError) throw obrasError
  if (recordsError) throw recordsError

  const obrasById = new Map((obras || []).map((obra) => [String(obra.id), obra]))
  const recordsByUser = new Map()

  ;(records || []).forEach((record) => {
    const userId = record?.data?.auth_user_id
    if (!userId || record.archived_at) return
    if (!recordsByUser.has(userId)) recordsByUser.set(userId, [])
    recordsByUser.get(userId).push(record)
  })

  return {
    obras: obras || [],
    clientes: (profiles || []).map((profile) => {
      const clientLinks = (links || []).filter((link) => (
        link.user_id === profile.id && link.ativo && link.pode_visualizar
      ))
      const clientRecords = recordsByUser.get(profile.id) || []
      const latestData = clientRecords
        .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))[0]?.data || {}

      const obraIds = uniqueIds(clientLinks.map((link) => link.obra_id))

      return {
        id: profile.id,
        nome: latestData.nome || profile.nome || '',
        email: profile.email || latestData.email || '',
        telefone: latestData.telefone || '',
        documento: latestData.documento || '',
        cidade: latestData.cidade || '',
        empresa: latestData.empresa || profile.empresa || '',
        status: latestData.status || 'Ativo',
        observacoes: latestData.observacoes || '',
        obra_ids: obraIds,
        obras: obraIds.map((id) => obrasById.get(id)).filter(Boolean),
        created_at: profile.created_at,
      }
    }),
  }
}

async function findOrInviteClient(admin, { email, nome, empresa, origin }) {
  const { data: existingProfile, error: profileLookupError } = await admin
    .from('profiles')
    .select('id, email, role')
    .ilike('email', email)
    .maybeSingle()

  if (profileLookupError) throw profileLookupError

  if (existingProfile?.id) {
    const role = String(existingProfile.role || '').toLowerCase()
    if (role && role !== 'cliente') {
      throw new Error('Este e-mail já pertence a outro perfil do NeoCanteiro.')
    }
    return { userId: existingProfile.id, invited: false }
  }

  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/`,
    data: {
      nome,
      empresa,
      role: 'cliente',
      tipo_usuario: 'cliente',
    },
  })

  if (inviteError) throw inviteError
  if (!inviteData?.user?.id) throw new Error('O convite foi solicitado, mas o usuário não foi retornado pelo Supabase.')

  return { userId: inviteData.user.id, invited: true }
}

async function syncClientWorkspaceRecords(admin, userId, clientData, obraIds, requesterId) {
  const { data: existing, error: existingError } = await admin
    .from('workspace_records')
    .select('id, obra_id, archived_at')
    .eq('module_key', 'clientes')
    .eq('data->>auth_user_id', userId)

  if (existingError) throw existingError

  const existingByObra = new Map((existing || []).map((record) => [String(record.obra_id), record]))
  const now = new Date().toISOString()

  for (const obraId of obraIds) {
    const record = existingByObra.get(String(obraId))
    const data = {
      ...clientData,
      auth_user_id: userId,
      obra_ids: obraIds,
      acesso_plataforma: true,
    }

    if (record) {
      const { error } = await admin
        .from('workspace_records')
        .update({ data, archived_at: null, updated_by: requesterId, updated_at: now })
        .eq('id', record.id)
      if (error) throw error
    } else {
      const { error } = await admin.from('workspace_records').insert({
        module_key: 'clientes',
        obra_id: String(obraId),
        data,
        created_by: requesterId,
        updated_by: requesterId,
      })
      if (error) throw error
    }
  }

  const selected = new Set(obraIds.map(String))
  const recordsToArchive = (existing || []).filter((record) => !selected.has(String(record.obra_id)) && !record.archived_at)

  if (recordsToArchive.length) {
    const { error } = await admin
      .from('workspace_records')
      .update({ archived_at: now, updated_by: requesterId, updated_at: now })
      .in('id', recordsToArchive.map((record) => record.id))
    if (error) throw error
  }
}

async function saveClient(request, isUpdate = false) {
  const auth = await requireAdministrator(request)
  if (auth.error) return auth.error

  const { admin, requester } = auth
  const body = await request.json().catch(() => ({}))

  const nome = String(body.nome || '').trim()
  const email = normalizeEmail(body.email)
  const obraIds = uniqueIds(body.obra_ids)
  const existingUserId = String(body.id || '').trim()

  if (!nome) return jsonError('Informe o nome do cliente.')
  if (!email || !email.includes('@')) return jsonError('Informe um e-mail válido.')
  if (!obraIds.length) return jsonError('Selecione pelo menos uma obra para o cliente visualizar.')

  const { data: validWorks, error: worksError } = await admin
    .from('obras')
    .select('id')
    .in('id', obraIds)

  if (worksError) return jsonError('Não foi possível validar as obras selecionadas.', 400, worksError.message)
  if ((validWorks || []).length !== obraIds.length) return jsonError('Uma das obras selecionadas não existe mais.')

  try {
    let userId = existingUserId
    let invited = false

    if (isUpdate) {
      if (!userId) return jsonError('Cliente não identificado.')

      const { data: currentProfile, error: currentProfileError } = await admin
        .from('profiles')
        .select('id, email, role')
        .eq('id', userId)
        .single()

      if (currentProfileError || !currentProfile) return jsonError('Cliente não encontrado.', 404)
      if (String(currentProfile.role || '').toLowerCase() !== 'cliente') return jsonError('O perfil informado não é de cliente.')
      if (normalizeEmail(currentProfile.email) !== email) return jsonError('O e-mail do acesso não pode ser alterado nesta tela.')
    } else {
      const created = await findOrInviteClient(admin, {
        email,
        nome,
        empresa: String(body.empresa || '').trim(),
        origin: request.nextUrl.origin,
      })
      userId = created.userId
      invited = created.invited
    }

    const profilePayload = {
      id: userId,
      nome,
      email,
      role: 'cliente',
      empresa: String(body.empresa || '').trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { error: profileError } = await admin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })

    if (profileError) throw profileError

    const { error: disableLinksError } = await admin
      .from('obra_usuarios')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('perfil', 'cliente')

    if (disableLinksError) throw disableLinksError

    const links = obraIds.map((obraId) => ({
      obra_id: String(obraId),
      user_id: userId,
      perfil: 'cliente',
      pode_visualizar: true,
      pode_editar: false,
      pode_aprovar: false,
      pode_administrar: false,
      ativo: true,
      criado_por: requester.id,
      updated_at: new Date().toISOString(),
    }))

    const { error: linksError } = await admin
      .from('obra_usuarios')
      .upsert(links, { onConflict: 'obra_id,user_id' })

    if (linksError) throw linksError

    const clientData = {
      nome,
      email,
      telefone: String(body.telefone || '').trim(),
      documento: String(body.documento || '').trim(),
      cidade: String(body.cidade || '').trim(),
      empresa: String(body.empresa || '').trim(),
      status: String(body.status || 'Ativo'),
      observacoes: String(body.observacoes || '').trim(),
    }

    await syncClientWorkspaceRecords(admin, userId, clientData, obraIds, requester.id)

    const result = await loadClientRecords(admin)
    const cliente = result.clientes.find((item) => item.id === userId)

    return NextResponse.json({ cliente, invited })
  } catch (error) {
    return jsonError(error?.message || 'Não foi possível cadastrar o cliente.', 400)
  }
}

export async function GET(request) {
  const auth = await requireAdministrator(request)
  if (auth.error) return auth.error

  try {
    return NextResponse.json(await loadClientRecords(auth.admin))
  } catch (error) {
    return jsonError(error?.message || 'Não foi possível carregar os clientes.', 400)
  }
}

export async function POST(request) {
  return saveClient(request, false)
}

export async function PUT(request) {
  return saveClient(request, true)
}

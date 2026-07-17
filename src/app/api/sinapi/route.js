import { NextResponse } from 'next/server'
import { requireApiUser, roleCanUseSinapi } from '@/lib/server/supabaseAdmin'

export const runtime = 'nodejs'

function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request) {
  const auth = await requireApiUser(request)
  if (auth.error) return jsonError(auth.error.message, auth.error.status)

  const { admin, profile } = auth
  if (!roleCanUseSinapi(profile.role)) return jsonError('Seu perfil não possui acesso à biblioteca SINAPI.', 403)

  const url = new URL(request.url)
  const referenceId = url.searchParams.get('reference_id')
  const compositionId = url.searchParams.get('composition_id')
  const query = String(url.searchParams.get('q') || '').trim()
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const pageSize = Math.min(100, Math.max(10, Number(url.searchParams.get('page_size') || 40)))

  if (compositionId) {
    const { data: composition, error: compositionError } = await admin
      .from('sinapi_composicoes')
      .select('id, referencia_id, codigo, descricao, unidade, categoria, custo_total, dados')
      .eq('id', compositionId)
      .single()

    if (compositionError || !composition) return jsonError('Composição não encontrada.', 404)

    const { data: items, error: itemsError } = await admin
      .from('sinapi_composicao_itens')
      .select('id, ordem, tipo, codigo, descricao, unidade, coeficiente, preco_unitario, custo_total, dados')
      .eq('composicao_id', composition.id)
      .order('ordem', { ascending: true })

    if (itemsError) return jsonError(itemsError.message)
    return NextResponse.json({ composition, items: items || [] })
  }

  if (referenceId) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let requestQuery = admin
      .from('sinapi_composicoes')
      .select('id, referencia_id, codigo, descricao, unidade, categoria, custo_total', { count: 'exact' })
      .eq('referencia_id', referenceId)
      .order('codigo', { ascending: true })
      .range(from, to)

    if (query) {
      const safe = query.replace(/[%_,()]/g, ' ').trim()
      requestQuery = requestQuery.or(`codigo.ilike.%${safe}%,descricao.ilike.%${safe}%`)
    }

    const { data, error, count } = await requestQuery
    if (error) return jsonError(error.message)

    return NextResponse.json({
      compositions: data || [],
      page,
      page_size: pageSize,
      total: count || 0,
      total_pages: Math.max(1, Math.ceil((count || 0) / pageSize)),
    })
  }

  const { data: references, error: referencesError } = await admin
    .from('sinapi_referencias')
    .select('id, uf, referencia, regime, arquivo_nome, total_composicoes, created_at, updated_at')
    .order('referencia', { ascending: false })
    .order('uf', { ascending: true })

  if (referencesError) return jsonError(referencesError.message)
  return NextResponse.json({ references: references || [] })
}

import { NextResponse } from 'next/server'
import {
  canAccessObra,
  requireApiUser,
  roleCanImportSinapi,
} from '@/lib/server/supabaseAdmin'

export const runtime = 'nodejs'

function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request) {
  const auth = await requireApiUser(request)
  if (auth.error) return jsonError(auth.error.message, auth.error.status)

  const { admin, user, profile } = auth
  if (!roleCanImportSinapi(profile.role)) return jsonError('Seu perfil não pode alterar o orçamento.', 403)

  const body = await request.json().catch(() => ({}))
  const obraId = String(body.obra_id || '').trim()
  const compositionId = String(body.composition_id || '').trim()
  const quantidade = Math.max(0, Number(body.quantidade || 1))

  if (!obraId || !compositionId) return jsonError('Obra ou composição não informada.')
  if (!(await canAccessObra(admin, profile, obraId))) return jsonError('Você não possui acesso a esta obra.', 403)

  const { data: composition, error: compositionError } = await admin
    .from('sinapi_composicoes')
    .select('id, referencia_id, codigo, descricao, unidade, categoria, custo_total')
    .eq('id', compositionId)
    .single()

  if (compositionError || !composition) return jsonError('Composição SINAPI não encontrada.', 404)

  const { data: reference } = await admin
    .from('sinapi_referencias')
    .select('uf, referencia, regime')
    .eq('id', composition.referencia_id)
    .maybeSingle()

  const unitCost = Number(composition.custo_total || 0)
  const total = quantidade * unitCost
  const referenceLabel = reference
    ? `${reference.uf} • ${String(reference.referencia).slice(0, 7)} • ${reference.regime === 'desonerado' ? 'Desonerado' : 'Não desonerado'}`
    : 'SINAPI'

  const { data: record, error: insertError } = await admin
    .from('workspace_records')
    .insert({
      module_key: 'orcamento',
      obra_id: obraId,
      data: {
        codigo: composition.codigo,
        servico: composition.descricao,
        categoria: composition.categoria || 'SINAPI',
        unidade: composition.unidade || '',
        quantidade,
        valor_unitario: unitCost,
        total,
        responsavel: profile.nome || user.email || '',
        status: 'Previsto',
        observacoes: `Composição importada da referência ${referenceLabel}.`,
        sinapi_composicao_id: composition.id,
        sinapi_referencia_id: composition.referencia_id,
      },
      created_by: user.id,
      updated_by: user.id,
    })
    .select('id, data, created_at')
    .single()

  if (insertError) return jsonError(insertError.message)
  return NextResponse.json({ record, message: 'Composição adicionada ao orçamento da obra.' })
}

import { NextResponse } from 'next/server'
import { canAccessObra, requireApiUser } from '@/lib/server/supabaseAdmin'

export const runtime = 'nodejs'

function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request) {
  const auth = await requireApiUser(request)
  if (auth.error) return jsonError(auth.error.message, auth.error.status)

  const { admin, profile } = auth
  const url = new URL(request.url)
  const obraId = url.searchParams.get('obra_id')
  const datasetId = url.searchParams.get('dataset_id')

  if (!obraId) return jsonError('Selecione uma obra.')
  if (!(await canAccessObra(admin, profile, obraId))) return jsonError('Você não possui acesso a esta obra.', 403)

  if (datasetId) {
    const { data: dataset, error: datasetError } = await admin
      .from('planilha_datasets')
      .select('id, obra_id, nome, descricao, active_version_id, created_at, updated_at')
      .eq('id', datasetId)
      .eq('obra_id', obraId)
      .single()

    if (datasetError || !dataset) return jsonError('Planilha não encontrada.', 404)

    const { data: versions, error: versionsError } = await admin
      .from('planilha_versoes')
      .select('id, numero_versao, arquivo_nome, aba_nome, colunas, total_linhas, created_at')
      .eq('dataset_id', dataset.id)
      .order('numero_versao', { ascending: false })
      .limit(20)

    if (versionsError) return jsonError(versionsError.message)

    const activeVersion = (versions || []).find((version) => version.id === dataset.active_version_id) || versions?.[0] || null
    let rows = []

    if (activeVersion?.id) {
      const { data: rowData, error: rowsError } = await admin
        .from('planilha_linhas')
        .select('ordem, dados')
        .eq('versao_id', activeVersion.id)
        .order('ordem', { ascending: true })
        .limit(5000)

      if (rowsError) return jsonError(rowsError.message)
      rows = (rowData || []).map((row) => row.dados || {})
    }

    return NextResponse.json({
      dataset,
      active_version: activeVersion,
      versions: versions || [],
      rows,
    })
  }

  const { data: datasets, error: datasetsError } = await admin
    .from('planilha_datasets')
    .select('id, obra_id, nome, descricao, active_version_id, created_at, updated_at')
    .eq('obra_id', obraId)
    .order('updated_at', { ascending: false })

  if (datasetsError) return jsonError(datasetsError.message)

  const activeIds = (datasets || []).map((dataset) => dataset.active_version_id).filter(Boolean)
  let versionMap = new Map()

  if (activeIds.length) {
    const { data: versions, error: versionsError } = await admin
      .from('planilha_versoes')
      .select('id, numero_versao, arquivo_nome, aba_nome, colunas, total_linhas, created_at')
      .in('id', activeIds)

    if (versionsError) return jsonError(versionsError.message)
    versionMap = new Map((versions || []).map((version) => [version.id, version]))
  }

  return NextResponse.json({
    datasets: (datasets || []).map((dataset) => ({
      ...dataset,
      active_version: versionMap.get(dataset.active_version_id) || null,
    })),
  })
}

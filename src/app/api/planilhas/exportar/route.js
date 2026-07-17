import { NextResponse } from 'next/server'
import { exportWorkbookBuffer } from '@/lib/server/excelWorkbook'
import { canAccessObra, requireApiUser } from '@/lib/server/supabaseAdmin'

export const runtime = 'nodejs'

function safeFilename(value) {
  return String(value || 'planilha')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90) || 'planilha'
}

function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request) {
  const auth = await requireApiUser(request)
  if (auth.error) return jsonError(auth.error.message, auth.error.status)

  const { admin, profile } = auth
  const url = new URL(request.url)
  const datasetId = url.searchParams.get('dataset_id')

  if (!datasetId) return jsonError('Planilha não informada.')

  const { data: dataset, error: datasetError } = await admin
    .from('planilha_datasets')
    .select('id, obra_id, nome, active_version_id')
    .eq('id', datasetId)
    .single()

  if (datasetError || !dataset) return jsonError('Planilha não encontrada.', 404)
  if (!(await canAccessObra(admin, profile, dataset.obra_id))) return jsonError('Você não possui acesso a esta obra.', 403)
  if (!dataset.active_version_id) return jsonError('Esta planilha ainda não possui uma versão publicada.')

  const { data: version, error: versionError } = await admin
    .from('planilha_versoes')
    .select('id, numero_versao, aba_nome, colunas')
    .eq('id', dataset.active_version_id)
    .single()

  if (versionError || !version) return jsonError('Versão ativa não encontrada.', 404)

  const { data: rowData, error: rowsError } = await admin
    .from('planilha_linhas')
    .select('ordem, dados')
    .eq('versao_id', version.id)
    .order('ordem', { ascending: true })

  if (rowsError) return jsonError(rowsError.message)

  const headers = Array.isArray(version.colunas) ? version.colunas : []
  const rows = (rowData || []).map((row) => row.dados || {})
  const buffer = exportWorkbookBuffer(headers, rows, version.aba_nome || dataset.nome)
  const filename = `${safeFilename(dataset.nome)}-v${version.numero_versao}.xlsx`

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

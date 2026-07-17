import { NextResponse } from 'next/server'
import { parseGenericWorkbook } from '@/lib/server/excelWorkbook'
import {
  canAccessObra,
  removeImportFile,
  requireApiUser,
  roleCanEditPlanilhas,
} from '@/lib/server/supabaseAdmin'

export const runtime = 'nodejs'
export const maxDuration = 60

function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function chunks(values, size = 500) {
  const result = []
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size))
  return result
}

export async function POST(request) {
  const auth = await requireApiUser(request)
  if (auth.error) return jsonError(auth.error.message, auth.error.status)

  const { admin, user, profile } = auth
  if (!roleCanEditPlanilhas(profile.role)) return jsonError('Seu perfil não pode importar planilhas.', 403)

  const body = await request.json().catch(() => ({}))
  const obraId = String(body.obra_id || '').trim()
  const datasetId = String(body.dataset_id || '').trim()
  const nome = String(body.nome || '').trim()
  const descricao = String(body.descricao || '').trim()
  const storagePath = String(body.storage_path || '').trim()
  const arquivoNome = String(body.arquivo_nome || '').trim() || 'planilha.xlsx'

  if (!obraId) return jsonError('Selecione uma obra.')
  if (!nome) return jsonError('Informe um nome para a planilha.')
  if (!storagePath || !storagePath.startsWith(`${user.id}/`)) return jsonError('Arquivo de importação inválido.')
  if (!(await canAccessObra(admin, profile, obraId))) return jsonError('Você não possui acesso a esta obra.', 403)

  let versionId = null

  try {
    const { data: fileBlob, error: downloadError } = await admin.storage.from('importacoes').download(storagePath)
    if (downloadError || !fileBlob) throw new Error(downloadError?.message || 'Não foi possível baixar o arquivo enviado.')

    const buffer = Buffer.from(await fileBlob.arrayBuffer())
    const parsed = parseGenericWorkbook(buffer)

    if (parsed.rows.length > 20000) {
      throw new Error('A planilha possui mais de 20.000 linhas. Divida o arquivo em planilhas menores para manter a plataforma rápida.')
    }

    let dataset = null

    if (datasetId) {
      const { data, error } = await admin
        .from('planilha_datasets')
        .select('id, obra_id, nome')
        .eq('id', datasetId)
        .eq('obra_id', obraId)
        .single()
      if (error || !data) throw new Error('A planilha que seria atualizada não foi encontrada.')
      dataset = data
    } else {
      const { data: existing, error: existingError } = await admin
        .from('planilha_datasets')
        .select('id, obra_id, nome')
        .eq('obra_id', obraId)
        .eq('nome', nome)
        .maybeSingle()
      if (existingError) throw existingError
      dataset = existing
    }

    if (!dataset) {
      const { data, error } = await admin
        .from('planilha_datasets')
        .insert({
          obra_id: obraId,
          nome,
          descricao: descricao || null,
          created_by: user.id,
        })
        .select('id, obra_id, nome')
        .single()
      if (error) throw error
      dataset = data
    }

    const { data: latestVersion, error: latestError } = await admin
      .from('planilha_versoes')
      .select('numero_versao')
      .eq('dataset_id', dataset.id)
      .order('numero_versao', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError) throw latestError
    const nextVersion = Number(latestVersion?.numero_versao || 0) + 1

    const { data: version, error: versionError } = await admin
      .from('planilha_versoes')
      .insert({
        dataset_id: dataset.id,
        numero_versao: nextVersion,
        arquivo_nome: arquivoNome,
        aba_nome: parsed.sheetName,
        colunas: parsed.headers,
        total_linhas: parsed.rows.length,
        imported_by: user.id,
      })
      .select('id, numero_versao, arquivo_nome, aba_nome, colunas, total_linhas, created_at')
      .single()

    if (versionError) throw versionError
    versionId = version.id

    const records = parsed.rows.map((row, index) => ({
      versao_id: version.id,
      ordem: index + 1,
      dados: row,
    }))

    for (const batch of chunks(records)) {
      const { error } = await admin.from('planilha_linhas').insert(batch)
      if (error) throw error
    }

    const { error: updateError } = await admin
      .from('planilha_datasets')
      .update({
        nome,
        descricao: descricao || null,
        active_version_id: version.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dataset.id)

    if (updateError) throw updateError

    return NextResponse.json({
      dataset_id: dataset.id,
      version,
      message: nextVersion === 1
        ? 'Planilha importada e publicada no layout do NeoCanteiro.'
        : `Planilha atualizada para a versão ${nextVersion}.`,
    })
  } catch (error) {
    if (versionId) await admin.from('planilha_versoes').delete().eq('id', versionId)
    return jsonError(error?.message || 'Não foi possível importar a planilha.')
  } finally {
    await removeImportFile(admin, storagePath)
  }
}

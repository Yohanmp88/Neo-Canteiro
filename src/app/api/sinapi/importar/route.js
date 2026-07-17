import { NextResponse } from 'next/server'
import { parseSinapiWorkbook } from '@/lib/server/excelWorkbook'
import {
  removeImportFile,
  requireApiUser,
  roleCanImportSinapi,
} from '@/lib/server/supabaseAdmin'

export const runtime = 'nodejs'
export const maxDuration = 60

function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function chunks(values, size = 300) {
  const result = []
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size))
  return result
}

function monthDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})$/)
  if (!match) return null
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return `${match[1]}-${match[2]}-01`
}

export async function POST(request) {
  const auth = await requireApiUser(request)
  if (auth.error) return jsonError(auth.error.message, auth.error.status)

  const { admin, user, profile } = auth
  if (!roleCanImportSinapi(profile.role)) return jsonError('Seu perfil não pode importar bases SINAPI.', 403)

  const body = await request.json().catch(() => ({}))
  const uf = String(body.uf || '').trim().toUpperCase()
  const referencia = monthDate(body.referencia)
  const regime = String(body.regime || 'nao_desonerado').trim().toLowerCase()
  const storagePath = String(body.storage_path || '').trim()
  const arquivoNome = String(body.arquivo_nome || '').trim() || 'sinapi.xlsx'

  if (!/^[A-Z]{2}$/.test(uf)) return jsonError('Informe uma UF válida.')
  if (!referencia) return jsonError('Informe o mês de referência no formato AAAA-MM.')
  if (!['desonerado', 'nao_desonerado'].includes(regime)) return jsonError('Regime SINAPI inválido.')
  if (!storagePath || !storagePath.startsWith(`${user.id}/`)) return jsonError('Arquivo de importação inválido.')

  try {
    const { data: fileBlob, error: downloadError } = await admin.storage.from('importacoes').download(storagePath)
    if (downloadError || !fileBlob) throw new Error(downloadError?.message || 'Não foi possível baixar o arquivo enviado.')

    const buffer = Buffer.from(await fileBlob.arrayBuffer())
    const parsed = parseSinapiWorkbook(buffer)

    if (parsed.length > 50000) throw new Error('A base possui mais de 50.000 composições e excede o limite desta importação.')

    const { data: existingReference, error: referenceLookupError } = await admin
      .from('sinapi_referencias')
      .select('id')
      .eq('uf', uf)
      .eq('referencia', referencia)
      .eq('regime', regime)
      .maybeSingle()

    if (referenceLookupError) throw referenceLookupError

    let referenceId = existingReference?.id

    if (!referenceId) {
      const { data: createdReference, error: createReferenceError } = await admin
        .from('sinapi_referencias')
        .insert({
          uf,
          referencia,
          regime,
          arquivo_nome: arquivoNome,
          total_composicoes: parsed.length,
          imported_by: user.id,
        })
        .select('id')
        .single()

      if (createReferenceError) throw createReferenceError
      referenceId = createdReference.id
    } else {
      const { error: deleteError } = await admin
        .from('sinapi_composicoes')
        .delete()
        .eq('referencia_id', referenceId)
      if (deleteError) throw deleteError

      const { error: updateReferenceError } = await admin
        .from('sinapi_referencias')
        .update({
          arquivo_nome: arquivoNome,
          total_composicoes: parsed.length,
          imported_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', referenceId)
      if (updateReferenceError) throw updateReferenceError
    }

    const compositionIdByCode = new Map()

    for (const batch of chunks(parsed, 250)) {
      const payload = batch.map((composition) => ({
        referencia_id: referenceId,
        codigo: composition.codigo,
        descricao: composition.descricao,
        unidade: composition.unidade || null,
        categoria: composition.categoria || null,
        custo_total: Number(composition.custo_total || 0),
        dados: { aba_origem: composition.sheetName },
      }))

      const { data: inserted, error: insertError } = await admin
        .from('sinapi_composicoes')
        .insert(payload)
        .select('id, codigo')

      if (insertError) throw insertError
      ;(inserted || []).forEach((composition) => compositionIdByCode.set(composition.codigo, composition.id))
    }

    const items = []
    parsed.forEach((composition) => {
      const compositionId = compositionIdByCode.get(composition.codigo)
      if (!compositionId) return

      composition.items.forEach((item) => {
        items.push({
          composicao_id: compositionId,
          ordem: Number(item.ordem || 0),
          tipo: item.tipo || null,
          codigo: item.codigo || null,
          descricao: item.descricao || null,
          unidade: item.unidade || null,
          coeficiente: item.coeficiente,
          preco_unitario: item.preco_unitario,
          custo_total: item.custo_total,
        })
      })
    })

    for (const batch of chunks(items, 500)) {
      const { error: itemsError } = await admin.from('sinapi_composicao_itens').insert(batch)
      if (itemsError) throw itemsError
    }

    return NextResponse.json({
      reference_id: referenceId,
      total_composicoes: parsed.length,
      total_itens: items.length,
      message: existingReference
        ? 'Referência SINAPI atualizada e substituída com sucesso.'
        : 'Referência SINAPI importada com sucesso.',
    })
  } catch (error) {
    return jsonError(error?.message || 'Não foi possível importar a base SINAPI.')
  } finally {
    await removeImportFile(admin, storagePath)
  }
}

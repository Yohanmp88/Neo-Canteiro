'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getModuleDefinition, normalizeModuleRecord } from '@/lib/moduleDefinitions'
import {
  pedidoAtrasadoOperacional,
  statusCanceladoOperacional,
  statusRecebidoOperacional,
} from '@/lib/operationalData'

const STORAGE_PREFIX = 'neocanteiro_workspace_v1'
const DERIVED_STATUS_FLAG = '__status_operacional_derivado'
const ORIGINAL_STATUS_FIELD = '__status_original'

function criarId(moduleKey) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${moduleKey}-${crypto.randomUUID()}`
  }

  return `${moduleKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function storageKey(moduleKey, obraId) {
  return `${STORAGE_PREFIX}:${moduleKey}:${obraId || 'global'}`
}

function normalizeMatchValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
}

function isFullyReceivedMaterial(material = {}) {
  const status = normalizeMatchValue(material.recebimento_status)
  return status === 'recebido' || status === 'entregue' || status === 'concluido'
}

function matchesPurchaseToMaterial(purchase = {}, material = {}) {
  if (purchase.material_id && material.id) {
    return String(purchase.material_id) === String(material.id)
  }

  const purchaseItem = normalizeMatchValue(purchase.item || purchase.material || purchase.nome)
  const materialItem = normalizeMatchValue(material.item || material.material || material.nome)
  if (!purchaseItem || !materialItem || purchaseItem !== materialItem) return false

  const purchaseSupplier = normalizeMatchValue(purchase.fornecedor)
  const materialSupplier = normalizeMatchValue(material.fornecedor)
  return !purchaseSupplier || !materialSupplier || purchaseSupplier === materialSupplier
}

function receiptFields(material = {}, purchase = {}) {
  return {
    status: 'Recebido',
    recebimento_status: 'Recebido',
    data_recebimento: material.data_recebimento || purchase.data_recebimento || new Date().toISOString().slice(0, 10),
    quantidade_recebida: material.quantidade_recebida || material.quantidade || purchase.quantidade_recebida || purchase.quantidade || '',
    recebido_por: material.recebido_por || purchase.recebido_por || '',
  }
}

function stripDerivedStatus(moduleKey, record = {}) {
  if (moduleKey !== 'compras') return { ...record }

  const cleaned = { ...record }
  if (cleaned[DERIVED_STATUS_FLAG] && cleaned.status === 'Atrasado') {
    cleaned.status = cleaned[ORIGINAL_STATUS_FIELD] || 'Pedido emitido'
  }

  delete cleaned[DERIVED_STATUS_FLAG]
  delete cleaned[ORIGINAL_STATUS_FIELD]
  delete cleaned.atrasado_operacional
  return cleaned
}

function decorateRecord(moduleKey, record = {}) {
  if (moduleKey !== 'compras') return record

  const mapped = {
    ...record,
    data_necessidade: record.data_necessidade || record.necessario_em || '',
    data_prevista: record.data_prevista || record.entrega_prevista || record.data_reprogramada || '',
    data_entrega: record.data_entrega || record.recebido_em || record.data_recebimento || '',
  }
  const atrasado = pedidoAtrasadoOperacional(mapped)

  if (!atrasado) return { ...mapped, atrasado_operacional: false }

  return {
    ...mapped,
    [ORIGINAL_STATUS_FIELD]: record.status || 'Pedido emitido',
    [DERIVED_STATUS_FLAG]: true,
    status: 'Atrasado',
    atrasado_operacional: true,
  }
}

function reconcilePurchasesWithMaterials(purchases = [], materials = []) {
  const receivedMaterials = materials.filter(isFullyReceivedMaterial)
  if (!receivedMaterials.length) return purchases

  return purchases.map((purchase) => {
    const material = receivedMaterials.find((candidate) => matchesPurchaseToMaterial(purchase, candidate))
    if (!material) return purchase

    const rawPurchase = stripDerivedStatus('compras', purchase)
    return decorateRecord('compras', {
      ...rawPurchase,
      ...receiptFields(material, rawPurchase),
    })
  })
}

function readLocal(moduleKey, obraId) {
  if (typeof window === 'undefined') return []

  const key = storageKey(moduleKey, obraId)
  const raw = window.localStorage.getItem(key)

  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map((record) => decorateRecord(moduleKey, record))
    } catch {
      window.localStorage.removeItem(key)
    }
  }

  const definition = getModuleDefinition(moduleKey)
  const now = new Date().toISOString()
  const seeded = (definition?.seed || []).map((item) => decorateRecord(moduleKey, {
    ...item,
    obra_id: obraId || null,
    created_at: item.created_at || now,
    updated_at: item.updated_at || now,
    created_by_name: item.created_by_name || 'NeoCanteiro Demo',
  }))

  window.localStorage.setItem(key, JSON.stringify(seeded.map((record) => stripDerivedStatus(moduleKey, record))))
  return seeded
}

function writeLocal(moduleKey, obraId, records) {
  if (typeof window === 'undefined') return
  const rawRecords = records.map((record) => stripDerivedStatus(moduleKey, record))
  window.localStorage.setItem(storageKey(moduleKey, obraId), JSON.stringify(rawRecords))
  window.dispatchEvent(new CustomEvent('neocanteiro:workspace-change', {
    detail: { moduleKey, obraId, records: rawRecords },
  }))
}

function mapDatabaseRow(moduleKey, row) {
  return decorateRecord(moduleKey, {
    id: row.id,
    ...(row.data || {}),
    obra_id: row.obra_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    updated_by: row.updated_by,
  })
}

async function syncReceivedMaterialPurchases({ material, obraId, user, source, isDemo }) {
  if (!isFullyReceivedMaterial(material) || !obraId) return 0

  if (source === 'supabase' && !isDemo) {
    const { data: rows, error: queryError } = await supabase
      .from('workspace_records')
      .select('*')
      .eq('module_key', 'compras')
      .eq('obra_id', String(obraId))
      .is('archived_at', null)

    if (queryError) throw queryError

    const matches = (rows || []).filter((row) => {
      const purchase = row.data || {}
      const received = statusRecebidoOperacional(purchase.status) ||
        statusRecebidoOperacional(purchase.recebimento_status) ||
        Boolean(purchase.data_entrega || purchase.data_recebimento || purchase.recebido_em)

      return !received &&
        !statusCanceladoOperacional(purchase.status) &&
        matchesPurchaseToMaterial(purchase, material)
    })

    await Promise.all(matches.map(async (row) => {
      const purchase = row.data || {}
      const nextData = {
        ...purchase,
        ...receiptFields(material, purchase),
      }

      const { error: updateError } = await supabase
        .from('workspace_records')
        .update({ data: nextData, updated_by: user?.id || null })
        .eq('id', row.id)

      if (updateError) throw updateError
    }))

    return matches.length
  }

  const purchases = readLocal('compras', obraId)
  let updatedCount = 0
  const next = purchases.map((purchase) => {
    const rawPurchase = stripDerivedStatus('compras', purchase)
    const received = statusRecebidoOperacional(rawPurchase.status) ||
      statusRecebidoOperacional(rawPurchase.recebimento_status) ||
      Boolean(rawPurchase.data_entrega || rawPurchase.data_recebimento || rawPurchase.recebido_em)

    if (received || statusCanceladoOperacional(rawPurchase.status) || !matchesPurchaseToMaterial(rawPurchase, material)) {
      return purchase
    }

    updatedCount += 1
    return decorateRecord('compras', {
      ...rawPurchase,
      ...receiptFields(material, rawPurchase),
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    })
  })

  if (updatedCount) writeLocal('compras', obraId, next)
  return updatedCount
}

export function useWorkspaceRecords(moduleKey, obraId, user) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [source, setSource] = useState('local')

  const isDemo = useMemo(() => String(obraId || '').startsWith('demo'), [obraId])

  const load = useCallback(async () => {
    if (!moduleKey) return

    setLoading(true)
    setError(null)

    if (isDemo || !obraId) {
      let localRecords = readLocal(moduleKey, obraId)
      if (moduleKey === 'compras') {
        localRecords = reconcilePurchasesWithMaterials(localRecords, readLocal('materiais', obraId))
      }
      setRecords(localRecords)
      setSource('local')
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('workspace_records')
        .select('*')
        .eq('module_key', moduleKey)
        .is('archived_at', null)
        .order('updated_at', { ascending: false })

      if (obraId) query = query.eq('obra_id', String(obraId))

      const { data, error: queryError } = await query
      if (queryError) throw queryError

      let mappedRecords = (data || []).map((row) => mapDatabaseRow(moduleKey, row))

      if (moduleKey === 'compras') {
        const { data: materialRows, error: materialsError } = await supabase
          .from('workspace_records')
          .select('*')
          .eq('module_key', 'materiais')
          .eq('obra_id', String(obraId))
          .is('archived_at', null)

        if (!materialsError) {
          const materials = (materialRows || []).map((row) => mapDatabaseRow('materiais', row))
          mappedRecords = reconcilePurchasesWithMaterials(mappedRecords, materials)
        }
      }

      setRecords(mappedRecords)
      setSource('supabase')
    } catch (err) {
      console.warn(`Fallback local ativado para ${moduleKey}:`, err?.message)
      let localRecords = readLocal(moduleKey, obraId)
      if (moduleKey === 'compras') {
        localRecords = reconcilePurchasesWithMaterials(localRecords, readLocal('materiais', obraId))
      }
      setRecords(localRecords)
      setSource('local')
      setError('Banco profissional ainda não ativado. Os dados estão sendo salvos neste navegador.')
    } finally {
      setLoading(false)
    }
  }, [moduleKey, obraId, isDemo])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === storageKey(moduleKey, obraId)) {
        setRecords(readLocal(moduleKey, obraId))
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [moduleKey, obraId])

  const create = useCallback(async (input) => {
    setSaving(true)
    setError(null)

    const now = new Date().toISOString()
    const cleanInput = stripDerivedStatus(moduleKey, input)
    const data = normalizeModuleRecord(moduleKey, cleanInput)

    try {
      if (source === 'supabase' && !isDemo && obraId) {
        const payload = {
          module_key: moduleKey,
          obra_id: String(obraId),
          data,
          created_by: user?.id || null,
          updated_by: user?.id || null,
        }

        const { data: inserted, error: insertError } = await supabase
          .from('workspace_records')
          .insert(payload)
          .select('*')
          .single()

        if (insertError) throw insertError

        const mapped = mapDatabaseRow(moduleKey, inserted)
        setRecords((current) => [mapped, ...current])

        if (moduleKey === 'materiais') {
          try {
            await syncReceivedMaterialPurchases({ material: mapped, obraId, user, source, isDemo })
          } catch (syncError) {
            console.warn('Material salvo, mas a solicitação de compra não pôde ser sincronizada:', syncError?.message)
            setError('Material salvo, mas a solicitação de compra correspondente não pôde ser atualizada automaticamente.')
          }
        }

        return mapped
      }

      const created = decorateRecord(moduleKey, {
        id: criarId(moduleKey),
        ...data,
        obra_id: obraId || null,
        created_at: now,
        updated_at: now,
        created_by: user?.id || null,
        created_by_name: user?.user_metadata?.nome || user?.email || 'Usuário',
      })

      setRecords((current) => {
        const next = [created, ...current]
        writeLocal(moduleKey, obraId, next)
        return next
      })

      if (moduleKey === 'materiais') {
        try {
          await syncReceivedMaterialPurchases({ material: created, obraId, user, source, isDemo })
        } catch (syncError) {
          console.warn('Material salvo, mas a solicitação de compra não pôde ser sincronizada:', syncError?.message)
          setError('Material salvo, mas a solicitação de compra correspondente não pôde ser atualizada automaticamente.')
        }
      }

      return created
    } catch (err) {
      setError(err?.message || 'Não foi possível criar o registro.')
      throw err
    } finally {
      setSaving(false)
    }
  }, [moduleKey, obraId, source, isDemo, user])

  const update = useCallback(async (id, input) => {
    setSaving(true)
    setError(null)

    const cleanInput = stripDerivedStatus(moduleKey, input)
    const data = normalizeModuleRecord(moduleKey, cleanInput)
    const now = new Date().toISOString()

    try {
      if (source === 'supabase' && !isDemo && obraId) {
        const { data: updated, error: updateError } = await supabase
          .from('workspace_records')
          .update({ data, updated_by: user?.id || null })
          .eq('id', id)
          .select('*')
          .single()

        if (updateError) throw updateError

        const mapped = mapDatabaseRow(moduleKey, updated)
        setRecords((current) => current.map((record) => record.id === id ? mapped : record))

        if (moduleKey === 'materiais') {
          try {
            await syncReceivedMaterialPurchases({ material: mapped, obraId, user, source, isDemo })
          } catch (syncError) {
            console.warn('Material recebido, mas a solicitação de compra não pôde ser sincronizada:', syncError?.message)
            setError('Material recebido, mas a solicitação de compra correspondente não pôde ser atualizada automaticamente.')
          }
        }

        return mapped
      }

      let changed = null
      setRecords((current) => {
        const next = current.map((record) => {
          if (record.id !== id) return record
          const base = stripDerivedStatus(moduleKey, record)
          changed = decorateRecord(moduleKey, { ...base, ...data, updated_at: now, updated_by: user?.id || null })
          return changed
        })
        writeLocal(moduleKey, obraId, next)
        return next
      })

      if (moduleKey === 'materiais' && changed) {
        try {
          await syncReceivedMaterialPurchases({ material: changed, obraId, user, source, isDemo })
        } catch (syncError) {
          console.warn('Material recebido, mas a solicitação de compra não pôde ser sincronizada:', syncError?.message)
          setError('Material recebido, mas a solicitação de compra correspondente não pôde ser atualizada automaticamente.')
        }
      }

      return changed
    } catch (err) {
      setError(err?.message || 'Não foi possível atualizar o registro.')
      throw err
    } finally {
      setSaving(false)
    }
  }, [moduleKey, obraId, source, isDemo, user])

  const remove = useCallback(async (id) => {
    setSaving(true)
    setError(null)

    try {
      if (source === 'supabase' && !isDemo && obraId) {
        const { error: deleteError } = await supabase
          .from('workspace_records')
          .update({ archived_at: new Date().toISOString(), updated_by: user?.id || null })
          .eq('id', id)

        if (deleteError) throw deleteError
        setRecords((current) => current.filter((record) => record.id !== id))
        return
      }

      setRecords((current) => {
        const next = current.filter((record) => record.id !== id)
        writeLocal(moduleKey, obraId, next)
        return next
      })
    } catch (err) {
      setError(err?.message || 'Não foi possível excluir o registro.')
      throw err
    } finally {
      setSaving(false)
    }
  }, [moduleKey, obraId, source, isDemo, user])

  const duplicate = useCallback(async (record) => {
    const clone = stripDerivedStatus(moduleKey, record)
    delete clone.id
    delete clone.created_at
    delete clone.updated_at
    delete clone.created_by
    delete clone.updated_by
    delete clone.created_by_name

    const definition = getModuleDefinition(moduleKey)
    const primaryField = definition?.fields?.find((field) => field.required)?.key
    if (primaryField && clone[primaryField]) clone[primaryField] = `${clone[primaryField]} (cópia)`

    return create(clone)
  }, [moduleKey, create])

  const resetDemo = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey(moduleKey, obraId))
    }
    const seeded = readLocal(moduleKey, obraId)
    setRecords(seeded)
    return seeded
  }, [moduleKey, obraId])

  return {
    records,
    loading,
    saving,
    error,
    source,
    create,
    update,
    remove,
    duplicate,
    reload: load,
    resetDemo,
  }
}

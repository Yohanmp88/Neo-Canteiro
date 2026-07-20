'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getModuleDefinition, normalizeModuleRecord } from '@/lib/moduleDefinitions'
import { pedidoAtrasadoOperacional } from '@/lib/operationalData'

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
      setRecords(readLocal(moduleKey, obraId))
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

      setRecords((data || []).map((row) => mapDatabaseRow(moduleKey, row)))
      setSource('supabase')
    } catch (err) {
      console.warn(`Fallback local ativado para ${moduleKey}:`, err?.message)
      setRecords(readLocal(moduleKey, obraId))
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

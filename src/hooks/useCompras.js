'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { compraService } from '@/services/compraService'
import { obterPedidosDemoPorObra, pedidoAtrasadoOperacional } from '@/lib/operationalData'

const STORAGE_PREFIX = 'neocanteiro_workspace_v1'

function workspaceKey(obraId) {
  return `${STORAGE_PREFIX}:compras:${obraId || 'global'}`
}

function flattenWorkspaceRecord(record) {
  if (!record?.data || typeof record.data !== 'object') return record || {}
  return {
    ...record,
    ...record.data,
  }
}

function mapWorkspacePurchase(record, obraId) {
  const flat = flattenWorkspaceRecord(record)
  const mapped = {
    ...flat,
    obra_id: flat.obra_id || obraId,
    data_necessidade: flat.data_necessidade || flat.necessario_em || '',
    data_prevista: flat.data_prevista || flat.entrega_prevista || flat.data_reprogramada || '',
    data_entrega: flat.data_entrega || flat.recebido_em || flat.data_recebimento || '',
    status: flat.status || 'Solicitado',
    impacto: flat.impacto || flat.observacoes || '',
  }

  return {
    ...mapped,
    atrasado_operacional: pedidoAtrasadoOperacional(mapped),
  }
}

function readWorkspacePurchases(obraId) {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(workspaceKey(obraId))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.map((record) => mapWorkspacePurchase(record, obraId))
  } catch {
    return null
  }
}

function mergePurchases(legacy = [], workspace = [], obraId) {
  const unique = new Map()

  ;[...legacy, ...workspace].forEach((record) => {
    const mapped = mapWorkspacePurchase(record, obraId)
    const key = String(mapped.id || `${mapped.item || mapped.material || 'pedido'}:${mapped.data_prevista || mapped.created_at || ''}`)
    unique.set(key, mapped)
  })

  return Array.from(unique.values()).sort((a, b) => {
    const dateA = String(a.data_prevista || '9999-12-31')
    const dateB = String(b.data_prevista || '9999-12-31')
    return dateA.localeCompare(dateB)
  })
}

export function useCompras(obraId) {
  const [pedidosLegados, setPedidosLegados] = useState([])
  const [pedidosWorkspace, setPedidosWorkspace] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ativo = true

    const applyWorkspace = (records) => {
      if (!ativo || !Array.isArray(records)) return false
      setPedidosWorkspace(records.map((record) => mapWorkspacePurchase(record, obraId)))
      return true
    }

    const carregar = async () => {
      if (!obraId) {
        if (ativo) {
          setPedidosLegados([])
          setPedidosWorkspace([])
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      if (String(obraId).startsWith('demo')) {
        const workspaceRecords = readWorkspacePurchases(obraId)
        if (ativo) {
          setPedidosLegados([])
          setPedidosWorkspace(workspaceRecords || obterPedidosDemoPorObra(obraId))
          setLoading(false)
        }
        return
      }

      const [legacyResult, workspaceResult] = await Promise.allSettled([
        compraService.listarPorObra(obraId),
        supabase
          .from('workspace_records')
          .select('*')
          .eq('module_key', 'compras')
          .eq('obra_id', String(obraId))
          .is('archived_at', null)
          .order('updated_at', { ascending: false }),
      ])

      if (!ativo) return

      if (legacyResult.status === 'fulfilled') {
        setPedidosLegados((legacyResult.value || []).map((record) => mapWorkspacePurchase(record, obraId)))
      } else {
        setPedidosLegados([])
      }

      if (workspaceResult.status === 'fulfilled' && !workspaceResult.value?.error) {
        applyWorkspace(workspaceResult.value?.data || [])
      } else {
        const localRecords = readWorkspacePurchases(obraId)
        applyWorkspace(localRecords || [])
      }

      if (legacyResult.status === 'rejected' && (workspaceResult.status === 'rejected' || workspaceResult.value?.error)) {
        setError('Não foi possível carregar os pedidos de compra desta obra.')
      }

      setLoading(false)
    }

    const onWorkspaceChange = (event) => {
      const detail = event.detail || {}
      if (detail.moduleKey === 'compras' && String(detail.obraId) === String(obraId)) {
        applyWorkspace(detail.records || [])
      }
    }

    const onStorage = (event) => {
      if (event.key === workspaceKey(obraId)) {
        const records = readWorkspacePurchases(obraId)
        if (records) applyWorkspace(records)
      }
    }

    carregar()
    window.addEventListener('neocanteiro:workspace-change', onWorkspaceChange)
    window.addEventListener('storage', onStorage)

    return () => {
      ativo = false
      window.removeEventListener('neocanteiro:workspace-change', onWorkspaceChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [obraId])

  const pedidos = useMemo(
    () => mergePurchases(pedidosLegados, pedidosWorkspace, obraId),
    [pedidosLegados, pedidosWorkspace, obraId],
  )

  return { pedidos, loading, error }
}

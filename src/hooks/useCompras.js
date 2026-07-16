'use client'

import { useEffect, useState } from 'react'
import { compraService } from '@/services/compraService'
import { obterPedidosDemoPorObra } from '@/lib/operationalData'

const STORAGE_PREFIX = 'neocanteiro_workspace_v1'

function workspaceKey(obraId) {
  return `${STORAGE_PREFIX}:compras:${obraId || 'global'}`
}

function mapWorkspacePurchase(record, obraId) {
  return {
    ...record,
    obra_id: record.obra_id || obraId,
    data_necessidade: record.data_necessidade || record.necessario_em || '',
    data_prevista: record.data_prevista || record.entrega_prevista || '',
    status: record.status || 'Solicitado',
    impacto: record.impacto || record.observacoes || '',
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

export function useCompras(obraId) {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ativo = true

    const applyWorkspace = (records) => {
      if (!ativo || !Array.isArray(records)) return false
      setPedidos(records.map((record) => mapWorkspacePurchase(record, obraId)))
      setError(null)
      setLoading(false)
      return true
    }

    const carregar = async () => {
      if (!obraId) {
        if (ativo) {
          setPedidos([])
          setLoading(false)
        }
        return
      }

      if (String(obraId).startsWith('demo')) {
        const workspaceRecords = readWorkspacePurchases(obraId)
        if (!applyWorkspace(workspaceRecords)) {
          setPedidos(obterPedidosDemoPorObra(obraId))
          setError(null)
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await compraService.listarPorObra(obraId)
        if (ativo) setPedidos(data || [])
      } catch (err) {
        if (ativo) {
          const workspaceRecords = readWorkspacePurchases(obraId)
          if (!applyWorkspace(workspaceRecords)) {
            setPedidos([])
            setError(err?.message || 'Não foi possível carregar os pedidos de compra.')
          }
        }
      } finally {
        if (ativo) setLoading(false)
      }
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

  return { pedidos, loading, error }
}

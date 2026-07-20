'use client'

import { useEffect, useMemo, useState } from 'react'
import { compraService } from '@/services/compraService'
import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'
import { obterPedidosDemoPorObra, pedidoAtrasadoOperacional } from '@/lib/operationalData'

function flattenRecord(record) {
  if (!record?.data || typeof record.data !== 'object') return record || {}
  return { ...record, ...record.data }
}

function mapPurchase(record, obraId) {
  const flat = flattenRecord(record)
  const mapped = {
    ...flat,
    obra_id: flat.obra_id || obraId,
    item: flat.item || flat.material || flat.nome || 'Pedido sem identificação',
    quantidade: flat.quantidade ?? flat.qtd ?? '',
    unidade: flat.unidade || '',
    data_necessidade: flat.data_necessidade || flat.necessario_em || '',
    data_prevista: flat.data_prevista || flat.entrega_prevista || flat.data_reprogramada || flat.data || '',
    data_entrega: flat.data_entrega || flat.recebido_em || flat.data_recebimento || '',
    status: flat.status || 'Solicitado',
    impacto: flat.impacto || flat.observacoes || '',
  }

  return {
    ...mapped,
    atrasado_operacional: pedidoAtrasadoOperacional(mapped),
  }
}

function purchaseKey(record) {
  if (record?.id) return String(record.id)
  return [record?.item, record?.fornecedor, record?.data_prevista, record?.created_at]
    .map((value) => String(value || ''))
    .join(':')
}

function mergePurchases(groups, obraId) {
  const unique = new Map()

  groups.flat().filter(Boolean).forEach((record) => {
    const mapped = mapPurchase(record, obraId)
    unique.set(purchaseKey(mapped), mapped)
  })

  return Array.from(unique.values()).sort((a, b) => {
    if (a.atrasado_operacional !== b.atrasado_operacional) return a.atrasado_operacional ? -1 : 1
    return String(a.data_prevista || '9999-12-31').localeCompare(String(b.data_prevista || '9999-12-31'))
  })
}

export function useCompras(obraId, user) {
  const workspace = useWorkspaceRecords('compras', obraId, user)
  const [legacyRecords, setLegacyRecords] = useState([])
  const [legacyLoading, setLegacyLoading] = useState(false)
  const [legacyError, setLegacyError] = useState(null)

  useEffect(() => {
    let active = true

    const loadLegacy = async () => {
      if (!obraId || String(obraId).startsWith('demo')) {
        if (active) {
          setLegacyRecords(String(obraId || '').startsWith('demo') ? obterPedidosDemoPorObra(obraId) : [])
          setLegacyLoading(false)
          setLegacyError(null)
        }
        return
      }

      try {
        setLegacyLoading(true)
        setLegacyError(null)
        const data = await compraService.listarPorObra(obraId)
        if (active) setLegacyRecords(data || [])
      } catch (error) {
        if (active) {
          setLegacyRecords([])
          setLegacyError(error?.message || 'Não foi possível consultar os pedidos antigos.')
        }
      } finally {
        if (active) setLegacyLoading(false)
      }
    }

    loadLegacy()
    return () => { active = false }
  }, [obraId])

  const pedidos = useMemo(
    () => mergePurchases([legacyRecords, workspace.records], obraId),
    [legacyRecords, workspace.records, obraId],
  )

  return {
    pedidos,
    loading: legacyLoading || workspace.loading,
    error: workspace.error || legacyError,
    reload: workspace.reload,
  }
}

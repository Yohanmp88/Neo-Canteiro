'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { compraService } from '@/services/compraService'
import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'
import {
  obterPedidosDemoPorObra,
  pedidoAtrasadoOperacional,
  statusCanceladoOperacional,
  statusRecebidoOperacional,
} from '@/lib/operationalData'

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

function normalizeIdentity(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
}

function sameItem(left, right) {
  const a = normalizeIdentity(left)
  const b = normalizeIdentity(right)
  if (!a || !b) return false
  if (a === b) return true
  const shorter = a.length <= b.length ? a : b
  const longer = a.length > b.length ? a : b
  return shorter.length >= 7 && longer.includes(shorter)
}

function samePurchase(left, right) {
  if (left?.id && right?.id && String(left.id) === String(right.id)) return true
  if (!sameItem(left?.item, right?.item)) return false

  const supplierLeft = normalizeIdentity(left?.fornecedor)
  const supplierRight = normalizeIdentity(right?.fornecedor)
  if (supplierLeft && supplierRight && supplierLeft !== supplierRight) return false

  const quantityLeft = Number(left?.quantidade)
  const quantityRight = Number(right?.quantidade)
  if (quantityLeft > 0 && quantityRight > 0 && quantityLeft !== quantityRight) return false

  return true
}

function purchaseClosed(record) {
  return statusRecebidoOperacional(record?.status) ||
    statusRecebidoOperacional(record?.recebimento_status) ||
    statusCanceladoOperacional(record?.status) ||
    Boolean(record?.data_entrega || record?.data_recebimento || record?.recebido_em)
}

function mergeMatchedPurchase(legacy, workspace, obraId) {
  const workspaceClosed = purchaseClosed(workspace)
  const legacyClosed = purchaseClosed(legacy)
  const merged = { ...legacy, ...workspace }

  if (workspaceClosed) {
    merged.status = workspace.status
    merged.recebimento_status = workspace.recebimento_status
    merged.data_entrega = workspace.data_entrega || workspace.data_recebimento || workspace.recebido_em || ''
    merged.data_recebimento = workspace.data_recebimento || workspace.data_entrega || workspace.recebido_em || ''
  } else if (legacyClosed) {
    merged.status = legacy.status
    merged.recebimento_status = legacy.recebimento_status
    merged.data_entrega = legacy.data_entrega || legacy.data_recebimento || legacy.recebido_em || ''
    merged.data_recebimento = legacy.data_recebimento || legacy.data_entrega || legacy.recebido_em || ''
  }

  return mapPurchase(merged, obraId)
}

function mergePurchases(legacyRecords, workspaceRecords, obraId) {
  const workspaceMapped = workspaceRecords.map((record) => mapPurchase(record, obraId))
  const merged = [...workspaceMapped]

  legacyRecords.map((record) => mapPurchase(record, obraId)).forEach((legacy) => {
    const workspaceIndex = merged.findIndex((record) => samePurchase(legacy, record))

    if (workspaceIndex >= 0) {
      merged[workspaceIndex] = mergeMatchedPurchase(legacy, merged[workspaceIndex], obraId)
      return
    }

    merged.push(legacy)
  })

  const unique = new Map()
  merged.forEach((record) => {
    const key = record?.id
      ? String(record.id)
      : [record?.item, record?.fornecedor, record?.quantidade, record?.data_prevista]
        .map((value) => normalizeIdentity(value))
        .join(':')
    unique.set(key, record)
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

  const loadLegacy = useCallback(async () => {
    if (!obraId || String(obraId).startsWith('demo')) {
      setLegacyRecords(String(obraId || '').startsWith('demo') ? obterPedidosDemoPorObra(obraId) : [])
      setLegacyLoading(false)
      setLegacyError(null)
      return
    }

    try {
      setLegacyLoading(true)
      setLegacyError(null)
      const data = await compraService.listarPorObra(obraId)
      setLegacyRecords(data || [])
    } catch (error) {
      setLegacyRecords([])
      setLegacyError(error?.message || 'Não foi possível consultar os pedidos antigos.')
    } finally {
      setLegacyLoading(false)
    }
  }, [obraId])

  useEffect(() => {
    loadLegacy()
  }, [loadLegacy])

  const pedidos = useMemo(
    () => mergePurchases(legacyRecords, workspace.records, obraId),
    [legacyRecords, workspace.records, obraId],
  )

  const reload = useCallback(async () => {
    await Promise.all([workspace.reload(), loadLegacy()])
  }, [workspace.reload, loadLegacy])

  return {
    pedidos,
    loading: legacyLoading || workspace.loading,
    error: workspace.error || legacyError,
    reload,
  }
}

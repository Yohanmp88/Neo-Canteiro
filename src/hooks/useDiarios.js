'use client'

import { useEffect, useState } from 'react'
import { diarioService } from '@/services/diarioService'

const STORAGE_PREFIX = 'neocanteiro_workspace_v1'

function workspaceKey(obraId) {
  return `${STORAGE_PREFIX}:diario:${obraId || 'global'}`
}

function mapWorkspaceDiary(record, obraId) {
  return {
    ...record,
    obra_id: record.obra_id || obraId,
    servicos_executados: record.servicos_executados || record.atividades || '',
    ocorrencias: record.ocorrencias || record.observacoes || '',
  }
}

function readWorkspaceDiaries(obraId) {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(workspaceKey(obraId))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed
      .map((record) => mapWorkspaceDiary(record, obraId))
      .sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')))
  } catch {
    return null
  }
}

export function useDiarios(obraId) {
  const [diarios, setDiarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ativo = true

    const applyWorkspace = (records) => {
      if (!ativo || !Array.isArray(records)) return false
      setDiarios(records.map((record) => mapWorkspaceDiary(record, obraId)).sort((a, b) => String(b.data || '').localeCompare(String(a.data || ''))))
      setLoading(false)
      setError(null)
      return true
    }

    const loadDiarios = async () => {
      try {
        setLoading(true)

        const workspaceRecords = readWorkspaceDiaries(obraId)
        if (workspaceRecords && (String(obraId).startsWith('demo') || workspaceRecords.length > 0)) {
          applyWorkspace(workspaceRecords)
          return
        }

        if (obraId) {
          const data = await diarioService.listar(obraId)
          if (ativo) setDiarios(data || [])
        }
      } catch (err) {
        const workspaceRecords = readWorkspaceDiaries(obraId)
        if (!applyWorkspace(workspaceRecords)) {
          setError(err.message)
        }
      } finally {
        if (ativo) setLoading(false)
      }
    }

    const onWorkspaceChange = (event) => {
      const detail = event.detail || {}
      if (detail.moduleKey === 'diario' && String(detail.obraId) === String(obraId)) {
        applyWorkspace(detail.records || [])
      }
    }

    const onStorage = (event) => {
      if (event.key === workspaceKey(obraId)) {
        const records = readWorkspaceDiaries(obraId)
        if (records) applyWorkspace(records)
      }
    }

    loadDiarios()
    window.addEventListener('neocanteiro:workspace-change', onWorkspaceChange)
    window.addEventListener('storage', onStorage)

    return () => {
      ativo = false
      window.removeEventListener('neocanteiro:workspace-change', onWorkspaceChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [obraId])

  const criar = async (diarioData) => {
    try {
      const novoDiario = await diarioService.criar(diarioData)
      setDiarios((current) => [novoDiario, ...current])
      return novoDiario
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const atualizar = async (id, updates) => {
    try {
      const diarioAtualizado = await diarioService.atualizar(id, updates)
      setDiarios((current) => current.map((d) => (d.id === id ? diarioAtualizado : d)))
      return diarioAtualizado
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deletar = async (id) => {
    try {
      await diarioService.deletar(id)
      setDiarios((current) => current.filter((d) => d.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const uploadFoto = async (diarioId, arquivo) => {
    try {
      return await diarioService.uploadFoto(obraId, diarioId, arquivo)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return { diarios, loading, error, criar, atualizar, deletar, uploadFoto }
}

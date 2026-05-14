'use client'

import { useState, useEffect } from 'react'
import { materialService } from '@/services/materialService'

export function useMateriais(obraId) {
  const [materiais, setMateriais] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const carregarMateriais = async () => {
    if (!obraId) return
    try {
      setLoading(true)
      const data = await materialService.listarPorObra(obraId)
      setMateriais(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarMateriais()
  }, [obraId])

  const criar = async (materialData) => {
    try {
      setSaving(true)
      const novo = await materialService.criar({ ...materialData, obra_id: obraId })
      setMateriais(prev => [...prev, novo])
      return novo
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  const atualizar = async (id, updates) => {
    try {
      setSaving(true)
      const atualizado = await materialService.atualizar(id, updates)
      setMateriais(prev => prev.map(m => m.id === id ? atualizado : m))
      return atualizado
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  const deletar = async (id) => {
    try {
      setSaving(true)
      await materialService.deletar(id)
      setMateriais(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  return {
    materiais,
    loading,
    error,
    saving,
    criar,
    atualizar,
    deletar,
    refresh: carregarMateriais
  }
}

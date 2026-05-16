'use client'

import { useEffect, useState, useCallback } from 'react'
import { equipeService } from '@/services/equipeService'

export function useEquipe(obraId) {
  const [equipe, setEquipe] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const carregarEquipe = useCallback(async () => {
    if (!obraId || String(obraId).startsWith('demo')) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await equipeService.listar(obraId)
      setEquipe(data || [])
    } catch (err) {
      console.error('Erro ao carregar equipe:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [obraId])

  useEffect(() => {
    carregarEquipe()
  }, [carregarEquipe])

  const criar = async (membroData) => {
    try {
      const novo = await equipeService.criar({ ...membroData, obra_id: obraId })
      setEquipe(prev => [...prev, novo])
      return novo
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const atualizar = async (id, updates) => {
    try {
      const atualizado = await equipeService.atualizar(id, updates)
      setEquipe(prev => prev.map(m => m.id === id ? atualizado : m))
      return atualizado
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deletar = async (id) => {
    try {
      await equipeService.deletar(id)
      setEquipe(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return { 
    equipe, 
    loading, 
    error, 
    criar, 
    atualizar, 
    deletar,
    recarregar: carregarEquipe 
  }
}

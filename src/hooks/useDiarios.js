'use client'

import { useEffect, useState } from 'react'
import { diarioService } from '@/services/diarioService'

export function useDiarios(obraId) {
  const [diarios, setDiarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Carregar diários quando obraId mudar
  useEffect(() => {
    const loadDiarios = async () => {
      try {
        setLoading(true)
        if (obraId) {
          const data = await diarioService.listar(obraId)
          setDiarios(data || [])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadDiarios()
  }, [obraId])

  const criar = async (diarioData) => {
    try {
      const novoDiario = await diarioService.criar(diarioData)
      setDiarios([novoDiario, ...diarios])
      return novoDiario
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const atualizar = async (id, updates) => {
    try {
      const diarioAtualizado = await diarioService.atualizar(id, updates)
      setDiarios(diarios.map((d) => (d.id === id ? diarioAtualizado : d)))
      return diarioAtualizado
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deletar = async (id) => {
    try {
      await diarioService.deletar(id)
      setDiarios(diarios.filter((d) => d.id !== id))
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

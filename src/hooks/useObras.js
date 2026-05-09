'use client'

import { useEffect, useState } from 'react'
import { obraService } from '@/services/obraService'
import { useAuth } from './useAuth'

export function useObras() {
  const { user, userProfile } = useAuth()
  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Carregar obras
  useEffect(() => {
    const loadObras = async () => {
      try {
        setLoading(true)
        if (user) {
          const data = await obraService.listar(user.id, userProfile?.tipo_usuario)
          setObras(data || [])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadObras()
  }, [user, userProfile])

  const criar = async (obraData) => {
    try {
      const novaObra = await obraService.criar(obraData)
      setObras([novaObra, ...obras])
      return novaObra
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const atualizar = async (id, updates) => {
    try {
      const obraAtualizada = await obraService.atualizar(id, updates)
      setObras(obras.map((o) => (o.id === id ? obraAtualizada : o)))
      return obraAtualizada
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deletar = async (id) => {
    try {
      await obraService.deletar(id)
      setObras(obras.filter((o) => o.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return { obras, loading, error, criar, atualizar, deletar }
}

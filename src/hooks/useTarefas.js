'use client'

import { useEffect, useState } from 'react'
import { tarefaService } from '@/services/tarefaService'

export function useTarefas(obraId) {
  const [tarefas, setTarefas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Carregar tarefas quando obraId mudar
  useEffect(() => {
    const loadTarefas = async () => {
      try {
        setLoading(true)
        if (obraId) {
          const data = await tarefaService.listar(obraId)
          setTarefas(data || [])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadTarefas()
  }, [obraId])

  const criar = async (tarefaData) => {
    try {
      const novaTarefa = await tarefaService.criar(tarefaData)
      setTarefas([...tarefas, novaTarefa])
      return novaTarefa
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const atualizar = async (id, updates) => {
    try {
      const tarefaAtualizada = await tarefaService.atualizar(id, updates)
      setTarefas(tarefas.map((t) => (t.id === id ? tarefaAtualizada : t)))
      return tarefaAtualizada
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deletar = async (id) => {
    try {
      await tarefaService.deletar(id)
      setTarefas(tarefas.filter((t) => t.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return { tarefas, loading, error, criar, atualizar, deletar }
}

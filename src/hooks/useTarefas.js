'use client'

import { useEffect, useState } from 'react'
import { tarefaService } from '@/services/tarefaService'
import { obterTarefasDemoPorObra } from '@/lib/operationalData'

export function useTarefas(obraId) {
  const [tarefas, setTarefas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ativo = true

    const loadTarefas = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!obraId) {
          if (ativo) setTarefas([])
          return
        }

        if (String(obraId).startsWith('demo')) {
          if (ativo) setTarefas(obterTarefasDemoPorObra(obraId))
          return
        }

        const data = await tarefaService.listar(obraId)
        if (ativo) setTarefas(data || [])
      } catch (err) {
        if (ativo) {
          setTarefas([])
          setError(err?.message || 'Não foi possível carregar as tarefas.')
        }
      } finally {
        if (ativo) setLoading(false)
      }
    }

    loadTarefas()

    return () => {
      ativo = false
    }
  }, [obraId])

  const criar = async (tarefaData) => {
    try {
      if (String(obraId).startsWith('demo')) {
        const novaTarefa = {
          ...tarefaData,
          id: `tarefa-demo-${Date.now()}`,
          obra_id: obraId,
        }
        setTarefas((atuais) => [...atuais, novaTarefa])
        return novaTarefa
      }

      const novaTarefa = await tarefaService.criar(tarefaData)
      setTarefas((atuais) => [...atuais, novaTarefa])
      return novaTarefa
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const atualizar = async (id, updates) => {
    try {
      if (String(obraId).startsWith('demo')) {
        let tarefaAtualizada = null
        setTarefas((atuais) => atuais.map((tarefa) => {
          if (tarefa.id !== id) return tarefa
          tarefaAtualizada = { ...tarefa, ...updates }
          return tarefaAtualizada
        }))
        return tarefaAtualizada
      }

      const tarefaAtualizada = await tarefaService.atualizar(id, updates)
      setTarefas((atuais) => atuais.map((tarefa) => (tarefa.id === id ? tarefaAtualizada : tarefa)))
      return tarefaAtualizada
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deletar = async (id) => {
    try {
      if (!String(obraId).startsWith('demo')) {
        await tarefaService.deletar(id)
      }
      setTarefas((atuais) => atuais.filter((tarefa) => tarefa.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return { tarefas, loading, error, criar, atualizar, deletar }
}

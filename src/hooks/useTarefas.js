'use client'

import { useEffect, useState } from 'react'
import { tarefaService } from '@/services/tarefaService'
import { obterTarefasDemoPorObra } from '@/lib/operationalData'

const STORAGE_PREFIX = 'neocanteiro_tarefas_demo_v1'

function storageKey(obraId) {
  return `${STORAGE_PREFIX}:${obraId}`
}

function readDemoTasks(obraId) {
  if (typeof window === 'undefined') return obterTarefasDemoPorObra(obraId)

  const raw = window.localStorage.getItem(storageKey(obraId))
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    } catch {
      window.localStorage.removeItem(storageKey(obraId))
    }
  }

  const seeded = obterTarefasDemoPorObra(obraId)
  window.localStorage.setItem(storageKey(obraId), JSON.stringify(seeded))
  return seeded
}

function writeDemoTasks(obraId, tasks) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(obraId), JSON.stringify(tasks))
  window.dispatchEvent(new CustomEvent('neocanteiro:cronograma-change', { detail: { obraId, tasks } }))
}

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
          if (ativo) setTarefas(readDemoTasks(obraId))
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

    const onStorage = (event) => {
      if (event.key === storageKey(obraId) && ativo) setTarefas(readDemoTasks(obraId))
    }

    const onCronogramaChange = (event) => {
      if (String(event.detail?.obraId) === String(obraId) && ativo) setTarefas(event.detail.tasks || [])
    }

    loadTarefas()
    window.addEventListener('storage', onStorage)
    window.addEventListener('neocanteiro:cronograma-change', onCronogramaChange)

    return () => {
      ativo = false
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('neocanteiro:cronograma-change', onCronogramaChange)
    }
  }, [obraId])

  const criar = async (tarefaData) => {
    try {
      if (String(obraId).startsWith('demo')) {
        const novaTarefa = {
          ...tarefaData,
          id: `tarefa-demo-${Date.now()}`,
          obra_id: obraId,
          status_operacional: tarefaData.status_operacional || 'Planejado',
        }
        setTarefas((atuais) => {
          const next = [...atuais, novaTarefa]
          writeDemoTasks(obraId, next)
          return next
        })
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
        setTarefas((atuais) => {
          const next = atuais.map((tarefa) => {
            if (tarefa.id !== id) return tarefa
            tarefaAtualizada = { ...tarefa, ...updates }
            return tarefaAtualizada
          })
          writeDemoTasks(obraId, next)
          return next
        })
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
      setTarefas((atuais) => {
        const next = atuais.filter((tarefa) => tarefa.id !== id)
        if (String(obraId).startsWith('demo')) writeDemoTasks(obraId, next)
        return next
      })
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const resetDemo = () => {
    if (!String(obraId).startsWith('demo')) return
    if (typeof window !== 'undefined') window.localStorage.removeItem(storageKey(obraId))
    const seeded = readDemoTasks(obraId)
    setTarefas(seeded)
  }

  return { tarefas, loading, error, criar, atualizar, deletar, resetDemo }
}

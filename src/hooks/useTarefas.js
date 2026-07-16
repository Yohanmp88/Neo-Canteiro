'use client'

import { useEffect, useState } from 'react'
import { tarefaService } from '@/services/tarefaService'
import { obterTarefasDemoPorObra } from '@/lib/operationalData'
import { appendTimelineLocal } from '@/lib/timelineLocal'

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

function descricaoAlteracaoCronograma(anterior, atualizado, updates) {
  const alteracoes = []

  if (Object.prototype.hasOwnProperty.call(updates, 'progresso')) {
    alteracoes.push(`Progresso: ${Number(anterior?.progresso || 0)}% → ${Number(atualizado?.progresso || 0)}%`)
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'data_inicio')) {
    alteracoes.push(`Início: ${anterior?.data_inicio || 'não informado'} → ${atualizado?.data_inicio || 'não informado'}`)
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'data_termino')) {
    alteracoes.push(`Término: ${anterior?.data_termino || 'não informado'} → ${atualizado?.data_termino || 'não informado'}`)
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'status') || Object.prototype.hasOwnProperty.call(updates, 'status_operacional')) {
    alteracoes.push(`Situação: ${anterior?.status_operacional || anterior?.status || 'não informada'} → ${atualizado?.status_operacional || atualizado?.status || 'não informada'}`)
  }

  if (!alteracoes.length) alteracoes.push('Os dados do serviço foram atualizados.')
  return alteracoes.join('\n')
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
        const next = [...tarefas, novaTarefa]
        writeDemoTasks(obraId, next)
        setTarefas(next)
        appendTimelineLocal(obraId, {
          event_type: 'cronograma',
          title: 'Serviço adicionado ao cronograma',
          description: `${novaTarefa.nome || 'Serviço sem nome'}\nProgresso inicial: ${Number(novaTarefa.progresso || 0)}%`,
          source_table: 'tarefas',
          source_id: novaTarefa.id,
          metadata: { action: 'create', after: novaTarefa },
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
        const anterior = tarefas.find((tarefa) => tarefa.id === id)
        const tarefaAtualizada = anterior ? { ...anterior, ...updates } : null
        if (!tarefaAtualizada) return null

        const next = tarefas.map((tarefa) => (tarefa.id === id ? tarefaAtualizada : tarefa))
        writeDemoTasks(obraId, next)
        setTarefas(next)
        appendTimelineLocal(obraId, {
          event_type: 'cronograma',
          title: `Cronograma atualizado — ${tarefaAtualizada.nome || 'Serviço'}`,
          description: descricaoAlteracaoCronograma(anterior, tarefaAtualizada, updates),
          source_table: 'tarefas',
          source_id: tarefaAtualizada.id,
          metadata: { action: 'update', before: anterior, after: tarefaAtualizada, changed_fields: Object.keys(updates) },
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
        setTarefas((atuais) => atuais.filter((tarefa) => tarefa.id !== id))
        return
      }

      const removida = tarefas.find((tarefa) => tarefa.id === id)
      const next = tarefas.filter((tarefa) => tarefa.id !== id)
      writeDemoTasks(obraId, next)
      setTarefas(next)
      appendTimelineLocal(obraId, {
        event_type: 'cronograma',
        title: 'Serviço removido do cronograma',
        description: removida?.nome || 'Serviço sem nome',
        source_table: 'tarefas',
        source_id: id,
        metadata: { action: 'delete', before: removida || null },
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

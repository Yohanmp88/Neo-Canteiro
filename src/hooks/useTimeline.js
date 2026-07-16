'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDiarios } from '@/hooks/useDiarios'
import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'
import { readTimelineLocal, timelineStorageKey } from '@/lib/timelineLocal'
import '@/lib/coreModuleDefinitions'

function dataValida(value) {
  const date = String(value || '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10)
}

function eventKey(event) {
  if (event.source_table && event.source_id) return `${event.source_table}:${event.source_id}:${event.event_type}`
  return `${event.event_type}:${event.event_date}:${event.title}:${event.created_at || ''}`
}

function normalizarEvento(event, source = 'supabase') {
  return {
    id: event.id || eventKey(event),
    obra_id: event.obra_id,
    event_date: dataValida(event.event_date || event.data || event.created_at),
    event_type: event.event_type || 'registro',
    title: event.title || 'Registro da obra',
    description: event.description || '',
    metadata: event.metadata || {},
    source_table: event.source_table || null,
    source_id: event.source_id ? String(event.source_id) : null,
    created_by_name: event.created_by_name || event.responsavel || '',
    created_at: event.created_at || `${dataValida(event.event_date || event.data)}T12:00:00.000Z`,
    storage_source: event.storage_source || source,
  }
}

function diarioParaEvento(diario, obraId, source) {
  return normalizarEvento({
    id: `diario-${diario.id || `${diario.data}-${diario.servicos_executados}`}`,
    obra_id: obraId,
    event_date: diario.data,
    event_type: 'diario',
    title: 'Diário de obra',
    description: diario.servicos_executados || diario.atividades || 'Diário registrado sem descrição dos serviços.',
    metadata: {
      clima: diario.clima || '',
      equipe_total: diario.equipe_total ?? '',
      responsavel: diario.responsavel || diario.responsavel_nome || '',
      ocorrencias: diario.ocorrencias || diario.observacoes || '',
      visitas: diario.visitas || '',
      proximas_atividades: diario.proximas_atividades || '',
      status: diario.status || '',
    },
    source_table: diario.source_table || (source === 'supabase' ? 'diario_obra' : 'workspace_records'),
    source_id: diario.id || null,
    created_by_name: diario.responsavel || diario.responsavel_nome || diario.created_by_name || '',
    created_at: diario.created_at || `${dataValida(diario.data)}T12:00:00.000Z`,
  }, source)
}

function fotoWorkspaceParaEvento(foto, obraId, source) {
  return normalizarEvento({
    id: `foto-workspace-${foto.id}`,
    obra_id: obraId,
    event_date: foto.data || foto.created_at,
    event_type: 'foto',
    title: foto.descricao || 'Registro fotográfico',
    description: [foto.etapa, foto.local, foto.observacoes].filter(Boolean).join(' — '),
    metadata: {
      url: foto.url || '',
      etapa: foto.etapa || '',
      local: foto.local || '',
      responsavel: foto.responsavel || '',
      status: foto.status || '',
    },
    source_table: 'workspace_records',
    source_id: foto.id,
    created_by_name: foto.responsavel || foto.created_by_name || '',
    created_at: foto.created_at,
  }, source)
}

export function useTimeline(obraId, user) {
  const usandoDemo = String(obraId || '').startsWith('demo')
  const { diarios = [], loading: diariosLoading, error: diariosError } = useDiarios(obraId)
  const {
    records: fotosWorkspace = [],
    loading: fotosWorkspaceLoading,
    error: fotosWorkspaceError,
    source: fotosWorkspaceSource,
  } = useWorkspaceRecords('fotos', obraId, user)

  const [eventosBanco, setEventosBanco] = useState([])
  const [fotosLegadas, setFotosLegadas] = useState([])
  const [eventosLocais, setEventosLocais] = useState([])
  const [loadingBanco, setLoadingBanco] = useState(false)
  const [timelineAtiva, setTimelineAtiva] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!obraId) {
      setEventosLocais([])
      return undefined
    }

    const atualizar = () => setEventosLocais(readTimelineLocal(obraId))
    const onStorage = (event) => {
      if (event.key === timelineStorageKey(obraId)) atualizar()
    }
    const onTimeline = (event) => {
      if (String(event.detail?.obraId) === String(obraId)) atualizar()
    }

    atualizar()
    window.addEventListener('storage', onStorage)
    window.addEventListener('neocanteiro:timeline-change', onTimeline)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('neocanteiro:timeline-change', onTimeline)
    }
  }, [obraId])

  useEffect(() => {
    let active = true

    async function carregarBanco() {
      if (!obraId || usandoDemo) {
        if (active) {
          setEventosBanco([])
          setFotosLegadas([])
          setTimelineAtiva(false)
          setLoadingBanco(false)
        }
        return
      }

      setLoadingBanco(true)
      setError(null)

      try {
        const { data, error: timelineError } = await supabase
          .from('obra_timeline')
          .select('*')
          .eq('obra_id', String(obraId))
          .order('event_date', { ascending: false })
          .order('created_at', { ascending: false })

        if (timelineError) throw timelineError
        if (active) {
          setEventosBanco((data || []).map((event) => normalizarEvento(event, 'supabase')))
          setTimelineAtiva(true)
        }
      } catch (timelineError) {
        if (active) {
          setEventosBanco([])
          setTimelineAtiva(false)
          setError('A linha do tempo do banco ainda não foi ativada. Os registros disponíveis continuam sendo exibidos.')
        }
      }

      try {
        const diarioIds = diarios
          .map((diario) => String(diario.id || ''))
          .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))

        if (!diarioIds.length) {
          if (active) setFotosLegadas([])
        } else {
          const { data: fotos, error: fotosError } = await supabase
            .from('fotos_diario')
            .select('id, diario_id, url_foto, descricao, created_at')
            .in('diario_id', diarioIds)
            .order('created_at', { ascending: false })

          if (fotosError) throw fotosError
          if (active) setFotosLegadas(fotos || [])
        }
      } catch {
        if (active) setFotosLegadas([])
      } finally {
        if (active) setLoadingBanco(false)
      }
    }

    carregarBanco()
    return () => { active = false }
  }, [obraId, usandoDemo, diarios])

  const eventos = useMemo(() => {
    const diariosVisiveis = diarios.filter((diario) => usandoDemo || diario.created_by_name !== 'NeoCanteiro Demo')
    const eventosDiario = diariosVisiveis.map((diario) => diarioParaEvento(
      diario,
      obraId,
      usandoDemo || diario.created_by_name ? 'local' : 'supabase',
    ))

    const fotosVisiveis = fotosWorkspace.filter((foto) => usandoDemo || fotosWorkspaceSource === 'supabase' || foto.created_by_name !== 'NeoCanteiro Demo')
    const eventosFotosWorkspace = fotosVisiveis.map((foto) => fotoWorkspaceParaEvento(foto, obraId, fotosWorkspaceSource))

    const diariosPorId = new Map(diarios.map((diario) => [String(diario.id), diario]))
    const eventosFotosLegadas = fotosLegadas.map((foto) => {
      const diario = diariosPorId.get(String(foto.diario_id))
      return normalizarEvento({
        id: `foto-${foto.id}`,
        obra_id: obraId,
        event_date: diario?.data || foto.created_at,
        event_type: 'foto',
        title: foto.descricao || 'Registro fotográfico',
        description: diario?.servicos_executados ? `Vinculada ao diário: ${diario.servicos_executados}` : 'Foto vinculada ao diário de obra.',
        metadata: { url: foto.url_foto || '', diario_id: foto.diario_id },
        source_table: 'fotos_diario',
        source_id: foto.id,
        created_at: foto.created_at,
      }, 'supabase')
    })

    const orderedSources = [
      ...eventosBanco,
      ...eventosLocais.map((event) => normalizarEvento(event, 'local')),
      ...eventosDiario,
      ...eventosFotosLegadas,
      ...eventosFotosWorkspace,
    ]

    const unique = new Map()
    orderedSources.forEach((event) => {
      const key = eventKey(event)
      if (!unique.has(key)) unique.set(key, event)
    })

    return Array.from(unique.values()).sort((a, b) => {
      const byDate = String(b.event_date).localeCompare(String(a.event_date))
      if (byDate !== 0) return byDate
      return String(b.created_at || '').localeCompare(String(a.created_at || ''))
    })
  }, [diarios, eventosBanco, eventosLocais, fotosLegadas, fotosWorkspace, fotosWorkspaceSource, obraId, usandoDemo])

  return {
    eventos,
    loading: diariosLoading || fotosWorkspaceLoading || loadingBanco,
    error: error || diariosError || fotosWorkspaceError,
    timelineAtiva,
    source: timelineAtiva ? 'supabase' : 'local',
  }
}

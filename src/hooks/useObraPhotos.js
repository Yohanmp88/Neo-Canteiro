'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function dateKey(value) {
  const raw = String(value || '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : ''
}

function normalizePhoto(record = {}, fallback = {}) {
  const data = record?.data && typeof record.data === 'object' ? record.data : {}
  const flat = { ...record, ...data }
  const url = flat.url || flat.url_foto || flat.foto_url || flat.public_url || flat.image_url || flat.arquivo_url || fallback.url || ''
  if (!url) return null

  return {
    id: String(flat.id || fallback.id || url),
    date: dateKey(flat.data_foto || flat.data_registro || flat.data || flat.event_date || flat.created_at || fallback.date),
    url,
    title: flat.descricao || flat.titulo || flat.etapa || flat.legenda || fallback.title || 'Registro fotográfico',
    description: flat.observacoes || flat.local || flat.description || fallback.description || '',
  }
}

function uniquePhotos(items = []) {
  const unique = new Map()
  items.filter(Boolean).forEach((photo) => {
    const key = photo.url || photo.id
    if (key && !unique.has(key)) unique.set(key, photo)
  })
  return Array.from(unique.values()).sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

export function useObraPhotos(obraId) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!obraId) {
      setPhotos([])
      setLoading(false)
      return []
    }

    setLoading(true)
    setError(null)

    const queries = [
      supabase
        .from('workspace_records')
        .select('*')
        .eq('module_key', 'fotos')
        .eq('obra_id', String(obraId))
        .is('archived_at', null),
      supabase
        .from('obra_timeline')
        .select('*')
        .eq('obra_id', String(obraId))
        .eq('event_type', 'foto'),
      supabase
        .from('fotos_diario')
        .select('*')
        .eq('obra_id', String(obraId)),
      supabase
        .from('fotos_obra')
        .select('*')
        .eq('obra_id', String(obraId)),
    ]

    const results = await Promise.allSettled(queries)
    const collected = []

    results.forEach((result, index) => {
      if (result.status !== 'fulfilled' || result.value?.error) return
      const rows = result.value?.data || []

      rows.forEach((row) => {
        if (index === 1) {
          const metadata = row.metadata || {}
          collected.push(normalizePhoto(metadata, {
            id: row.id,
            date: row.event_date || row.created_at,
            url: metadata.url,
            title: row.title,
            description: row.description,
          }))
          return
        }

        collected.push(normalizePhoto(row))
      })
    })

    const nextPhotos = uniquePhotos(collected)
    setPhotos(nextPhotos)
    if (!nextPhotos.length && results.every((result) => result.status === 'rejected' || result.value?.error)) {
      setError('Não foi possível consultar os registros fotográficos da obra.')
    }
    setLoading(false)
    return nextPhotos
  }, [obraId])

  useEffect(() => {
    load()

    const onWorkspaceChange = (event) => {
      const detail = event.detail || {}
      if (detail.moduleKey === 'fotos' && String(detail.obraId) === String(obraId)) load()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') load()
    }

    window.addEventListener('neocanteiro:workspace-change', onWorkspaceChange)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('neocanteiro:workspace-change', onWorkspaceChange)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [load, obraId])

  return { photos, loading, error, reload: load }
}

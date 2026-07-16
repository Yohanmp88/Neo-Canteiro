const TIMELINE_STORAGE_PREFIX = 'neocanteiro_timeline_v1'

export function timelineStorageKey(obraId) {
  return `${TIMELINE_STORAGE_PREFIX}:${obraId || 'sem-obra'}`
}

export function readTimelineLocal(obraId) {
  if (typeof window === 'undefined' || !obraId) return []

  const raw = window.localStorage.getItem(timelineStorageKey(obraId))
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    window.localStorage.removeItem(timelineStorageKey(obraId))
    return []
  }
}

export function appendTimelineLocal(obraId, event) {
  if (typeof window === 'undefined' || !obraId) return null

  const now = new Date()
  const normalized = {
    id: event.id || `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    obra_id: String(obraId),
    event_date: event.event_date || now.toISOString().slice(0, 10),
    event_type: event.event_type || 'registro',
    title: event.title || 'Registro da obra',
    description: event.description || '',
    metadata: event.metadata || {},
    source_table: event.source_table || 'local',
    source_id: event.source_id ? String(event.source_id) : null,
    created_by_name: event.created_by_name || 'Usuário NeoCanteiro',
    created_at: event.created_at || now.toISOString(),
    storage_source: 'local',
  }

  const current = readTimelineLocal(obraId)
  const next = [normalized, ...current].slice(0, 1500)
  window.localStorage.setItem(timelineStorageKey(obraId), JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('neocanteiro:timeline-change', {
    detail: { obraId: String(obraId), event: normalized, records: next },
  }))

  return normalized
}

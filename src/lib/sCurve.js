const DAY_MS = 24 * 60 * 60 * 1000

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0))
}

export function parseCurveDate(value) {
  if (!value) return null
  const date = value instanceof Date
    ? new Date(value)
    : new Date(`${String(value).slice(0, 10)}T12:00:00`)

  if (Number.isNaN(date.getTime())) return null
  date.setHours(12, 0, 0, 0)
  return date
}

export function curveDateKey(value) {
  const date = parseCurveDate(value)
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function endOfCurveDay(value) {
  const date = parseCurveDate(value)
  if (!date) return null
  date.setHours(23, 59, 59, 999)
  return date
}

function addDays(value, days) {
  const date = parseCurveDate(value)
  if (!date) return null
  date.setDate(date.getDate() + days)
  return date
}

function daysBetween(start, end) {
  const startDate = parseCurveDate(start)
  const endDate = parseCurveDate(end)
  if (!startDate || !endDate) return 0
  return Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS)
}

function taskKey(task) {
  return String(task?.id || task?.external_id || task?.codigo || task?.nome || '')
}

function taskStart(task) {
  return parseCurveDate(task?.data_inicio || task?.inicio)
}

function taskEnd(task) {
  return parseCurveDate(task?.data_termino || task?.termino)
}

function validScheduledTasks(tasks = []) {
  return tasks.filter((task) => {
    const start = taskStart(task)
    const end = taskEnd(task)
    return taskKey(task) && start && end && end >= start
  })
}

function firstPositive(task, fields) {
  for (const field of fields) {
    const value = Number(task?.[field])
    if (Number.isFinite(value) && value > 0) return value
  }
  return 0
}

const PHYSICAL_WEIGHT_FIELDS = ['peso_fisico', 'peso', 'weight', 'percentual_peso']
const COST_WEIGHT_FIELDS = ['custo_total', 'valor_total', 'total', 'valor_orcado', 'valor']

export function resolveCurveWeightMode(tasks = []) {
  const scheduled = validScheduledTasks(tasks)
  if (!scheduled.length) return 'equal'

  if (scheduled.every((task) => firstPositive(task, PHYSICAL_WEIGHT_FIELDS) > 0)) return 'physical'
  if (scheduled.every((task) => firstPositive(task, COST_WEIGHT_FIELDS) > 0)) return 'cost'
  return 'equal'
}

export function curveWeightLabel(mode) {
  if (mode === 'physical') return 'peso físico das atividades'
  if (mode === 'cost') return 'peso financeiro das atividades'
  return 'peso igual por atividade'
}

function taskWeight(task, mode) {
  if (mode === 'physical') return firstPositive(task, PHYSICAL_WEIGHT_FIELDS)
  if (mode === 'cost') return firstPositive(task, COST_WEIGHT_FIELDS)
  return 1
}

function plannedTaskProgress(task, date) {
  const start = taskStart(task)
  const end = taskEnd(task)
  const reference = parseCurveDate(date)
  if (!start || !end || !reference) return 0
  if (reference < start) return 0
  if (reference >= end) return 100

  const duration = Math.max(1, daysBetween(start, end))
  const elapsed = Math.max(0, daysBetween(start, reference))
  return clamp((elapsed / duration) * 100)
}

export function calculatePlannedProgress(tasks = [], date, mode = resolveCurveWeightMode(tasks)) {
  const scheduled = validScheduledTasks(tasks)
  if (!scheduled.length) return 0

  const totalWeight = scheduled.reduce((sum, task) => sum + taskWeight(task, mode), 0)
  if (!totalWeight) return 0

  const weighted = scheduled.reduce(
    (sum, task) => sum + taskWeight(task, mode) * plannedTaskProgress(task, date),
    0,
  )

  return clamp(weighted / totalWeight)
}

export function calculateActualProgress(stateTasks = [], baselineTasks = stateTasks, mode = resolveCurveWeightMode(baselineTasks)) {
  const baseline = validScheduledTasks(baselineTasks)
  if (!baseline.length) return 0

  const states = new Map((stateTasks || []).map((task) => [taskKey(task), task]))
  const totalWeight = baseline.reduce((sum, task) => sum + taskWeight(task, mode), 0)
  if (!totalWeight) return 0

  const weighted = baseline.reduce((sum, baselineTask) => {
    const state = states.get(taskKey(baselineTask))
    return sum + taskWeight(baselineTask, mode) * clamp(state?.progresso || 0)
  }, 0)

  return clamp(weighted / totalWeight)
}

function projectPeriod(tasks = []) {
  const scheduled = validScheduledTasks(tasks)
  if (!scheduled.length) return null

  const starts = scheduled.map(taskStart)
  const ends = scheduled.map(taskEnd)
  return {
    start: new Date(Math.min(...starts.map((date) => date.getTime()))),
    end: new Date(Math.max(...ends.map((date) => date.getTime()))),
  }
}

function historyRecordDate(record) {
  return parseCurveDate(record?.data_referencia || record?.data || record?.created_at)
}

function historyRecordProgress(record) {
  const value = Number(record?.progresso_realizado ?? record?.realizado ?? record?.progresso)
  return Number.isFinite(value) ? clamp(value) : null
}

function normalizeAction(value) {
  const action = String(value || '').trim().toLowerCase()
  if (['insert', 'create', 'created', 'criar', 'criado'].includes(action)) return 'create'
  if (['update', 'updated', 'editar', 'editado', 'atualizar', 'atualizado'].includes(action)) return 'update'
  if (['delete', 'deleted', 'remove', 'removed', 'excluir', 'excluido', 'removido'].includes(action)) return 'delete'
  return ''
}

function normalizeTaskEvent(event) {
  const metadata = event?.metadata || {}
  const before = metadata.before || metadata.old || metadata.previous || metadata.registro_anterior || metadata.old_record || null
  const after = metadata.after || metadata.new || metadata.current || metadata.registro_novo || metadata.new_record || null
  let action = normalizeAction(metadata.action || metadata.operation || metadata.operacao || metadata.event)

  if (!action) {
    if (before && after) action = 'update'
    else if (!before && after) action = 'create'
    else if (before && !after) action = 'delete'
  }

  const id = String(event?.source_id || after?.id || before?.id || '')
  const eventDate = new Date(event?.created_at || `${curveDateKey(event?.event_date)}T23:59:59.999`)
  const taskRelated = event?.source_table === 'tarefas' || event?.event_type === 'cronograma'

  if (!taskRelated || !action || !id || Number.isNaN(eventDate.getTime())) return null
  if (action === 'update' && !before) return null
  if (action === 'delete' && !before) return null

  return { id, action, before, after, eventDate }
}

function reverseEvent(state, event) {
  if (event.action === 'create') {
    state.delete(event.id)
    return
  }

  if (event.before) state.set(event.id, { ...event.before, id: event.before.id || event.id })
}

function reliableTimeline(events, baselineTasks) {
  const normalized = events.map(normalizeTaskEvent).filter(Boolean)
  if (!normalized.length) return { events: [], complete: false, start: null }

  const covered = new Set(normalized.map((event) => event.id))
  const progressed = validScheduledTasks(baselineTasks)
    .filter((task) => clamp(task.progresso) > 0)
    .map(taskKey)

  const complete = progressed.every((id) => covered.has(id))
  const start = normalized.reduce(
    (earliest, event) => (!earliest || event.eventDate < earliest ? event.eventDate : earliest),
    null,
  )

  return {
    events: normalized.sort((a, b) => b.eventDate - a.eventDate),
    complete,
    start,
  }
}

function buildControlDates(period, snapshots, timelineStart, today) {
  if (!period) return [parseCurveDate(today)].filter(Boolean)

  const keys = new Set()
  let cursor = parseCurveDate(period.start)
  const end = parseCurveDate(period.end)

  while (cursor && end && cursor <= end) {
    keys.add(curveDateKey(cursor))
    cursor = addDays(cursor, 7)
  }

  keys.add(curveDateKey(period.start))
  keys.add(curveDateKey(period.end))
  keys.add(curveDateKey(today))
  if (timelineStart) keys.add(curveDateKey(timelineStart))

  snapshots.forEach((record) => {
    const date = historyRecordDate(record)
    if (date) keys.add(curveDateKey(date))
  })

  return Array.from(keys)
    .filter(Boolean)
    .map(parseCurveDate)
    .filter(Boolean)
    .sort((a, b) => a - b)
}

function latestSnapshotAtOrBefore(snapshots, date) {
  const reference = endOfCurveDay(date)
  if (!reference) return null

  const eligible = snapshots
    .map((record) => ({ date: historyRecordDate(record), progress: historyRecordProgress(record) }))
    .filter((item) => item.date && item.progress !== null && item.date <= reference)
    .sort((a, b) => b.date - a.date)

  return eligible[0] || null
}

function formatPointLabel(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function buildSCurveData({ tasks = [], snapshots = [], timelineEvents = [], referenceDate = new Date() } = {}) {
  const baseline = validScheduledTasks(tasks)
  const mode = resolveCurveWeightMode(baseline)
  const period = projectPeriod(baseline)
  const today = parseCurveDate(referenceDate) || parseCurveDate(new Date())
  const currentActual = calculateActualProgress(baseline, baseline, mode)
  const currentPlanned = calculatePlannedProgress(baseline, today, mode)
  const timeline = reliableTimeline(timelineEvents, baseline)
  const controlDates = buildControlDates(period, snapshots, timeline.complete ? timeline.start : null, today)
  const state = new Map(baseline.map((task) => [taskKey(task), { ...task }]))
  let eventIndex = 0
  const descendingDates = [...controlDates].sort((a, b) => b - a)
  const timelineValues = new Map()

  if (timeline.complete) {
    descendingDates.forEach((date) => {
      const end = endOfCurveDay(date)
      while (eventIndex < timeline.events.length && timeline.events[eventIndex].eventDate > end) {
        reverseEvent(state, timeline.events[eventIndex])
        eventIndex += 1
      }
      if (!timeline.start || date >= parseCurveDate(timeline.start)) {
        timelineValues.set(curveDateKey(date), calculateActualProgress(Array.from(state.values()), baseline, mode))
      }
    })
  }

  const firstSnapshot = snapshots
    .map(historyRecordDate)
    .filter(Boolean)
    .sort((a, b) => a - b)[0] || null

  const data = controlDates.map((date) => {
    const key = curveDateKey(date)
    const snapshot = latestSnapshotAtOrBefore(snapshots, date)
    let actual = null

    if (snapshot && (!firstSnapshot || date >= firstSnapshot)) actual = snapshot.progress
    else if (timelineValues.has(key)) actual = timelineValues.get(key)

    if (key === curveDateKey(today)) actual = currentActual
    if (date > today) actual = null

    return {
      date: key,
      label: formatPointLabel(date),
      previsto: Number(calculatePlannedProgress(baseline, date, mode).toFixed(1)),
      realizado: actual === null ? null : Number(clamp(actual).toFixed(1)),
    }
  })

  return {
    data,
    summary: {
      previstoHoje: Number(currentPlanned.toFixed(1)),
      realizadoHoje: Number(currentActual.toFixed(1)),
      desvio: Number((currentActual - currentPlanned).toFixed(1)),
      metodoPeso: mode,
      metodoPesoLabel: curveWeightLabel(mode),
      inicio: period ? curveDateKey(period.start) : '',
      termino: period ? curveDateKey(period.end) : '',
      historicoDesde: firstSnapshot ? curveDateKey(firstSnapshot) : timeline.complete && timeline.start ? curveDateKey(timeline.start) : curveDateKey(today),
      tarefasConsideradas: baseline.length,
      timelineCompleta: timeline.complete,
    },
  }
}

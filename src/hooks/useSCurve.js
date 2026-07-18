'use client'

import { useEffect, useMemo } from 'react'
import { canEditModule, normalizeRole } from '@/lib/accessControl'
import { buildSCurveData, calculateActualProgress, curveDateKey, resolveCurveWeightMode } from '@/lib/sCurve'
import { useTimeline } from '@/hooks/useTimeline'
import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'

export function useSCurve(obraId, tarefas = [], user, role) {
  const activeRole = normalizeRole(role)
  const canWrite = canEditModule(activeRole, 'cronograma')
  const { eventos = [], loading: timelineLoading } = useTimeline(obraId, user)
  const {
    records: snapshots = [],
    loading: snapshotsLoading,
    saving: snapshotSaving,
    create,
    update,
  } = useWorkspaceRecords('curva_s', obraId, user)

  const mode = useMemo(() => resolveCurveWeightMode(tarefas), [tarefas])
  const currentActual = useMemo(
    () => Number(calculateActualProgress(tarefas, tarefas, mode).toFixed(1)),
    [tarefas, mode],
  )
  const today = curveDateKey(new Date())
  const taskSignature = useMemo(
    () => tarefas
      .map((task) => `${task.id || task.nome}:${Number(task.progresso || 0)}:${task.data_inicio || task.inicio || ''}:${task.data_termino || task.termino || ''}`)
      .sort()
      .join('|'),
    [tarefas],
  )
  const signature = `${today}:${currentActual}:${mode}:${taskSignature}`

  useEffect(() => {
    if (!obraId || !canWrite || snapshotsLoading || snapshotSaving || !tarefas.length) return

    const existing = snapshots.find((record) => String(record.data_referencia || record.data || '').slice(0, 10) === today)
    const payload = {
      data_referencia: today,
      progresso_realizado: currentActual,
      metodo_peso: mode,
      tarefas_consideradas: tarefas.length,
      assinatura: signature,
      origem: 'cronograma',
    }

    if (existing?.assinatura === signature) return

    const save = existing?.id ? update(existing.id, payload) : create(payload)
    Promise.resolve(save).catch((error) => {
      console.warn('Não foi possível registrar o histórico da Curva S:', error?.message)
    })
  }, [obraId, canWrite, snapshotsLoading, snapshotSaving, tarefas.length, snapshots, today, currentActual, mode, signature, create, update])

  const result = useMemo(
    () => buildSCurveData({ tasks: tarefas, snapshots, timelineEvents: eventos }),
    [tarefas, snapshots, eventos],
  )

  return {
    ...result,
    loading: timelineLoading || snapshotsLoading,
  }
}

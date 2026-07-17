const fs = require('fs')

const path = 'src/components/dashboard/Schedule.js'
let source = fs.readFileSync(path, 'utf8')

if (!source.includes("import { useEffect, useState } from 'react'")) {
  source = source.replace("'use client'\n\n", "'use client'\n\nimport { useEffect, useState } from 'react'\n")
}

const marker = 'export function CronogramaVisual'
const start = source.indexOf(marker)
if (start < 0) throw new Error('CronogramaVisual não encontrado.')

const replacement = `function EditableScheduleRow({ tarefa, atualizarTarefa, podeEditar }) {
  const [draft, setDraft] = useState({
    nome: tarefa.nome || '',
    inicio: tarefa.inicio || tarefa.data_inicio || '',
    termino: tarefa.termino || tarefa.data_termino || '',
    progresso: Math.max(0, Math.min(100, Number(tarefa.progresso || 0))),
  })
  const [savingField, setSavingField] = useState('')

  useEffect(() => {
    setDraft({
      nome: tarefa.nome || '',
      inicio: tarefa.inicio || tarefa.data_inicio || '',
      termino: tarefa.termino || tarefa.data_termino || '',
      progresso: Math.max(0, Math.min(100, Number(tarefa.progresso || 0))),
    })
  }, [tarefa.id, tarefa.nome, tarefa.inicio, tarefa.data_inicio, tarefa.termino, tarefa.data_termino, tarefa.progresso])

  const saveField = async (field) => {
    if (!podeEditar || !atualizarTarefa || savingField) return

    let value = draft[field]
    if (field === 'nome') {
      value = String(value || '').trim()
      if (!value) {
        setDraft((current) => ({ ...current, nome: tarefa.nome || '' }))
        return
      }
    }

    if (field === 'progresso') {
      value = Math.max(0, Math.min(100, Number(value || 0)))
      setDraft((current) => ({ ...current, progresso: value }))
    }

    const original = field === 'inicio'
      ? tarefa.inicio || tarefa.data_inicio || ''
      : field === 'termino'
        ? tarefa.termino || tarefa.data_termino || ''
        : field === 'progresso'
          ? Math.max(0, Math.min(100, Number(tarefa.progresso || 0)))
          : tarefa.nome || ''

    if (String(value) === String(original)) return

    setSavingField(field)
    try {
      await atualizarTarefa(tarefa.id, field, value)
    } finally {
      setSavingField('')
    }
  }

  const handleKeyDown = (event, field) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
    if (event.key === 'Escape') {
      const original = field === 'inicio'
        ? tarefa.inicio || tarefa.data_inicio || ''
        : field === 'termino'
          ? tarefa.termino || tarefa.data_termino || ''
          : field === 'progresso'
            ? Math.max(0, Math.min(100, Number(tarefa.progresso || 0)))
            : tarefa.nome || ''
      setDraft((current) => ({ ...current, [field]: original }))
      event.currentTarget.blur()
    }
  }

  const atraso = tarefaAtrasadaOperacional({
    ...tarefa,
    nome: draft.nome,
    inicio: draft.inicio,
    data_inicio: draft.inicio,
    termino: draft.termino,
    data_termino: draft.termino,
    progresso: draft.progresso,
  })

  const inputBase = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-slate-600'

  return (
    <tr className="group transition-premium">
      <td className="rounded-l-2xl border-y border-l border-slate-200/60 bg-white p-3 shadow-sm transition-colors group-hover:bg-slate-50/60">
        {podeEditar ? (
          <div className="relative">
            <input
              className={inputBase + ' pr-16'}
              value={draft.nome}
              disabled={savingField === 'nome'}
              onChange={(event) => setDraft((current) => ({ ...current, nome: event.target.value }))}
              onBlur={() => saveField('nome')}
              onKeyDown={(event) => handleKeyDown(event, 'nome')}
              aria-label="Editar atividade"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-wider text-slate-400">
              {savingField === 'nome' ? 'Salvando' : 'Editar'}
            </span>
          </div>
        ) : (
          <p className="font-black text-slate-900">{tarefa.nome}</p>
        )}
      </td>

      <td className="border-y border-slate-200/60 bg-white p-3 text-center shadow-sm transition-colors group-hover:bg-slate-50/60">
        {podeEditar ? (
          <input
            type="date"
            className={inputBase + ' min-w-[142px] text-center'}
            value={draft.inicio}
            disabled={savingField === 'inicio'}
            onChange={(event) => setDraft((current) => ({ ...current, inicio: event.target.value }))}
            onBlur={() => saveField('inicio')}
            onKeyDown={(event) => handleKeyDown(event, 'inicio')}
            aria-label="Editar data de início"
          />
        ) : (
          <span className="text-xs font-bold text-slate-500">{formatarData(draft.inicio, true)}</span>
        )}
      </td>

      <td className="border-y border-slate-200/60 bg-white p-3 text-center shadow-sm transition-colors group-hover:bg-slate-50/60">
        {podeEditar ? (
          <input
            type="date"
            min={draft.inicio || undefined}
            className={inputBase + ' min-w-[142px] text-center ' + (atraso ? 'border-red-200 text-red-600' : '')}
            value={draft.termino}
            disabled={savingField === 'termino'}
            onChange={(event) => setDraft((current) => ({ ...current, termino: event.target.value }))}
            onBlur={() => saveField('termino')}
            onKeyDown={(event) => handleKeyDown(event, 'termino')}
            aria-label="Editar data de término"
          />
        ) : (
          <span className={'text-xs font-bold ' + (atraso ? 'text-red-500' : 'text-slate-500')}>{formatarData(draft.termino, true)}</span>
        )}
      </td>

      <td className="border-y border-slate-200/60 bg-white p-3 text-center shadow-sm transition-colors group-hover:bg-slate-50/60">
        {podeEditar ? (
          <div className="mx-auto flex w-[118px] items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              className={inputBase + ' text-center'}
              value={draft.progresso}
              disabled={savingField === 'progresso'}
              onChange={(event) => setDraft((current) => ({ ...current, progresso: event.target.value }))}
              onBlur={() => saveField('progresso')}
              onKeyDown={(event) => handleKeyDown(event, 'progresso')}
              aria-label="Editar porcentagem executada"
            />
            <span className="text-xs font-black text-slate-400">%</span>
          </div>
        ) : (
          <span className="text-sm font-black text-slate-900">{draft.progresso}%</span>
        )}
      </td>

      <td className="rounded-r-2xl border-y border-r border-slate-200/60 bg-white p-4 shadow-sm transition-colors group-hover:bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={'h-full rounded-full transition-all duration-500 ' + (draft.progresso >= 100 ? 'bg-emerald-500' : atraso ? 'bg-red-500' : 'bg-blue-600')}
              style={{ width: \\`${Math.max(0, Math.min(100, Number(draft.progresso || 0)))}%\\` }}
            />
          </div>
          <span className={'w-10 text-right text-xs font-black ' + (draft.progresso >= 100 ? 'text-emerald-600' : atraso ? 'text-red-600' : 'text-slate-700')}>{draft.progresso}%</span>
          {atraso && <AlertCircle size={14} className="shrink-0 text-red-500" />}
        </div>
      </td>
    </tr>
  )
}

export function CronogramaVisual({ tarefas, atualizarTarefa, podeEditar }) {
  if (!tarefas || !tarefas.length) return null

  return (
    <div>
      {podeEditar && (
        <div className="mb-3 flex flex-col gap-1 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-700">Edição direta do cronograma</p>
            <p className="mt-0.5 text-[10px] font-semibold text-blue-700/80">Altere atividade, início, término ou porcentagem. A informação é salva ao sair do campo ou pressionar Enter.</p>
          </div>
          <span className="text-[8px] font-black uppercase tracking-wider text-blue-500">Esc cancela a alteração</span>
        </div>
      )}

      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[980px]">
          <table className="w-full border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="w-[34%] px-4 py-2">Atividade</th>
                <th className="w-[17%] px-4 py-2 text-center">Início</th>
                <th className="w-[17%] px-4 py-2 text-center">Término</th>
                <th className="w-[14%] px-4 py-2 text-center">Executado</th>
                <th className="w-[18%] px-4 py-2">Status visual</th>
              </tr>
            </thead>
            <tbody>
              {tarefas.map((tarefa) => (
                <EditableScheduleRow
                  key={tarefa.id}
                  tarefa={tarefa}
                  atualizarTarefa={atualizarTarefa}
                  podeEditar={podeEditar}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
`

source = source.slice(0, start) + replacement
fs.writeFileSync(path, source)
console.log('Cronograma editável atualizado.')

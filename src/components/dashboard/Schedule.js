'use client'

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock3,
  Flag,
  Trash2,
} from 'lucide-react'
import {
  normalizarTextoOperacional,
  parseDataOperacional,
  tarefaAtrasadaOperacional,
} from '@/lib/operationalData'

const NOMES_MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

function inicioDoMes(data) {
  return new Date(data.getFullYear(), data.getMonth(), 1, 12, 0, 0, 0)
}

function fimDoMes(data) {
  return new Date(data.getFullYear(), data.getMonth() + 1, 0, 12, 0, 0, 0)
}

function diasEntre(final, inicial) {
  return Math.max(0, Math.round((final - inicial) / 86400000))
}

function formatarData(valor, completa = false) {
  const data = parseDataOperacional(valor)
  if (!data) return '--/--'
  return data.toLocaleDateString('pt-BR', completa
    ? { day: '2-digit', month: 'short', year: 'numeric' }
    : { day: '2-digit', month: '2-digit' })
}

function obterPeriodo(tarefas) {
  const datasInicio = tarefas
    .map((tarefa) => parseDataOperacional(tarefa.inicio || tarefa.data_inicio))
    .filter(Boolean)
  const datasFim = tarefas
    .map((tarefa) => parseDataOperacional(tarefa.termino || tarefa.data_termino))
    .filter(Boolean)

  if (!datasInicio.length || !datasFim.length) return null

  const menorInicio = new Date(Math.min(...datasInicio.map((data) => data.getTime())))
  const maiorFim = new Date(Math.max(...datasFim.map((data) => data.getTime())))
  const inicio = inicioDoMes(menorInicio)
  const fim = fimDoMes(maiorFim)
  const totalDias = diasEntre(fim, inicio) + 1
  const meses = []

  let cursor = new Date(inicio)
  while (cursor <= fim) {
    const inicioMes = inicioDoMes(cursor)
    const fimMes = fimDoMes(cursor)
    const inicioVisivel = inicioMes < inicio ? inicio : inicioMes
    const fimVisivel = fimMes > fim ? fim : fimMes
    const dias = diasEntre(fimVisivel, inicioVisivel) + 1

    meses.push({
      chave: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      nome: NOMES_MESES[cursor.getMonth()],
      ano: cursor.getFullYear(),
      left: (diasEntre(inicioVisivel, inicio) / totalDias) * 100,
      width: (dias / totalDias) * 100,
    })

    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 12, 0, 0, 0)
  }

  return { inicio, fim, totalDias, meses }
}

function obterStatus(tarefa) {
  const status = normalizarTextoOperacional(tarefa.status_operacional || tarefa.status)
  const progresso = Number(tarefa.progresso || 0)

  if (progresso >= 100 || status.includes('concluido')) {
    return {
      texto: 'Concluído',
      classe: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
      barra: 'bg-emerald-500',
      Icone: CheckCircle2,
    }
  }

  if (status.includes('bloquead')) {
    return {
      texto: 'Bloqueado',
      classe: 'bg-amber-50 text-amber-700 ring-amber-100',
      barra: 'bg-amber-500',
      Icone: AlertCircle,
    }
  }

  if (tarefaAtrasadaOperacional(tarefa)) {
    return {
      texto: 'Atrasado',
      classe: 'bg-red-50 text-red-600 ring-red-100',
      barra: 'bg-red-500',
      Icone: AlertCircle,
    }
  }

  if (progresso > 0 || status.includes('andamento')) {
    return {
      texto: 'Em execução',
      classe: 'bg-blue-50 text-blue-700 ring-blue-100',
      barra: 'bg-blue-600',
      Icone: Clock3,
    }
  }

  return {
    texto: 'Planejado',
    classe: 'bg-slate-100 text-slate-600 ring-slate-200',
    barra: 'bg-slate-500',
    Icone: Flag,
  }
}

function GanttMobile({ tarefas }) {
  return (
    <div className="space-y-3 md:hidden">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Visualização para celular</p>
        <p className="mt-1 text-xs font-medium text-blue-600">Toque e role para acompanhar as 20 etapas da obra.</p>
      </div>

      {tarefas.map((tarefa, indice) => {
        const progresso = Math.max(0, Math.min(100, Number(tarefa.progresso || 0)))
        const status = obterStatus(tarefa)
        const IconeStatus = status.Icone

        return (
          <article key={tarefa.id || indice} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-black text-slate-500">
                {String(indice + 1).padStart(2, '0')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-black leading-snug text-slate-900">{tarefa.nome}</h3>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[8px] font-black uppercase ring-1 ${status.classe}`}>
                    <IconeStatus size={9} /> {status.texto}
                  </span>
                </div>

                <p className="mt-2 text-[10px] font-bold text-slate-500">
                  {formatarData(tarefa.inicio || tarefa.data_inicio, true)} — {formatarData(tarefa.termino || tarefa.data_termino, true)}
                </p>
                {tarefa.responsavel && <p className="mt-1 text-[10px] font-medium text-slate-400">{tarefa.responsavel}</p>}

                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${status.barra}`} style={{ width: `${progresso}%` }} />
                  </div>
                  <span className={`w-10 text-right text-xs font-black ${tarefaAtrasadaOperacional(tarefa) ? 'text-red-600' : 'text-slate-900'}`}>
                    {progresso}%
                  </span>
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function GraficoCronograma({ tarefas }) {
  if (!tarefas || !tarefas.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
        <Calendar className="text-slate-300" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhuma tarefa criada.</p>
      </div>
    )
  }

  const periodo = obterPeriodo(tarefas)
  if (!periodo) return null

  const hoje = new Date()
  hoje.setHours(12, 0, 0, 0)
  const hojeDentroDoPeriodo = hoje >= periodo.inicio && hoje <= periodo.fim
  const posicaoHoje = hojeDentroDoPeriodo
    ? (diasEntre(hoje, periodo.inicio) / periodo.totalDias) * 100
    : null

  return (
    <>
      <GanttMobile tarefas={tarefas} />

      <div className="hidden overflow-x-auto pb-3 custom-scrollbar md:block">
        <div className="min-w-[1450px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[320px_1fr_90px] border-b border-slate-200 bg-slate-50">
            <div className="flex items-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Etapas da obra
            </div>

            <div className="relative h-12 border-x border-slate-200">
              {periodo.meses.map((mes) => (
                <div
                  key={mes.chave}
                  className="absolute inset-y-0 flex items-center justify-center border-r border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500"
                  style={{ left: `${mes.left}%`, width: `${mes.width}%` }}
                >
                  {mes.nome}<span className="ml-1 text-slate-300">{String(mes.ano).slice(-2)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Avanço
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {tarefas.map((tarefa, indice) => {
              const inicio = parseDataOperacional(tarefa.inicio || tarefa.data_inicio)
              const fim = parseDataOperacional(tarefa.termino || tarefa.data_termino)
              const progresso = Math.max(0, Math.min(100, Number(tarefa.progresso || 0)))
              const status = obterStatus(tarefa)
              const IconeStatus = status.Icone

              const left = inicio
                ? (diasEntre(inicio, periodo.inicio) / periodo.totalDias) * 100
                : 0
              const width = inicio && fim
                ? Math.max(0.9, ((diasEntre(fim, inicio) + 1) / periodo.totalDias) * 100)
                : 1

              return (
                <div key={tarefa.id || indice} className="grid min-h-[62px] grid-cols-[320px_1fr_90px] transition hover:bg-slate-50/70">
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-500">
                      {String(indice + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-slate-900" title={tarefa.nome}>{tarefa.nome}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400">
                          {formatarData(tarefa.inicio || tarefa.data_inicio)} — {formatarData(tarefa.termino || tarefa.data_termino)}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase ring-1 ${status.classe}`}>
                          <IconeStatus size={8} /> {status.texto}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="relative border-x border-slate-100"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(to right, transparent 0, transparent calc(8.333% - 1px), #f1f5f9 calc(8.333% - 1px), #f1f5f9 8.333%)',
                    }}
                  >
                    {periodo.meses.map((mes) => (
                      <div
                        key={mes.chave}
                        className="pointer-events-none absolute inset-y-0 border-r border-slate-200/80"
                        style={{ left: `${mes.left}%`, width: `${mes.width}%` }}
                      />
                    ))}

                    {posicaoHoje !== null && (
                      <div
                        className="pointer-events-none absolute inset-y-0 z-10 w-px bg-red-400"
                        style={{ left: `${posicaoHoje}%` }}
                        title="Hoje"
                      />
                    )}

                    <div
                      className="absolute top-1/2 h-7 -translate-y-1/2 overflow-hidden rounded-lg bg-slate-200 shadow-sm ring-1 ring-slate-300/50"
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={`${tarefa.nome}: ${formatarData(tarefa.inicio || tarefa.data_inicio)} a ${formatarData(tarefa.termino || tarefa.data_termino)}`}
                    >
                      <div
                        className={`h-full ${status.barra} transition-all duration-700`}
                        style={{ width: `${progresso}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center px-1 text-[8px] font-black text-white drop-shadow-sm">
                        {width > 4 ? `${progresso}%` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center px-3 py-2.5">
                    <div className="text-center">
                      <p className={`text-sm font-black ${tarefaAtrasadaOperacional(tarefa) ? 'text-red-600' : 'text-slate-900'}`}>{progresso}%</p>
                      <p className="text-[8px] font-bold uppercase text-slate-400">executado</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-5 border-t border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-5 rounded bg-blue-600" />
              <span className="text-[9px] font-bold uppercase text-slate-500">Em execução</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-5 rounded bg-emerald-500" />
              <span className="text-[9px] font-bold uppercase text-slate-500">Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-5 rounded bg-red-500" />
              <span className="text-[9px] font-bold uppercase text-slate-500">Atrasado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-5 rounded bg-slate-500" />
              <span className="text-[9px] font-bold uppercase text-slate-500">Planejado</span>
            </div>
            {hojeDentroDoPeriodo && (
              <div className="ml-auto flex items-center gap-2">
                <div className="h-4 w-px bg-red-400" />
                <span className="text-[9px] font-black uppercase text-red-500">Data atual</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export function CronogramaVisual({ tarefas, atualizarTarefa, excluirTarefa, podeEditar }) {
  if (!tarefas || !tarefas.length) return null

  return (
    <div className="overflow-x-auto pb-4 custom-scrollbar">
      <div className="min-w-[880px]">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="px-4 py-2">Atividade</th>
              <th className="px-4 py-2 text-center">Início</th>
              <th className="px-4 py-2 text-center">Término</th>
              <th className="px-4 py-2 text-center">Progresso</th>
              <th className="px-4 py-2">Status Visual</th>
              <th className="w-20 px-4 py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {tarefas.map((tarefa) => {
              const atrasada = tarefaAtrasadaOperacional(tarefa)
              const inicio = tarefa.inicio || tarefa.data_inicio
              const termino = tarefa.termino || tarefa.data_termino

              return (
                <tr key={tarefa.id} className="group transition-premium">
                  <td className="rounded-l-2xl border-y border-l border-slate-200/60 bg-white p-4 shadow-sm transition-colors group-hover:bg-slate-50">
                    {podeEditar ? (
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-black text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        defaultValue={tarefa.nome}
                        onBlur={(event) => {
                          const value = event.target.value.trim()
                          if (value && value !== tarefa.nome) atualizarTarefa(tarefa.id, 'nome', value)
                          if (!value) event.target.value = tarefa.nome
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') event.currentTarget.blur()
                          if (event.key === 'Escape') {
                            event.currentTarget.value = tarefa.nome
                            event.currentTarget.blur()
                          }
                        }}
                        aria-label="Editar atividade"
                      />
                    ) : (
                      <p className="font-black text-slate-900">{tarefa.nome}</p>
                    )}
                  </td>

                  <td className="border-y border-slate-200/60 bg-white p-3 text-center shadow-sm transition-colors group-hover:bg-slate-50">
                    {podeEditar ? (
                      <input
                        type="date"
                        defaultValue={inicio || ''}
                        onBlur={(event) => {
                          if (event.target.value !== (inicio || '')) atualizarTarefa(tarefa.id, 'inicio', event.target.value)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') event.currentTarget.blur()
                          if (event.key === 'Escape') {
                            event.currentTarget.value = inicio || ''
                            event.currentTarget.blur()
                          }
                        }}
                        className="min-w-[145px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        aria-label="Editar data de início"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-500">{formatarData(inicio, true)}</span>
                    )}
                  </td>

                  <td className="border-y border-slate-200/60 bg-white p-3 text-center shadow-sm transition-colors group-hover:bg-slate-50">
                    {podeEditar ? (
                      <input
                        type="date"
                        min={inicio || undefined}
                        defaultValue={termino || ''}
                        onBlur={(event) => {
                          if (event.target.value !== (termino || '')) atualizarTarefa(tarefa.id, 'termino', event.target.value)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') event.currentTarget.blur()
                          if (event.key === 'Escape') {
                            event.currentTarget.value = termino || ''
                            event.currentTarget.blur()
                          }
                        }}
                        className={`min-w-[145px] rounded-xl border bg-slate-50 px-3 py-2 text-center text-xs font-bold outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${atrasada ? 'border-red-200 text-red-600 focus:border-red-400' : 'border-slate-200 text-slate-700 focus:border-blue-400'}`}
                        aria-label="Editar data de término"
                      />
                    ) : (
                      <span className={`text-xs font-bold ${atrasada ? 'text-red-500' : 'text-slate-500'}`}>{formatarData(termino, true)}</span>
                    )}
                  </td>

                  <td className="border-y border-slate-200/60 bg-white p-4 text-center shadow-sm transition-colors group-hover:bg-slate-50">
                    {podeEditar && atualizarTarefa ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          defaultValue={Math.max(0, Math.min(100, Number(tarefa.progresso || 0)))}
                          onBlur={(event) => {
                            const value = Math.max(0, Math.min(100, Number(event.target.value || 0)))
                            event.target.value = value
                            if (value !== Number(tarefa.progresso || 0)) atualizarTarefa(tarefa.id, 'progresso', value)
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') event.currentTarget.blur()
                            if (event.key === 'Escape') {
                              event.currentTarget.value = Math.max(0, Math.min(100, Number(tarefa.progresso || 0)))
                              event.currentTarget.blur()
                            }
                          }}
                          className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                          aria-label="Editar porcentagem executada"
                        />
                        <span className="text-xs font-bold text-slate-400">%</span>
                      </div>
                    ) : (
                      <span className="text-sm font-black text-slate-900">{tarefa.progresso}%</span>
                    )}
                  </td>

                  <td className="border-y border-slate-200/60 bg-white p-4 shadow-sm transition-colors group-hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full transition-all duration-500 ${atrasada ? 'bg-red-500' : 'bg-blue-600'}`}
                          style={{ width: `${Math.max(0, Math.min(100, Number(tarefa.progresso || 0)))}%` }}
                        />
                      </div>
                      {atrasada && <AlertCircle size={14} className="text-red-500" />}
                    </div>
                  </td>

                  <td className="rounded-r-2xl border-y border-r border-slate-200/60 bg-white p-3 text-center shadow-sm transition-colors group-hover:bg-slate-50">
                    {podeEditar && excluirTarefa ? (
                      <button
                        type="button"
                        onClick={() => {
                          const confirmado = window.confirm(`Excluir definitivamente a atividade “${tarefa.nome}”?`)
                          if (confirmado) excluirTarefa(tarefa.id)
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:border-red-200 hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                        title="Excluir atividade"
                        aria-label={`Excluir atividade ${tarefa.nome}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

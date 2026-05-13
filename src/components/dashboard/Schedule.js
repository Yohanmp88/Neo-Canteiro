'use client'

import { PanelClean } from '@/components/ui/Cards'
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export function GraficoCronograma({ tarefas }) {
  if (!tarefas || !tarefas.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center flex flex-col items-center gap-3">
        <Calendar className="text-slate-300" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhuma tarefa criada.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-4 custom-scrollbar">
      <div className="min-w-[800px] space-y-6">
        {/* Timeline Header */}
        <div className="grid grid-cols-[200px_1fr_100px] gap-6 px-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Atividade</span>
          <div className="flex justify-between px-2">
            {['Maio', 'Junho', 'Julho'].map(mes => (
              <span key={mes} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{mes}</span>
            ))}
          </div>
          <span className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Progresso</span>
        </div>

        {/* Tasks */}
        <div className="space-y-4">
          {tarefas.map((t) => {
            const isAtrasada = t.progresso < 100 && new Date(t.termino) < new Date()
            
            // Simulação de posicionamento baseada em datas (melhorada)
            const start = new Date(t.inicio)
            const end = new Date(t.termino)
            const duration = Math.max(1, (end - start) / (1000 * 60 * 60 * 24))
            
            const plannedLeft = Math.max(0, Number(t.inicioGrafico || 0))
            const plannedWidth = Math.max(Number(t.duracao || 1) * 3, 5)

            return (
              <div key={t.id} className="grid grid-cols-[200px_1fr_100px] gap-6 items-center group">
                <div className="pl-4 border-l-4 border-transparent group-hover:border-blue-600 transition-all">
                  <p className="text-sm font-black text-slate-900 truncate">{t.nome}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {isAtrasada ? (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md ring-1 ring-red-100">
                        <AlertCircle size={10} /> Atrasado
                      </span>
                    ) : t.progresso === 100 ? (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md ring-1 ring-emerald-100">
                        <CheckCircle2 size={10} /> Concluído
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md ring-1 ring-blue-100">
                        <Clock size={10} /> Em dia
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative h-10 bg-slate-50/50 rounded-2xl overflow-hidden group-hover:bg-slate-100 transition-colors border border-slate-100">
                  {/* Planned Bar */}
                  <div 
                    className="absolute top-2 h-2 rounded-full bg-slate-200" 
                    style={{ left: `${plannedLeft}%`, width: `${plannedWidth}%` }}
                  ></div>
                  
                  {/* Actual Progress Bar */}
                  <div 
                    className={`absolute bottom-2 h-4 rounded-xl shadow-sm transition-all duration-500 ${isAtrasada ? 'bg-red-500 shadow-red-200' : 'bg-blue-600 shadow-blue-200'}`}
                    style={{ left: `${plannedLeft}%`, width: `${plannedWidth * (t.progresso / 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse-subtle"></div>
                  </div>
                </div>

                <div className="text-right pr-4">
                  <span className={`text-sm font-black ${isAtrasada ? 'text-red-600' : 'text-slate-900'}`}>
                    {t.progresso}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 pt-6 border-t border-slate-100 px-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-md bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Previsto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-md bg-blue-600"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Realizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-md bg-red-500"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Atraso Crítico</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CronogramaVisual({ tarefas, atualizarProgresso, atualizarTarefa, podeEditar }) {
  if (!tarefas || !tarefas.length) return null

  return (
    <div className="overflow-x-auto pb-4 custom-scrollbar">
      <div className="min-w-[1000px]">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="px-4 py-2">Atividade</th>
              <th className="px-4 py-2 text-center">Início</th>
              <th className="px-4 py-2 text-center">Término</th>
              <th className="px-4 py-2 text-center">Progresso</th>
              <th className="px-4 py-2">Status Visual</th>
            </tr>
          </thead>
          <tbody>
            {tarefas.map((t) => {
              const isAtrasada = t.progresso < 100 && new Date(t.termino) < new Date()
              
              return (
                <tr key={t.id} className="group transition-premium">
                  <td className="bg-white border-y border-l border-slate-200/60 rounded-l-2xl p-4 shadow-sm group-hover:bg-slate-50 transition-colors">
                    {podeEditar ? (
                      <input 
                        className="bg-transparent font-black text-slate-900 outline-none w-full" 
                        value={t.nome} 
                        onChange={(e) => atualizarTarefa(t.id, 'nome', e.target.value)} 
                      />
                    ) : (
                      <p className="font-black text-slate-900">{t.nome}</p>
                    )}
                  </td>
                  
                  <td className="bg-white border-y border-slate-200/60 p-4 shadow-sm text-center group-hover:bg-slate-50 transition-colors">
                    <span className="text-xs font-bold text-slate-500">
                      {new Date(t.inicio).toLocaleDateString('pt-BR')}
                    </span>
                  </td>

                  <td className="bg-white border-y border-slate-200/60 p-4 shadow-sm text-center group-hover:bg-slate-50 transition-colors">
                    <span className={`text-xs font-bold ${isAtrasada ? 'text-red-500' : 'text-slate-500'}`}>
                      {new Date(t.termino).toLocaleDateString('pt-BR')}
                    </span>
                  </td>

                  <td className="bg-white border-y border-slate-200/60 p-4 shadow-sm text-center group-hover:bg-slate-50 transition-colors">
                    {podeEditar ? (
                      <div className="flex items-center gap-2 justify-center">
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          value={t.progresso} 
                          onChange={(e) => atualizarProgresso(t.id, e.target.value)} 
                          className="w-16 bg-slate-100 rounded-lg px-2 py-1 text-center font-black text-xs border border-slate-200" 
                        />
                        <span className="text-xs font-bold text-slate-400">%</span>
                      </div>
                    ) : (
                      <span className="text-sm font-black text-slate-900">{t.progresso}%</span>
                    )}
                  </td>

                  <td className="bg-white border-y border-r border-slate-200/60 rounded-r-2xl p-4 shadow-sm group-hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${isAtrasada ? 'bg-red-500' : 'bg-blue-600'}`}
                          style={{ width: `${t.progresso}%` }}
                        ></div>
                      </div>
                      {isAtrasada && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
                    </div>
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

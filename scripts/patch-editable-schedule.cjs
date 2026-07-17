const fs = require('fs')

const path = 'src/components/dashboard/Schedule.js'
let source = fs.readFileSync(path, 'utf8')

function replaceOnce(search, replacement, label) {
  if (source.includes(replacement)) return
  if (!source.includes(search)) throw new Error(`Trecho não encontrado: ${label}`)
  source = source.replace(search, replacement)
}

replaceOnce(
`                    {podeEditar ? (
                      <input
                        className="w-full bg-transparent font-black text-slate-900 outline-none"
                        value={tarefa.nome}
                        onChange={(event) => atualizarTarefa(tarefa.id, 'nome', event.target.value)}
                      />
                    ) : (
                      <p className="font-black text-slate-900">{tarefa.nome}</p>
                    )}`,
`                    {podeEditar ? (
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
                    )}`,
  'edição da atividade',
)

replaceOnce(
`                  <td className="border-y border-slate-200/60 bg-white p-4 text-center shadow-sm transition-colors group-hover:bg-slate-50">
                    <span className="text-xs font-bold text-slate-500">{formatarData(inicio, true)}</span>
                  </td>`,
`                  <td className="border-y border-slate-200/60 bg-white p-3 text-center shadow-sm transition-colors group-hover:bg-slate-50">
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
                  </td>`,
  'edição da data inicial',
)

replaceOnce(
`                  <td className="border-y border-slate-200/60 bg-white p-4 text-center shadow-sm transition-colors group-hover:bg-slate-50">
                    <span className={\`text-xs font-bold \${atrasada ? 'text-red-500' : 'text-slate-500'}\`}>{formatarData(termino, true)}</span>
                  </td>`,
`                  <td className="border-y border-slate-200/60 bg-white p-3 text-center shadow-sm transition-colors group-hover:bg-slate-50">
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
                        className={\`min-w-[145px] rounded-xl border bg-slate-50 px-3 py-2 text-center text-xs font-bold outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/10 \${atrasada ? 'border-red-200 text-red-600 focus:border-red-400' : 'border-slate-200 text-slate-700 focus:border-blue-400'}\`}
                        aria-label="Editar data de término"
                      />
                    ) : (
                      <span className={\`text-xs font-bold \${atrasada ? 'text-red-500' : 'text-slate-500'}\`}>{formatarData(termino, true)}</span>
                    )}
                  </td>`,
  'edição da data final',
)

replaceOnce(
`                    {podeEditar && atualizarProgresso ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={tarefa.progresso}
                          onChange={(event) => atualizarProgresso(tarefa.id, event.target.value)}
                          className="w-16 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-center text-xs font-black"
                        />
                        <span className="text-xs font-bold text-slate-400">%</span>
                      </div>
                    ) : (`,
`                    {podeEditar && atualizarTarefa ? (
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
                    ) : (`,
  'edição do progresso',
)

source = source.replace(
  'export function CronogramaVisual({ tarefas, atualizarProgresso, atualizarTarefa, podeEditar }) {',
  'export function CronogramaVisual({ tarefas, atualizarTarefa, podeEditar }) {',
)

fs.writeFileSync(path, source)
console.log('Atividade, datas e porcentagem agora são editáveis no cronograma.')

const fs = require('fs')

function replaceRequired(source, search, replacement, label) {
  if (source.includes(replacement)) return source
  if (!source.includes(search)) throw new Error(`Trecho não encontrado: ${label}`)
  return source.replace(search, replacement)
}

const pagePath = 'src/app/page.js'
let page = fs.readFileSync(pagePath, 'utf8')

page = replaceRequired(
  page,
  "const { tarefas: tarefasRaw = [], criar: adicionarTarefaHook, atualizar: atualizarTarefaHook } = useTarefas(obraAtualId)",
  "const { tarefas: tarefasRaw = [], criar: adicionarTarefaHook, atualizar: atualizarTarefaHook, deletar: deletarTarefaHook } = useTarefas(obraAtualId)",
  'hook de tarefas',
)

page = replaceRequired(
  page,
`  async function atualizarTarefa(id, campo, valor) {
    if (!permissaoEditar) return
    const dbField = campo === 'inicio' ? 'data_inicio' : campo === 'termino' ? 'data_termino' : campo
    try {
      triggerFeedback('saving')
      await atualizarTarefaHook(id, { [dbField]: valor })
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', e.message) }
  }

  async function importarCronogramaExcel`,
`  async function atualizarTarefa(id, campo, valor) {
    if (!permissaoEditar) return
    const dbField = campo === 'inicio' ? 'data_inicio' : campo === 'termino' ? 'data_termino' : campo
    try {
      triggerFeedback('saving')
      await atualizarTarefaHook(id, { [dbField]: valor })
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', e.message) }
  }

  async function excluirTarefa(id) {
    if (!permissaoEditar || !id) return
    try {
      triggerFeedback('saving')
      await deletarTarefaHook(id)
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', e.message) }
  }

  async function importarCronogramaExcel`,
  'handler de exclusão',
)

page = replaceRequired(
  page,
  "{tela === 'cronograma' && <TelaCronograma permissaoEditar={permissaoEditar} novaTarefa={novaTarefa} setNovaTarefa={setNovaTarefa} adicionarTarefa={adicionarTarefa} tarefas={tarefas} atualizarTarefa={atualizarTarefa} importarCronogramaExcel={importarCronogramaExcel} obraAtual={obraAtualSegura} />}",
  "{tela === 'cronograma' && <TelaCronograma permissaoEditar={permissaoEditar} novaTarefa={novaTarefa} setNovaTarefa={setNovaTarefa} adicionarTarefa={adicionarTarefa} tarefas={tarefas} atualizarTarefa={atualizarTarefa} excluirTarefa={excluirTarefa} importarCronogramaExcel={importarCronogramaExcel} obraAtual={obraAtualSegura} />}",
  'propriedade excluirTarefa',
)

page = replaceRequired(
  page,
  "function TelaCronograma({ permissaoEditar, novaTarefa, setNovaTarefa, adicionarTarefa, tarefas, atualizarTarefa, importarCronogramaExcel, obraAtual }) {",
  "function TelaCronograma({ permissaoEditar, novaTarefa, setNovaTarefa, adicionarTarefa, tarefas, atualizarTarefa, excluirTarefa, importarCronogramaExcel, obraAtual }) {",
  'assinatura TelaCronograma',
)

page = replaceRequired(
  page,
  '<CronogramaVisual tarefas={tarefas} atualizarTarefa={atualizarTarefa} podeEditar={permissaoEditar} />',
  '<CronogramaVisual tarefas={tarefas} atualizarTarefa={atualizarTarefa} excluirTarefa={excluirTarefa} podeEditar={permissaoEditar} />',
  'CronogramaVisual com exclusão',
)

fs.writeFileSync(pagePath, page)

const schedulePath = 'src/components/dashboard/Schedule.js'
let schedule = fs.readFileSync(schedulePath, 'utf8')

schedule = replaceRequired(
  schedule,
  "  Flag,\n} from 'lucide-react'",
  "  Flag,\n  Trash2,\n} from 'lucide-react'",
  'ícone de exclusão',
)

schedule = replaceRequired(
  schedule,
  'export function CronogramaVisual({ tarefas, atualizarTarefa, podeEditar }) {',
  'export function CronogramaVisual({ tarefas, atualizarTarefa, excluirTarefa, podeEditar }) {',
  'assinatura CronogramaVisual',
)

schedule = replaceRequired(
  schedule,
  `              <th className="px-4 py-2">Status Visual</th>
            </tr>`,
  `              <th className="px-4 py-2">Status Visual</th>
              <th className="w-20 px-4 py-2 text-center">Ações</th>
            </tr>`,
  'coluna de ações',
)

schedule = replaceRequired(
  schedule,
  `                  <td className="rounded-r-2xl border-y border-r border-slate-200/60 bg-white p-4 shadow-sm transition-colors group-hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={\`h-full transition-all duration-500 \${atrasada ? 'bg-red-500' : 'bg-blue-600'}\`}
                          style={{ width: \`\${Math.max(0, Math.min(100, Number(tarefa.progresso || 0)))}%\` }}
                        />
                      </div>
                      {atrasada && <AlertCircle size={14} className="text-red-500" />}
                    </div>
                  </td>`,
  `                  <td className="border-y border-slate-200/60 bg-white p-4 shadow-sm transition-colors group-hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={\`h-full transition-all duration-500 \${atrasada ? 'bg-red-500' : 'bg-blue-600'}\`}
                          style={{ width: \`\${Math.max(0, Math.min(100, Number(tarefa.progresso || 0)))}%\` }}
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
                          const confirmado = window.confirm(\`Excluir definitivamente a atividade “\${tarefa.nome}”?\`)
                          if (confirmado) excluirTarefa(tarefa.id)
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:border-red-200 hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                        title="Excluir atividade"
                        aria-label={\`Excluir atividade \${tarefa.nome}\`}
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-300">—</span>
                    )}
                  </td>`,
  'botão de exclusão',
)

fs.writeFileSync(schedulePath, schedule)
console.log('Exclusão de atividades adicionada ao cronograma.')

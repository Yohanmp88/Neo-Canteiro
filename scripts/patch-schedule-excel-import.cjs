const fs = require('fs')

const path = 'src/app/page.js'
let source = fs.readFileSync(path, 'utf8')

function replaceOnce(search, replacement, label) {
  if (source.includes(replacement)) return
  if (!source.includes(search)) throw new Error(`Trecho não encontrado: ${label}`)
  source = source.replace(search, replacement)
}

replaceOnce(
  "import { exportScheduleToExcel } from '@/lib/exportScheduleExcel'",
  "import { exportScheduleToExcel } from '@/lib/exportScheduleExcel'\nimport { ScheduleExcelImport } from '@/components/platform/ScheduleExcelImport'",
  'importação do componente Excel',
)

replaceOnce(
`  async function atualizarTarefa(id, campo, valor) {
    if (!permissaoEditar) return
    const dbField = campo === 'inicio' ? 'data_inicio' : campo === 'termino' ? 'data_termino' : campo
    try {
      triggerFeedback('saving')
      await atualizarTarefaHook(id, { [dbField]: valor })
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', e.message) }
  }

  // Equipe`,
`  async function atualizarTarefa(id, campo, valor) {
    if (!permissaoEditar) return
    const dbField = campo === 'inicio' ? 'data_inicio' : campo === 'termino' ? 'data_termino' : campo
    try {
      triggerFeedback('saving')
      await atualizarTarefaHook(id, { [dbField]: valor })
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', e.message) }
  }

  async function importarCronogramaExcel(itens = []) {
    if (!permissaoEditar || !obraAtualId) throw new Error('Seu perfil não permite importar o cronograma.')
    if (!Array.isArray(itens) || !itens.length) throw new Error('Nenhuma atividade válida foi encontrada.')

    const normalizeName = (value) => String(value || '')
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\\s+/g, ' ')

    const byId = new Map((tarefasRaw || []).map((item) => [String(item.id), item]))
    const byName = new Map((tarefasRaw || []).map((item) => [normalizeName(item.nome), item]))
    let created = 0
    let updated = 0

    triggerFeedback('saving')

    try {
      for (const item of itens) {
        const existing = (item.external_id && byId.get(String(item.external_id))) || byName.get(normalizeName(item.nome))
        const payload = {
          nome: String(item.nome || '').trim(),
          data_inicio: item.data_inicio || null,
          data_termino: item.data_termino || null,
          progresso: Math.max(0, Math.min(100, Number(item.progresso || 0))),
        }

        if (existing?.id) {
          const saved = await atualizarTarefaHook(existing.id, payload)
          const current = saved || { ...existing, ...payload }
          byId.set(String(existing.id), current)
          byName.set(normalizeName(current.nome), current)
          updated += 1
        } else {
          const saved = await adicionarTarefaHook({ obra_id: obraAtualId, ...payload })
          if (saved?.id) byId.set(String(saved.id), saved)
          byName.set(normalizeName(payload.nome), saved || payload)
          created += 1
        }
      }

      triggerFeedback('saved')
      return { created, updated, total: itens.length }
    } catch (error) {
      triggerFeedback('error', error.message)
      throw error
    }
  }

  // Equipe`,
  'função de importação do cronograma',
)

replaceOnce(
  "{tela === 'cronograma' && <TelaCronograma permissaoEditar={permissaoEditar} novaTarefa={novaTarefa} setNovaTarefa={setNovaTarefa} adicionarTarefa={adicionarTarefa} tarefas={tarefas} atualizarTarefa={atualizarTarefa} obraAtual={obraAtualSegura} />}",
  "{tela === 'cronograma' && <TelaCronograma permissaoEditar={permissaoEditar} novaTarefa={novaTarefa} setNovaTarefa={setNovaTarefa} adicionarTarefa={adicionarTarefa} tarefas={tarefas} atualizarTarefa={atualizarTarefa} importarCronogramaExcel={importarCronogramaExcel} obraAtual={obraAtualSegura} />}",
  'propriedade de importação na tela do cronograma',
)

replaceOnce(
  "function TelaCronograma({ permissaoEditar, novaTarefa, setNovaTarefa, adicionarTarefa, tarefas, atualizarTarefa, obraAtual }) {",
  "function TelaCronograma({ permissaoEditar, novaTarefa, setNovaTarefa, adicionarTarefa, tarefas, atualizarTarefa, importarCronogramaExcel, obraAtual }) {",
  'assinatura da tela do cronograma',
)

replaceOnce(
`        <button
          type="button"
          onClick={exportarCronograma}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-[0_12px_28px_-18px_rgba(5,150,105,0.8)] transition hover:-translate-y-0.5 hover:bg-emerald-700 active:translate-y-0"
        >
          Exportar Excel
        </button>`,
`        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ScheduleExcelImport canEdit={permissaoEditar} onImport={importarCronogramaExcel} />
          <button
            type="button"
            onClick={exportarCronograma}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-[0_12px_28px_-18px_rgba(5,150,105,0.8)] transition hover:-translate-y-0.5 hover:bg-emerald-700 active:translate-y-0"
          >
            Exportar Excel
          </button>
        </div>`,
  'botões importar e exportar',
)

fs.writeFileSync(path, source)
console.log('Importação de cronograma Excel integrada ao NeoCanteiro.')

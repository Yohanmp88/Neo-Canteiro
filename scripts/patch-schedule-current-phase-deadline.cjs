const fs = require('fs')

function replaceRequired(source, search, replacement, label) {
  if (source.includes(replacement)) return source
  if (!source.includes(search)) throw new Error(`Trecho não encontrado: ${label}`)
  return source.replace(search, replacement)
}

// 1) Prazo da obra editável e conectado ao Supabase.
const pagePath = 'src/app/page.js'
let page = fs.readFileSync(pagePath, 'utf8')

page = replaceRequired(
  page,
  "const { obras: obrasRaw = [], loading: obrasLoading, criar: criarObraHook } = useObras()",
  "const { obras: obrasRaw = [], loading: obrasLoading, criar: criarObraHook, atualizar: atualizarObraHook } = useObras()",
  'hook de obras com atualização',
)

page = replaceRequired(
  page,
`  async function excluirTarefa(id) {
    if (!permissaoEditar || !id) return
    try {
      triggerFeedback('saving')
      await deletarTarefaHook(id)
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', e.message) }
  }

  async function importarCronogramaExcel`,
`  async function excluirTarefa(id) {
    if (!permissaoEditar || !id) return
    try {
      triggerFeedback('saving')
      await deletarTarefaHook(id)
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', e.message) }
  }

  async function atualizarPrazoEntrega(valor) {
    if (!permissaoEditar || !obraAtualId || String(obraAtualId).startsWith('demo')) return
    try {
      triggerFeedback('saving')
      await atualizarObraHook(obraAtualId, { prazo_final: valor || null })
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', e.message) }
  }

  async function importarCronogramaExcel`,
  'handler do prazo da obra',
)

page = replaceRequired(
  page,
  "{tela === 'cronograma' && <TelaCronograma permissaoEditar={permissaoEditar} novaTarefa={novaTarefa} setNovaTarefa={setNovaTarefa} adicionarTarefa={adicionarTarefa} tarefas={tarefas} atualizarTarefa={atualizarTarefa} excluirTarefa={excluirTarefa} importarCronogramaExcel={importarCronogramaExcel} obraAtual={obraAtualSegura} />}",
  "{tela === 'cronograma' && <TelaCronograma permissaoEditar={permissaoEditar} novaTarefa={novaTarefa} setNovaTarefa={setNovaTarefa} adicionarTarefa={adicionarTarefa} tarefas={tarefas} atualizarTarefa={atualizarTarefa} excluirTarefa={excluirTarefa} atualizarPrazoEntrega={atualizarPrazoEntrega} importarCronogramaExcel={importarCronogramaExcel} obraAtual={obraAtualSegura} />}",
  'prazo na TelaCronograma',
)

page = replaceRequired(
  page,
  "function TelaCronograma({ permissaoEditar, novaTarefa, setNovaTarefa, adicionarTarefa, tarefas, atualizarTarefa, excluirTarefa, importarCronogramaExcel, obraAtual }) {",
  "function TelaCronograma({ permissaoEditar, novaTarefa, setNovaTarefa, adicionarTarefa, tarefas, atualizarTarefa, excluirTarefa, atualizarPrazoEntrega, importarCronogramaExcel, obraAtual }) {",
  'assinatura da TelaCronograma',
)

page = replaceRequired(
  page,
`  const progressoGlobal = total > 0 ? Math.round(tarefas.reduce((a, t) => a + Number(t.progresso), 0) / total) : 0
  const exportarCronograma = () => exportScheduleToExcel({ obra: obraAtual, tarefas })`,
`  const progressoGlobal = total > 0 ? Math.round(tarefas.reduce((a, t) => a + Number(t.progresso), 0) / total) : 0
  const prazoFinalCronograma = tarefas.reduce((ultimo, tarefa) => {
    const data = String(tarefa.termino || tarefa.data_termino || '').slice(0, 10)
    return data && (!ultimo || data > ultimo) ? data : ultimo
  }, '')
  const prazoEntregaAtual = obraAtual.prazo_final || prazoFinalCronograma || ''
  const formatarPrazo = (valor) => valor
    ? new Date(\`${'${String(valor).slice(0, 10)}'}T12:00:00\`).toLocaleDateString('pt-BR')
    : 'Não definido'
  const exportarCronograma = () => exportScheduleToExcel({ obra: obraAtual, tarefas })`,
  'cálculo automático do prazo final',
)

page = replaceRequired(
  page,
`        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <p className={eyebrowClass + " mb-1"}>Prazo Final</p>
          <h4 className="text-2xl font-black text-slate-900">
            {obraAtual.prazo_final ? new Date(obraAtual.prazo_final).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
          </h4>
          <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{obraAtual.prazo || 'Data Estimada'}</p>
        </div>`,
`        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm">
          <p className={eyebrowClass + " mb-2"}>Prazo de entrega da obra</p>
          {permissaoEditar ? (
            <input
              key={\`${'${obraAtual.id}:${prazoEntregaAtual}'}\`}
              type="date"
              defaultValue={prazoEntregaAtual}
              onChange={(event) => atualizarPrazoEntrega(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              aria-label="Editar prazo de entrega da obra"
            />
          ) : (
            <h4 className="text-2xl font-black text-slate-900">{formatarPrazo(prazoEntregaAtual)}</h4>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[9px] font-bold text-slate-500">Fim automático: {formatarPrazo(prazoFinalCronograma)}</p>
            {permissaoEditar && prazoFinalCronograma && prazoFinalCronograma !== obraAtual.prazo_final && (
              <button type="button" onClick={() => atualizarPrazoEntrega(prazoFinalCronograma)} className="shrink-0 text-[8px] font-black uppercase tracking-wider text-blue-600 hover:text-blue-700">
                Usar data
              </button>
            )}
          </div>
        </div>`,
  'card editável de prazo',
)

fs.writeFileSync(pagePath, page)

// 2) Dashboard mostra primeiro o que está em execução hoje.
const dashboardPath = 'src/components/dashboard/views/DashboardView.js'
let dashboard = fs.readFileSync(dashboardPath, 'utf8')

dashboard = replaceRequired(
  dashboard,
`function formatDate(value, options = { day: '2-digit', month: 'short' }) {
  if (!value) return '—'
  const date = new Date(\`${'${String(value).slice(0, 10)}'}T12:00:00\`)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR', options)
}`,
`function formatDate(value, options = { day: '2-digit', month: 'short' }) {
  if (!value) return '—'
  const date = new Date(\`${'${String(value).slice(0, 10)}'}T12:00:00\`)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR', options)
}

function parseScheduleDate(value) {
  if (!value) return null
  const date = new Date(\`${'${String(value).slice(0, 10)}'}T12:00:00\`)
  return Number.isNaN(date.getTime()) ? null : date
}`,
  'parser de datas do dashboard',
)

dashboard = replaceRequired(
  dashboard,
`  const prazoFinal = obraAtual.prazo_final || obraAtual.previsao_entrega || obraAtual.previsaoEntrega
  const ultimoDiario = diariosVisiveis[0] || null`,
`  const prazoFinalCronograma = tarefas.reduce((ultimo, tarefa) => {
    const data = String(tarefa.data_termino || tarefa.termino || '').slice(0, 10)
    return data && (!ultimo || data > ultimo) ? data : ultimo
  }, '')
  const prazoFinal = obraAtual.prazo_final || obraAtual.previsao_entrega || obraAtual.previsaoEntrega || prazoFinalCronograma
  const ultimoDiario = diariosVisiveis[0] || null`,
  'prazo automático no dashboard',
)

dashboard = replaceRequired(
  dashboard,
`  const tarefasOrdenadas = useMemo(() => [...tarefas]
    .sort((a, b) => new Date(a.data_termino || a.termino || '2999-12-31') - new Date(b.data_termino || b.termino || '2999-12-31')),
  [tarefas])

  const dadosEvolucao = useMemo(() => {`,
`  const tarefasOrdenadas = useMemo(() => [...tarefas]
    .sort((a, b) => new Date(a.data_termino || a.termino || '2999-12-31') - new Date(b.data_termino || b.termino || '2999-12-31')),
  [tarefas])

  const hoje = new Date()
  hoje.setHours(12, 0, 0, 0)
  const estaEmExecucaoHoje = (tarefa) => {
    const inicio = parseScheduleDate(tarefa.data_inicio || tarefa.inicio)
    const termino = parseScheduleDate(tarefa.data_termino || tarefa.termino)
    const progresso = Number(tarefa.progresso || 0)
    return progresso < 100 && inicio && termino && inicio <= hoje && termino >= hoje
  }
  const tarefasHoje = tarefasOrdenadas.filter(estaEmExecucaoHoje)
  const tarefasEmAndamento = tarefasOrdenadas.filter((tarefa) => {
    const progresso = Number(tarefa.progresso || 0)
    return progresso > 0 && progresso < 100 && !tarefasHoje.some((atual) => String(atual.id) === String(tarefa.id))
  })
  const tarefasFuturas = tarefasOrdenadas.filter((tarefa) => {
    const inicio = parseScheduleDate(tarefa.data_inicio || tarefa.inicio)
    return Number(tarefa.progresso || 0) < 100 && inicio && inicio > hoje
  })
  const tarefasDestaque = [...tarefasHoje, ...tarefasEmAndamento, ...tarefasFuturas, ...tarefasOrdenadas]
    .filter((tarefa, index, lista) => lista.findIndex((item) => String(item.id) === String(tarefa.id)) === index)
    .slice(0, 5)
  const faseAtual = tarefasHoje[0]?.etapa || tarefasHoje[0]?.fase || tarefasHoje[0]?.categoria || obraAtual.etapa || 'Execução da obra'
  const tituloCronograma = tarefasHoje.length ? \`Fase atual — ${'${faseAtual}'}\` : \`Próximas atividades — ${'${faseAtual}'}\`

  const dadosEvolucao = useMemo(() => {`,
  'priorização das atividades atuais',
)

dashboard = replaceRequired(
  dashboard,
  '<PanelHeader eyebrow="Cronograma físico" title="Atividades e avanço da obra" action="Ver completo" onAction={() => navigate(\'cronograma\')} />',
  '<PanelHeader eyebrow="Cronograma físico · hoje" title={tituloCronograma} action="Ver completo" onAction={() => navigate(\'cronograma\')} />',
  'título da fase atual',
)

dashboard = replaceRequired(
  dashboard,
  '{tarefasOrdenadas.slice(0, 5).map((item, index) => {',
  '{tarefasDestaque.map((item, index) => {',
  'lista priorizada do cronograma',
)

dashboard = replaceRequired(
  dashboard,
`              const completed = progress === 100

              return (`,
`              const completed = progress === 100
              const runningToday = estaEmExecucaoHoje(item)

              return (`,
  'identificação de atividade de hoje',
)

dashboard = replaceRequired(
  dashboard,
`                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-[10px] font-bold text-slate-800">{item.nome}</span>
                      <span className={\`shrink-0 text-[9px] font-black ${'${completed ? \'text-emerald-600\' : delayed ? \'text-red-600\' : \'text-slate-500\'}'}\`}>{progress}%</span>
                    </span>`,
`                    <span className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[10px] font-bold text-slate-800">{item.nome}</span>
                        {runningToday && <span className="shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-blue-700">Hoje</span>}
                      </span>
                      <span className={\`shrink-0 text-[9px] font-black ${'${completed ? \'text-emerald-600\' : delayed ? \'text-red-600\' : \'text-slate-500\'}'}\`}>{progress}%</span>
                    </span>`,
  'selo de execução hoje',
)

dashboard = replaceRequired(
  dashboard,
  '{!tarefasOrdenadas.length && <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-xs font-bold text-slate-400">Nenhuma atividade cadastrada no cronograma.</p>}',
  '{!tarefasDestaque.length && <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-xs font-bold text-slate-400">Nenhuma atividade cadastrada no cronograma.</p>}',
  'estado vazio do cronograma',
)

fs.writeFileSync(dashboardPath, dashboard)

// 3) Volta a mostrar somente a lixeira, sem a palavra Excluir.
const cssPath = 'src/app/globals.css'
let css = fs.readFileSync(cssPath, 'utf8')
css = css.replace(/\nbutton\[aria-label\^="Excluir atividade"\] \{[\s\S]*?\n\}\n\nbutton\[aria-label\^="Excluir atividade"\]::after \{[\s\S]*?\n\}\n/, '\n')
css = css.replace('  min-width: 112px;\n', '  min-width: 72px;\n')
fs.writeFileSync(cssPath, css)

console.log('Cronograma atual, prazo da obra e botão de lixeira atualizados.')

const fs = require('fs')

function patchFile(path, mutate) {
  const original = fs.readFileSync(path, 'utf8')
  const updated = mutate(original)
  if (updated !== original) fs.writeFileSync(path, updated)
}

function replaceRequired(source, search, replacement, label) {
  if (source.includes(replacement)) return source
  if (!source.includes(search)) throw new Error(`Trecho não encontrado: ${label}`)
  return source.replace(search, replacement)
}

patchFile('src/lib/moduleDefinitions.js', (input) => {
  if (input.includes('  projetos: {')) return input

  const definition = `  projetos: {
    title: 'Projetos',
    singular: 'projeto',
    description: 'Projetos da obra organizados nas pastas arquitetônico, estrutural e complementares.',
    statusField: 'status',
    fields: [
      { key: 'nome', label: 'Nome do projeto', type: 'text', required: true },
      { key: 'pasta', label: 'Pasta', type: 'select', required: true, options: ['Arquitetônico', 'Estrutural', 'Complementares'] },
      { key: 'disciplina', label: 'Disciplina', type: 'text' },
      { key: 'versao', label: 'Versão', type: 'text' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'data_emissao', label: 'Data de emissão', type: 'date' },
      { key: 'url', label: 'Link do arquivo', type: 'url' },
      { key: 'status', label: 'Status', type: 'select', options: ['Vigente', 'Em revisão', 'Arquivado'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', full: true },
    ],
    seed: [],
  },
`

  return replaceRequired(input, '  documentos: {', `${definition}  documentos: {`, 'definição de projetos')
})

patchFile('src/lib/accessControl.js', (input) => {
  let source = input
  source = replaceRequired(
    source,
    "'composicoes', 'abc', 'medicoes', 'documentos', 'templates', 'obras',",
    "'composicoes', 'abc', 'medicoes', 'projetos', 'documentos', 'templates', 'obras',",
    'projetos para engenheiro e investidor',
  )
  source = replaceRequired(
    source,
    "'dashboard', 'cronograma', 'diario', 'fotos', 'equipe', 'materiais', 'compras',",
    "'dashboard', 'cronograma', 'diario', 'fotos', 'equipe', 'materiais', 'compras', 'projetos',",
    'projetos para operação',
  )
  source = replaceRequired(
    source,
    "'dashboard', 'cronograma', 'ia', 'diario', 'fotos', 'medicoes', 'documentos', 'planilhas',",
    "'dashboard', 'cronograma', 'ia', 'diario', 'fotos', 'medicoes', 'projetos', 'documentos', 'planilhas',",
    'projetos para cliente',
  )
  return source
})

patchFile('src/components/dashboard/Sidebar.js', (input) => {
  let source = input
  source = replaceRequired(source, '  FolderKanban,\n  History,', '  FolderKanban,\n  FolderOpen,\n  History,', 'ícone de projetos no menu')
  source = replaceRequired(source, "  'documentos',\n  'templates',", "  'projetos',\n  'documentos',\n  'templates',", 'rota de projetos no menu')
  source = replaceRequired(source, "      { id: 'documentos', label: 'Documentos', icon: FolderKanban },", "      { id: 'projetos', label: 'Projetos', icon: FolderOpen },\n      { id: 'documentos', label: 'Documentos', icon: FolderKanban },", 'item Projetos no menu')
  return source
})

patchFile('src/components/dashboard/BottomNav.js', (input) => {
  let source = input
  source = replaceRequired(source, '  FolderKanban,\n  FileCode,', '  FolderKanban,\n  FolderOpen,\n  FileCode,', 'ícone de projetos no mobile')
  source = replaceRequired(source, "  'documentos',\n  'templates',", "  'projetos',\n  'documentos',\n  'templates',", 'rota de projetos no mobile')
  source = replaceRequired(source, "  { id: 'documentos', label: 'Documentos', icon: FolderKanban },", "  { id: 'projetos', label: 'Projetos', icon: FolderOpen },\n  { id: 'documentos', label: 'Documentos', icon: FolderKanban },", 'item Projetos no mobile')
  return source
})

patchFile('src/app/workspace/page.js', (input) => {
  let source = input
  source = replaceRequired(
    source,
    "import { PhotoWorkspace } from '@/components/platform/PhotoWorkspace'",
    "import { PhotoWorkspace } from '@/components/platform/PhotoWorkspace'\nimport { ProjectsWorkspace } from '@/components/platform/ProjectsWorkspace'\nimport { UsersPermissionsWorkspace } from '@/components/platform/UsersPermissionsWorkspace'",
    'imports dos novos workspaces',
  )
  source = replaceRequired(
    source,
    "  const [moduleKey, setModuleKey] = useState('clientes')\n  const [obraId, setObraId] = useState('demo-1')",
    "  const [moduleKey, setModuleKey] = useState('clientes')\n  const [obraId, setObraId] = useState('demo-1')\n  const [focus, setFocus] = useState('')",
    'estado de foco do workspace',
  )

  const oldEffect = `  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requested = params.get('module')

    if (requested && WORKSPACE_KEYS.includes(requested)) {
      setModuleKey(requested)
      return
    }

    if (requested === 'crm') {
      window.history.replaceState({}, '', '/workspace?module=clientes')
    }
  }, [])`
  const newEffect = `  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requested = params.get('module')
    const requestedWork = params.get('obra')
    const requestedFocus = params.get('focus')

    if (requestedWork) setObraId(requestedWork)
    setFocus(requestedFocus || '')

    if (requested && WORKSPACE_KEYS.includes(requested)) {
      setModuleKey(requested)
      return
    }

    if (requested === 'crm') {
      window.history.replaceState({}, '', '/workspace?module=clientes')
    }
  }, [])`
  source = replaceRequired(source, oldEffect, newEffect, 'parâmetros de foco e obra')

  source = replaceRequired(
    source,
    "      setModuleKey(tabId)\n      const nextUrl = `/workspace?module=${tabId}`",
    "      setModuleKey(tabId)\n      setFocus('')\n      const nextUrl = `/workspace?module=${tabId}`",
    'limpeza do foco ao navegar',
  )

  source = replaceRequired(
    source,
    "              ) : moduleKey === 'planilhas' ? (\n                <SpreadsheetWorkspace obra={obraAtual} user={user} canEdit={canEditCurrentModule} />",
    "              ) : moduleKey === 'projetos' ? (\n                <ProjectsWorkspace obra={obraAtual} user={user} canEdit={canEditCurrentModule} />\n              ) : moduleKey === 'usuarios' ? (\n                <UsersPermissionsWorkspace />\n              ) : moduleKey === 'planilhas' ? (\n                <SpreadsheetWorkspace obra={obraAtual} user={user} canEdit={canEditCurrentModule} />",
    'renderização de projetos e usuários',
  )

  source = replaceRequired(
    source,
    '<EditableWorkspace moduleKey={moduleKey} obra={obraAtual} user={user} canEdit={canEditCurrentModule} />',
    '<EditableWorkspace moduleKey={moduleKey} obra={obraAtual} user={user} canEdit={canEditCurrentModule} focus={focus} />',
    'foco no workspace editável',
  )

  return source
})

patchFile('src/components/platform/EditableWorkspace.js', (input) => {
  let source = input
  source = replaceRequired(
    source,
    "import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'",
    "import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'\nimport { pedidoAtrasadoOperacional } from '@/lib/operationalData'",
    'regra automática de atraso em compras',
  )
  source = replaceRequired(
    source,
    'export function EditableWorkspace({ moduleKey, obra, user, canEdit = true }) {',
    'export function EditableWorkspace({ moduleKey, obra, user, canEdit = true, focus = \'\' }) {',
    'propriedade de foco',
  )
  source = replaceRequired(
    source,
    "  const statusField = definition?.statusField\n  const valueField = definition?.valueField",
    "  const statusField = definition?.statusField\n  const valueField = definition?.valueField\n  const focusLatePurchases = moduleKey === 'compras' && focus === 'atrasados'",
    'foco de compras atrasadas',
  )
  source = replaceRequired(
    source,
    "      const matchesStatus = statusFilter === 'todos' || String(record[statusField] || '') === statusFilter\n      return matchesSearch && matchesStatus",
    "      const matchesStatus = statusFilter === 'todos' || String(record[statusField] || '') === statusFilter\n      const matchesFocus = !focusLatePurchases || pedidoAtrasadoOperacional(record)\n      return matchesSearch && matchesStatus && matchesFocus",
    'filtro automático de compras atrasadas',
  )
  source = replaceRequired(
    source,
    '  }, [records, search, statusFilter, sort, definition, statusField, valueField])',
    '  }, [records, search, statusFilter, sort, definition, statusField, valueField, focusLatePurchases])',
    'dependência do foco',
  )
  source = replaceRequired(
    source,
    '    attention: records.filter((record) => needsAttention(record, statusField)).length,',
    "    attention: records.filter((record) => moduleKey === 'compras' ? pedidoAtrasadoOperacional(record) : needsAttention(record, statusField)).length,",
    'métrica automática de compras',
  )
  source = replaceRequired(
    source,
    '  }), [records, statusField, valueField])',
    '  }), [records, statusField, valueField, moduleKey])',
    'dependência da métrica de compras',
  )
  source = replaceRequired(
    source,
    "        {loading ? (",
    "        {focusLatePurchases && (\n          <div className=\"mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700\">\n            <AlertTriangle size={17} className=\"mt-0.5 shrink-0\" /> Exibindo somente os pedidos cuja entrega prevista venceu e que ainda não possuem recebimento confirmado.\n          </div>\n        )}\n\n        {loading ? (",
    'aviso de compras atrasadas',
  )
  source = replaceRequired(
    source,
    '<tr key={record.id} className="group hover:bg-slate-50/80">',
    '<tr key={record.id} className={`group ${focusLatePurchases && pedidoAtrasadoOperacional(record) ? \'bg-red-50/80 ring-1 ring-inset ring-red-200\' : \'hover:bg-slate-50/80\'}`}>',
    'destaque de compra atrasada no desktop',
  )
  source = replaceRequired(
    source,
    '<article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">',
    '<article key={record.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${focusLatePurchases && pedidoAtrasadoOperacional(record) ? \'border-red-300 ring-2 ring-red-100\' : \'border-slate-200\'}`}>',
    'destaque de compra atrasada no mobile',
  )
  return source
})

patchFile('src/components/dashboard/views/DashboardView.js', (input) => {
  let source = input
  source = replaceRequired(
    source,
    '  const navigate = (tabId) => {',
    '  const navigate = (tabId, options = {}) => {',
    'opções de navegação do dashboard',
  )
  source = replaceRequired(
    source,
    "    if (WORKSPACE_TABS.has(tabId)) {\n      window.location.href = `/workspace?module=${tabId}`\n      return\n    }\n\n    onNavigate(tabId)",
    "    if (WORKSPACE_TABS.has(tabId)) {\n      const params = new URLSearchParams({ module: tabId, obra: String(obraAtual.id) })\n      if (options.focus) params.set('focus', options.focus)\n      window.location.href = `/workspace?${params.toString()}`\n      return\n    }\n\n    onNavigate(tabId, options)",
    'navegação com foco e obra',
  )
  source = replaceRequired(
    source,
    "          onClick={() => navigate(atrasadas.length ? 'cronograma' : 'compras')}",
    "          onClick={() => navigate(atrasadas.length ? 'cronograma' : 'compras', { focus: 'atrasados' })}",
    'alerta operacional direcionado',
  )
  source = replaceRequired(
    source,
    '<button type="button" onClick={() => navigate(\'compras\')} className="group flex min-h-[94px]',
    '<button type="button" onClick={() => navigate(\'compras\', materiaisCriticos.length ? { focus: \'atrasados\' } : {})} className="group flex min-h-[94px]',
    'card de materiais direcionado',
  )
  return source
})

patchFile('src/app/page.js', (input) => {
  let source = input
  source = replaceRequired(
    source,
    "import { AIWorkspace } from '@/components/platform/AIWorkspace'",
    "import { AIWorkspace } from '@/components/platform/AIWorkspace'\nimport { tarefaAtrasadaOperacional } from '@/lib/operationalData'",
    'regra de atraso do cronograma',
  )
  source = replaceRequired(
    source,
    "  const [tela, setTela] = useState('dashboard')\n  const [obraId, setObraId] = useState(null)",
    "  const [tela, setTela] = useState('dashboard')\n  const [obraId, setObraId] = useState(null)\n  const [navigationFocus, setNavigationFocus] = useState(null)",
    'estado de foco da navegação',
  )
  source = replaceRequired(
    source,
    "  const triggerFeedback = useCallback((status, msg = '') => {\n    setSaveStatus(status); setErrorMsg(msg)\n    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current)\n    if (status === 'saved') feedbackTimerRef.current = window.setTimeout(() => setSaveStatus(null), 2500)\n  }, [])",
    "  const triggerFeedback = useCallback((status, msg = '') => {\n    setSaveStatus(status); setErrorMsg(msg)\n    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current)\n    if (status === 'saved') feedbackTimerRef.current = window.setTimeout(() => setSaveStatus(null), 2500)\n  }, [])\n\n  const navigateInternal = useCallback((tabId, options = {}) => {\n    setNavigationFocus(options?.focus || null)\n    setTela(tabId)\n  }, [])",
    'navegação interna com foco',
  )
  source = replaceRequired(
    source,
    '<Sidebar activeTab={tela} onTabChange={setTela} userProfile={profileForNavigation} logout={authLogout} />',
    '<Sidebar activeTab={tela} onTabChange={navigateInternal} userProfile={profileForNavigation} logout={authLogout} />',
    'sidebar com foco controlado',
  )
  source = replaceRequired(
    source,
    '<DashboardView obraAtual={obraAtualSegura} tarefas={tarefas} materiais={materiais} diarios={diarios} user={user} role={role} isClient={ehCliente} onNavigate={setTela} />',
    '<DashboardView obraAtual={obraAtualSegura} tarefas={tarefas} materiais={materiais} diarios={diarios} user={user} role={role} isClient={ehCliente} onNavigate={navigateInternal} />',
    'dashboard com foco controlado',
  )
  source = replaceRequired(
    source,
    '<TelaCronograma permissaoEditar={permissaoEditar} novaTarefa={novaTarefa}',
    '<TelaCronograma focus={navigationFocus} permissaoEditar={permissaoEditar} novaTarefa={novaTarefa}',
    'foco enviado ao cronograma',
  )
  source = replaceRequired(
    source,
    '<BottomNav activeTab={tela} onTabChange={setTela} userProfile={profileForNavigation} />',
    '<BottomNav activeTab={tela} onTabChange={navigateInternal} userProfile={profileForNavigation} />',
    'menu mobile com foco controlado',
  )
  source = replaceRequired(
    source,
    'function TelaCronograma({ permissaoEditar, novaTarefa, setNovaTarefa, adicionarTarefa, tarefas, atualizarTarefa, excluirTarefa, atualizarPrazoEntrega, importarCronogramaExcel, obraAtual }) {',
    'function TelaCronograma({ focus, permissaoEditar, novaTarefa, setNovaTarefa, adicionarTarefa, tarefas, atualizarTarefa, excluirTarefa, atualizarPrazoEntrega, importarCronogramaExcel, obraAtual }) {',
    'propriedade de foco do cronograma',
  )
  source = replaceRequired(
    source,
    "  const progressoGlobal = total > 0 ? Math.round(tarefas.reduce((a, t) => a + Number(t.progresso), 0) / total) : 0",
    "  const progressoGlobal = total > 0 ? Math.round(tarefas.reduce((a, t) => a + Number(t.progresso), 0) / total) : 0\n  const destacarAtrasadas = focus === 'atrasados'\n  const tarefasVisiveis = destacarAtrasadas ? tarefas.filter((tarefa) => tarefaAtrasadaOperacional(tarefa)) : tarefas",
    'tarefas atrasadas visíveis',
  )
  source = replaceRequired(
    source,
    "    <div className=\"space-y-6\">\n      <div className=\"flex flex-col gap-3 rounded-3xl",
    "    <div className=\"space-y-6\">\n      {destacarAtrasadas && (\n        <div className=\"rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700\">\n          Evidenciando {tarefasVisiveis.length} serviço{tarefasVisiveis.length === 1 ? '' : 's'} com prazo vencido e progresso abaixo de 100%.\n        </div>\n      )}\n      <div className=\"flex flex-col gap-3 rounded-3xl",
    'aviso de serviços atrasados',
  )
  source = replaceRequired(source, '<GraficoCronograma tarefas={tarefas} />', '<GraficoCronograma tarefas={tarefasVisiveis} />', 'gráfico filtrado de atrasos')
  source = replaceRequired(
    source,
    '<CronogramaVisual tarefas={tarefas} atualizarTarefa={atualizarTarefa} excluirTarefa={excluirTarefa} podeEditar={permissaoEditar} />',
    '<CronogramaVisual tarefas={tarefasVisiveis} atualizarTarefa={atualizarTarefa} excluirTarefa={excluirTarefa} podeEditar={permissaoEditar} />',
    'detalhamento filtrado de atrasos',
  )
  return source
})

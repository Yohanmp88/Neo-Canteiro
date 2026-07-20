const fs = require('fs')

function patchFile(path, mutate) {
  const original = fs.readFileSync(path, 'utf8')
  const next = mutate(original)
  if (next !== original) fs.writeFileSync(path, next)
}

function replaceRequired(source, search, replacement, label) {
  if (source.includes(replacement)) return source
  if (!source.includes(search)) throw new Error(`Trecho não encontrado: ${label}`)
  return source.replace(search, replacement)
}

patchFile('src/app/page.js', (input) => {
  let source = input
  source = replaceRequired(
    source,
    "import { ScheduleExcelImport } from '@/components/platform/ScheduleExcelImport'",
    "import { ScheduleExcelImport } from '@/components/platform/ScheduleExcelImport'\nimport { AIWorkspace } from '@/components/platform/AIWorkspace'",
    'importação da IA',
  )

  source = replaceRequired(
    source,
    "              {['materiais', 'financeiro', 'orcamento', 'ia'].includes(tela) && <ModulePlaceholder tela={tela} setTela={setTela} />}",
    "              {tela === 'ia' && <AIWorkspace obra={obraAtualSegura} user={user} />}\n              {['materiais', 'financeiro', 'orcamento'].includes(tela) && <ModulePlaceholder tela={tela} setTela={setTela} />}",
    'renderização da IA',
  )

  return source
})

patchFile('src/components/platform/AIWorkspace.js', (input) => {
  let source = input

  source = replaceRequired(
    source,
    "import { formatDeliveryQuantity, isReceivedStatus } from '@/lib/materialDelivery'",
    "import { formatDeliveryQuantity, isReceivedStatus, materialDeliveryFromRecord } from '@/lib/materialDelivery'",
    'importação de recebimento de material',
  )

  source = replaceRequired(
    source,
    "function materialLabel(record) {\n  const quantity = formatDeliveryQuantity(record)\n  return [quantity, record.item || record.material || record.nome].filter(Boolean).join(' de ')\n}",
    "function materialLabel(record) {\n  const delivery = materialDeliveryFromRecord(record)\n  const quantity = formatDeliveryQuantity(delivery)\n  return [quantity, delivery.item].filter(Boolean).join(' de ')\n}",
    'quantidade de material recebido',
  )

  source = replaceRequired(
    source,
    "  const { diarios = [], loading: diariesLoading } = useDiarios(obra?.id)\n  const { records: materialRecords = [], loading: materialsLoading } = useWorkspaceRecords('materiais', obra?.id, user)",
    "  const { diarios = [], loading: diariesLoading } = useDiarios(obra?.id)\n  const { records: workspaceDiaries = [], loading: workspaceDiariesLoading } = useWorkspaceRecords('diario', obra?.id, user)\n  const { records: materialRecords = [], loading: materialsLoading } = useWorkspaceRecords('materiais', obra?.id, user)",
    'diários profissionais',
  )

  source = replaceRequired(
    source,
    "  const loading = diariesLoading || materialsLoading || timelineLoading",
    "  const allDiaries = useMemo(() => uniqueBy(\n    [...diarios, ...workspaceDiaries]\n      .filter(Boolean)\n      .sort((a, b) => String(b.data || b.created_at || '').localeCompare(String(a.data || a.created_at || ''))),\n    (diary) => String(diary.id || `${dateKey(diary.data || diary.created_at)}:${cleanText(diary.servicos_executados || diary.atividades)}`),\n  ), [diarios, workspaceDiaries])\n\n  const loading = diariesLoading || workspaceDiariesLoading || materialsLoading || timelineLoading",
    'união dos diários',
  )

  source = replaceRequired(
    source,
    "    const dayDiaries = diarios.filter((diary) => dateKey(diary.data || diary.created_at) === targetDate)",
    "    const dayDiaries = allDiaries.filter((diary) => dateKey(diary.data || diary.created_at) === targetDate)",
    'consulta de diários por data',
  )

  source = replaceRequired(
    source,
    "<p className=\"flex items-center gap-2\"><Bot size={15} className=\"text-blue-600\" /> {diarios.length} diário{diarios.length === 1 ? '' : 's'}</p>",
    "<p className=\"flex items-center gap-2\"><Bot size={15} className=\"text-blue-600\" /> {allDiaries.length} diário{allDiaries.length === 1 ? '' : 's'}</p>",
    'contador de diários',
  )

  return source
})

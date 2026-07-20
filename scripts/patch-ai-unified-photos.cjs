const fs = require('fs')

const path = 'src/components/platform/AIWorkspace.js'
let source = fs.readFileSync(path, 'utf8')

function replaceRequired(search, replacement, label) {
  if (source.includes(replacement)) return
  if (!source.includes(search)) throw new Error(`Trecho não encontrado: ${label}`)
  source = source.replace(search, replacement)
}

replaceRequired(
  "import { useTimeline } from '@/hooks/useTimeline'",
  "import { useTimeline } from '@/hooks/useTimeline'\nimport { useObraPhotos } from '@/hooks/useObraPhotos'",
  'importação de fotos unificadas',
)

replaceRequired(
  "  const { records: workspacePhotos = [], loading: workspacePhotosLoading } = useWorkspaceRecords('fotos', obra?.id, user)\n  const { eventos = [], loading: timelineLoading } = useTimeline(obra?.id, user)",
  "  const { photos: unifiedPhotos = [], loading: unifiedPhotosLoading, reload: reloadPhotos } = useObraPhotos(obra?.id)\n  const { eventos = [], loading: timelineLoading } = useTimeline(obra?.id, user)",
  'hook de fotos',
)

const start = source.indexOf('  const photos = useMemo(() => uniqueBy(')
const endMarker = '  const allDiaries = useMemo(() => uniqueBy('
const end = source.indexOf(endMarker)
if (start === -1 || end === -1 || end <= start) throw new Error('Bloco antigo de fotos não encontrado.')
source = source.slice(0, start) + "  const photos = unifiedPhotos\n\n" + source.slice(end)

replaceRequired(
  '  const loading = diariesLoading || workspaceDiariesLoading || materialsLoading || workspacePhotosLoading || timelineLoading',
  '  const loading = diariesLoading || workspaceDiariesLoading || materialsLoading || unifiedPhotosLoading || timelineLoading',
  'carregamento de fotos',
)

replaceRequired(
  '  const ask = (value = question) => {',
  '  const ask = async (value = question) => {',
  'pergunta assíncrona',
)

replaceRequired(
  "    const targetDate = resolveQuestionDate(text)\n    const dayDiaries = allDiaries.filter((diary) => dateKey(diary.data || diary.created_at) === targetDate)",
  "    const targetDate = resolveQuestionDate(text)\n    await reloadPhotos()\n    const dayDiaries = allDiaries.filter((diary) => dateKey(diary.data || diary.created_at) === targetDate)",
  'recarregamento antes da resposta',
)

fs.writeFileSync(path, source)

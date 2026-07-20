const fs = require('fs')

const path = 'src/components/platform/AIWorkspace.js'
let source = fs.readFileSync(path, 'utf8')

const oldHooks = `  const { diarios = [], loading: diariesLoading } = useDiarios(obra?.id)
  const { records: workspaceDiaries = [], loading: workspaceDiariesLoading } = useWorkspaceRecords('diario', obra?.id, user)
  const { records: materialRecords = [], loading: materialsLoading } = useWorkspaceRecords('materiais', obra?.id, user)
  const { eventos = [], loading: timelineLoading } = useTimeline(obra?.id, user)`

const newHooks = `  const { diarios = [], loading: diariesLoading } = useDiarios(obra?.id)
  const { records: workspaceDiaries = [], loading: workspaceDiariesLoading } = useWorkspaceRecords('diario', obra?.id, user)
  const { records: materialRecords = [], loading: materialsLoading } = useWorkspaceRecords('materiais', obra?.id, user)
  const { records: workspacePhotos = [], loading: workspacePhotosLoading } = useWorkspaceRecords('fotos', obra?.id, user)
  const { eventos = [], loading: timelineLoading } = useTimeline(obra?.id, user)`

const oldPhotos = `  const photos = useMemo(() => uniqueBy(
    eventos
      .filter((event) => event.event_type === 'foto' && event.metadata?.url)
      .map((event) => ({
        id: event.id,
        date: dateKey(event.event_date || event.created_at),
        url: event.metadata.url,
        title: event.title || 'Registro fotográfico',
        description: event.description || '',
      })),
    (photo) => photo.url,
  ), [eventos])`

const newPhotos = `  const photos = useMemo(() => uniqueBy(
    [
      ...workspacePhotos
        .filter((record) => record?.url || record?.url_foto || record?.data?.url || record?.data?.url_foto)
        .map((record) => ({
          id: record.id,
          date: dateKey(record.data || record.data_foto || record.created_at),
          url: record.url || record.url_foto || record.data?.url || record.data?.url_foto,
          title: record.descricao || record.titulo || record.etapa || 'Registro fotográfico',
          description: record.observacoes || record.local || '',
        })),
      ...eventos
        .filter((event) => event.event_type === 'foto' && event.metadata?.url)
        .map((event) => ({
          id: event.id,
          date: dateKey(event.event_date || event.created_at),
          url: event.metadata.url,
          title: event.title || 'Registro fotográfico',
          description: event.description || '',
        })),
    ],
    (photo) => photo.url,
  ), [workspacePhotos, eventos])`

const oldLoading = `  const loading = diariesLoading || workspaceDiariesLoading || materialsLoading || timelineLoading`
const newLoading = `  const loading = diariesLoading || workspaceDiariesLoading || materialsLoading || workspacePhotosLoading || timelineLoading`

if (!source.includes(newHooks)) {
  if (!source.includes(oldHooks)) throw new Error('Hooks da IA não encontrados.')
  source = source.replace(oldHooks, newHooks)
}

if (!source.includes(newPhotos)) {
  if (!source.includes(oldPhotos)) throw new Error('Fonte de fotos da IA não encontrada.')
  source = source.replace(oldPhotos, newPhotos)
}

if (!source.includes(newLoading)) {
  if (!source.includes(oldLoading)) throw new Error('Estado de carregamento da IA não encontrado.')
  source = source.replace(oldLoading, newLoading)
}

fs.writeFileSync(path, source)

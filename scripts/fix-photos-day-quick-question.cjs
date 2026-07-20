const fs = require('fs')

const path = 'src/components/platform/AIWorkspace.js'
let source = fs.readFileSync(path, 'utf8')

function replaceRequired(search, replacement, label) {
  if (source.includes(replacement)) return
  if (!source.includes(search)) throw new Error(`Trecho não encontrado: ${label}`)
  source = source.replace(search, replacement)
}

replaceRequired(
  `function PhotoGallery({ photos }) {`,
  `function buildPhotosAnswer({ date, photos }) {
  return {
    id: \`assistant-photos-\${Date.now()}\`,
    role: 'assistant',
    date,
    title: \`Fotos de \${formatLongDate(date)}\`,
    text: photos.length
      ? \`Encontrei \${photos.length} \${photos.length === 1 ? 'foto registrada' : 'fotos registradas'} neste dia.\`
      : 'Não encontrei fotos registradas para este dia.',
    photos,
    materials: [],
  }
}

function PhotoGallery({ photos }) {`,
  'resposta exclusiva de fotos',
)

replaceRequired(
  `    const targetDate = resolveQuestionDate(text)
    const freshPhotos = await reloadPhotos()
    const dayDiaries = allDiaries.filter((diary) => dateKey(diary.data || diary.created_at) === targetDate)
    const dayMaterials = materialRecords.filter((record) => isReceivedStatus(record.recebimento_status || record.status_recebimento) && materialDate(record) === targetDate)
    const dayPhotos = freshPhotos.filter((photo) => photo.date === targetDate)

    setMessages((current) => [
      ...current,
      { id: \`user-\${Date.now()}\`, role: 'user', text },
      buildDailyAnswer({ date: targetDate, diaries: dayDiaries, materials: dayMaterials, photos: dayPhotos }),
    ])`,
  `    const photosOnly = normalizeText(text) === 'fotos do dia'
    const freshPhotos = await reloadPhotos()
    const latestPhotoDate = freshPhotos.find((photo) => photo.date)?.date
    const latestDiaryDate = allDiaries.find((diary) => dateKey(diary.data || diary.created_at))
    const targetDate = photosOnly
      ? (freshPhotos.some((photo) => photo.date === localToday()) ? localToday() : latestPhotoDate || dateKey(latestDiaryDate?.data || latestDiaryDate?.created_at) || localToday())
      : resolveQuestionDate(text)
    const dayDiaries = allDiaries.filter((diary) => dateKey(diary.data || diary.created_at) === targetDate)
    const dayMaterials = materialRecords.filter((record) => isReceivedStatus(record.recebimento_status || record.status_recebimento) && materialDate(record) === targetDate)
    const dayPhotos = freshPhotos.filter((photo) => photo.date === targetDate)
    const answer = photosOnly
      ? buildPhotosAnswer({ date: targetDate, photos: dayPhotos })
      : buildDailyAnswer({ date: targetDate, diaries: dayDiaries, materials: dayMaterials, photos: dayPhotos })

    setMessages((current) => [
      ...current,
      { id: \`user-\${Date.now()}\`, role: 'user', text },
      answer,
    ])`,
  'tratamento específico da pergunta Fotos do dia',
)

fs.writeFileSync(path, source)

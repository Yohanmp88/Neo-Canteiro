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

patchFile('src/services/photoUploadService.js', (input) => {
  let source = input

  source = replaceRequired(
    source,
    "const MAX_FILE_SIZE = 20 * 1024 * 1024",
    "const MAX_FILE_SIZE = 20 * 1024 * 1024\nconst HEIC_EXTENSION = /\\.(heic|heif)$/i\nconst HEIC_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'])",
    'constantes HEIC',
  )

  source = replaceRequired(
    source,
    "function randomId() {\n  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {\n    return crypto.randomUUID()\n  }\n\n  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`\n}\n",
    "function randomId() {\n  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {\n    return crypto.randomUUID()\n  }\n\n  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`\n}\n\nfunction isHeicFile(file) {\n  const type = String(file?.type || '').toLowerCase()\n  return HEIC_EXTENSION.test(String(file?.name || '')) || HEIC_TYPES.has(type)\n}\n\nexport async function prepareObraPhotoFile(file) {\n  if (!isHeicFile(file)) {\n    return { file, converted: false, originalName: file?.name || '' }\n  }\n\n  try {\n    const { heicTo } = await import('heic-to/csp')\n    const convertedResult = await heicTo({\n      blob: file,\n      type: 'image/jpeg',\n      quality: 0.88,\n    })\n    const convertedBlob = Array.isArray(convertedResult) ? convertedResult[0] : convertedResult\n\n    if (!(convertedBlob instanceof Blob)) {\n      throw new Error('A conversão não retornou uma imagem válida.')\n    }\n\n    const baseName = String(file.name || 'foto').replace(HEIC_EXTENSION, '') || 'foto'\n    const jpegFile = new File([convertedBlob], `${baseName}.jpg`, {\n      type: 'image/jpeg',\n      lastModified: file.lastModified || Date.now(),\n    })\n\n    if (jpegFile.size > MAX_FILE_SIZE) {\n      throw new Error('A foto convertida ultrapassou o limite de 20 MB.')\n    }\n\n    return { file: jpegFile, converted: true, originalName: file.name || '' }\n  } catch (error) {\n    throw new Error(`Não foi possível converter a foto HEIC para JPEG. ${error?.message || ''}`.trim())\n  }\n}\n",
    'preparação do arquivo HEIC',
  )

  source = replaceRequired(
    source,
    "  if (file.type && !file.type.startsWith('image/')) {\n    throw new Error('O arquivo selecionado não é uma imagem válida.')\n  }\n\n  if (file.size > MAX_FILE_SIZE) {\n    throw new Error('A foto deve ter no máximo 20 MB.')\n  }\n\n  const eventDate = /^\\d{4}-\\d{2}-\\d{2}$/.test(String(date || ''))",
    "  if (file.type && !file.type.startsWith('image/') && !isHeicFile(file)) {\n    throw new Error('O arquivo selecionado não é uma imagem válida.')\n  }\n\n  if (file.size > MAX_FILE_SIZE) {\n    throw new Error('A foto deve ter no máximo 20 MB.')\n  }\n\n  const prepared = await prepareObraPhotoFile(file)\n  const uploadFile = prepared.file\n\n  const eventDate = /^\\d{4}-\\d{2}-\\d{2}$/.test(String(date || ''))",
    'conversão antes do upload',
  )

  source = replaceRequired(
    source,
    "  const filename = safeName(file.name) || 'foto.jpg'\n  const path = `${obraId}/${month}/${Date.now()}-${randomId()}-${filename}`",
    "  const filename = safeName(uploadFile.name) || 'foto.jpg'\n  const path = `${obraId}/${month}/${Date.now()}-${randomId()}-${filename}`",
    'nome do JPEG convertido',
  )

  source = replaceRequired(
    source,
    "    .upload(path, file, {\n      cacheControl: '3600',\n      upsert: false,\n      contentType: file.type || undefined,",
    "    .upload(path, uploadFile, {\n      cacheControl: '3600',\n      upsert: false,\n      contentType: uploadFile.type || 'image/jpeg',",
    'upload do arquivo convertido',
  )

  source = replaceRequired(
    source,
    "    arquivo_nome: file.name,\n    arquivo_tamanho: file.size,\n    arquivo_tipo: file.type || 'image',",
    "    arquivo_nome: uploadFile.name,\n    arquivo_nome_original: prepared.originalName || file.name,\n    arquivo_tamanho: uploadFile.size,\n    arquivo_tipo: uploadFile.type || 'image/jpeg',\n    arquivo_convertido: prepared.converted,",
    'metadados da conversão',
  )

  return source
})

patchFile('src/components/platform/PhotoWorkspace.js', (input) => replaceRequired(
  input,
  '<input type="file" accept="image/*" onChange={chooseFile} disabled={saving} className="sr-only" />',
  '<input type="file" accept="image/*,.heic,.heif,image/heic,image/heif" onChange={chooseFile} disabled={saving} className="sr-only" />',
  'formatos aceitos no seletor de fotos',
))

patchFile('src/components/platform/AIWorkspace.js', (input) => {
  let source = input

  source = replaceRequired(
    source,
    "        <div className=\"border-t border-slate-200 bg-white p-3 sm:p-4\">\n          <form onSubmit={(event) => { event.preventDefault(); ask() }} className=\"flex items-end gap-2\">",
    "        <div className=\"border-t border-slate-200 bg-white p-3 sm:p-4\">\n          <button\n            type=\"button\"\n            onClick={() => ask('Fotos do dia')}\n            disabled={loading}\n            className=\"mb-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs font-black text-violet-800 transition hover:bg-violet-100 disabled:opacity-50 lg:hidden\"\n          >\n            <Camera size={15} /> Fotos do dia\n          </button>\n          <form onSubmit={(event) => { event.preventDefault(); ask() }} className=\"flex items-end gap-2\">",
    'botão Fotos do dia no chat móvel',
  )

  return source
})

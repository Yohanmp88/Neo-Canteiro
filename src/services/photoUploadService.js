import { supabase } from '@/lib/supabase'

const PHOTO_BUCKET = 'fotos-obras'
const MAX_FILE_SIZE = 20 * 1024 * 1024
const HEIC_EXTENSION = /\.(heic|heif)$/i
const HEIC_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'])

function safeName(value) {
  return String(value || 'foto')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(-90)
}

function randomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function isHeicFile(file) {
  const type = String(file?.type || '').toLowerCase()
  return HEIC_EXTENSION.test(String(file?.name || '')) || HEIC_TYPES.has(type)
}

export async function prepareObraPhotoFile(file) {
  if (!isHeicFile(file)) {
    return { file, converted: false, originalName: file?.name || '' }
  }

  try {
    const { heicTo } = await import('heic-to/csp')
    const convertedResult = await heicTo({
      blob: file,
      type: 'image/jpeg',
      quality: 0.88,
    })
    const convertedBlob = Array.isArray(convertedResult) ? convertedResult[0] : convertedResult

    if (!(convertedBlob instanceof Blob)) {
      throw new Error('A conversão não retornou uma imagem válida.')
    }

    const baseName = String(file.name || 'foto').replace(HEIC_EXTENSION, '') || 'foto'
    const jpegFile = new File([convertedBlob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: file.lastModified || Date.now(),
    })

    if (jpegFile.size > MAX_FILE_SIZE) {
      throw new Error('A foto convertida ultrapassou o limite de 20 MB.')
    }

    return { file: jpegFile, converted: true, originalName: file.name || '' }
  } catch (error) {
    throw new Error(`Não foi possível converter a foto HEIC para JPEG. ${error?.message || ''}`.trim())
  }
}

export async function uploadObraPhoto({ file, obraId, date }) {
  if (!file) throw new Error('Selecione uma foto para enviar.')
  if (!obraId) throw new Error('Selecione uma obra antes de enviar a foto.')

  if (file.type && !file.type.startsWith('image/') && !isHeicFile(file)) {
    throw new Error('O arquivo selecionado não é uma imagem válida.')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('A foto deve ter no máximo 20 MB.')
  }

  const prepared = await prepareObraPhotoFile(file)
  const uploadFile = prepared.file

  const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))
    ? String(date)
    : new Date().toISOString().slice(0, 10)
  const month = eventDate.slice(0, 7)
  const filename = safeName(uploadFile.name) || 'foto.jpg'
  const path = `${obraId}/${month}/${Date.now()}-${randomId()}-${filename}`

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, uploadFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: uploadFile.type || 'image/jpeg',
    })

  if (uploadError) throw new Error(uploadError.message)

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
  const publicUrl = data?.publicUrl

  if (!publicUrl) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path])
    throw new Error('A foto foi enviada, mas não foi possível gerar o endereço público.')
  }

  return {
    url: publicUrl,
    storage_path: path,
    arquivo_nome: uploadFile.name,
    arquivo_nome_original: prepared.originalName || file.name,
    arquivo_tamanho: uploadFile.size,
    arquivo_tipo: uploadFile.type || 'image/jpeg',
    arquivo_convertido: prepared.converted,
  }
}

export async function removeUploadedPhoto(path) {
  if (!path) return
  await supabase.storage.from(PHOTO_BUCKET).remove([path])
}

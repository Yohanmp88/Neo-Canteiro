import { supabase } from '@/lib/supabase'

const PHOTO_BUCKET = 'fotos-obras'
const MAX_FILE_SIZE = 20 * 1024 * 1024

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

export async function uploadObraPhoto({ file, obraId, date }) {
  if (!file) throw new Error('Selecione uma foto para enviar.')
  if (!obraId) throw new Error('Selecione uma obra antes de enviar a foto.')

  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('O arquivo selecionado não é uma imagem válida.')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('A foto deve ter no máximo 20 MB.')
  }

  const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))
    ? String(date)
    : new Date().toISOString().slice(0, 10)
  const month = eventDate.slice(0, 7)
  const filename = safeName(file.name) || 'foto.jpg'
  const path = `${obraId}/${month}/${Date.now()}-${randomId()}-${filename}`

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
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
    arquivo_nome: file.name,
    arquivo_tamanho: file.size,
    arquivo_tipo: file.type || 'image',
  }
}

export async function removeUploadedPhoto(path) {
  if (!path) return
  await supabase.storage.from(PHOTO_BUCKET).remove([path])
}

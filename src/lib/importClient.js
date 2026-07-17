import { supabase } from '@/lib/supabase'

const MAX_FILE_SIZE = 50 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['xlsx', 'xls', 'csv']

function safeName(value) {
  return String(value || 'arquivo.xlsx')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(-120)
}

export function validateSpreadsheetFile(file) {
  if (!file) throw new Error('Selecione um arquivo Excel ou CSV.')
  if (file.size > MAX_FILE_SIZE) throw new Error('O arquivo deve ter no máximo 50 MB.')

  const extension = String(file.name || '').split('.').pop()?.toLowerCase()
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    throw new Error('Formato inválido. Use .xlsx, .xls ou .csv.')
  }
}

export async function uploadImportFile(file, user, folder = 'planilhas') {
  validateSpreadsheetFile(file)
  if (!user?.id) throw new Error('Sessão do usuário não encontrada.')

  const filename = safeName(file.name)
  const path = `${user.id}/${folder}/${Date.now()}-${filename}`
  const { error } = await supabase.storage.from('importacoes').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  })

  if (error) throw new Error(error.message)
  return path
}

export async function authenticatedApi(path, options = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (!token) throw new Error('Sua sessão expirou. Entre novamente no NeoCanteiro.')

  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(path, { ...options, headers })
  if (options.rawResponse) {
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload?.error || 'Não foi possível concluir a operação.')
    }
    return response
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error || 'Não foi possível concluir a operação.')
  return payload
}

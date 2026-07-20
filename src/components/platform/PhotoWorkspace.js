'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  Camera,
  CheckCircle2,
  Edit3,
  HardDrive,
  ImagePlus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'
import { removeUploadedPhoto, uploadObraPhoto } from '@/services/photoUploadService'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function initialForm(user) {
  return {
    descricao: '',
    etapa: '',
    local: '',
    data: today(),
    responsavel: user?.user_metadata?.nome || user?.email?.split('@')[0] || '',
    status: 'Publicado',
    observacoes: '',
  }
}

function formatDate(value) {
  const date = new Date(`${String(value || '').slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Data não informada'
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function PhotoModal({ open, record, user, saving, source, onClose, onSave }) {
  const [form, setForm] = useState(() => record ? { ...record } : initialForm(user))
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(record?.url || '')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    setForm(record ? { ...record } : initialForm(user))
    setFile(null)
    setPreview(record?.url || '')
    setLocalError('')
  }, [record, open, user])

  useEffect(() => {
    if (!file) return undefined
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  if (!open) return null

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const chooseFile = (event) => {
    const selected = event.target.files?.[0] || null
    setLocalError('')

    if (selected?.type && !selected.type.startsWith('image/')) {
      setLocalError('Selecione um arquivo de imagem.')
      event.target.value = ''
      return
    }

    if (selected && selected.size > 20 * 1024 * 1024) {
      setLocalError('A foto deve ter no máximo 20 MB.')
      event.target.value = ''
      return
    }

    setFile(selected)
  }

  const submit = async (event) => {
    event.preventDefault()
    setLocalError('')

    if (!record && !file) {
      setLocalError('Selecione uma foto do computador ou celular.')
      return
    }

    if (source !== 'supabase') {
      setLocalError('O upload de arquivo precisa estar sincronizado com o Supabase.')
      return
    }

    try {
      await onSave(form, file)
    } catch (error) {
      setLocalError(error?.message || 'Não foi possível salvar a foto.')
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm md:items-center md:p-6">
      <form onSubmit={submit} className="max-h-[94vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:max-w-4xl md:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">{record ? 'Editar registro' : 'Nova foto'}</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">Registro fotográfico</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(94vh-150px)] overflow-y-auto px-5 py-5 md:px-7">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <label className="block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-blue-300 hover:bg-blue-50/40">
                <input type="file" accept="image/*,.heic,.heif,image/heic,image/heif" onChange={chooseFile} disabled={saving} className="sr-only" />
                {preview ? (
                  <div>
                    <img src={preview} alt="Pré-visualização da foto" className="h-72 w-full object-contain bg-slate-100" />
                    <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-white px-4 py-3 text-xs font-black text-blue-700">
                      <Upload size={15} /> Selecionar outra foto
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                      <ImagePlus size={28} />
                    </div>
                    <p className="mt-5 text-base font-black text-slate-900">Clique para escolher uma foto</p>
                    <p className="mt-2 max-w-xs text-xs font-medium leading-5 text-slate-500">Selecione uma imagem do computador, celular ou galeria. Tamanho máximo de 20 MB.</p>
                  </div>
                )}
              </label>
              {file && <p className="mt-2 truncate text-[10px] font-bold text-slate-500">Arquivo: {file.name}</p>}
            </div>

            <div className="grid content-start gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Descrição *</span>
                <input value={form.descricao || ''} onChange={(event) => change('descricao', event.target.value)} required disabled={saving} className={inputClass} placeholder="Ex.: Concretagem das vigas" />
              </label>
              <label>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Data</span>
                <input type="date" value={form.data || ''} onChange={(event) => change('data', event.target.value)} disabled={saving} className={inputClass} />
              </label>
              <label>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Status</span>
                <select value={form.status || ''} onChange={(event) => change('status', event.target.value)} disabled={saving} className={inputClass}>
                  <option>Publicado</option>
                  <option>Em revisão</option>
                  <option>Privado</option>
                  <option>Arquivado</option>
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Etapa da obra</span>
                <input value={form.etapa || ''} onChange={(event) => change('etapa', event.target.value)} disabled={saving} className={inputClass} placeholder="Ex.: Estrutura" />
              </label>
              <label>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Local / ambiente</span>
                <input value={form.local || ''} onChange={(event) => change('local', event.target.value)} disabled={saving} className={inputClass} placeholder="Ex.: Pavimento superior" />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Responsável</span>
                <input value={form.responsavel || ''} onChange={(event) => change('responsavel', event.target.value)} disabled={saving} className={inputClass} />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Observações</span>
                <textarea rows={4} value={form.observacoes || ''} onChange={(event) => change('observacoes', event.target.value)} disabled={saving} className={inputClass} placeholder="Informações complementares do registro" />
              </label>
            </div>
          </div>

          {localError && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" /> {localError}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 md:px-7">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60">
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
            {saving ? 'Enviando foto...' : record ? 'Salvar alterações' : 'Enviar foto'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function PhotoWorkspace({ obra, user, canEdit = true }) {
  const {
    records,
    loading,
    saving,
    error,
    source,
    create,
    update,
    remove,
    reload,
  } = useWorkspaceRecords('fotos', obra?.id, user)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const grouped = useMemo(() => {
    const groups = new Map()
    records.forEach((record) => {
      const date = record.data || String(record.created_at || '').slice(0, 10) || 'sem-data'
      if (!groups.has(date)) groups.set(date, [])
      groups.get(date).push(record)
    })
    return Array.from(groups.entries()).sort(([a], [b]) => String(b).localeCompare(String(a)))
  }, [records])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    setModalOpen(true)
  }

  const save = async (form, file) => {
    setUploading(true)
    let uploaded = null

    try {
      if (file) {
        uploaded = await uploadObraPhoto({ file, obraId: obra?.id, date: form.data })
      }

      const payload = {
        ...form,
        ...(uploaded || {}),
        data: form.data || today(),
        status: form.status || 'Publicado',
      }

      delete payload.id
      delete payload.obra_id
      delete payload.created_at
      delete payload.updated_at
      delete payload.created_by
      delete payload.updated_by
      delete payload.created_by_name
      delete payload.storage_source

      if (editing) await update(editing.id, payload)
      else await create(payload)

      setModalOpen(false)
      setEditing(null)
    } catch (saveError) {
      if (uploaded?.storage_path) await removeUploadedPhoto(uploaded.storage_path)
      throw saveError
    } finally {
      setUploading(false)
    }
  }

  const archiveRecord = async (record) => {
    if (!window.confirm('Arquivar este registro fotográfico? A imagem permanecerá no histórico da obra.')) return
    setDeletingId(record.id)
    try {
      await remove(record.id)
    } finally {
      setDeletingId(null)
    }
  }

  const busy = saving || uploading

  return (
    <div className="space-y-5">
      <PhotoModal
        open={modalOpen}
        record={editing}
        user={user}
        saving={busy}
        source={source}
        onClose={() => { if (!busy) { setModalOpen(false); setEditing(null) } }}
        onSave={save}
      />

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between md:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{obra?.nome || 'NeoCanteiro'}</p>
              <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ring-1 ${source === 'supabase' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
                {source === 'supabase' ? 'Banco sincronizado' : 'Somente neste navegador'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Fotos da Obra</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">Envie imagens diretamente do computador ou celular. As fotos ficam vinculadas à obra e organizadas cronologicamente.</p>
          </div>

          {canEdit && (
            <button onClick={openCreate} disabled={source !== 'supabase'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              <Camera size={18} /> Adicionar foto
            </button>
          )}
        </div>

        <div className="grid gap-3 bg-slate-50/70 p-4 sm:grid-cols-3 md:p-5">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-center justify-between text-slate-500"><p className="text-[9px] font-black uppercase tracking-wider">Total de fotos</p><Camera size={16} /></div>
            <p className="mt-2 text-xl font-black text-slate-900">{records.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-center justify-between text-slate-500"><p className="text-[9px] font-black uppercase tracking-wider">Dias registrados</p><CalendarDays size={16} /></div>
            <p className="mt-2 text-xl font-black text-slate-900">{grouped.length}</p>
          </div>
          <div className={`rounded-2xl p-4 ring-1 ${source === 'supabase' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-amber-50 text-amber-700 ring-amber-100'}`}>
            <div className="flex items-center justify-between"><p className="text-[9px] font-black uppercase tracking-wider">Armazenamento</p>{source === 'supabase' ? <CheckCircle2 size={16} /> : <HardDrive size={16} />}</div>
            <p className="mt-2 text-sm font-black">{source === 'supabase' ? 'Supabase Storage' : 'Upload indisponível'}</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={reload} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 shadow-sm hover:bg-slate-50">
          <RefreshCw size={15} /> Atualizar galeria
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-72 items-center justify-center text-sm font-black text-blue-600"><RefreshCw className="mr-2 animate-spin" size={18} /> Carregando fotos...</div>
      ) : grouped.length === 0 ? (
        <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <ImagePlus size={42} className="mx-auto text-slate-300" />
          <h2 className="mt-4 text-lg font-black text-slate-900">Nenhuma foto cadastrada</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-slate-500">Clique em “Adicionar foto” para selecionar uma imagem do computador ou celular.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, items], index) => (
            <details key={date} open={index === 0} className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white"><CalendarDays size={19} /></div>
                  <div className="min-w-0">
                    <p className="capitalize text-sm font-black text-slate-900 md:text-base">{formatDate(date)}</p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{items.length} foto{items.length === 1 ? '' : 's'}</p>
                  </div>
                </div>
              </summary>

              <div className="grid gap-4 border-t border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 xl:grid-cols-3 md:p-6">
                {items.map((record) => (
                  <article key={record.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="aspect-[4/3] bg-slate-100">
                      {record.url ? <img src={record.url} alt={record.descricao || 'Foto da obra'} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><Camera size={36} /></div>}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black text-slate-900">{record.descricao || 'Registro fotográfico'}</h3>
                          <p className="mt-1 truncate text-[10px] font-bold uppercase text-slate-400">{[record.etapa, record.local].filter(Boolean).join(' • ') || 'Sem etapa informada'}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[8px] font-black uppercase text-blue-700 ring-1 ring-blue-100">{record.status || 'Publicado'}</span>
                      </div>
                      {record.observacoes && <p className="mt-3 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{record.observacoes}</p>}
                      {canEdit && (
                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                          <button onClick={() => openEdit(record)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-[10px] font-black text-blue-700"><Edit3 size={13} /> Editar</button>
                          <button onClick={() => archiveRecord(record)} disabled={deletingId === record.id} className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-[10px] font-black text-red-600 disabled:opacity-50"><Trash2 size={13} /> {deletingId === record.id ? 'Arquivando' : 'Arquivar'}</button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

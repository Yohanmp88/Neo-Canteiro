'use client'

import { useMemo, useState } from 'react'
import {
  Edit3,
  ExternalLink,
  FileText,
  FolderOpen,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'

const FOLDERS = [
  { id: 'Arquitetônico', label: 'Arquitetônico', description: 'Plantas, cortes, fachadas e detalhamentos arquitetônicos.' },
  { id: 'Estrutural', label: 'Estrutural', description: 'Fundações, formas, armações e memoriais estruturais.' },
  { id: 'Complementares', label: 'Complementares', description: 'Elétrico, hidrossanitário, preventivo, climatização e demais disciplinas.' },
]

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400'

function emptyForm(folder = FOLDERS[0].id) {
  return {
    nome: '',
    pasta: folder,
    disciplina: '',
    versao: '',
    responsavel: '',
    data_emissao: '',
    url: '',
    status: 'Vigente',
    observacoes: '',
  }
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('pt-BR')
}

function statusClass(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized.includes('revis')) return 'bg-amber-50 text-amber-700 ring-amber-200'
  if (normalized.includes('arquiv')) return 'bg-slate-100 text-slate-600 ring-slate-200'
  return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
}

function ProjectModal({ open, project, selectedFolder, saving, onClose, onSave }) {
  const [form, setForm] = useState(() => project ? { ...emptyForm(selectedFolder), ...project } : emptyForm(selectedFolder))
  if (!open) return null

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm md:items-center md:p-6">
      <form onSubmit={async (event) => { event.preventDefault(); await onSave(form) }} className="max-h-[94vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:max-w-3xl md:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">{project ? 'Editar projeto' : 'Novo projeto'}</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">Arquivo de projeto</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Fechar"><X size={20} /></button>
        </div>

        <div className="max-h-[calc(94vh-150px)] overflow-y-auto px-5 py-5 md:px-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Nome do projeto *</span>
              <input value={form.nome} onChange={(event) => change('nome', event.target.value)} required disabled={saving} className={inputClass} placeholder="Ex.: Projeto executivo pavimento térreo" />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Pasta *</span>
              <select value={form.pasta} onChange={(event) => change('pasta', event.target.value)} required disabled={saving} className={inputClass}>
                {FOLDERS.map((folder) => <option key={folder.id} value={folder.id}>{folder.label}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Disciplina</span>
              <input value={form.disciplina} onChange={(event) => change('disciplina', event.target.value)} disabled={saving} className={inputClass} placeholder="Ex.: Hidrossanitário" />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Versão</span>
              <input value={form.versao} onChange={(event) => change('versao', event.target.value)} disabled={saving} className={inputClass} placeholder="Ex.: R02" />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Responsável</span>
              <input value={form.responsavel} onChange={(event) => change('responsavel', event.target.value)} disabled={saving} className={inputClass} />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Data de emissão</span>
              <input type="date" value={form.data_emissao} onChange={(event) => change('data_emissao', event.target.value)} disabled={saving} className={inputClass} />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Status</span>
              <select value={form.status} onChange={(event) => change('status', event.target.value)} disabled={saving} className={inputClass}>
                <option>Vigente</option>
                <option>Em revisão</option>
                <option>Arquivado</option>
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Link do arquivo</span>
              <input type="url" value={form.url} onChange={(event) => change('url', event.target.value)} disabled={saving} className={inputClass} placeholder="https://..." />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Observações</span>
              <textarea rows={3} value={form.observacoes} onChange={(event) => change('observacoes', event.target.value)} disabled={saving} className={inputClass} />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 md:px-7">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
          <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar projeto'}</button>
        </div>
      </form>
    </div>
  )
}

export function ProjectsWorkspace({ obra, user, canEdit = true }) {
  const { records, loading, saving, error, source, create, update, remove, reload } = useWorkspaceRecords('projetos', obra?.id, user)
  const [selectedFolder, setSelectedFolder] = useState(FOLDERS[0].id)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const folderRecords = useMemo(
    () => records.filter((record) => String(record.pasta || FOLDERS[0].id) === selectedFolder),
    [records, selectedFolder],
  )

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    setModalOpen(true)
  }

  const save = async (form) => {
    if (editing?.id) await update(editing.id, form)
    else await create(form)
    setSelectedFolder(form.pasta)
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <div className="space-y-5">
      <ProjectModal
        key={`${editing?.id || 'new'}-${selectedFolder}-${modalOpen}`}
        open={modalOpen}
        project={editing}
        selectedFolder={selectedFolder}
        saving={saving}
        onClose={() => { if (!saving) { setModalOpen(false); setEditing(null) } }}
        onSave={save}
      />

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between md:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{obra?.nome || 'NeoCanteiro'}</p>
              <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ring-1 ${source === 'supabase' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}`}>{source === 'supabase' ? 'Banco sincronizado' : 'Modo demonstração'}</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Projetos</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">Projetos da obra organizados nas pastas arquitetônico, estrutural e complementares.</p>
          </div>

          <div className="flex gap-2">
            <button onClick={reload} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"><RefreshCw size={17} /> Atualizar</button>
            {canEdit && <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Plus size={18} /> Novo projeto</button>}
          </div>
        </div>

        <div className="grid gap-3 bg-slate-50/70 p-4 md:grid-cols-3 md:p-5">
          {FOLDERS.map((folder) => {
            const count = records.filter((record) => String(record.pasta || FOLDERS[0].id) === folder.id).length
            const active = selectedFolder === folder.id
            return (
              <button key={folder.id} type="button" onClick={() => setSelectedFolder(folder.id)} className={`rounded-2xl border p-4 text-left transition ${active ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}><FolderOpen size={21} /></span>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-black ${active ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{count}</span>
                </div>
                <h2 className="mt-3 text-sm font-black text-slate-900">{folder.label}</h2>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{folder.description}</p>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">Pasta selecionada</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">{selectedFolder}</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[9px] font-black uppercase text-slate-600">{folderRecords.length} arquivo{folderRecords.length === 1 ? '' : 's'}</span>
        </div>

        {error && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">{error}</div>}

        {loading ? (
          <div className="flex min-h-56 items-center justify-center text-sm font-black text-blue-600"><RefreshCw className="mr-2 animate-spin" size={18} /> Carregando projetos...</div>
        ) : folderRecords.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><FileText size={24} /></div>
            <h3 className="mt-4 text-base font-black text-slate-900">Nenhum projeto nesta pasta</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">Cadastre o primeiro arquivo de {selectedFolder.toLowerCase()}.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {folderRecords.map((project) => (
              <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><FileText size={18} /></span>
                  <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ring-1 ${statusClass(project.status)}`}>{project.status || 'Vigente'}</span>
                </div>
                <h3 className="mt-3 text-sm font-black leading-5 text-slate-900">{project.nome}</h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Info label="Disciplina" value={project.disciplina || '—'} />
                  <Info label="Versão" value={project.versao || '—'} />
                  <Info label="Responsável" value={project.responsavel || '—'} />
                  <Info label="Emissão" value={formatDate(project.data_emissao)} />
                </div>
                {project.observacoes && <p className="mt-3 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{project.observacoes}</p>}
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  {project.url && <a href={project.url} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-[10px] font-black text-blue-700 hover:bg-blue-100"><ExternalLink size={13} /> Abrir arquivo</a>}
                  {canEdit && <button onClick={() => openEdit(project)} className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-700" aria-label="Editar projeto"><Edit3 size={15} /></button>}
                  {canEdit && <button onClick={async () => { if (window.confirm(`Excluir o projeto “${project.nome}”?`)) await remove(project.id) }} className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100" aria-label="Excluir projeto"><Trash2 size={15} /></button>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-slate-700">{value}</p>
    </div>
  )
}

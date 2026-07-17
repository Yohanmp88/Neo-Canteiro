'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CloudSun,
  Edit3,
  FileText,
  Plus,
  RefreshCw,
  UsersRound,
  X,
} from 'lucide-react'
import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400'

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

function formularioInicial(user) {
  return {
    data: hoje(),
    clima: '',
    equipe_total: '',
    responsavel: user?.user_metadata?.nome || user?.email?.split('@')[0] || '',
    servicos_executados: '',
    ocorrencias: '',
    visitas: '',
    proximas_atividades: '',
    status: 'Finalizado',
  }
}

function formatarData(value) {
  const date = new Date(`${String(value || '').slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Data não informada'
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function textoOuVazio(value) {
  return String(value || '').trim()
}

function CampoDetalhe({ titulo, valor, destaque = false }) {
  if (!textoOuVazio(valor)) return null

  return (
    <section className={`rounded-2xl border p-4 ${destaque ? 'border-blue-100 bg-blue-50/60' : 'border-slate-200 bg-white'}`}>
      <p className={`text-[9px] font-black uppercase tracking-[0.16em] ${destaque ? 'text-blue-600' : 'text-slate-400'}`}>{titulo}</p>
      <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-slate-700">{valor}</p>
    </section>
  )
}

function DiarioDetalhes({ record, open, canEdit, onClose, onEdit }) {
  if (!open || !record) return null

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm md:items-center md:p-6">
      <div className="max-h-[94vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:max-w-4xl md:rounded-[2rem]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 md:px-7">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Diário de obra</p>
            <h2 className="mt-1 capitalize text-xl font-black text-slate-900">{formatarData(record.data)}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {record.status && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-700 ring-1 ring-emerald-100">{record.status}</span>}
              {record.clima && <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase text-slate-600 ring-1 ring-slate-200"><CloudSun size={12} />{record.clima}</span>}
              {record.equipe_total !== '' && record.equipe_total !== null && record.equipe_total !== undefined && <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase text-slate-600 ring-1 ring-slate-200"><UsersRound size={12} />{record.equipe_total} trabalhadores</span>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(94vh-145px)] overflow-y-auto bg-slate-50/60 px-5 py-5 md:px-7">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <CampoDetalhe titulo="Serviços executados" valor={record.servicos_executados || record.atividades} destaque />
            </div>
            <CampoDetalhe titulo="Ocorrências e interferências" valor={record.ocorrencias || record.observacoes} />
            <CampoDetalhe titulo="Visitas e fiscalizações" valor={record.visitas} />
            <CampoDetalhe titulo="Próximas atividades" valor={record.proximas_atividades} />
            <CampoDetalhe titulo="Responsável pelo registro" valor={record.responsavel || record.created_by_name} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-5 py-4 md:px-7">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Fechar</button>
          {canEdit && <button type="button" onClick={() => onEdit(record)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Edit3 size={16} />Editar diário</button>}
        </div>
      </div>
    </div>
  )
}

function DiarioFormulario({ open, record, user, saving, onClose, onSave }) {
  const [form, setForm] = useState(() => record ? { ...record } : formularioInicial(user))
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    setForm(record ? { ...record } : formularioInicial(user))
    setLocalError('')
  }, [record, open, user])

  if (!open) return null

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setLocalError('')

    try {
      await onSave(form)
    } catch (error) {
      setLocalError(error?.message || 'Não foi possível salvar o diário.')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm md:items-center md:p-6">
      <form onSubmit={submit} className="max-h-[95vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:max-w-5xl md:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">{record ? 'Editar diário' : 'Novo diário'}</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">Registro diário da obra</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Fechar"><X size={20} /></button>
        </div>

        <div className="max-h-[calc(95vh-150px)] overflow-y-auto px-5 py-5 md:px-7">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Data *</span>
              <input type="date" value={form.data || ''} onChange={(event) => change('data', event.target.value)} required disabled={saving} className={inputClass} />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Clima</span>
              <select value={form.clima || ''} onChange={(event) => change('clima', event.target.value)} disabled={saving} className={inputClass}>
                <option value="">Selecione</option>
                <option>Ensolarado</option>
                <option>Nublado</option>
                <option>Chuva leve</option>
                <option>Chuva forte</option>
                <option>Instável</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Total de trabalhadores</span>
              <input type="number" min="0" value={form.equipe_total ?? ''} onChange={(event) => change('equipe_total', event.target.value)} disabled={saving} className={inputClass} />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Status</span>
              <select value={form.status || ''} onChange={(event) => change('status', event.target.value)} disabled={saving} className={inputClass}>
                <option>Rascunho</option>
                <option>Finalizado</option>
                <option>Aprovado</option>
                <option>Revisar</option>
              </select>
            </label>
            <label className="md:col-span-2 lg:col-span-4">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Responsável</span>
              <input value={form.responsavel || ''} onChange={(event) => change('responsavel', event.target.value)} disabled={saving} className={inputClass} />
            </label>
            <label className="md:col-span-2 lg:col-span-4">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Serviços executados *</span>
              <textarea rows={6} value={form.servicos_executados || ''} onChange={(event) => change('servicos_executados', event.target.value)} required disabled={saving} className={inputClass} placeholder="Descreva tudo que foi executado no dia" />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Ocorrências e interferências</span>
              <textarea rows={4} value={form.ocorrencias || ''} onChange={(event) => change('ocorrencias', event.target.value)} disabled={saving} className={inputClass} />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Visitas e fiscalizações</span>
              <textarea rows={4} value={form.visitas || ''} onChange={(event) => change('visitas', event.target.value)} disabled={saving} className={inputClass} />
            </label>
            <label className="md:col-span-2 lg:col-span-4">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Próximas atividades</span>
              <textarea rows={4} value={form.proximas_atividades || ''} onChange={(event) => change('proximas_atividades', event.target.value)} disabled={saving} className={inputClass} />
            </label>
          </div>

          {localError && <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700"><AlertTriangle size={17} className="mt-0.5 shrink-0" />{localError}</div>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 md:px-7">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60">{saving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}{saving ? 'Salvando...' : 'Salvar diário'}</button>
        </div>
      </form>
    </div>
  )
}

export function DiaryWorkspace({ obra, user, canEdit = true }) {
  const {
    records,
    loading,
    saving,
    error,
    source,
    create,
    update,
    reload,
  } = useWorkspaceRecords('diario', obra?.id, user)

  const [viewing, setViewing] = useState(null)
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  const ordered = useMemo(
    () => [...records].sort((a, b) => String(b.data || b.created_at || '').localeCompare(String(a.data || a.created_at || ''))),
    [records],
  )

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (record) => {
    setViewing(null)
    setEditing(record)
    setFormOpen(true)
  }

  const save = async (form) => {
    const payload = { ...form }
    delete payload.id
    delete payload.obra_id
    delete payload.created_at
    delete payload.updated_at
    delete payload.created_by
    delete payload.updated_by
    delete payload.created_by_name

    if (editing) await update(editing.id, payload)
    else await create(payload)

    setFormOpen(false)
    setEditing(null)
  }

  return (
    <div className="space-y-5">
      <DiarioDetalhes record={viewing} open={Boolean(viewing)} canEdit={canEdit} onClose={() => setViewing(null)} onEdit={openEdit} />
      <DiarioFormulario open={formOpen} record={editing} user={user} saving={saving} onClose={() => { if (!saving) { setFormOpen(false); setEditing(null) } }} onSave={save} />

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between md:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{obra?.nome || 'NeoCanteiro'}</p>
              <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ring-1 ${source === 'supabase' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>{source === 'supabase' ? 'Banco sincronizado' : 'Somente neste navegador'}</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Diário de Obra</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">O cliente pode abrir cada registro e consultar tudo que foi executado, ocorrências, visitas e próximas atividades.</p>
          </div>

          {canEdit && <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Plus size={18} />Novo diário</button>}
        </div>

        <div className="grid gap-3 bg-slate-50/70 p-4 sm:grid-cols-3 md:p-5">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Registros</p><p className="mt-2 text-xl font-black text-slate-900">{records.length}</p></div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Último diário</p><p className="mt-2 text-sm font-black capitalize text-slate-900">{ordered[0] ? formatarData(ordered[0].data) : 'Nenhum'}</p></div>
          <div className={`rounded-2xl p-4 ring-1 ${source === 'supabase' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-amber-50 text-amber-700 ring-amber-100'}`}><p className="text-[9px] font-black uppercase tracking-wider">Armazenamento</p><p className="mt-2 text-sm font-black">{source === 'supabase' ? 'Supabase' : 'Navegador'}</p></div>
        </div>
      </section>

      {error && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800"><AlertTriangle size={17} className="mt-0.5 shrink-0" />{error}</div>}

      <div className="flex justify-end"><button onClick={reload} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 shadow-sm hover:bg-slate-50"><RefreshCw size={15} />Atualizar diários</button></div>

      {loading ? (
        <div className="flex min-h-72 items-center justify-center text-sm font-black text-blue-600"><RefreshCw className="mr-2 animate-spin" size={18} />Carregando diários...</div>
      ) : ordered.length === 0 ? (
        <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center"><FileText size={42} className="mx-auto text-slate-300" /><h2 className="mt-4 text-lg font-black text-slate-900">Nenhum diário cadastrado</h2><p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-slate-500">Quando um diário for adicionado, ele aparecerá aqui para consulta completa.</p></div>
      ) : (
        <div className="space-y-3">
          {ordered.map((record) => (
            <button key={record.id} type="button" onClick={() => setViewing(record)} className="group w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md md:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><CalendarDays size={19} /></div>
                  <div className="min-w-0">
                    <p className="capitalize text-sm font-black text-slate-900 md:text-base">{formatarData(record.data)}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{record.servicos_executados || record.atividades || 'Diário sem descrição dos serviços.'}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {record.clima && <span className="rounded-full bg-slate-50 px-2 py-1 text-[8px] font-black uppercase text-slate-500 ring-1 ring-slate-200">{record.clima}</span>}
                      {record.status && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase text-emerald-700 ring-1 ring-emerald-100">{record.status}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-[9px] font-black uppercase text-blue-600"><span className="hidden sm:inline">Ver registro</span><ChevronRight size={17} className="transition group-hover:translate-x-0.5" /></div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

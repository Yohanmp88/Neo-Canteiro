'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Edit3,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'
import {
  cleanWorkspaceRecord,
  formatDeliveryQuantity,
  isReceivedStatus,
  materialDeliveryFromRecord,
  mergeMaterialDeliveries,
  todayDate,
} from '@/lib/materialDelivery'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400'

const UNITS = ['un', 'kg', 'm', 'm²', 'm³', 'saco', 'l', 'conjunto']
const STOCK_STATUS = ['Disponível', 'Estoque baixo', 'Solicitar compra', 'Esgotado']
const RECEIPT_STATUS = ['Não recebido', 'Aguardando entrega', 'Recebido parcialmente', 'Recebido']

function emptyForm(user) {
  return {
    item: '',
    categoria: '',
    unidade: 'un',
    quantidade: '',
    estoque_minimo: '',
    custo_unitario: '',
    fornecedor: '',
    localizacao: '',
    status: 'Disponível',
    recebimento_status: 'Não recebido',
    quantidade_recebida: '',
    data_recebimento: '',
    recebido_por: user?.user_metadata?.nome || user?.email?.split('@')[0] || '',
    observacoes_recebimento: '',
    observacoes: '',
  }
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('pt-BR')
}

function statusTone(value) {
  const normalized = String(value || '').toLowerCase()
  if (normalized.startsWith('recebido')) return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (normalized.includes('aguardando')) return 'bg-amber-50 text-amber-700 ring-amber-200'
  return 'bg-slate-50 text-slate-600 ring-slate-200'
}

function MaterialModal({ open, record, user, saving, onClose, onSave }) {
  const [form, setForm] = useState(() => record ? { ...emptyForm(user), ...record } : emptyForm(user))
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(record ? { ...emptyForm(user), ...record } : emptyForm(user))
    setError('')
  }, [open, record, user])

  if (!open) return null

  const change = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value }

      if (key === 'recebimento_status' && isReceivedStatus(value)) {
        if (!next.data_recebimento) next.data_recebimento = todayDate()
        if (next.quantidade_recebida === '' || next.quantidade_recebida === null || next.quantidade_recebida === undefined) {
          next.quantidade_recebida = next.quantidade || ''
        }
      }

      return next
    })
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      await onSave(form)
    } catch (saveError) {
      setError(saveError?.message || 'Não foi possível salvar o material.')
    }
  }

  const received = isReceivedStatus(form.recebimento_status)

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm md:items-center md:p-6">
      <form onSubmit={submit} className="max-h-[95vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:max-w-5xl md:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">{record ? 'Editar material' : 'Novo material'}</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">Estoque e recebimento</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Fechar"><X size={20} /></button>
        </div>

        <div className="max-h-[calc(95vh-150px)] overflow-y-auto px-5 py-5 md:px-7">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="md:col-span-2">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Material *</span>
              <input value={form.item || ''} onChange={(event) => change('item', event.target.value)} required disabled={saving} className={inputClass} placeholder="Ex.: Cimento CP-II" />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Categoria</span>
              <input value={form.categoria || ''} onChange={(event) => change('categoria', event.target.value)} disabled={saving} className={inputClass} />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Unidade</span>
              <select value={form.unidade || ''} onChange={(event) => change('unidade', event.target.value)} disabled={saving} className={inputClass}>{UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select>
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Quantidade atual</span>
              <input type="number" min="0" step="0.01" value={form.quantidade ?? ''} onChange={(event) => change('quantidade', event.target.value)} disabled={saving} className={inputClass} />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Estoque mínimo</span>
              <input type="number" min="0" step="0.01" value={form.estoque_minimo ?? ''} onChange={(event) => change('estoque_minimo', event.target.value)} disabled={saving} className={inputClass} />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Custo unitário</span>
              <input type="number" min="0" step="0.01" value={form.custo_unitario ?? ''} onChange={(event) => change('custo_unitario', event.target.value)} disabled={saving} className={inputClass} />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Situação do estoque</span>
              <select value={form.status || ''} onChange={(event) => change('status', event.target.value)} disabled={saving} className={inputClass}>{STOCK_STATUS.map((status) => <option key={status}>{status}</option>)}</select>
            </label>
            <label className="md:col-span-2">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Fornecedor</span>
              <input value={form.fornecedor || ''} onChange={(event) => change('fornecedor', event.target.value)} disabled={saving} className={inputClass} />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Localização no canteiro</span>
              <input value={form.localizacao || ''} onChange={(event) => change('localizacao', event.target.value)} disabled={saving} className={inputClass} />
            </label>
          </div>

          <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 md:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"><Truck size={19} /></div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Recebimento na obra</h3>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-500">Ao marcar como recebido, o material será incluído automaticamente no Diário de Obra da data informada.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Situação do recebimento</span>
                <select value={form.recebimento_status || ''} onChange={(event) => change('recebimento_status', event.target.value)} disabled={saving} className={inputClass}>{RECEIPT_STATUS.map((status) => <option key={status}>{status}</option>)}</select>
              </label>
              <label>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Quantidade recebida</span>
                <input type="number" min="0" step="0.01" value={form.quantidade_recebida ?? ''} onChange={(event) => change('quantidade_recebida', event.target.value)} required={received} disabled={saving} className={inputClass} />
              </label>
              <label>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Data do recebimento</span>
                <input type="date" value={form.data_recebimento || ''} onChange={(event) => change('data_recebimento', event.target.value)} required={received} disabled={saving} className={inputClass} />
              </label>
              <label>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Recebido por</span>
                <input value={form.recebido_por || ''} onChange={(event) => change('recebido_por', event.target.value)} disabled={saving} className={inputClass} />
              </label>
              <label className="md:col-span-2 lg:col-span-4">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Observações do recebimento</span>
                <textarea rows={3} value={form.observacoes_recebimento || ''} onChange={(event) => change('observacoes_recebimento', event.target.value)} disabled={saving} className={inputClass} placeholder="Conferência, avarias, diferença de quantidade ou nota fiscal" />
              </label>
            </div>
          </section>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Observações gerais</span>
            <textarea rows={3} value={form.observacoes || ''} onChange={(event) => change('observacoes', event.target.value)} disabled={saving} className={inputClass} />
          </label>

          {error && <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700"><AlertTriangle size={17} className="mt-0.5 shrink-0" />{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 md:px-7">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}{saving ? 'Salvando...' : 'Salvar material'}</button>
        </div>
      </form>
    </div>
  )
}

export function MaterialsWorkspace({ obra, user, canEdit = true }) {
  const materials = useWorkspaceRecords('materiais', obra?.id, user)
  const diaries = useWorkspaceRecords('diario', obra?.id, user)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [localError, setLocalError] = useState('')

  const ordered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return [...materials.records]
      .filter((record) => !term || [record.item, record.categoria, record.fornecedor, record.recebimento_status].some((value) => String(value || '').toLowerCase().includes(term)))
      .sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))
  }, [materials.records, search])

  const receivedCount = materials.records.filter((record) => isReceivedStatus(record.recebimento_status)).length
  const awaitingCount = materials.records.filter((record) => String(record.recebimento_status || '').toLowerCase().includes('aguardando')).length

  const syncDiary = async (material) => {
    const received = isReceivedStatus(material.recebimento_status)
    const targetDate = received ? String(material.data_recebimento || todayDate()).slice(0, 10) : ''
    const delivery = received ? materialDeliveryFromRecord(material) : null
    let targetFound = false

    for (const diary of diaries.records) {
      const previous = Array.isArray(diary.materiais_entregues) ? diary.materiais_entregues : []
      const withoutMaterial = previous.filter((entry) => String(entry.material_id || '') !== String(material.id || ''))
      let nextDeliveries = withoutMaterial

      if (received && String(diary.data || '').slice(0, 10) === targetDate) {
        nextDeliveries = mergeMaterialDeliveries(withoutMaterial, delivery)
        targetFound = true
      }

      if (JSON.stringify(previous) !== JSON.stringify(nextDeliveries)) {
        await diaries.update(diary.id, {
          ...cleanWorkspaceRecord(diary),
          materiais_entregues: nextDeliveries,
        })
      }
    }

    if (received && !targetFound) {
      await diaries.create({
        data: targetDate,
        clima: '',
        equipe_total: '',
        responsavel: user?.user_metadata?.nome || user?.email?.split('@')[0] || '',
        servicos_executados: 'Recebimento de materiais registrado automaticamente.',
        ocorrencias: '',
        visitas: '',
        proximas_atividades: '',
        status: 'Rascunho',
        materiais_entregues: [delivery],
        materiais_entregues_observacoes: '',
        origem_automatica_materiais: true,
      })
    }
  }

  const save = async (form) => {
    setMessage('')
    setLocalError('')

    const payload = {
      ...form,
      quantidade: form.quantidade === '' ? '' : Number(form.quantidade),
      estoque_minimo: form.estoque_minimo === '' ? '' : Number(form.estoque_minimo),
      custo_unitario: form.custo_unitario === '' ? '' : Number(form.custo_unitario),
      quantidade_recebida: form.quantidade_recebida === '' ? '' : Number(form.quantidade_recebida),
    }

    if (isReceivedStatus(payload.recebimento_status)) {
      payload.data_recebimento = payload.data_recebimento || todayDate()
      if (payload.quantidade_recebida === '') payload.quantidade_recebida = Number(payload.quantidade || 0)
    }

    const saved = editing
      ? await materials.update(editing.id, payload)
      : await materials.create(payload)

    try {
      await syncDiary(saved)
      setMessage(isReceivedStatus(saved.recebimento_status)
        ? `Recebimento de ${saved.item} registrado e incluído automaticamente no Diário de Obra de ${formatDate(saved.data_recebimento)}.`
        : 'Material salvo e vínculo do diário atualizado.')
    } catch (syncError) {
      setLocalError(`O material foi salvo, mas o diário não pôde ser atualizado automaticamente: ${syncError?.message || 'erro desconhecido'}`)
    }

    setModalOpen(false)
    setEditing(null)
  }

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    setModalOpen(true)
  }

  const openReceive = (record) => {
    setEditing({
      ...record,
      recebimento_status: isReceivedStatus(record.recebimento_status) ? record.recebimento_status : 'Recebido',
      data_recebimento: record.data_recebimento || todayDate(),
      quantidade_recebida: record.quantidade_recebida === '' || record.quantidade_recebida === undefined ? record.quantidade || '' : record.quantidade_recebida,
      recebido_por: record.recebido_por || user?.user_metadata?.nome || user?.email?.split('@')[0] || '',
    })
    setModalOpen(true)
  }

  const removeMaterial = async (record) => {
    if (!window.confirm(`Arquivar o material “${record.item}”?`)) return
    await materials.remove(record.id)
    await syncDiary({ ...record, recebimento_status: 'Não recebido' })
  }

  const busy = materials.saving || diaries.saving

  return (
    <div className="space-y-5">
      <MaterialModal open={modalOpen} record={editing} user={user} saving={busy} onClose={() => { if (!busy) { setModalOpen(false); setEditing(null) } }} onSave={save} />

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between md:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{obra?.nome || 'NeoCanteiro'}</p>
              <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ring-1 ${materials.source === 'supabase' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>{materials.source === 'supabase' ? 'Banco sincronizado' : 'Somente neste navegador'}</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Materiais e Estoque</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">Controle o estoque e registre entregas. Cada recebimento confirmado alimenta automaticamente o Diário de Obra da mesma data.</p>
          </div>

          {canEdit && <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Plus size={18} />Novo material</button>}
        </div>

        <div className="grid gap-3 bg-slate-50/70 p-4 sm:grid-cols-3 md:p-5">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><div className="flex items-center justify-between text-slate-500"><p className="text-[9px] font-black uppercase tracking-wider">Materiais</p><Boxes size={16} /></div><p className="mt-2 text-xl font-black text-slate-900">{materials.records.length}</p></div>
          <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700 ring-1 ring-emerald-100"><div className="flex items-center justify-between"><p className="text-[9px] font-black uppercase tracking-wider">Recebidos</p><PackageCheck size={16} /></div><p className="mt-2 text-xl font-black">{receivedCount}</p></div>
          <div className="rounded-2xl bg-amber-50 p-4 text-amber-700 ring-1 ring-amber-100"><div className="flex items-center justify-between"><p className="text-[9px] font-black uppercase tracking-wider">Aguardando</p><Truck size={16} /></div><p className="mt-2 text-xl font-black">{awaitingCount}</p></div>
        </div>
      </section>

      {(materials.error || diaries.error || localError) && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-800"><AlertTriangle size={17} className="mt-0.5 shrink-0" />{localError || materials.error || diaries.error}</div>}
      {message && <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold leading-5 text-emerald-800"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />{message}</div>}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-md"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} pl-9`} placeholder="Buscar material, fornecedor ou recebimento" /></label>
          <button onClick={() => { materials.reload(); diaries.reload() }} disabled={materials.loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={materials.loading ? 'animate-spin' : ''} />Atualizar</button>
        </div>

        {materials.loading ? (
          <div className="flex min-h-72 items-center justify-center text-sm font-black text-blue-600"><Loader2 className="mr-2 animate-spin" size={18} />Carregando materiais...</div>
        ) : ordered.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center text-center"><Boxes size={42} className="text-slate-300" /><h2 className="mt-4 text-lg font-black text-slate-900">Nenhum material cadastrado</h2><p className="mt-2 text-sm font-medium text-slate-500">Cadastre os materiais da obra para controlar estoque e entregas.</p></div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {ordered.map((record) => {
              const received = isReceivedStatus(record.recebimento_status)
              const delivery = received ? materialDeliveryFromRecord(record) : null
              return (
                <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0"><h3 className="truncate text-base font-black text-slate-900">{record.item}</h3><p className="mt-1 truncate text-xs font-medium text-slate-500">{[record.categoria, record.fornecedor].filter(Boolean).join(' • ') || 'Sem categoria ou fornecedor'}</p></div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase ring-1 ${statusTone(record.recebimento_status)}`}>{record.recebimento_status || 'Não recebido'}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
                    <div><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Em estoque</p><p className="mt-1 text-xs font-black text-slate-700">{Number(record.quantidade || 0).toLocaleString('pt-BR')} {record.unidade || ''}</p></div>
                    <div><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Situação</p><p className="mt-1 text-xs font-black text-slate-700">{record.status || '—'}</p></div>
                    <div><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Recebido</p><p className="mt-1 text-xs font-black text-slate-700">{delivery ? formatDeliveryQuantity(delivery) : '—'}</p></div>
                    <div><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Data</p><p className="mt-1 text-xs font-black text-slate-700">{formatDate(record.data_recebimento)}</p></div>
                  </div>

                  {canEdit && (
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                      <button onClick={() => openReceive(record)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-50 px-2 py-2 text-[10px] font-black text-emerald-700"><PackageCheck size={13} />{received ? 'Conferir' : 'Receber'}</button>
                      <button onClick={() => openEdit(record)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-50 px-2 py-2 text-[10px] font-black text-blue-700"><Edit3 size={13} />Editar</button>
                      <button onClick={() => removeMaterial(record)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-50 px-2 py-2 text-[10px] font-black text-red-600"><Trash2 size={13} />Arquivar</button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

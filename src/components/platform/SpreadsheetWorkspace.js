'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  FileSpreadsheet,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Table2,
  Upload,
  X,
} from 'lucide-react'
import { authenticatedApi, uploadImportFile, validateSpreadsheetFile } from '@/lib/importClient'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function cellText(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function ImportModal({ open, datasets, selectedDataset, user, obra, saving, onClose, onImported }) {
  const [mode, setMode] = useState('new')
  const [datasetId, setDatasetId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const target = selectedDataset || null
    setMode(target ? 'update' : 'new')
    setDatasetId(target?.id || '')
    setName(target?.nome || '')
    setDescription(target?.descricao || '')
    setFile(null)
    setSubmitting(false)
    setError('')
  }, [open, selectedDataset])

  if (!open) return null
  const busy = saving || submitting

  const changeDataset = (id) => {
    setDatasetId(id)
    const target = datasets.find((dataset) => dataset.id === id)
    if (target) {
      setName(target.nome || '')
      setDescription(target.descricao || '')
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      validateSpreadsheetFile(file)
      if (!name.trim()) throw new Error('Informe um nome para a planilha.')
      if (mode === 'update' && !datasetId) throw new Error('Selecione a planilha que será atualizada.')

      const storagePath = await uploadImportFile(file, user, `planilhas/${obra.id}`)
      const payload = await authenticatedApi('/api/planilhas/importar', {
        method: 'POST',
        body: JSON.stringify({
          obra_id: obra.id,
          dataset_id: mode === 'update' ? datasetId : null,
          nome: name.trim(),
          descricao: description.trim(),
          storage_path: storagePath,
          arquivo_nome: file.name,
        }),
      })

      await onImported(payload)
    } catch (submitError) {
      setError(submitError?.message || 'Não foi possível importar a planilha.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm md:items-center md:p-6">
      <form onSubmit={submit} className="max-h-[94vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:max-w-2xl md:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Importação Excel</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">Publicar planilha no NeoCanteiro</h2>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Fechar"><X size={20} /></button>
        </div>

        <div className="max-h-[calc(94vh-150px)] space-y-5 overflow-y-auto px-5 py-5 md:px-7">
          {datasets.length > 0 && (
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
              <button type="button" onClick={() => { setMode('new'); setDatasetId(''); setName(''); setDescription('') }} className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${mode === 'new' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Nova planilha</button>
              <button type="button" onClick={() => setMode('update')} className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${mode === 'update' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Atualizar existente</button>
            </div>
          )}

          {mode === 'update' && (
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Planilha que será atualizada</span>
              <select value={datasetId} onChange={(event) => changeDataset(event.target.value)} required disabled={busy} className={inputClass}>
                <option value="">Selecione...</option>
                {datasets.map((dataset) => <option key={dataset.id} value={dataset.id}>{dataset.nome}</option>)}
              </select>
            </label>
          )}

          <label>
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Nome exibido para o cliente *</span>
            <input value={name} onChange={(event) => setName(event.target.value)} required disabled={saving || mode === 'update'} className={inputClass} placeholder="Ex.: Orçamento executivo da obra" />
          </label>

          <label>
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Descrição</span>
            <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} className={inputClass} placeholder="Explique ao cliente o conteúdo desta planilha" />
          </label>

          <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-7 text-center transition hover:border-blue-300 hover:bg-blue-50/50">
            <input type="file" accept=".xlsx,.xls,.csv" className="sr-only" disabled={busy} onChange={(event) => { setError(''); setFile(event.target.files?.[0] || null) }} />
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Upload size={21} /></div>
            <p className="mt-3 text-sm font-black text-slate-900">{file?.name || 'Selecionar arquivo Excel ou CSV'}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">A primeira tabela legível será transformada no layout da plataforma. Limite de 50 MB.</p>
          </label>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs font-medium leading-5 text-blue-800">
            Ao importar novamente a mesma planilha, o NeoCanteiro cria uma nova versão e mantém o histórico anterior. O cliente sempre visualiza a versão mais recente.
          </div>

          {error && <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700"><AlertTriangle size={17} className="mt-0.5 shrink-0" />{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 md:px-7">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600">Cancelar</button>
          <button type="submit" disabled={saving || !file} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-50">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {busy ? 'Importando...' : mode === 'update' ? 'Publicar nova versão' : 'Importar planilha'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function SpreadsheetWorkspace({ obra, user, canEdit = false }) {
  const [datasets, setDatasets] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDataset, setModalDataset] = useState(null)

  const loadDetail = useCallback(async (datasetId) => {
    if (!datasetId || !obra?.id) {
      setDetail(null)
      return
    }

    setDetailLoading(true)
    try {
      const payload = await authenticatedApi(`/api/planilhas?obra_id=${encodeURIComponent(obra.id)}&dataset_id=${encodeURIComponent(datasetId)}`)
      setDetail(payload)
    } catch (loadError) {
      setError(loadError?.message || 'Não foi possível abrir a planilha.')
    } finally {
      setDetailLoading(false)
    }
  }, [obra?.id])

  const load = useCallback(async (preferredId = '') => {
    if (!obra?.id) return
    setLoading(true)
    setError('')

    try {
      const payload = await authenticatedApi(`/api/planilhas?obra_id=${encodeURIComponent(obra.id)}`)
      const nextDatasets = payload.datasets || []
      setDatasets(nextDatasets)
      const nextId = preferredId || selectedId || nextDatasets[0]?.id || ''
      setSelectedId(nextId)
      if (nextId) await loadDetail(nextId)
      else setDetail(null)
    } catch (loadError) {
      setError(loadError?.message || 'Não foi possível carregar as planilhas.')
    } finally {
      setLoading(false)
    }
  }, [obra?.id, selectedId, loadDetail])

  useEffect(() => {
    setSelectedId('')
    setDetail(null)
    load('')
  }, [obra?.id])

  const selectDataset = async (datasetId) => {
    setSelectedId(datasetId)
    setSearch('')
    await loadDetail(datasetId)
  }

  const rows = detail?.rows || []
  const headers = Array.isArray(detail?.active_version?.colunas) ? detail.active_version.colunas : []
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) => Object.values(row || {}).some((value) => cellText(value).toLowerCase().includes(query)))
  }, [rows, search])

  const openCreate = () => {
    setModalDataset(null)
    setSuccess('')
    setModalOpen(true)
  }

  const openUpdate = () => {
    const dataset = datasets.find((item) => item.id === selectedId) || null
    setModalDataset(dataset)
    setSuccess('')
    setModalOpen(true)
  }

  const imported = async (payload) => {
    setSaving(false)
    setModalOpen(false)
    setSuccess(payload.message || 'Planilha publicada com sucesso.')
    await load(payload.dataset_id)
  }

  const submitImported = async (payload) => {
    try {
      await imported(payload)
    } finally {
      setSaving(false)
    }
  }

  const exportExcel = async () => {
    if (!selectedId) return
    setError('')
    try {
      const response = await authenticatedApi(`/api/planilhas/exportar?dataset_id=${encodeURIComponent(selectedId)}`, { rawResponse: true })
      const blob = await response.blob()
      const disposition = response.headers.get('content-disposition') || ''
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] || 'planilha-neocanteiro.xlsx'
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (exportError) {
      setError(exportError?.message || 'Não foi possível exportar a planilha.')
    }
  }

  return (
    <div className="space-y-5">
      <ImportModal
        open={modalOpen}
        datasets={datasets}
        selectedDataset={modalDataset}
        user={user}
        obra={obra}
        saving={saving}
        onClose={() => { if (!saving) setModalOpen(false) }}
        onImported={submitImported}
      />

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between md:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{obra?.nome}</p>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase text-emerald-700 ring-1 ring-emerald-200">Versionamento ativo</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Planilhas Excel</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">Importe uma planilha e apresente os dados ao cliente dentro do layout do NeoCanteiro. Uma nova importação atualiza a publicação sem apagar o histórico.</p>
          </div>
          {canEdit && <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20"><Plus size={18} />Importar planilha</button>}
        </div>

        <div className="grid gap-3 bg-slate-50/70 p-4 sm:grid-cols-3 md:p-5">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Planilhas publicadas</p><p className="mt-2 text-2xl font-black text-slate-900">{datasets.length}</p></div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Linhas na versão atual</p><p className="mt-2 text-2xl font-black text-slate-900">{detail?.active_version?.total_linhas || 0}</p></div>
          <div className="rounded-2xl bg-blue-50 p-4 text-blue-700 ring-1 ring-blue-100"><p className="text-[9px] font-black uppercase tracking-wider">Versão publicada</p><p className="mt-2 text-lg font-black">{detail?.active_version ? `v${detail.active_version.numero_versao}` : 'Nenhuma'}</p></div>
        </div>
      </section>

      {error && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800"><AlertTriangle size={17} className="mt-0.5 shrink-0" />{error}</div>}
      {success && <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />{success}</div>}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center text-sm font-black text-blue-600"><Loader2 size={18} className="mr-2 animate-spin" />Carregando planilhas...</div>
      ) : datasets.length === 0 ? (
        <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center"><FileSpreadsheet size={44} className="mx-auto text-slate-300" /><h2 className="mt-4 text-lg font-black text-slate-900">Nenhuma planilha publicada</h2><p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-slate-500">Importe um arquivo Excel para transformá-lo em uma tabela responsiva dentro da plataforma.</p></div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between px-2 py-2"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Publicações</p><button onClick={() => load(selectedId)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600"><RefreshCw size={15} /></button></div>
            <div className="space-y-1.5">
              {datasets.map((dataset) => {
                const active = dataset.id === selectedId
                return (
                  <button key={dataset.id} onClick={() => selectDataset(dataset.id)} className={`w-full rounded-2xl border p-3 text-left transition ${active ? 'border-blue-200 bg-blue-50' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}>
                    <div className="flex items-start gap-3"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}><FileSpreadsheet size={16} /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-slate-900">{dataset.nome}</p><p className="mt-1 text-[9px] font-bold uppercase text-slate-400">v{dataset.active_version?.numero_versao || 0} • {dataset.active_version?.total_linhas || 0} linhas</p></div><ChevronRight size={14} className="mt-2 shrink-0 text-slate-300" /></div>
                  </button>
                )
              })}
            </div>
          </aside>

          <section className="min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between md:p-5">
              <div className="min-w-0"><p className="truncate text-base font-black text-slate-900">{detail?.dataset?.nome || 'Planilha'}</p><p className="mt-1 text-[10px] font-bold text-slate-400">Atualizada em {formatDate(detail?.active_version?.created_at)} • Aba “{detail?.active_version?.aba_nome || 'Planilha'}”</p></div>
              <div className="flex flex-wrap gap-2">
                <button onClick={exportExcel} disabled={!selectedId} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50"><Download size={15} />Exportar Excel</button>
                {canEdit && <button onClick={openUpdate} disabled={!selectedId} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-black text-white disabled:opacity-50"><Upload size={15} />Atualizar</button>}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative block w-full sm:max-w-sm"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} pl-9`} placeholder="Buscar em todas as colunas" /></label>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><History size={14} />{detail?.versions?.length || 0} versão{detail?.versions?.length === 1 ? '' : 'ões'} preservada{detail?.versions?.length === 1 ? '' : 's'}</div>
            </div>

            {detailLoading ? (
              <div className="flex min-h-72 items-center justify-center text-sm font-black text-blue-600"><Loader2 size={18} className="mr-2 animate-spin" />Abrindo planilha...</div>
            ) : (
              <div className="max-h-[620px] overflow-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left">
                  <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur">
                    <tr>{headers.map((header) => <th key={header} className="min-w-40 border-b border-r border-slate-200 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-600 last:border-r-0">{header}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="odd:bg-white even:bg-slate-50/50 hover:bg-blue-50/40">
                        {headers.map((header) => <td key={`${rowIndex}-${header}`} className="max-w-sm border-b border-r border-slate-100 px-4 py-3 text-xs font-medium leading-5 text-slate-700 last:border-r-0"><span className="block max-h-20 overflow-hidden whitespace-pre-wrap break-words">{cellText(row?.[header])}</span></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredRows.length && <div className="flex min-h-52 flex-col items-center justify-center text-center"><Table2 size={35} className="text-slate-300" /><p className="mt-3 text-sm font-black text-slate-900">Nenhuma linha encontrada</p></div>}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

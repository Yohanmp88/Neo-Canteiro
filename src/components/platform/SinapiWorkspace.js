'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  FileSpreadsheet,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Upload,
  X,
} from 'lucide-react'
import { authenticatedApi, uploadImportFile, validateSpreadsheetFile } from '@/lib/importClient'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400'
const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

function currency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function referenceLabel(reference) {
  if (!reference) return 'Referência SINAPI'
  const month = new Date(`${String(reference.referencia).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const regime = reference.regime === 'desonerado' ? 'Desonerado' : 'Não desonerado'
  return `${reference.uf} • ${month} • ${regime}`
}

function ImportSinapiModal({ open, user, saving, onClose, onImported }) {
  const [uf, setUf] = useState('SC')
  const [reference, setReference] = useState(new Date().toISOString().slice(0, 7))
  const [regime, setRegime] = useState('nao_desonerado')
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setFile(null)
    setError('')
    setSubmitting(false)
  }, [open])

  if (!open) return null
  const busy = saving || submitting

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      validateSpreadsheetFile(file)
      const storagePath = await uploadImportFile(file, user, `sinapi/${uf}/${reference}`)
      const payload = await authenticatedApi('/api/sinapi/importar', {
        method: 'POST',
        body: JSON.stringify({
          uf,
          referencia: reference,
          regime,
          storage_path: storagePath,
          arquivo_nome: file.name,
        }),
      })
      await onImported(payload)
    } catch (submitError) {
      setError(submitError?.message || 'Não foi possível importar a base SINAPI.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm md:items-center md:p-6">
      <form onSubmit={submit} className="max-h-[94vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:max-w-2xl md:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-7">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Base oficial de custos</p><h2 className="mt-1 text-lg font-black text-slate-900">Importar referência SINAPI</h2></div>
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"><X size={20} /></button>
        </div>

        <div className="max-h-[calc(94vh-150px)] space-y-5 overflow-y-auto px-5 py-5 md:px-7">
          <div className="grid gap-4 sm:grid-cols-3">
            <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">UF</span><select value={uf} onChange={(event) => setUf(event.target.value)} disabled={busy} className={inputClass}>{UFS.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Mês de referência</span><input type="month" value={reference} onChange={(event) => setReference(event.target.value)} required disabled={busy} className={inputClass} /></label>
            <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Regime</span><select value={regime} onChange={(event) => setRegime(event.target.value)} disabled={busy} className={inputClass}><option value="nao_desonerado">Não desonerado</option><option value="desonerado">Desonerado</option></select></label>
          </div>

          <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-7 text-center transition hover:border-blue-300 hover:bg-blue-50/50">
            <input type="file" accept=".xlsx,.xls,.csv" className="sr-only" disabled={busy} onChange={(event) => { setError(''); setFile(event.target.files?.[0] || null) }} />
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><FileSpreadsheet size={22} /></div>
            <p className="mt-3 text-sm font-black text-slate-900">{file?.name || 'Selecionar relatório de composições'}</p>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-500">O importador procura código, descrição, unidade, custo e, quando existirem, os insumos e coeficientes da composição.</p>
          </label>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium leading-5 text-amber-800">Ao importar novamente a mesma UF, mês e regime, a referência anterior é substituída pela nova planilha.</div>
          {error && <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700"><AlertTriangle size={17} className="mt-0.5 shrink-0" />{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 md:px-7">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600">Cancelar</button>
          <button type="submit" disabled={busy || !file} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}{busy ? 'Processando base...' : 'Importar SINAPI'}</button>
        </div>
      </form>
    </div>
  )
}

function CompositionModal({ composition, items, loading, canEdit, onClose, onAdd }) {
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setQuantity(1)
    setError('')
  }, [composition?.id])

  if (!composition && !loading) return null

  const add = async () => {
    setAdding(true)
    setError('')
    try {
      await onAdd(composition, quantity)
    } catch (addError) {
      setError(addError?.message || 'Não foi possível adicionar ao orçamento.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm md:items-center md:p-6">
      <section className="max-h-[94vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:max-w-4xl md:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-7"><div><p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Composição SINAPI</p><h2 className="mt-1 text-lg font-black text-slate-900">{composition?.codigo || 'Carregando...'}</h2></div><button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button></div>

        {loading ? <div className="flex min-h-80 items-center justify-center text-sm font-black text-blue-600"><Loader2 size={18} className="mr-2 animate-spin" />Carregando composição...</div> : (
          <div className="max-h-[calc(94vh-145px)] overflow-y-auto px-5 py-5 md:px-7">
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <div><h3 className="text-base font-black leading-6 text-slate-900">{composition.descricao}</h3><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600">Unidade: {composition.unidade || '—'}</span>{composition.categoria && <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black text-blue-700">{composition.categoria}</span>}</div></div>
              <div className="rounded-2xl bg-slate-950 p-4 text-white"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Custo unitário</p><p className="mt-2 text-2xl font-black">{currency(composition.custo_total)}</p></div>
            </div>

            {canEdit && <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-end"><label className="w-full sm:max-w-40"><span className="mb-1.5 block text-[10px] font-black uppercase text-blue-700">Quantidade</span><input type="number" min="0" step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} className={inputClass} /></label><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase text-blue-700">Total estimado</p><p className="mt-1 text-lg font-black text-slate-900">{currency(Number(quantity || 0) * Number(composition.custo_total || 0))}</p></div><button onClick={add} disabled={adding} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-black text-white disabled:opacity-50">{adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}Adicionar ao orçamento</button></div>}
            {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}

            <div className="mt-6"><div className="flex items-center justify-between"><h3 className="text-sm font-black text-slate-900">Itens e coeficientes</h3><span className="text-[10px] font-bold text-slate-400">{items.length} item{items.length === 1 ? '' : 's'}</span></div>
              <div className="mt-3 overflow-auto rounded-2xl border border-slate-200"><table className="min-w-full text-left"><thead className="bg-slate-100"><tr>{['Tipo', 'Código', 'Descrição', 'Un.', 'Coeficiente', 'Preço unit.', 'Custo'].map((header) => <th key={header} className="whitespace-nowrap border-b border-slate-200 px-3 py-3 text-[9px] font-black uppercase tracking-wider text-slate-500">{header}</th>)}</tr></thead><tbody>{items.map((item) => <tr key={item.id} className="odd:bg-white even:bg-slate-50/50"><td className="px-3 py-3 text-[10px] font-bold text-slate-500">{item.tipo || '—'}</td><td className="whitespace-nowrap px-3 py-3 text-xs font-black text-slate-700">{item.codigo || '—'}</td><td className="min-w-72 px-3 py-3 text-xs font-medium text-slate-700">{item.descricao || '—'}</td><td className="px-3 py-3 text-xs text-slate-600">{item.unidade || '—'}</td><td className="px-3 py-3 text-xs text-slate-600">{item.coeficiente ?? '—'}</td><td className="whitespace-nowrap px-3 py-3 text-xs text-slate-600">{item.preco_unitario == null ? '—' : currency(item.preco_unitario)}</td><td className="whitespace-nowrap px-3 py-3 text-xs font-bold text-slate-800">{item.custo_total == null ? '—' : currency(item.custo_total)}</td></tr>)}</tbody></table>{!items.length && <p className="p-8 text-center text-xs font-bold text-slate-400">Esta planilha não trouxe os itens analíticos da composição.</p>}</div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export function SinapiWorkspace({ obra, user, canEdit = false }) {
  const [references, setReferences] = useState([])
  const [referenceId, setReferenceId] = useState('')
  const [compositions, setCompositions] = useState([])
  const [query, setQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailItems, setDetailItems] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  const selectedReference = useMemo(() => references.find((item) => item.id === referenceId) || null, [references, referenceId])

  const loadReferences = useCallback(async (preferredId = '') => {
    setLoading(true)
    setError('')
    try {
      const payload = await authenticatedApi('/api/sinapi')
      const next = payload.references || []
      setReferences(next)
      const nextId = preferredId || referenceId || next[0]?.id || ''
      setReferenceId(nextId)
      return nextId
    } catch (loadError) {
      setError(loadError?.message || 'Não foi possível carregar as referências SINAPI.')
      return ''
    } finally {
      setLoading(false)
    }
  }, [referenceId])

  const loadCompositions = useCallback(async (refId, nextPage = 1, nextQuery = query) => {
    if (!refId) {
      setCompositions([])
      setTotal(0)
      return
    }
    setListLoading(true)
    setError('')
    try {
      const payload = await authenticatedApi(`/api/sinapi?reference_id=${encodeURIComponent(refId)}&q=${encodeURIComponent(nextQuery)}&page=${nextPage}&page_size=40`)
      setCompositions(payload.compositions || [])
      setPage(payload.page || 1)
      setTotalPages(payload.total_pages || 1)
      setTotal(payload.total || 0)
    } catch (loadError) {
      setError(loadError?.message || 'Não foi possível pesquisar as composições.')
    } finally {
      setListLoading(false)
    }
  }, [query])

  useEffect(() => {
    ;(async () => {
      const id = await loadReferences('')
      if (id) await loadCompositions(id, 1, '')
    })()
  }, [])

  const selectReference = async (id) => {
    setReferenceId(id)
    setQuery('')
    setSearchInput('')
    await loadCompositions(id, 1, '')
  }

  const search = async (event) => {
    event.preventDefault()
    setQuery(searchInput.trim())
    await loadCompositions(referenceId, 1, searchInput.trim())
  }

  const imported = async (payload) => {
    setImportOpen(false)
    setSuccess(`${payload.message} ${payload.total_composicoes} composições e ${payload.total_itens} itens processados.`)
    const id = await loadReferences(payload.reference_id)
    if (id) await loadCompositions(id, 1, '')
  }

  const openComposition = async (composition) => {
    setDetail(composition)
    setDetailItems([])
    setDetailLoading(true)
    try {
      const payload = await authenticatedApi(`/api/sinapi?composition_id=${encodeURIComponent(composition.id)}`)
      setDetail(payload.composition)
      setDetailItems(payload.items || [])
    } catch (detailError) {
      setError(detailError?.message || 'Não foi possível abrir a composição.')
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const addToBudget = async (composition, quantity) => {
    const payload = await authenticatedApi('/api/sinapi/adicionar-orcamento', {
      method: 'POST',
      body: JSON.stringify({ obra_id: obra.id, composition_id: composition.id, quantidade: Number(quantity || 0) }),
    })
    setSuccess(payload.message || 'Composição adicionada ao orçamento.')
    setDetail(null)
  }

  return (
    <div className="space-y-5">
      <ImportSinapiModal open={importOpen} user={user} saving={false} onClose={() => setImportOpen(false)} onImported={imported} />
      <CompositionModal composition={detail} items={detailItems} loading={detailLoading} canEdit={canEdit} onClose={() => setDetail(null)} onAdd={addToBudget} />

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between md:p-7">
          <div><div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Base de custos nacional</p><span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase text-emerald-700 ring-1 ring-emerald-200">Salvo no banco</span></div><h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Composições SINAPI</h1><p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">Pesquise composições por código ou serviço, consulte insumos e coeficientes e envie o custo diretamente para o orçamento da obra.</p></div>
          {canEdit && <button onClick={() => { setSuccess(''); setImportOpen(true) }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20"><Upload size={18} />Importar referência</button>}
        </div>

        <div className="grid gap-3 bg-slate-50/70 p-4 sm:grid-cols-3 md:p-5"><div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Referências salvas</p><p className="mt-2 text-2xl font-black text-slate-900">{references.length}</p></div><div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Composições da seleção</p><p className="mt-2 text-2xl font-black text-slate-900">{total}</p></div><div className="rounded-2xl bg-blue-50 p-4 text-blue-700 ring-1 ring-blue-100"><p className="text-[9px] font-black uppercase tracking-wider">Obra do orçamento</p><p className="mt-2 truncate text-sm font-black">{obra?.nome || 'Nenhuma obra'}</p></div></div>
      </section>

      {error && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800"><AlertTriangle size={17} className="mt-0.5 shrink-0" />{error}</div>}
      {success && <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />{success}</div>}

      {loading ? <div className="flex min-h-72 items-center justify-center text-sm font-black text-blue-600"><Loader2 size={18} className="mr-2 animate-spin" />Carregando biblioteca...</div> : references.length === 0 ? (
        <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center"><Database size={44} className="mx-auto text-slate-300" /><h2 className="mt-4 text-lg font-black text-slate-900">Nenhuma referência SINAPI importada</h2><p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-slate-500">Importe a planilha de composições do mês e da UF que serão usados nos seus orçamentos.</p></div>
      ) : (
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-4 border-b border-slate-100 p-4 lg:grid-cols-[320px_1fr_auto] lg:items-end md:p-5">
            <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Referência ativa</span><select value={referenceId} onChange={(event) => selectReference(event.target.value)} className={inputClass}>{references.map((reference) => <option key={reference.id} value={reference.id}>{referenceLabel(reference)}</option>)}</select></label>
            <form onSubmit={search}><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Pesquisar composição</span><div className="flex gap-2"><label className="relative min-w-0 flex-1"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className={`${inputClass} pl-9`} placeholder="Código ou descrição do serviço" /></label><button className="rounded-xl bg-slate-900 px-4 text-xs font-black text-white">Buscar</button></div></form>
            <button onClick={() => loadCompositions(referenceId, page, query)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600"><RefreshCw size={15} />Atualizar</button>
          </div>

          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black text-slate-700">{selectedReference ? referenceLabel(selectedReference) : 'Referência'}</p><p className="text-[10px] font-bold text-slate-400">Arquivo: {selectedReference?.arquivo_nome || '—'}</p></div></div>

          {listLoading ? <div className="flex min-h-72 items-center justify-center text-sm font-black text-blue-600"><Loader2 size={18} className="mr-2 animate-spin" />Pesquisando composições...</div> : (
            <div className="divide-y divide-slate-100">
              {compositions.map((composition) => (
                <button key={composition.id} onClick={() => openComposition(composition)} className="group flex w-full items-center gap-4 p-4 text-left transition hover:bg-blue-50/40 md:px-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white"><Calculator size={18} /></div>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black text-blue-700 ring-1 ring-blue-100">{composition.codigo}</span><span className="text-[9px] font-black uppercase text-slate-400">{composition.unidade || 'Sem unidade'}</span></div><p className="mt-1.5 text-sm font-bold leading-5 text-slate-900">{composition.descricao}</p></div>
                  <div className="hidden shrink-0 text-right sm:block"><p className="text-[9px] font-black uppercase text-slate-400">Custo unitário</p><p className="mt-1 text-sm font-black text-slate-900">{currency(composition.custo_total)}</p></div>
                  <ChevronRight size={17} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </button>
              ))}
              {!compositions.length && <div className="p-14 text-center"><BookOpen size={38} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-black text-slate-900">Nenhuma composição encontrada</p></div>}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3 md:px-5"><button onClick={() => loadCompositions(referenceId, page - 1, query)} disabled={page <= 1 || listLoading} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 disabled:opacity-40"><ChevronLeft size={14} />Anterior</button><p className="text-[10px] font-black text-slate-500">Página {page} de {totalPages}</p><button onClick={() => loadCompositions(referenceId, page + 1, query)} disabled={page >= totalPages || listLoading} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 disabled:opacity-40">Próxima<ChevronRight size={14} /></button></div>
        </section>
      )}
    </div>
  )
}

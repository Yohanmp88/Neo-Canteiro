'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Edit3,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400'

function emptyForm() {
  return {
    id: '',
    nome: '',
    email: '',
    telefone: '',
    documento: '',
    cidade: '',
    empresa: '',
    status: 'Ativo',
    observacoes: '',
    obra_ids: [],
  }
}

async function apiRequest(path, options = {}) {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData?.session?.access_token

  if (!accessToken) throw new Error('Sua sessão expirou. Entre novamente no NeoCanteiro.')

  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error || 'Não foi possível concluir a operação.')
  return payload
}

function ClientModal({ open, client, works, saving, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm())
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(client ? {
      ...emptyForm(),
      ...client,
      obra_ids: Array.isArray(client.obra_ids) ? client.obra_ids.map(String) : [],
    } : emptyForm())
    setError('')
  }, [open, client])

  if (!open) return null

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const toggleWork = (workId) => {
    const id = String(workId)
    setForm((current) => ({
      ...current,
      obra_ids: current.obra_ids.includes(id)
        ? current.obra_ids.filter((item) => item !== id)
        : [...current.obra_ids, id],
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.obra_ids.length) {
      setError('Selecione pelo menos uma obra para este cliente visualizar.')
      return
    }

    try {
      await onSave(form)
    } catch (saveError) {
      setError(saveError?.message || 'Não foi possível salvar o cliente.')
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm md:items-center md:p-6">
      <form onSubmit={submit} className="max-h-[95vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:max-w-4xl md:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">{client ? 'Editar acesso' : 'Novo cliente'}</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">Cliente e obras autorizadas</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(95vh-150px)] overflow-y-auto px-5 py-5 md:px-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Nome do cliente *</span>
              <input value={form.nome} onChange={(event) => change('nome', event.target.value)} required disabled={saving} className={inputClass} placeholder="Nome completo ou razão social" />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">E-mail de acesso *</span>
              <input type="email" value={form.email} onChange={(event) => change('email', event.target.value)} required disabled={saving || Boolean(client)} className={inputClass} placeholder="cliente@email.com" />
              {client && <span className="mt-1 block text-[10px] font-medium text-slate-400">O e-mail de login não é alterado nesta tela.</span>}
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Telefone</span>
              <input value={form.telefone} onChange={(event) => change('telefone', event.target.value)} disabled={saving} className={inputClass} placeholder="(47) 99999-9999" />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">CPF / CNPJ</span>
              <input value={form.documento} onChange={(event) => change('documento', event.target.value)} disabled={saving} className={inputClass} />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Cidade</span>
              <input value={form.cidade} onChange={(event) => change('cidade', event.target.value)} disabled={saving} className={inputClass} />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Empresa</span>
              <input value={form.empresa} onChange={(event) => change('empresa', event.target.value)} disabled={saving} className={inputClass} />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Status</span>
              <select value={form.status} onChange={(event) => change('status', event.target.value)} disabled={saving} className={inputClass}>
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Observações</span>
              <textarea rows={3} value={form.observacoes} onChange={(event) => change('observacoes', event.target.value)} disabled={saving} className={inputClass} />
            </label>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Building2 size={19} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Obras que o cliente poderá visualizar</h3>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-500">O cliente terá acesso somente às obras marcadas abaixo, sempre em modo de leitura.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {works.map((work) => {
                const checked = form.obra_ids.includes(String(work.id))
                return (
                  <label key={work.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${checked ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleWork(work.id)} disabled={saving} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-black text-slate-900">{work.nome}</span>
                      <span className="mt-0.5 block truncate text-[10px] font-medium text-slate-500">{work.cliente || work.status || 'Obra cadastrada'}</span>
                    </span>
                  </label>
                )
              })}
            </div>

            {!works.length && <p className="mt-4 text-xs font-bold text-amber-700">Cadastre uma obra antes de criar o acesso do cliente.</p>}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 md:px-7">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={saving || !works.length} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {saving ? 'Salvando...' : client ? 'Salvar acesso' : 'Cadastrar e enviar convite'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function ClientAccessWorkspace() {
  const [clients, setClients] = useState([])
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const payload = await apiRequest('/api/admin/clientes')
      setClients(payload.clientes || [])
      setWorks(payload.obras || [])
    } catch (loadError) {
      setError(loadError?.message || 'Não foi possível carregar os clientes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return clients
    return clients.filter((client) => [client.nome, client.email, client.documento, client.telefone]
      .some((value) => String(value || '').toLowerCase().includes(query)))
  }, [clients, search])

  const totalLinks = clients.reduce((total, client) => total + (client.obra_ids?.length || 0), 0)

  const openCreate = () => {
    setEditing(null)
    setSuccess('')
    setModalOpen(true)
  }

  const openEdit = (client) => {
    setEditing(client)
    setSuccess('')
    setModalOpen(true)
  }

  const save = async (form) => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = await apiRequest('/api/admin/clientes', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      })

      await load()
      setModalOpen(false)
      setEditing(null)
      setSuccess(payload.invited
        ? 'Cliente cadastrado, obras vinculadas e convite de acesso enviado por e-mail.'
        : 'Cliente e obras autorizadas atualizados com sucesso.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <ClientModal
        open={modalOpen}
        client={editing}
        works={works}
        saving={saving}
        onClose={() => { if (!saving) { setModalOpen(false); setEditing(null) } }}
        onSave={save}
      />

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between md:p-7">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Acesso do cliente</p>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase text-emerald-700 ring-1 ring-emerald-200">Protegido por obra</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Clientes e obras autorizadas</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">Cadastre o cliente, selecione as obras liberadas e envie o convite de acesso sem sair do NeoCanteiro.</p>
          </div>

          <button onClick={openCreate} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50">
            <Plus size={18} /> Cadastrar cliente
          </button>
        </div>

        <div className="grid gap-3 bg-slate-50/70 p-4 sm:grid-cols-3 md:p-5">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-center justify-between text-slate-500"><p className="text-[9px] font-black uppercase tracking-wider">Clientes com acesso</p><UsersRound size={16} /></div>
            <p className="mt-2 text-xl font-black text-slate-900">{clients.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-center justify-between text-slate-500"><p className="text-[9px] font-black uppercase tracking-wider">Vínculos cliente-obra</p><Building2 size={16} /></div>
            <p className="mt-2 text-xl font-black text-slate-900">{totalLinks}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700 ring-1 ring-emerald-100">
            <div className="flex items-center justify-between"><p className="text-[9px] font-black uppercase tracking-wider">Permissão padrão</p><CheckCircle2 size={16} /></div>
            <p className="mt-2 text-sm font-black">Somente leitura</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-800">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold leading-5 text-emerald-800">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> {success}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} pl-9`} placeholder="Buscar cliente por nome, e-mail ou documento" />
        </label>
        <button onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-72 items-center justify-center text-sm font-black text-blue-600"><Loader2 className="mr-2 animate-spin" size={18} /> Carregando clientes...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <UserRound size={42} className="mx-auto text-slate-300" />
          <h2 className="mt-4 text-lg font-black text-slate-900">Nenhum cliente com acesso</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-slate-500">Cadastre o primeiro cliente e selecione diretamente quais obras ele poderá acompanhar.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((client) => (
            <article key={client.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white"><UserRound size={19} /></div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-black text-slate-900">{client.nome || 'Cliente sem nome'}</h3>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs font-medium text-slate-500"><Mail size={12} /> {client.email}</p>
                  </div>
                </div>
                <button onClick={() => openEdit(client)} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-[10px] font-black text-blue-700 hover:bg-blue-100"><Edit3 size={13} /> Editar</button>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Obras liberadas</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(client.obras || []).map((work) => (
                    <span key={work.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1.5 text-[9px] font-black text-blue-700 ring-1 ring-blue-100"><Building2 size={11} /> {work.nome}</span>
                  ))}
                  {!client.obras?.length && <span className="text-xs font-bold text-amber-700">Nenhuma obra vinculada</span>}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-bold text-slate-500">
                {client.telefone && <span>{client.telefone}</span>}
                {client.documento && <span>{client.documento}</span>}
                <span className="text-emerald-700">Acesso somente leitura</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

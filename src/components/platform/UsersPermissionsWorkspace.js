'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  ACCESS_MODULES,
  getDefaultPermissions,
  getRoleLabel,
  getUserPermissions,
  normalizeRole,
} from '@/lib/accessControl'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
const ROLE_OPTIONS = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'engenheiro', label: 'Engenheiro' },
  { value: 'estagiario', label: 'Estagiário' },
  { value: 'compras', label: 'Compras' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'investidor', label: 'Investidor' },
]

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

function formatDateTime(value) {
  if (!value) return 'Nunca acessou'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Não informado' : date.toLocaleString('pt-BR')
}

function permissionSummary(user) {
  const permissions = getUserPermissions(user)
  const personalized = user?.custom_permissions?.enabled === true
  const viewCount = permissions.view.length
  const editCount = permissions.edit.length

  if (personalized) return `Personalizado: ${viewCount} módulo${viewCount === 1 ? '' : 's'} · ${editCount} com edição`
  if (normalizeRole(user) === 'administrador') return 'Controle total da plataforma'
  return `${viewCount} módulo${viewCount === 1 ? '' : 's'} liberado${viewCount === 1 ? '' : 's'}`
}

function statusClass(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized.includes('bloque')) return 'bg-red-50 text-red-700 ring-red-200'
  if (normalized.includes('pendente') || normalized.includes('convite')) return 'bg-amber-50 text-amber-700 ring-amber-200'
  return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
}

function PermissionsModal({ user, saving, error, onClose, onSave }) {
  const initialRole = normalizeRole(user)
  const existingCustom = user?.custom_permissions?.enabled === true
  const initialPermissions = existingCustom ? getUserPermissions(user) : getDefaultPermissions(initialRole)
  const [role, setRole] = useState(initialRole)
  const [customEnabled, setCustomEnabled] = useState(existingCustom)
  const [viewModules, setViewModules] = useState(initialPermissions.view)
  const [editModules, setEditModules] = useState(initialPermissions.edit)

  if (!user) return null

  const changeRole = (nextRole) => {
    const defaults = getDefaultPermissions(nextRole)
    setRole(nextRole)
    setCustomEnabled(false)
    setViewModules(defaults.view)
    setEditModules(defaults.edit)
  }

  const toggleCustom = () => {
    const next = !customEnabled
    setCustomEnabled(next)
    if (next) {
      const defaults = getDefaultPermissions(role)
      setViewModules(defaults.view)
      setEditModules(defaults.edit)
    }
  }

  const toggleView = (moduleKey) => {
    if (moduleKey === 'dashboard') return

    setViewModules((current) => {
      if (current.includes(moduleKey)) {
        setEditModules((editable) => editable.filter((item) => item !== moduleKey))
        return current.filter((item) => item !== moduleKey)
      }
      return [...current, moduleKey]
    })
  }

  const toggleEdit = (moduleKey) => {
    if (!viewModules.includes(moduleKey)) return
    setEditModules((current) => current.includes(moduleKey)
      ? current.filter((item) => item !== moduleKey)
      : [...current, moduleKey])
  }

  const submit = (event) => {
    event.preventDefault()
    onSave(role, customEnabled
      ? { enabled: true, view: viewModules, edit: editModules }
      : { enabled: false, view: [], edit: [] })
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm md:items-center md:p-6">
      <form onSubmit={submit} className="max-h-[95vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:max-w-4xl md:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Editar permissões</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">{user.nome}</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">{user.email}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(95vh-150px)] overflow-y-auto px-5 py-5 md:px-7">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Perfil principal</span>
              <select value={role} onChange={(event) => changeRole(event.target.value)} disabled={saving} className={inputClass}>
                {ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <button type="button" onClick={toggleCustom} disabled={saving} className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${customEnabled ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
              <span>
                <span className="block text-xs font-black text-slate-900">Personalizar este login</span>
                <span className="mt-1 block text-[11px] font-medium leading-5 text-slate-500">Libere ou bloqueie módulos além do padrão do perfil.</span>
              </span>
              <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${customEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${customEnabled ? 'left-6' : 'left-1'}`} />
              </span>
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 ring-1 ring-blue-100"><ShieldCheck size={18} /></span>
              <div>
                <p className="text-xs font-black text-blue-950">{getRoleLabel(role)}{customEnabled ? ' com permissões personalizadas' : ''}</p>
                <p className="mt-1 text-xs font-medium leading-5 text-blue-700">
                  {customEnabled
                    ? `${viewModules.length} módulos para visualizar e ${editModules.length} módulos com permissão de edição.`
                    : 'As permissões seguem exatamente o padrão atual deste perfil.'}
                </p>
              </div>
            </div>
          </div>

          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[minmax(0,1fr)_72px_72px] items-center bg-slate-50 px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-500">
              <span>Módulo</span>
              <span className="text-center">Visualizar</span>
              <span className="text-center">Editar</span>
            </div>

            <div className="divide-y divide-slate-100">
              {ACCESS_MODULES.map((module) => {
                const administratorBlocked = module.administratorOnly && role !== 'administrador'
                const canView = viewModules.includes(module.id) && !administratorBlocked
                const canEdit = editModules.includes(module.id) && canView
                const disabled = saving || !customEnabled || administratorBlocked

                return (
                  <div key={module.id} className={`grid grid-cols-[minmax(0,1fr)_72px_72px] items-center gap-2 px-4 py-3 ${disabled ? 'bg-slate-50/40' : 'bg-white'}`}>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-800">{module.label}</p>
                      {module.id === 'dashboard' && <p className="mt-0.5 text-[9px] font-medium text-slate-400">Acesso básico obrigatório</p>}
                      {administratorBlocked && <p className="mt-0.5 text-[9px] font-medium text-amber-600">Disponível somente para administrador</p>}
                    </div>

                    <label className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={canView}
                        onChange={() => toggleView(module.id)}
                        disabled={disabled || module.id === 'dashboard'}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                        aria-label={`Permitir visualização de ${module.label}`}
                      />
                    </label>

                    <label className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={canEdit}
                        onChange={() => toggleEdit(module.id)}
                        disabled={disabled || !canView}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                        aria-label={`Permitir edição de ${module.label}`}
                      />
                    </label>
                  </div>
                )
              })}
            </div>
          </section>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500"><Eye size={14} /> Visualizar</p>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-600">O módulo aparece no menu e o usuário pode consultar as informações permitidas da obra.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500"><Pencil size={14} /> Editar</p>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-600">Além de visualizar, o usuário pode criar, alterar ou excluir registros quando o módulo oferecer essas ações.</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 md:px-7">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {saving ? 'Salvando...' : 'Salvar permissões'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function UsersPermissionsWorkspace() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const payload = await apiRequest('/api/admin/usuarios')
      setUsers(payload.usuarios || [])
    } catch (loadError) {
      setError(loadError?.message || 'Não foi possível carregar os usuários.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users

    return users.filter((user) => [user.nome, user.email, user.role, user.empresa, user.status]
      .some((value) => String(value || '').toLowerCase().includes(term)))
  }, [users, search])

  const active = users.filter((user) => user.status === 'Ativo').length
  const pending = users.filter((user) => user.status !== 'Ativo').length

  const openPermissions = (user) => {
    setActionError('')
    setSuccess('')
    setEditingUser(user)
  }

  const savePermissions = async (role, customPermissions) => {
    if (!editingUser) return

    setSaving(true)
    setActionError('')
    setSuccess('')

    try {
      const payload = await apiRequest('/api/admin/usuarios', {
        method: 'PUT',
        body: JSON.stringify({
          id: editingUser.id,
          role,
          custom_permissions: customPermissions,
        }),
      })
      const updated = payload.usuario
      setUsers((current) => current.map((user) => String(user.id) === String(updated.id) ? { ...user, ...updated } : user))
      setEditingUser(null)
      setSuccess(`Permissões de ${updated.nome} atualizadas para ${getRoleLabel(updated.role)}${updated.custom_permissions?.enabled ? ' com acesso personalizado' : ''}.`)
    } catch (saveError) {
      setActionError(saveError?.message || 'Não foi possível atualizar as permissões.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <PermissionsModal
        key={editingUser?.id || 'closed'}
        user={editingUser}
        saving={saving}
        error={actionError}
        onClose={() => { if (!saving) { setEditingUser(null); setActionError('') } }}
        onSave={savePermissions}
      />

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between md:p-7">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Administração</p>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase text-emerald-700 ring-1 ring-emerald-200">Supabase Auth</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Usuários e Permissões</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">Defina o perfil principal e personalize os módulos liberados para cada login.</p>
          </div>

          <button onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60">
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Atualizar usuários
          </button>
        </div>

        <div className="grid gap-3 bg-slate-50/70 p-4 sm:grid-cols-3 md:p-5">
          <Metric label="Usuários cadastrados" value={users.length} icon={<UsersRound size={17} />} />
          <Metric label="Acessos ativos" value={active} tone="success" icon={<CheckCircle2 size={17} />} />
          <Metric label="Pendentes ou bloqueados" value={pending} tone={pending ? 'warning' : 'default'} icon={<Clock3 size={17} />} />
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, e-mail, perfil ou empresa..." className={`${inputClass} pl-10`} />
        </div>

        {success && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> {success}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
            <AlertTriangle size={17} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center text-sm font-black text-blue-600"><RefreshCw className="mr-2 animate-spin" size={18} /> Carregando usuários...</div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><UserRound size={24} /></div>
            <h3 className="mt-4 text-base font-black text-slate-900">Nenhum usuário encontrado</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">Confira o termo pesquisado ou atualize a listagem.</p>
          </div>
        ) : (
          <>
            <div className="mt-5 hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[980px] text-left">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-3">Usuário</th>
                    <th className="px-3 py-3">Perfil</th>
                    <th className="px-3 py-3">Permissões</th>
                    <th className="px-3 py-3">Empresa</th>
                    <th className="px-3 py-3">Último acesso</th>
                    <th className="px-3 py-3 text-right">Status</th>
                    <th className="px-3 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-4">
                        <p className="font-black text-slate-900">{user.nome}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-3 py-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase text-blue-700 ring-1 ring-blue-200"><ShieldCheck size={11} /> {getRoleLabel(user.role)}</span></td>
                      <td className="px-3 py-4 text-sm font-medium text-slate-600">{permissionSummary(user)}</td>
                      <td className="px-3 py-4 text-sm font-medium text-slate-600">{user.empresa || '—'}</td>
                      <td className="px-3 py-4 text-xs font-bold text-slate-500">{formatDateTime(user.last_sign_in_at)}</td>
                      <td className="px-3 py-4 text-right"><span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase ring-1 ${statusClass(user.status)}`}>{user.status}</span></td>
                      <td className="px-3 py-4 text-right">
                        <button type="button" onClick={() => openPermissions(user)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                          <Edit3 size={14} /> Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-3 lg:hidden">
              {filtered.map((user) => (
                <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{user.nome}</p>
                      <p className="mt-1 truncate text-xs font-medium text-slate-500">{user.email}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-black uppercase ring-1 ${statusClass(user.status)}`}>{user.status}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Info label="Perfil" value={getRoleLabel(user.role)} />
                    <Info label="Permissões" value={permissionSummary(user)} />
                    <Info label="Empresa" value={user.empresa || '—'} />
                    <Info label="Último acesso" value={formatDateTime(user.last_sign_in_at)} />
                  </div>
                  <button type="button" onClick={() => openPermissions(user)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-black text-blue-700">
                    <Edit3 size={15} /> Editar permissões
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function Metric({ label, value, icon, tone = 'default' }) {
  const toneClass = tone === 'success'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    : tone === 'warning'
      ? 'bg-amber-50 text-amber-700 ring-amber-100'
      : 'bg-white text-slate-900 ring-slate-200'

  return (
    <div className={`rounded-2xl p-4 ring-1 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-wider opacity-60">{label}</p>
        <span className="opacity-60">{icon}</span>
      </div>
      <p className="mt-2 truncate text-xl font-black tracking-tight">{value}</p>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-700">{value}</p>
    </div>
  )
}

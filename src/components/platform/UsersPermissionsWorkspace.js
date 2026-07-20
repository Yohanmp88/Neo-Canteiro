'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getAllowedModules, getRoleLabel } from '@/lib/accessControl'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'

async function apiRequest(path) {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData?.session?.access_token
  if (!accessToken) throw new Error('Sua sessão expirou. Entre novamente no NeoCanteiro.')

  const response = await fetch(path, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error || 'Não foi possível carregar os usuários.')
  return payload
}

function formatDateTime(value) {
  if (!value) return 'Nunca acessou'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Não informado' : date.toLocaleString('pt-BR')
}

function permissionSummary(role) {
  const modules = getAllowedModules(role)
  if (modules === '*') return 'Controle total da plataforma'
  if (!Array.isArray(modules) || !modules.length) return 'Sem módulos liberados'
  return `${modules.length} módulo${modules.length === 1 ? '' : 's'} liberado${modules.length === 1 ? '' : 's'}`
}

function statusClass(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized.includes('bloque')) return 'bg-red-50 text-red-700 ring-red-200'
  if (normalized.includes('pendente') || normalized.includes('convite')) return 'bg-amber-50 text-amber-700 ring-amber-200'
  return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
}

export function UsersPermissionsWorkspace() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

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

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between md:p-7">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Administração</p>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase text-emerald-700 ring-1 ring-emerald-200">Supabase Auth</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Usuários e Permissões</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">Usuários cadastrados no login do NeoCanteiro e os perfis de acesso definidos no banco.</p>
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
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-3">Usuário</th>
                    <th className="px-3 py-3">Perfil</th>
                    <th className="px-3 py-3">Permissões</th>
                    <th className="px-3 py-3">Empresa</th>
                    <th className="px-3 py-3">Último acesso</th>
                    <th className="px-3 py-3 text-right">Status</th>
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
                      <td className="px-3 py-4 text-sm font-medium text-slate-600">{permissionSummary(user.role)}</td>
                      <td className="px-3 py-4 text-sm font-medium text-slate-600">{user.empresa || '—'}</td>
                      <td className="px-3 py-4 text-xs font-bold text-slate-500">{formatDateTime(user.last_sign_in_at)}</td>
                      <td className="px-3 py-4 text-right"><span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase ring-1 ${statusClass(user.status)}`}>{user.status}</span></td>
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
                    <Info label="Permissões" value={permissionSummary(user.role)} />
                    <Info label="Empresa" value={user.empresa || '—'} />
                    <Info label="Último acesso" value={formatDateTime(user.last_sign_in_at)} />
                  </div>
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

'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ChevronDown, LockKeyhole, LogOut, ShieldCheck } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { BottomNav } from '@/components/dashboard/BottomNav'
import { ClientAccessWorkspace } from '@/components/platform/ClientAccessWorkspace'
import { DiaryWorkspace } from '@/components/platform/DiaryWorkspace'
import { EditableWorkspace } from '@/components/platform/EditableWorkspace'
import { PhotoWorkspace } from '@/components/platform/PhotoWorkspace'
import { EDITABLE_MODULE_KEYS, getModuleDefinition } from '@/lib/moduleDefinitions'
import { CORE_MODULE_KEYS } from '@/lib/coreModuleDefinitions'
import { canEditModule, canViewModule, normalizeRole } from '@/lib/accessControl'
import { useAuth } from '@/hooks/useAuth'
import { useObras } from '@/hooks/useObras'

const WORKSPACE_KEYS = Array.from(new Set([...EDITABLE_MODULE_KEYS, ...CORE_MODULE_KEYS]))
  .filter((moduleKey) => moduleKey !== 'crm')

const OBRAS_DEMO = [
  { id: 'demo-1', nome: 'Residencial Aurora', cliente: 'Aurora Empreendimentos', status: 'Em andamento' },
  { id: 'demo-2', nome: 'Loja Concept', cliente: 'Concept Store', status: 'Finalização' },
  { id: 'demo-3', nome: 'Harmonia', cliente: 'Condomínio Harmonia', status: 'Planejamento' },
]

function firstWorkspaceModule(role) {
  return WORKSPACE_KEYS.find((moduleKey) => canViewModule(role, moduleKey)) || null
}

export default function WorkspacePage() {
  const { user, userProfile, loading: authLoading, logout } = useAuth()
  const { obras: obrasRaw = [] } = useObras()
  const [moduleKey, setModuleKey] = useState('clientes')
  const [obraId, setObraId] = useState('demo-1')

  const isDemoUser = user?.app_metadata?.provider === 'demo'
  const profileReady = Boolean(userProfile) || isDemoUser
  const role = normalizeRole(userProfile?.tipo_usuario || userProfile?.role || user?.user_metadata?.role)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requested = params.get('module')

    if (requested && WORKSPACE_KEYS.includes(requested)) {
      setModuleKey(requested)
      return
    }

    if (requested === 'crm') {
      window.history.replaceState({}, '', '/workspace?module=clientes')
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !user) window.location.replace('/')
  }, [authLoading, user])

  useEffect(() => {
    if (!user || !profileReady) return
    if (canViewModule(role, moduleKey)) return

    const fallback = firstWorkspaceModule(role)
    if (!fallback) {
      window.location.replace('/')
      return
    }

    setModuleKey(fallback)
    window.history.replaceState({}, '', `/workspace?module=${fallback}`)
  }, [user, profileReady, role, moduleKey])

  const obras = useMemo(() => {
    const reais = (obrasRaw || []).filter(Boolean)
    return reais.length ? reais : OBRAS_DEMO
  }, [obrasRaw])

  useEffect(() => {
    if (!obras.some((obra) => String(obra.id) === String(obraId))) {
      setObraId(String(obras[0]?.id || 'demo-1'))
    }
  }, [obras, obraId])

  const obraAtual = useMemo(
    () => obras.find((obra) => String(obra.id) === String(obraId)) || obras[0] || OBRAS_DEMO[0],
    [obras, obraId],
  )

  const isLucasDemo = user?.email === 'lucas.demo@nc.com'
  const canAccessModule = canViewModule(role, moduleKey)
  const canEditCurrentModule = Boolean(user) && profileReady && canAccessModule && !isLucasDemo && canEditModule(role, moduleKey)
  const isAdminClientAccess = moduleKey === 'clientes' && role === 'administrador' && !isDemoUser

  const profileForNavigation = {
    ...userProfile,
    nome: userProfile?.nome || user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuário',
    role,
    tipo_usuario: role,
    tipo: role,
  }

  const navigate = (tabId) => {
    if (!canViewModule(role, tabId)) return

    if (WORKSPACE_KEYS.includes(tabId)) {
      setModuleKey(tabId)
      const nextUrl = `/workspace?module=${tabId}`
      window.history.pushState({}, '', nextUrl)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    window.location.href = '/'
  }

  if (authLoading || !user || !profileReady) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-black text-blue-600">Validando acesso...</div>
  }

  if (!canAccessModule) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-black text-slate-500">Redirecionando para uma área permitida...</div>
  }

  const definition = getModuleDefinition(moduleKey)

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-900 lg:pb-0">
      <div className="flex min-h-screen w-full">
        <Sidebar activeTab={moduleKey} onTabChange={navigate} userProfile={profileForNavigation} logout={logout} />

        <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
          <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur-xl lg:px-8">
            <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={() => { window.location.href = '/' }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-blue-600" aria-label="Voltar ao dashboard">
                  <ArrowLeft size={18} />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-slate-900">{definition?.title || 'NeoCanteiro'}</p>
                  <p className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">Sistema profissional de gestão</p>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2">
                {!isAdminClientAccess && (
                  <div className="relative hidden sm:block">
                    <select value={obraId} onChange={(event) => setObraId(event.target.value)} className="max-w-56 appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-xs font-black text-slate-800 outline-none focus:border-blue-500">
                      {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nome}</option>)}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                )}

                <span className={`hidden items-center gap-1.5 rounded-full px-3 py-2 text-[9px] font-black uppercase ring-1 md:inline-flex ${canEditCurrentModule ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
                  {canEditCurrentModule ? <ShieldCheck size={13} /> : <LockKeyhole size={13} />}
                  {canEditCurrentModule ? 'Edição liberada' : 'Somente leitura'}
                </span>

                <button type="button" onClick={logout} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600" aria-label="Sair">
                  <LogOut size={17} />
                </button>
              </div>
            </div>

            {!isAdminClientAccess && (
              <div className="relative mt-3 sm:hidden">
                <select value={obraId} onChange={(event) => setObraId(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-xs font-black text-slate-800 outline-none focus:border-blue-500">
                  {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nome}</option>)}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            )}
          </header>

          {!canEditCurrentModule && (
            <div className="mx-4 mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800 lg:mx-8">
              <LockKeyhole size={17} className="mt-0.5 shrink-0" />
              Seu login permite consultar este módulo, mas não permite criar, editar, duplicar ou excluir registros.
            </div>
          )}

          <section className="flex-1 px-4 py-5 lg:px-8 lg:py-7">
            <div className="mx-auto w-full max-w-screen-2xl">
              {isAdminClientAccess ? (
                <ClientAccessWorkspace />
              ) : moduleKey === 'diario' ? (
                <DiaryWorkspace obra={obraAtual} user={user} canEdit={canEditCurrentModule} />
              ) : moduleKey === 'fotos' ? (
                <PhotoWorkspace obra={obraAtual} user={user} canEdit={canEditCurrentModule} />
              ) : (
                <EditableWorkspace moduleKey={moduleKey} obra={obraAtual} user={user} canEdit={canEditCurrentModule} />
              )}
            </div>
          </section>
        </div>
      </div>

      <BottomNav activeTab={moduleKey} onTabChange={navigate} userProfile={profileForNavigation} />
    </main>
  )
}

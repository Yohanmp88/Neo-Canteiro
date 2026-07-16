'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  Camera,
  ChevronDown,
  Clock3,
  Database,
  FileText,
  FolderOpen,
  HardDrive,
  History,
  ListChecks,
  UserRound,
} from 'lucide-react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { BottomNav } from '@/components/dashboard/BottomNav'
import { useAuth } from '@/hooks/useAuth'
import { useObras } from '@/hooks/useObras'
import { useTimeline } from '@/hooks/useTimeline'

const OBRAS_DEMO = [
  { id: 'demo-1', nome: 'Residencial Aurora', cliente: 'Aurora Empreendimentos' },
  { id: 'demo-2', nome: 'Loja Concept', cliente: 'Concept Store' },
  { id: 'demo-3', nome: 'Harmonia', cliente: 'Condomínio Harmonia' },
]

const TYPE_META = {
  diario: { label: 'Diário de obra', icon: FileText, className: 'bg-blue-50 text-blue-700 ring-blue-200' },
  foto: { label: 'Foto', icon: Camera, className: 'bg-purple-50 text-purple-700 ring-purple-200' },
  cronograma: { label: 'Cronograma', icon: ListChecks, className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  compra: { label: 'Compras', icon: Database, className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  registro: { label: 'Registro', icon: History, className: 'bg-slate-50 text-slate-700 ring-slate-200' },
}

function formatarData(value) {
  const date = new Date(`${String(value || '').slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Data não informada'
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function formatarHora(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function EventCard({ event }) {
  const meta = TYPE_META[event.event_type] || TYPE_META.registro
  const Icon = meta.icon
  const imageUrl = event.metadata?.url || event.metadata?.url_foto || ''
  const details = [
    event.metadata?.clima ? `Clima: ${event.metadata.clima}` : null,
    event.metadata?.equipe_total !== '' && event.metadata?.equipe_total !== undefined
      ? `Equipe: ${event.metadata.equipe_total} trabalhador(es)`
      : null,
    event.metadata?.ocorrencias ? `Ocorrências: ${event.metadata.ocorrencias}` : null,
    event.metadata?.visitas ? `Visitas: ${event.metadata.visitas}` : null,
    event.metadata?.proximas_atividades ? `Próximas atividades: ${event.metadata.proximas_atividades}` : null,
  ].filter(Boolean)

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
      {imageUrl && (
        <div className="border-b border-slate-100 bg-slate-100">
          <img src={imageUrl} alt={event.title || 'Foto da obra'} className="max-h-80 w-full object-cover" />
        </div>
      )}

      <div className="p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${meta.className}`}>
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-900 md:text-base">{event.title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-400">
                <span className="inline-flex items-center gap-1"><Clock3 size={12} />{formatarHora(event.created_at) || 'horário não informado'}</span>
                {event.created_by_name && <span className="inline-flex items-center gap-1"><UserRound size={12} />{event.created_by_name}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ring-1 ${meta.className}`}>{meta.label}</span>
            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase text-slate-500 ring-1 ring-slate-200">
              {event.storage_source === 'supabase' ? 'Banco de dados' : 'Neste navegador'}
            </span>
          </div>
        </div>

        {event.description && <p className="mt-4 whitespace-pre-line text-sm font-medium leading-6 text-slate-600">{event.description}</p>}

        {details.length > 0 && (
          <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3">
            {details.map((detail) => <p key={detail} className="text-xs font-semibold leading-5 text-slate-600">{detail}</p>)}
          </div>
        )}
      </div>
    </article>
  )
}

export default function TimelinePage() {
  const { user, userProfile, loading: authLoading, logout } = useAuth()
  const { obras: obrasRaw = [], loading: obrasLoading } = useObras()
  const [obraId, setObraId] = useState('demo-1')
  const [filter, setFilter] = useState('todos')

  useEffect(() => {
    if (!authLoading && !user) window.location.replace('/')
  }, [authLoading, user])

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

  const { eventos, loading, error, timelineAtiva, source } = useTimeline(obraAtual?.id, user)

  const filtered = useMemo(
    () => filter === 'todos' ? eventos : eventos.filter((event) => event.event_type === filter),
    [eventos, filter],
  )

  const grouped = useMemo(() => {
    const groups = new Map()
    filtered.forEach((event) => {
      const date = event.event_date || 'sem-data'
      if (!groups.has(date)) groups.set(date, [])
      groups.get(date).push(event)
    })
    return Array.from(groups.entries())
  }, [filtered])

  const role = userProfile?.tipo_usuario || userProfile?.role || 'investidor'
  const profileForNavigation = {
    ...userProfile,
    nome: userProfile?.nome || user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuário',
    tipo_usuario: role,
    tipo: role,
  }

  const navigate = (tabId) => {
    if (tabId === 'timeline') return
    window.location.href = tabId === 'dashboard' ? '/' : `/?tab=${tabId}`
  }

  if (authLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-black text-blue-600">Validando acesso...</div>
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-900 lg:pb-0">
      <div className="flex min-h-screen w-full">
        <Sidebar activeTab="timeline" onTabChange={navigate} userProfile={profileForNavigation} logout={logout} />

        <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
          <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur-xl lg:px-8">
            <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={() => { window.location.href = '/' }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-blue-600" aria-label="Voltar ao dashboard">
                  <ArrowLeft size={18} />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">Linha do Tempo da Obra</p>
                  <p className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">Acompanhamento diário e histórico</p>
                </div>
              </div>

              <div className="relative min-w-52 flex-1 sm:max-w-72">
                <Building2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" />
                <select value={obraId} onChange={(event) => setObraId(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-xs font-black text-slate-800 outline-none focus:border-blue-500">
                  {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nome}</option>)}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </header>

          <section className="flex-1 px-4 py-5 lg:px-8 lg:py-7">
            <div className="mx-auto w-full max-w-screen-2xl">
              <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm md:p-7">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                      <History size={23} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">{obraAtual?.nome}</p>
                      <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 md:text-2xl">Histórico organizado por data</h1>
                      <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">Diários, fotos e mudanças do cronograma são reunidos em pastas diárias para acompanhar a evolução da obra.</p>
                    </div>
                  </div>

                  <div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black uppercase ring-1 ${timelineAtiva ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
                    {timelineAtiva ? <Database size={14} /> : <HardDrive size={14} />}
                    {timelineAtiva ? 'Sincronizado no Supabase' : 'Salvo neste navegador'}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    ['todos', 'Todos'],
                    ['diario', 'Diários'],
                    ['foto', 'Fotos'],
                    ['cronograma', 'Cronograma'],
                  ].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-[10px] font-black uppercase transition ${filter === value ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-800">
                  <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {(loading || obrasLoading) && <p className="py-10 text-center text-sm font-black text-blue-600">Carregando histórico da obra...</p>}

              {!loading && grouped.length === 0 && (
                <div className="mt-5 rounded-[2rem] border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                  <FolderOpen size={42} className="mx-auto text-slate-300" />
                  <h2 className="mt-4 text-lg font-black text-slate-900">Nenhum registro encontrado</h2>
                  <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-slate-500">Adicione um diário, uma foto ou atualize o cronograma para iniciar a linha do tempo desta obra.</p>
                </div>
              )}

              <div className="mt-5 space-y-4">
                {grouped.map(([date, items], index) => (
                  <details key={date} open={index === 0} className="group overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-sm">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 md:px-6">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                          <CalendarDays size={19} />
                        </div>
                        <div className="min-w-0">
                          <p className="capitalize text-sm font-black text-slate-900 md:text-base">{formatarData(date)}</p>
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{items.length} registro{items.length === 1 ? '' : 's'}</p>
                        </div>
                      </div>
                      <ChevronDown size={18} className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                    </summary>

                    <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-4 md:p-6">
                      {items.map((event) => <EventCard key={`${event.id}-${event.created_at}`} event={event} />)}
                    </div>
                  </details>
                ))}
              </div>

              {source === 'local' && String(obraAtual?.id || '').startsWith('demo') && (
                <p className="mt-5 text-center text-[10px] font-bold leading-5 text-slate-400">Na obra demonstrativa, os dados permanecem neste navegador. A sincronização entre aparelhos depende da ativação da tabela de linha do tempo no Supabase.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <BottomNav activeTab="timeline" onTabChange={navigate} userProfile={profileForNavigation} />
    </main>
  )
}

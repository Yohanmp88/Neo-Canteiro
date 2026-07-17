'use client'

import { useEffect, useMemo, useState } from 'react'
import { PanelClean, StatusBadge } from '@/components/ui/Cards'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCompras } from '@/hooks/useCompras'
import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'
import '@/lib/coreModuleDefinitions'
import { canViewModule, normalizeRole } from '@/lib/accessControl'
import {
  pedidoAtrasadoOperacional,
  tarefaAtrasadaOperacional,
} from '@/lib/operationalData'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import {
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  Camera,
  ShoppingBag,
  ArrowRight,
  Target,
  BarChart3,
} from 'lucide-react'

const WORKSPACE_TABS = new Set(['compras', 'diario', 'fotos', 'materiais', 'equipe', 'financeiro', 'crm', 'clientes'])
const SEEN_PREFIX = 'neocanteiro_module_seen_v1'

const CARD_TONES = {
  blue: {
    icon: 'bg-blue-50 text-blue-700 ring-blue-100',
    accent: 'from-blue-500 via-blue-600 to-indigo-500',
  },
  indigo: {
    icon: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    accent: 'from-indigo-500 via-indigo-600 to-violet-500',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    accent: 'from-emerald-400 via-emerald-500 to-teal-500',
  },
  red: {
    icon: 'bg-red-50 text-red-700 ring-red-100',
    accent: 'from-red-400 via-red-500 to-rose-500',
  },
  orange: {
    icon: 'bg-orange-50 text-orange-700 ring-orange-100',
    accent: 'from-orange-400 via-orange-500 to-amber-500',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    accent: 'from-slate-500 via-slate-600 to-slate-700',
  },
  purple: {
    icon: 'bg-purple-50 text-purple-700 ring-purple-100',
    accent: 'from-purple-400 via-purple-500 to-fuchsia-500',
  },
}

function recordTimestamp(record) {
  const value = record?.updated_at || record?.created_at || (record?.data ? `${record.data}T23:59:59` : '')
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function seenKey(user, obraId, moduleKey) {
  return `${SEEN_PREFIX}:${user?.id || user?.email || 'usuario'}:${obraId || 'obra'}:${moduleKey}`
}

function unreadCount(records, user, obraId, moduleKey) {
  if (typeof window === 'undefined') return 0
  const lastSeen = Number(window.localStorage.getItem(seenKey(user, obraId, moduleKey)) || 0)
  return records.filter((record) => recordTimestamp(record) > lastSeen).length
}

function PremiumMetricCard({ title, value, detail, icon: Icon, tone = 'blue', notification = 0, onClick }) {
  const visual = CARD_TONES[tone] || CARD_TONES.blue

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative min-h-[116px] overflow-hidden rounded-[1.45rem] border border-slate-200/80 bg-white p-4 text-left shadow-[0_16px_45px_-34px_rgba(15,23,42,0.65)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_20px_48px_-30px_rgba(37,99,235,0.35)] active:translate-y-0"
    >
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${visual.accent}`} />

      {notification > 0 && (
        <span className="absolute right-3 top-3 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white shadow-lg shadow-red-600/20">
          {notification > 99 ? '99+' : notification}
        </span>
      )}

      <div className="flex items-start gap-3 pr-5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${visual.icon}`}>
          <Icon size={18} strokeWidth={2.3} />
        </div>
        <p className="line-clamp-2 min-h-[32px] pt-0.5 text-[10px] font-black uppercase leading-4 tracking-[0.11em] text-slate-500">{title}</p>
      </div>

      <div className="mt-3 pr-5">
        <p className="text-[27px] font-black leading-none tracking-tight text-slate-950">{value}</p>
        {detail && <p className="mt-1.5 line-clamp-2 text-[10px] font-bold leading-4 text-slate-500">{detail}</p>}
      </div>

      <ArrowRight size={14} className="absolute bottom-4 right-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
    </button>
  )
}

export function DashboardView({
  obraAtual,
  tarefas = [],
  diarios = [],
  user,
  role,
  onNavigate,
}) {
  const [isMounted, setIsMounted] = useState(false)
  const [seenVersion, setSeenVersion] = useState(0)
  const activeRole = normalizeRole(role)
  const { pedidos = [] } = useCompras(obraAtual?.id)
  const { records: diariosWorkspace = [] } = useWorkspaceRecords('diario', obraAtual?.id, user)
  const { records: fotosWorkspace = [] } = useWorkspaceRecords('fotos', obraAtual?.id, user)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const diariosVisiveis = useMemo(() => {
    const unique = new Map()

    ;[...diariosWorkspace, ...(diarios || [])].forEach((record) => {
      const key = record?.id
        ? String(record.id)
        : `${record?.data || ''}:${record?.servicos_executados || record?.atividades || ''}`
      if (!unique.has(key)) unique.set(key, record)
    })

    return Array.from(unique.values()).sort((a, b) => recordTimestamp(b) - recordTimestamp(a))
  }, [diariosWorkspace, diarios])

  const fotosVisiveis = useMemo(
    () => [...fotosWorkspace].sort((a, b) => recordTimestamp(b) - recordTimestamp(a)),
    [fotosWorkspace],
  )

  const diariosNovos = useMemo(
    () => unreadCount(diariosVisiveis, user, obraAtual?.id, 'diario'),
    [diariosVisiveis, user, obraAtual?.id, seenVersion],
  )
  const fotosNovas = useMemo(
    () => unreadCount(fotosVisiveis, user, obraAtual?.id, 'fotos'),
    [fotosVisiveis, user, obraAtual?.id, seenVersion],
  )

  if (!obraAtual) {
    return (
      <EmptyState
        title="Nenhuma obra selecionada"
        description="Selecione uma obra para visualizar o dashboard executivo."
      />
    )
  }

  const markSeen = (moduleKey) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(seenKey(user, obraAtual?.id, moduleKey), String(Date.now()))
    setSeenVersion((current) => current + 1)
  }

  const navigate = (tabId) => {
    if (!canViewModule(activeRole, tabId)) return
    if (tabId === 'diario' || tabId === 'fotos') markSeen(tabId)

    if (WORKSPACE_TABS.has(tabId)) {
      window.location.href = `/workspace?module=${tabId}`
      return
    }

    onNavigate(tabId)
  }

  const concluidas = tarefas.filter((tarefa) => Number(tarefa.progresso) === 100).length
  const totalTarefas = tarefas.length || 0
  const progressoMedio = totalTarefas > 0
    ? Math.round(tarefas.reduce((acc, tarefa) => acc + (Number(tarefa.progresso) || 0), 0) / totalTarefas)
    : 0

  const atrasosCronograma = tarefas.filter((tarefa) => tarefaAtrasadaOperacional(tarefa)).length
  const materiaisAtrasados = pedidos.filter((pedido) => pedidoAtrasadoOperacional(pedido)).length
  const ultimoDiario = diariosVisiveis[0] || null
  const ultimaFoto = fotosVisiveis[0] || null

  const dadosEvolucao = [
    { name: 'S1', previsto: 10, realizado: 8 },
    { name: 'S2', previsto: 25, realizado: 22 },
    { name: 'S3', previsto: 40, realizado: 42 },
    { name: 'S4', previsto: 55, realizado: 50 },
    { name: 'S5', previsto: 70, realizado: 68 },
    { name: 'S6', previsto: 85, realizado: 82 },
    { name: 'S7', previsto: 100, realizado: 95 },
  ]

  const prazoEntrega = obraAtual.prazo_final
    ? new Date(`${String(obraAtual.prazo_final).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : '—'

  return (
    <div className="mx-auto w-full max-w-[1600px] animate-fade-in space-y-4">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PremiumMetricCard title="Progresso da obra" value={`${progressoMedio}%`} detail="Evolução física geral" icon={TrendingUp} onClick={() => navigate('cronograma')} />
        <PremiumMetricCard title="Previsão de entrega" value={prazoEntrega} detail="Prazo final contratado" icon={Calendar} tone="indigo" onClick={() => navigate('cronograma')} />
        <PremiumMetricCard title="Tarefas concluídas" value={`${concluidas}/${totalTarefas}`} detail="Atividades do cronograma" icon={CheckCircle2} tone="emerald" onClick={() => navigate('cronograma')} />
        <PremiumMetricCard title="Serviços atrasados" value={atrasosCronograma} detail={atrasosCronograma === 1 ? 'Atividade exige atenção' : 'Atividades exigem atenção'} icon={AlertCircle} tone={atrasosCronograma > 0 ? 'red' : 'emerald'} onClick={() => navigate('cronograma')} />
        {canViewModule(activeRole, 'compras') && <PremiumMetricCard title="Materiais em atraso" value={materiaisAtrasados} detail="Suprimentos com impacto no prazo" icon={ShoppingBag} tone={materiaisAtrasados > 0 ? 'orange' : 'slate'} onClick={() => navigate('compras')} />}
        {canViewModule(activeRole, 'diario') && <PremiumMetricCard title="Diários de obra" value={diariosVisiveis.length} detail={`${diariosVisiveis.length} registro${diariosVisiveis.length === 1 ? '' : 's'} cadastrado${diariosVisiveis.length === 1 ? '' : 's'}`} icon={FileText} notification={diariosNovos} onClick={() => navigate('diario')} />}
        {canViewModule(activeRole, 'fotos') && <PremiumMetricCard title="Fotos da obra" value={fotosVisiveis.length} detail={`${fotosVisiveis.length} foto${fotosVisiveis.length === 1 ? '' : 's'} cadastrada${fotosVisiveis.length === 1 ? '' : 's'}`} icon={Camera} tone="purple" notification={fotosNovas} onClick={() => navigate('fotos')} />}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <PanelClean className="min-h-[245px] !rounded-[1.6rem] !border-slate-200/80 !p-5 shadow-[0_18px_48px_-38px_rgba(15,23,42,0.65)] xl:col-span-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600">Análise de performance</p>
              <h3 className="mt-1 flex items-center gap-2 text-sm font-black text-slate-950">
                <Target size={16} className="text-blue-600" />
                Curva S — Previsto x realizado
              </h3>
            </div>
            <StatusBadge status={obraAtual.status} />
          </div>

          <div className="mt-3 flex items-center gap-4 text-[10px] font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600" />Previsto</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Realizado</span>
          </div>

          <div className="mt-2 h-[164px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosEvolucao} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', padding: '8px 10px', boxShadow: '0 12px 32px -18px rgba(15,23,42,.45)' }} />
                  <Area type="monotone" dataKey="previsto" name="Previsto" stroke="#2563eb" strokeWidth={2.5} fill="url(#colorPrevisto)" />
                  <Area type="monotone" dataKey="realizado" name="Realizado" stroke="#10b981" strokeWidth={2.5} fill="url(#colorRealizado)" />
                  <defs>
                    <linearGradient id="colorPrevisto" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.16}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.14}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </PanelClean>

        <PanelClean className="min-h-[245px] cursor-pointer !rounded-[1.6rem] !border-slate-200/80 !p-5 shadow-[0_18px_48px_-38px_rgba(15,23,42,0.65)] transition hover:border-blue-300 hover:shadow-[0_22px_48px_-34px_rgba(37,99,235,0.28)] xl:col-span-4" onClick={() => navigate('cronograma')}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-indigo-600">Acompanhamento executivo</p>
              <h3 className="mt-1 flex items-center gap-2 text-sm font-black text-slate-950"><BarChart3 size={16} className="text-indigo-600" />Cronograma físico</h3>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase text-blue-700 ring-1 ring-blue-100">Ao vivo</span>
          </div>

          <div className="mt-5 space-y-3.5">
            {tarefas.slice(0, 5).map((tarefa, index) => {
              const progress = Math.max(0, Math.min(100, Number(tarefa.progresso || 0)))
              const delayed = tarefaAtrasadaOperacional(tarefa)
              const completed = progress === 100

              return (
                <div key={tarefa.id || index} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-[11px] font-bold">
                    <span className="min-w-0 flex-1 truncate text-slate-700">{tarefa.nome}</span>
                    <span className={delayed ? 'text-red-600' : completed ? 'text-emerald-600' : 'text-slate-500'}>{progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full transition-all duration-700 ${completed ? 'bg-emerald-500' : delayed ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )
            })}

            {!tarefas.length && <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-xs font-bold text-slate-400">Nenhuma atividade cadastrada no cronograma.</p>}
            {tarefas.length > 5 && <p className="pt-0.5 text-center text-[9px] font-black uppercase tracking-wider text-slate-400">+ {tarefas.length - 5} atividades no cronograma</p>}
          </div>
        </PanelClean>

        <div className="grid gap-4 sm:grid-cols-2 xl:col-span-3 xl:grid-cols-1">
          {canViewModule(activeRole, 'diario') && (
            <button onClick={() => navigate('diario')} className="group relative min-h-[114px] overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white p-4 text-left shadow-[0_18px_48px_-38px_rgba(15,23,42,0.65)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_20px_44px_-32px_rgba(37,99,235,0.3)]">
              {diariosNovos > 0 && <span className="absolute right-4 top-4 rounded-full bg-red-600 px-2 py-1 text-[9px] font-black text-white">{diariosNovos} novo{diariosNovos === 1 ? '' : 's'}</span>}
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white"><FileText size={16} /></div>
                <ArrowRight size={15} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
              </div>
              <p className="mt-3 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Último diário</p>
              <h4 className="mt-1 line-clamp-2 text-[12px] font-bold leading-4 text-slate-900">{ultimoDiario?.servicos_executados || ultimoDiario?.atividades || 'Sem relatos registrados.'}</h4>
            </button>
          )}

          {canViewModule(activeRole, 'fotos') && (
            <button onClick={() => navigate('fotos')} className="group relative min-h-[114px] overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white p-4 text-left shadow-[0_18px_48px_-38px_rgba(15,23,42,0.65)] transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-[0_20px_44px_-32px_rgba(147,51,234,0.25)]">
              {fotosNovas > 0 && <span className="absolute right-4 top-4 z-10 rounded-full bg-red-600 px-2 py-1 text-[9px] font-black text-white">{fotosNovas} nova{fotosNovas === 1 ? '' : 's'}</span>}
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700 ring-1 ring-purple-100"><Camera size={16} /></div>
                {ultimaFoto?.url ? <img src={ultimaFoto.url} alt="Última foto da obra" className="h-12 w-16 rounded-xl object-cover ring-1 ring-slate-200" /> : <ArrowRight size={15} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-purple-600" />}
              </div>
              <p className="mt-3 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Acervo fotográfico</p>
              <h4 className="mt-1 text-[12px] font-bold leading-4 text-slate-900">{fotosVisiveis.length ? `${fotosVisiveis.length} foto${fotosVisiveis.length === 1 ? '' : 's'} cadastrada${fotosVisiveis.length === 1 ? '' : 's'}` : 'Nenhuma foto cadastrada'}</h4>
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  Camera,
  CheckCircle2,
  FileText,
  ShoppingBag,
  Target,
  TrendingUp,
} from 'lucide-react'
import { PanelClean, StatusBadge } from '@/components/ui/Cards'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCompras } from '@/hooks/useCompras'
import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'
import '@/lib/coreModuleDefinitions'
import { canViewModule, normalizeRole } from '@/lib/accessControl'
import { pedidoAtrasadoOperacional, tarefaAtrasadaOperacional } from '@/lib/operationalData'

const WORKSPACE_TABS = new Set(['compras', 'diario', 'fotos', 'materiais', 'equipe', 'financeiro', 'crm', 'clientes'])
const SEEN_PREFIX = 'neocanteiro_module_seen_v1'

const CARD_TONES = {
  blue: {
    icon: 'bg-blue-50 text-blue-700 ring-blue-100',
    line: 'bg-blue-600',
    value: 'text-blue-700',
  },
  indigo: {
    icon: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    line: 'bg-indigo-600',
    value: 'text-indigo-700',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    line: 'bg-emerald-500',
    value: 'text-emerald-700',
  },
  red: {
    icon: 'bg-red-50 text-red-700 ring-red-100',
    line: 'bg-red-500',
    value: 'text-red-700',
  },
  orange: {
    icon: 'bg-orange-50 text-orange-700 ring-orange-100',
    line: 'bg-orange-500',
    value: 'text-orange-700',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    line: 'bg-slate-600',
    value: 'text-slate-900',
  },
  purple: {
    icon: 'bg-purple-50 text-purple-700 ring-purple-100',
    line: 'bg-purple-500',
    value: 'text-purple-700',
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

function MetricCard({ title, value, detail, icon: Icon, tone = 'blue', notification = 0, onClick }) {
  const visual = CARD_TONES[tone] || CARD_TONES.blue

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[86px] items-center gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 text-left shadow-[0_14px_34px_-28px_rgba(15,23,42,0.7)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_18px_38px_-26px_rgba(37,99,235,0.32)] active:translate-y-0"
    >
      <span className={`absolute inset-y-3 left-0 w-[3px] rounded-r-full ${visual.line}`} />

      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${visual.icon}`}>
        <Icon size={18} strokeWidth={2.3} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[9px] font-black uppercase leading-3 tracking-[0.12em] text-slate-500">{title}</p>
          {notification > 0 && (
            <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white">
              {notification > 99 ? '99+' : notification}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-[24px] font-black leading-none tracking-tight ${visual.value}`}>{value}</p>
            {detail && <p className="mt-1 text-[9px] font-semibold leading-3 text-slate-500">{detail}</p>}
          </div>
          <ArrowRight size={14} className="mb-0.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
        </div>
      </div>
    </button>
  )
}

function ActivityCard({ title, eyebrow, body, icon: Icon, tone = 'dark', notification = 0, imageUrl, onClick }) {
  const dark = tone === 'dark'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-h-[92px] items-center gap-4 overflow-hidden rounded-2xl border p-4 text-left shadow-[0_14px_34px_-28px_rgba(15,23,42,0.65)] transition hover:-translate-y-0.5 ${
        dark
          ? 'border-slate-900 bg-gradient-to-br from-slate-950 to-slate-900 text-white hover:border-blue-700'
          : 'border-slate-200/80 bg-white text-slate-900 hover:border-purple-300'
      }`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${dark ? 'bg-white/10 text-white ring-1 ring-white/10' : 'bg-purple-50 text-purple-700 ring-1 ring-purple-100'}`}>
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`text-[9px] font-black uppercase tracking-[0.14em] ${dark ? 'text-blue-200' : 'text-slate-400'}`}>{eyebrow}</p>
          {notification > 0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-black text-white">{notification} novo{notification === 1 ? '' : 's'}</span>}
        </div>
        <h4 className="mt-1 text-sm font-black leading-5">{title}</h4>
        <p className={`mt-1 line-clamp-2 text-[10px] font-medium leading-4 ${dark ? 'text-slate-300' : 'text-slate-500'}`}>{body}</p>
      </div>

      {imageUrl ? (
        <img src={imageUrl} alt="Última foto da obra" className="h-14 w-20 shrink-0 rounded-xl object-cover ring-1 ring-slate-200" />
      ) : (
        <ArrowRight size={16} className={`shrink-0 transition group-hover:translate-x-0.5 ${dark ? 'text-blue-300' : 'text-slate-300 group-hover:text-purple-600'}`} />
      )}
    </button>
  )
}

export function DashboardView({ obraAtual, tarefas = [], diarios = [], user, role, onNavigate }) {
  const [isMounted, setIsMounted] = useState(false)
  const [seenVersion, setSeenVersion] = useState(0)
  const activeRole = normalizeRole(role)
  const { pedidos = [] } = useCompras(obraAtual?.id)
  const { records: diariosWorkspace = [] } = useWorkspaceRecords('diario', obraAtual?.id, user)
  const { records: fotosWorkspace = [] } = useWorkspaceRecords('fotos', obraAtual?.id, user)

  useEffect(() => setIsMounted(true), [])

  const diariosVisiveis = useMemo(() => {
    const unique = new Map()
    ;[...diariosWorkspace, ...(diarios || [])].forEach((record) => {
      const key = record?.id ? String(record.id) : `${record?.data || ''}:${record?.servicos_executados || record?.atividades || ''}`
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
    return <EmptyState title="Nenhuma obra selecionada" description="Selecione uma obra para visualizar o dashboard executivo." />
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
  const totalTarefas = tarefas.length
  const progressoMedio = totalTarefas
    ? Math.round(tarefas.reduce((acc, tarefa) => acc + (Number(tarefa.progresso) || 0), 0) / totalTarefas)
    : 0
  const atrasosCronograma = tarefas.filter((tarefa) => tarefaAtrasadaOperacional(tarefa)).length
  const materiaisAtrasados = pedidos.filter((pedido) => pedidoAtrasadoOperacional(pedido)).length
  const ultimoDiario = diariosVisiveis[0] || null
  const ultimaFoto = fotosVisiveis[0] || null
  const ultimaFotoUrl = ultimaFoto?.url || ultimaFoto?.url_foto || ''

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
    <div className="mx-auto w-full max-w-[1600px] animate-fade-in space-y-3.5">
      <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Progresso da obra" value={`${progressoMedio}%`} detail="Evolução física geral" icon={TrendingUp} onClick={() => navigate('cronograma')} />
        <MetricCard title="Previsão de entrega" value={prazoEntrega} detail="Prazo final contratado" icon={Calendar} tone="indigo" onClick={() => navigate('cronograma')} />
        <MetricCard title="Tarefas concluídas" value={`${concluidas}/${totalTarefas}`} detail="Atividades do cronograma" icon={CheckCircle2} tone="emerald" onClick={() => navigate('cronograma')} />
        <MetricCard title="Serviços atrasados" value={atrasosCronograma} detail={atrasosCronograma === 1 ? 'Atividade exige atenção' : 'Atividades exigem atenção'} icon={AlertCircle} tone={atrasosCronograma > 0 ? 'red' : 'emerald'} onClick={() => navigate('cronograma')} />
        {canViewModule(activeRole, 'compras') && <MetricCard title="Materiais em atraso" value={materiaisAtrasados} detail="Suprimentos com impacto no prazo" icon={ShoppingBag} tone={materiaisAtrasados > 0 ? 'orange' : 'slate'} onClick={() => navigate('compras')} />}
        {canViewModule(activeRole, 'diario') && <MetricCard title="Diários de obra" value={diariosVisiveis.length} detail={`${diariosVisiveis.length} registro${diariosVisiveis.length === 1 ? '' : 's'} cadastrado${diariosVisiveis.length === 1 ? '' : 's'}`} icon={FileText} notification={diariosNovos} onClick={() => navigate('diario')} />}
        {canViewModule(activeRole, 'fotos') && <MetricCard title="Fotos da obra" value={fotosVisiveis.length} detail={`${fotosVisiveis.length} foto${fotosVisiveis.length === 1 ? '' : 's'} cadastrada${fotosVisiveis.length === 1 ? '' : 's'}`} icon={Camera} tone="purple" notification={fotosNovas} onClick={() => navigate('fotos')} />}
      </section>

      <section className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
        <PanelClean className="min-h-[235px] !rounded-2xl !border-slate-200/80 !p-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.7)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600">Análise de performance</p>
              <h3 className="mt-1 flex items-center gap-2 text-sm font-black text-slate-950"><Target size={15} className="text-blue-600" />Curva S — Previsto x realizado</h3>
            </div>
            <StatusBadge status={obraAtual.status} />
          </div>

          <div className="mt-2 flex items-center gap-4 text-[9px] font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600" />Previsto</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Realizado</span>
          </div>

          <div className="mt-1 h-[165px] w-full">
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

        <PanelClean className="min-h-[235px] cursor-pointer !rounded-2xl !border-slate-200/80 !p-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.7)] transition hover:border-blue-300" onClick={() => navigate('cronograma')}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-indigo-600">Acompanhamento executivo</p>
              <h3 className="mt-1 flex items-center gap-2 text-sm font-black text-slate-950"><BarChart3 size={15} className="text-indigo-600" />Cronograma físico</h3>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[8px] font-black uppercase text-blue-700 ring-1 ring-blue-100">Ao vivo</span>
          </div>

          <div className="mt-4 space-y-3">
            {tarefas.slice(0, 5).map((tarefa, index) => {
              const progress = Math.max(0, Math.min(100, Number(tarefa.progresso || 0)))
              const delayed = tarefaAtrasadaOperacional(tarefa)
              const completed = progress === 100
              return (
                <div key={tarefa.id || index} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-[10px] font-bold">
                    <span className="min-w-0 flex-1 truncate text-slate-700">{tarefa.nome}</span>
                    <span className={delayed ? 'text-red-600' : completed ? 'text-emerald-600' : 'text-slate-500'}>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full transition-all duration-700 ${completed ? 'bg-emerald-500' : delayed ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )
            })}
            {!tarefas.length && <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-xs font-bold text-slate-400">Nenhuma atividade cadastrada no cronograma.</p>}
            {tarefas.length > 5 && <p className="text-center text-[8px] font-black uppercase tracking-wider text-slate-400">+ {tarefas.length - 5} atividades no cronograma</p>}
          </div>
        </PanelClean>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {canViewModule(activeRole, 'diario') && (
          <ActivityCard
            title="Último diário da obra"
            eyebrow="Atualização operacional"
            body={ultimoDiario?.servicos_executados || ultimoDiario?.atividades || 'Sem relatos registrados.'}
            icon={FileText}
            notification={diariosNovos}
            onClick={() => navigate('diario')}
          />
        )}
        {canViewModule(activeRole, 'fotos') && (
          <ActivityCard
            title={`${fotosVisiveis.length} foto${fotosVisiveis.length === 1 ? '' : 's'} cadastrada${fotosVisiveis.length === 1 ? '' : 's'}`}
            eyebrow="Acervo fotográfico"
            body="Acompanhe visualmente a evolução dos serviços executados na obra."
            icon={Camera}
            tone="light"
            notification={fotosNovas}
            imageUrl={ultimaFotoUrl}
            onClick={() => navigate('fotos')}
          />
        )}
      </section>
    </div>
  )
}
